import EventEmitter from "events";
import { Emitter } from "../models/EventEmitter";
import { Models } from "../models/proto/models";
import { Packets } from "../models/proto/packets";
import { TAEvents } from "../models/TAEvents";
import { TAClientVersion } from "../utils/constants";
import { generateUUID } from "../utils/uuid";
import { StateManager } from "./client/StateManager";
import { PlayerWithScore } from "./client/User";
import { ConnectionOptions, TAWebsocket } from "./TAWebsocket";

export class Client {
    public Self: Models.User;

    public ServerSettings: Models.ServerSettings = new Models.ServerSettings();
    public KnownHosts: Models.CoreServer[] = [];

    public isConnected = false;
    private emitter: Emitter<TAEvents.Events> = new EventEmitter();
    private transport: TAWebsocket;
    private sm = new StateManager(this.emitter);

    constructor(name: string, options: ConnectionOptions) {
        this.transport = new TAWebsocket(options);

        this.Self = new Models.User({
            name: name,
            guid: generateUUID(),
            client_type: this.transport.config.connectionMode
        });

        this.transport.emitter.on("open", () => {
            this.emitter.emit("wsConnected");
            this.ClientConnect();
        });
        this.transport.emitter.on("message", p => {
            this.handlePacket(p);
        });
        this.transport.emitter.on("disconnected", () => {
            this.emitter.emit("close");
        });
        this.transport.emitter.on("error", e => {
            this.emitter.emit("error", e);
        });
    }

    ClientConnect() {
        const packetData = new Packets.Request.Connect({
            user: this.Self,
            client_version: TAClientVersion,
            password: this.transport.password ?? undefined
        });
        const packet = new Packets.Packet({
            id: generateUUID(),
            from: this.Self?.guid,
            request: new Packets.Request({ connect: packetData })
        });
        this.transport.sendPacket(packet);
    }

    init(connectResponse: Packets.Response.Connect) {
        this.Self.guid = connectResponse.self_guid;

        this.sm.init(connectResponse);
        this.ServerSettings = connectResponse.state.server_settings;
        this.KnownHosts = connectResponse.state.known_hosts;

        this.isConnected = true;
        this.emitter.emit("taConnected");
    }

    public get on() {
        return this.emitter.on.bind(this.emitter);
    }

    public get off() {
        return this.emitter.off.bind(this.emitter);
    }

    public get once() {
        return this.emitter.once.bind(this.emitter);
    }

    public get users() {
        return [...this.Coordinators, ...this.Players.map(x => x.userOnly), ...this.WebsocketUsers];
    }

    public get State() {
        return new Models.State({
            matches: this.Matches,
            users: this.users,
            server_settings: this.ServerSettings,
            events: this.QualifierEvents,
            known_hosts: this.KnownHosts
        });
    }

    /**
     *List of matches on the server
     *
     * @readonly
     * @type {Models.Match[]}
     * @memberof Client
     */
    public get Matches(): Models.Match[] {
        return this.sm.Matches;
    }

    /**
     *List of Coordinators connected to the server
     *
     * @readonly
     * @type {Models.User[]}
     * @memberof Client
     */
    public get Coordinators(): Models.User[] {
        return this.sm.Coordinators;
    }

    /**
     *List of players connected to the server
     *
     * @readonly
     * @type {PlayerWithScore[]}
     * @memberof Client
     */
    public get Players(): PlayerWithScore[] {
        return this.sm.Players;
    }

    /**
     *List of websocket users connected to the server
     *
     * @readonly
     * @type {Models.User[]}
     * @memberof Client
     */
    public get WebsocketUsers(): Models.User[] {
        return this.sm.WebsocketUsers;
    }

    /**
     *List of qualifier events on the server
     *
     * @readonly
     * @type {Models.QualifierEvent[]}
     * @memberof Client
     */
    public get QualifierEvents(): Models.QualifierEvent[] {
        return this.sm.QualifierEvents;
    }

    /**
     * Resets the client to a disconnected state
     */
    public reset() {
        this.sm.reset();
        this.ServerSettings = new Models.ServerSettings();
        this.KnownHosts = [];

        this.isConnected = false;
    }

    /**
     *Processes a packet from the server and updates the client state accordingly
     *
     * @param {Packets.Packet} packet
     * @return {void}
     * @memberof Client
     */
    public handlePacket(packet: Packets.Packet): void {
        if (!this.isConnected) {
            if (packet.has_response && packet.response.has_connect && packet.response.type === Packets.Response.ResponseType.Success) {
                const connectResponse = packet.response.connect;
                if (connectResponse.self_guid) {
                    this.init(connectResponse);
                }
            } else if (packet.has_response && packet.response.has_connect && packet.response.type === Packets.Response.ResponseType.Fail) {
                this.emitter.emit("error", new Error(packet.response.connect.message));
            }
            if (!this.isConnected) return;
        }
        this.sm.handlePacket(packet);
    }

