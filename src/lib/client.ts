/*eslint-disable no-case-declarations */
import EventEmitter from "events";
import { v4 as uuidv4 } from "uuid";
import { Emitter } from "../models/EventEmitter";
import { Models } from "../models/proto/models";
import { Packets } from "../models/proto/packets";
import { TAEvents } from "../models/TAEvents";
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
            guid: uuidv4(),
            client_type: this.transport.config.connectionMode
        });

        this.transport.emitter.on("open", () => {
            this.emitter.emit("wsConnected");
            this.ClientConnect();
        });
        this.transport.emitter.on("message", p => {
            this.handlePacket(p);
        });
        this.transport.emitter.on("error", e => {
            this.emitter.emit("error", e);
        });
    }

    private ClientConnect() {
        const packetData = new Packets.Request.Connect({
            user: this.Self,
            client_version: 67,
            password: this.transport.password ?? undefined
        });
        const packet = new Packets.Packet({
            id: uuidv4(),
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

    public get Matches(): Models.Match[] {
        return this.sm.Matches;
    }
    public get Coordinators(): Models.User[] {
        return this.sm.Coordinators;
    }
    public get Players(): PlayerWithScore[] {
        return this.sm.Players;
    }
    public get WebsocketUsers(): Models.User[] {
        return this.sm.WebsocketUsers;
    }
    public get QualifierEvents(): Models.QualifierEvent[] {
        return this.sm.QualifierEvents;
    }

    public reset() {
        this.sm.reset();
        this.ServerSettings = new Models.ServerSettings();
        this.KnownHosts = [];

        this.isConnected = false;
    }

    public handlePacket(packet: Packets.Packet) {
        if (!this.isConnected) {
            if (packet.has_response && packet.response.has_connect && packet.response.type === Packets.Response.ResponseType.Success) {
                const connectResponse = packet.response.connect;
                if (connectResponse.self_guid) {
                    this.init(connectResponse);
                }
            }
            if (!this.isConnected) return;
        }
        this.sm.handlePacket(packet);
    }

    sendPacket(packet: Packets.Packet) {
        if (this.isConnected) {
            packet.from = this.Self?.guid;
            this.transport.sendPacket(packet);
        }
    }

    getUser(guid: string) {
        return this.users.find(x => x.guid === guid);
    }

    getPlayer(guid: string) {
        return this.Players.find(x => x.guid === guid);
    }

    getCoordinator(guid: string) {
        return this.Coordinators.find(x => x.guid === guid);
    }

    getWebsocketUser(guid: string) {
        return this.WebsocketUsers.find(x => x.guid === guid);
    }

    getMatch(guid: string) {
        return this.Matches.find(x => x.guid === guid);
    }

    getEvent(guid: string) {
        return this.QualifierEvents.find(x => x.guid === guid);
    }

    getMatchPlayers(match: Models.Match) {
        return this.Players.filter(x => match.associated_users.includes(x.guid) && x.client_type === Models.User.ClientTypes.Player);
    }

    getMatchCoordinators(match: Models.Match) {
        return this.Coordinators.filter(x => match.associated_users.includes(x.guid) && x.client_type === Models.User.ClientTypes.Coordinator);
    }

    getMatchWebsocketUsers(match: Models.Match) {
        return this.WebsocketUsers.filter(
            x => match.associated_users.includes(x.guid) && x.client_type === Models.User.ClientTypes.WebsocketConnection
        );
    }

    getMatchUsers(match: Models.Match) {
        return [...this.getMatchPlayers(match), ...this.getMatchCoordinators(match), ...this.getMatchWebsocketUsers(match)];
    }

    sendMessage(ids: string[], msg: Packets.Command.ShowModal) {
        this.forwardPacket(ids, new Packets.Packet({ command: new Packets.Command({ show_modal: msg }) }));
    }

    sendEvent(event: Packets.Event) {
        this.sendPacket(new Packets.Packet({ event }));
    }

    forwardPacket(ids: string[], packet: Packets.Packet) {
        this.sendPacket(
            new Packets.Packet({
                forwarding_packet: new Packets.ForwardingPacket({
                    forward_to: ids,
                    packet: packet
                })
            })
        );
    }

    createMatch(players: Models.User[]) {
        const match = new Models.Match({
            guid: uuidv4(),
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

    updateMatch(match: Models.Match) {
        this.sendEvent(
            new Packets.Event({
                match_updated_event: new Packets.Event.MatchUpdatedEvent({ match: match })
            })
        );
    }

    closeMatch(match: Models.Match) {
        this.sendEvent(
            new Packets.Event({
                match_deleted_event: new Packets.Event.MatchDeletedEvent({ match: match })
            })
        );
    }

    async loadSong(songName: string, hash: string, difficulty: number, taMatch: Models.Match) {
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

    playSong(match: Models.Match, withSync = false, disable_pause = false, disable_fail = false, floating_scoreboard = false) {
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

    returnToMenu(ids: string[]) {
        this.forwardPacket(
            ids,
            new Packets.Packet({
                command: new Packets.Command({
                    return_to_menu: true
                })
            })
        );
    }

    close() {
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
