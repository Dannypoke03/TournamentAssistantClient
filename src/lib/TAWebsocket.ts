import { Client } from "./client";
import { uuidv4 } from "../utils/helpers";
import { Config } from "../models/Config";
import { Packet } from "../models/proto/packets";
import { Models } from "../models/proto/models";
import { BeatmapDifficulty } from "../models/old/match";
import WebSocket from "ws";

export class TAWebsocket {

    private url: string;
    private password?: string;
    private name: string;
    private userId?: string;

    private ws: WebSocket | null = null;
    public taClient: Client;

    private config: Config;
    private reconnectAttempts = -1;

    private sendToSocket: (data: any) => void = () => null;

    constructor({ url, name, password, userId, options }: { url: string; name: string; password?: string; userId?: string; options?: Partial<Config>; }) {
        this.config = this.loadConfig(options);
        this.url = url;
        this.password = password;
        this.name = name;
        this.userId = userId;
        this.taClient = new Client();
        if (this.config.autoInit) this.init();
    }

    private loadConfig(config?: Partial<Config>): Config {
        return {
            autoReconnect: true,
            autoReconnectInterval: 10000,
            autoReconnectMaxRetries: -1,
            logging: false,
            handshakeTimeout: 5000,
            autoInit: true,
            sendToSocket: null,
            ...config
        };
    }

    private init() {
        this.ws = new WebSocket(`${this.url}`, {
            handshakeTimeout: this.config.handshakeTimeout
        });
        if (!this.config.sendToSocket) {
            if (this.ws) this.sendToSocket = (data) => this.ws?.send(data);
        } else {
            this.sendToSocket = this.config.sendToSocket;
        }
        if (!this.ws) return;
        this.ws.onopen = () => {
            this.coordinatorConnect();
        };
        this.ws.on("message", (event) => {
            if (event instanceof Buffer) {
                this.handlePacket(Packet.Packet.deserialize(new Uint8Array(event)));
            }
        });
        this.ws.on("close", () => {
            if (this.config.logging && this.taClient.State?.server_settings?.server_name) console.error(`Socket Closed - ${this.taClient?.State?.server_settings?.server_name}`);
            this.taClient.reset();
            if (this.config.autoReconnect && this.reconnectAttempts < this.config.autoReconnectMaxRetries) {
                setTimeout(() => {
                    this.init();
                }, this.config.autoReconnectInterval);
                if (this.reconnectAttempts !== -1) this.reconnectAttempts++;
            }
        });
        this.ws.onerror = (error) => {
            if (this.config.logging) console.error(error);
        };
    }

    coordinatorConnect() {
        const packetData = new Packet.Connect({
            client_type: Packet.Connect.ConnectTypes.Coordinator,
            name: this.name,
            client_version: 60,
            password: this.password ?? undefined,
            user_id: this.userId ?? "",
        });
        const packet = new Packet.Packet({
            id: uuidv4(),
            from: this.taClient.Self?.id,
            connect: packetData
        });
        this.sendPacket(packet);
    }

    handlePacket(packet: Packet.Packet) {
        if (packet.connect_response) {
            const connectResponse = packet.connect_response;
            if (!this.taClient.Self && connectResponse.self) {
                this.taClient.init(connectResponse);
            }
        }
        this.taClient.handlePacket(packet);
    }

    sendPacket(packet: Packet.Packet) {
        if (!this.ws) return;
        packet.from = this.taClient.Self?.id ?? uuidv4();
        this.sendToSocket(packet.serializeBinary());
    }

    sendEvent(event: Packet.Event) {
        this.sendPacket(new Packet.Packet({ event }));
    }

    forwardPacket(ids: string[], packet: Packet.Packet) {
        this.sendPacket(new Packet.Packet({
            forwarding_packet: new Packet.ForwardingPacket({
                forward_to: ids,
                packet: packet
            })
        }));
    }

    // TA Helper functions

    createMatch(players: Models.Player[]) {
        const match = new Models.Match({
            guid: uuidv4(),
            players: players,
            leader: this.taClient.Self!
        });
        this.sendEvent(new Packet.Event({
            match_created_event: new Packet.Event.MatchCreatedEvent({ match: match })
        }));
        return match.guid;
    }

    updateMatch(match: Models.Match) {
        this.sendEvent(new Packet.Event({
            match_updated_event: new Packet.Event.MatchUpdatedEvent({ match: match })
        }));
    }

    closeMatch(match: Models.Match) {
        this.sendEvent(new Packet.Event({
            match_deleted_event: new Packet.Event.MatchDeletedEvent({ match: match })
        }));
    }

    // TODO: Waiting on protobuf implementation of messages
    // async sendMessage(ids: string[], msg: Message) {
    //     const specificPacket2: ForwardingPacket = {
    //         ForwardTo: ids,
    //         Type: PacketType.Message,
    //         SpecificPacket: msg,
    //     };
    //     this.sendPacket(this.taClient.createPacket(specificPacket2, PacketType.ForwardingPacket));
    // }

    async loadSong(songName: string, hash: string, difficulty: BeatmapDifficulty, taMatch: Models.Match) {
        const matchMap = new Models.PreviewBeatmapLevel({
            level_id: hash,
            name: songName,
            characteristics: [new Models.Characteristic({
                serialized_name: "Standard",
                difficulties: [
                    difficulty
                ]
            })],
            loaded: true
        });

        taMatch.selected_level = matchMap;
        taMatch.selected_characteristic = matchMap.characteristics[0];
        taMatch.selected_difficulty = difficulty;

        const playerIds = taMatch.players.map((x) => x.user.id);

        this.forwardPacket(playerIds, new Packet.Packet({
            load_song: new Packet.LoadSong({
                level_id: taMatch.selected_level.level_id
            })
        }));
        setTimeout(() => {
            this.updateMatch(taMatch);
        }, 500);
    }

    playSong(match: Models.Match, withSync = false, disable_pause = false, disable_fail = false, floating_scoreboard = false) {
        const gm = new Models.GameplayModifiers({
            options: Models.GameplayModifiers.GameOptions.None,
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

        const playSong = new Packet.PlaySong({
            gameplay_parameters: gameplayParameters,
            floating_scoreboard: floating_scoreboard,
            stream_sync: withSync,
            disable_pause: disable_pause,
            disable_fail: disable_fail,
        });
        const playerIds = match.players.map((x) => x.user.id);

        const curTime = new Date();
        curTime.setSeconds(curTime.getSeconds() + 2);
        match.start_time = curTime.toISOString();
        this.updateMatch(match);

        setTimeout(() => {
            this.forwardPacket(playerIds, new Packet.Packet({
                play_song: playSong
            }));
        }, 500);
    }

    returnToMenu(ids: string[]) {
        this.forwardPacket(ids, new Packet.Packet({
            command: new Packet.Command({
                command_type: Packet.Command.CommandTypes.ReturnToMenu,
            })
        }));
    }

    close() {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.sendEvent(new Packet.Event({
                coordinator_left_event: new Packet.Event.CoordinatorLeftEvent({
                    coordinator: new Models.Coordinator({
                        user: this.taClient.Self!
                    })
                })
            }));
            this.ws.close();
        }
    }

}