    /**
     *Sends a packet to the server
     *
     * @param {Packets.Packet} packet
     * @memberof Client
     */
    sendPacket(packet: Packets.Packet): void {
        if (this.isConnected) {
            packet.from = this.Self?.guid;
            this.transport.sendPacket(packet);
        }
    }

    /**
     *Gets a user by their guid
     *
     * @param {string} guid
     * @return {*}  {(Models.User | undefined)}
     * @memberof Client
     */
    getUser(guid: string): Models.User | undefined {
        return this.users.find(x => x.guid === guid);
    }

    /**
     *Gets a player by their guid
     *
     * @param {string} guid
     * @return {*}  {(Models.User | undefined)}
     * @memberof Client
     */
    getPlayer(guid: string): Models.User | undefined {
        return this.Players.find(x => x.guid === guid);
    }

    /**
     *Gets a coordinator by their guid
     *
     * @param {string} guid
     * @return {*}  {(Models.User | undefined)}
     * @memberof Client
     */
    getCoordinator(guid: string): Models.User | undefined {
        return this.Coordinators.find(x => x.guid === guid);
    }

    /**
     *Gets a websocket user by their guid
     *
     * @param {string} guid
     * @return {*}  {(Models.User | undefined)}
     * @memberof Client
     */
    getWebsocketUser(guid: string): Models.User | undefined {
        return this.WebsocketUsers.find(x => x.guid === guid);
    }

    /**
     *Gets a match by its guid
     *
     * @param {string} guid
     * @return {*}  {(Models.Match | undefined)}
     * @memberof Client
     */
    getMatch(guid: string): Models.Match | undefined {
        return this.Matches.find(x => x.guid === guid);
    }

    /**
     *Gets a qualifier event by its guid
     *
     * @param {string} guid
     * @return {*}  {(Models.QualifierEvent | undefined)}
     * @memberof Client
     */
    getEvent(guid: string): Models.QualifierEvent | undefined {
        return this.QualifierEvents.find(x => x.guid === guid);
    }

    /**
     *Gets the players in a match
     *
     * @param {Models.Match} match
     * @return {*}  {PlayerWithScore[]}
     * @memberof Client
     */
    getMatchPlayers(match: Models.Match): PlayerWithScore[] {
        return this.Players.filter(x => match.associated_users.includes(x.guid) && x.client_type === Models.User.ClientTypes.Player);
    }

    /**
     *Gets the coordinators in a match
     *
     * @param {Models.Match} match
     * @return {*}  {Models.User[]}
     * @memberof Client
     */
    getMatchCoordinators(match: Models.Match): Models.User[] {
        return this.Coordinators.filter(x => match.associated_users.includes(x.guid) && x.client_type === Models.User.ClientTypes.Coordinator);
    }

    /**
     *Gets the websocket users in a match
     *
     * @param {Models.Match} match
     * @return {*}  {Models.User[]}
     * @memberof Client
     */
    getMatchWebsocketUsers(match: Models.Match): Models.User[] {
        return this.WebsocketUsers.filter(x => match.associated_users.includes(x.guid) && x.client_type === Models.User.ClientTypes.WebsocketConnection);
    }

    /**
     *Gets all users in a match
     *
     * @param {Models.Match} match
     * @return {*}  {Models.User[]}
     * @memberof Client
     */
    getMatchUsers(match: Models.Match): Models.User[] {
        return [...this.getMatchPlayers(match), ...this.getMatchCoordinators(match), ...this.getMatchWebsocketUsers(match)];
    }

    /**
     *Sends a message to a list of users
     *
     * @param {string[]} ids
     * @param {Packets.Command.ShowModal} msg
     * @memberof Client
     */
    sendMessage(ids: string[], msg: Packets.Command.ShowModal): void {
        this.forwardPacket(ids, new Packets.Packet({ command: new Packets.Command({ show_modal: msg }) }));
    }

    /**
     *Sends an event to the server
     *
     * @param {Packets.Event} event
     * @memberof Client
     */
    sendEvent(event: Packets.Event): void {
        this.sendPacket(new Packets.Packet({ event }));
    }

    /**
     *Forwards a packet to a list of users
     *
     * @param {string[]} ids
     * @param {Packets.Packet} packet
     * @memberof Client
     */
    forwardPacket(ids: string[], packet: Packets.Packet): void {
        this.sendPacket(
            new Packets.Packet({
                forwarding_packet: new Packets.ForwardingPacket({
                    forward_to: ids,
                    packet: packet
                })
            })
        );
    }

    /**
     *Creates a match with the given list of users
     *
     * @param {Models.User[]} players
     * @return {*}  {string}
     * @memberof Client
     */
    createMatch(players: Models.User[]): string {
        const match = new Models.Match({
            guid: generateUUID(),
            associated_users: [...players.map(x => x.guid), this.Self.guid],
            leader: this.Self!.guid
        });
        this.sendEvent(
            new Packets.Event({
                match_created_event: new Packets.Event.MatchCreatedEvent({ match: match })
            })
        );
        return match.guid;
    }

    /**
     *Updates a match on the server
     *
     * @param {Models.Match} match
     * @memberof Client
     */
    updateMatch(match: Models.Match): void {
        this.sendEvent(
            new Packets.Event({
                match_updated_event: new Packets.Event.MatchUpdatedEvent({ match: match })
            })
        );
    }

    /**
     *Closes a match room
     *
     * @param {Models.Match} match
     * @memberof Client
     */
    closeMatch(match: Models.Match): void {
        this.sendEvent(
            new Packets.Event({
                match_deleted_event: new Packets.Event.MatchDeletedEvent({ match: match })
            })
        );
    }

    /**
     *Loads a song into a match room
     *
     * @param {string} songName
     * @param {string} hash
     * @param {number} difficulty
     * @param {Models.Match} taMatch
     * @memberof Client
     */
    loadSong(songName: string, hash: string, difficulty: number, taMatch: Models.Match): void {
        const matchMap = new Models.PreviewBeatmapLevel({
            level_id: `custom_level_${hash}`,
            name: songName,
            characteristics: [
                new Models.Characteristic({
                    serialized_name: "Standard",
                    difficulties: [+difficulty]
                })
            ],
            loaded: true
        });

        taMatch.selected_level = matchMap;
        taMatch.selected_characteristic = new Models.Characteristic({
            serialized_name: "Standard",
            difficulties: [+difficulty]
        });
        taMatch.selected_difficulty = +difficulty;

        const playerIds = this.getMatchPlayers(taMatch).map(x => x.guid);

        this.forwardPacket(
            playerIds,
            new Packets.Packet({
                command: new Packets.Command({
                    load_song: new Packets.Command.LoadSong({
                        level_id: taMatch.selected_level.level_id
                    })
                })
            })
        );
        setTimeout(() => {
            this.updateMatch(taMatch);
        }, 500);
    }

    /**
     *Starts the loaded song in a match room
     *
     * @param {Models.Match} match
     * @param {boolean} [withSync=false]
     * @param {boolean} [disable_pause=false]
     * @param {boolean} [disable_fail=false]
     * @param {boolean} [floating_scoreboard=false]
     * @memberof Client
     */
    playSong(match: Models.Match, withSync: boolean = false, disable_pause: boolean = false, disable_fail: boolean = false, floating_scoreboard: boolean = false): void {
        const gm = new Models.GameplayModifiers({
            options: Models.GameplayModifiers.GameOptions.None
        });
        const beatMap = new Models.Beatmap({
            characteristic: match.selected_characteristic,
            difficulty: match.selected_difficulty,
            level_id: match.selected_level.level_id,
            name: match.selected_level.name
        });
        const gameplayParameters = new Models.GameplayParameters({
            player_settings: new Models.PlayerSpecificSettings({
                options: Models.PlayerSpecificSettings.PlayerOptions.None
            }),
            gameplay_modifiers: gm,
            beatmap: beatMap
        });

        const playSong = new Packets.Command.PlaySong({
            gameplay_parameters: gameplayParameters,
            floating_scoreboard: floating_scoreboard,
            stream_sync: withSync,
            disable_pause: disable_pause,
            disable_fail: disable_fail
        });
        const playerIds = this.getMatchPlayers(match).map(x => x.guid);

        const curTime = new Date();
        curTime.setSeconds(curTime.getSeconds() + 2);
        match.start_time = curTime.toISOString();
        this.updateMatch(match);

        setTimeout(() => {
            this.forwardPacket(
                playerIds,
                new Packets.Packet({
                    command: new Packets.Command({
                        play_song: playSong
                    })
                })
            );
        }, 500);
    }

    /**
     *Returns a list of players to the menu
     *
     * @param {string[]} ids
     * @memberof Client
     */
    returnToMenu(ids: string[]): void {
        this.forwardPacket(
            ids,
            new Packets.Packet({
                command: new Packets.Command({
                    return_to_menu: true
                })
            })
        );
    }

    close(): void {
        this.sendEvent(
            new Packets.Event({
                user_left_event: new Packets.Event.UserLeftEvent({
                    user: this.Self
                })
            })
        );
        this.transport.close();
    }
}
