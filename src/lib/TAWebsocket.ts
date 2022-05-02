import { Client } from "./client";
import WebSocket from "ws";
import { uuidv4 } from "../utils/helpers";
import { Config } from "../models/Config";
import { Packet } from "../models/proto/packets";
import { Models } from "../models/proto/models";
import { BeatmapDifficulty } from "../models/old/match";

export class TAWebsocket {

    private url: string;
    private password?: string;
    private name: string;
    private userId?: string;

    private ws: WebSocket;
    public taClient: Client;

    private config: Config;
    private reconnectAttempts = -1;

    constructor({ url, name, password, userId, options }: { url: string; name: string; password?: string; userId?: string; options?: Partial<Config>; }) {
        this.config = this.loadConfig(options);
        this.url = url;
        this.password = password;
        this.name = name;
        this.userId = userId;
        this.ws = new WebSocket(`${url}`, {
            handshakeTimeout: this.config.handshakeTimeout
        });
        this.taClient = new Client();
        this.init();
    }

    private loadConfig(config?: Partial<Config>): Config {
        return {
            autoReconnect: true,
            autoReconnectInterval: 10000,
            autoReconnectMaxRetries: -1,
            logging: false,
            handshakeTimeout: 5000,
            ...config
        };
    }

    private init() {
        this.ws.onopen = () => {
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
                    this.ws = new WebSocket(`${this.url}`);
                    this.init();
                }, this.config.autoReconnectInterval);
                if (this.reconnectAttempts !== -1) this.reconnectAttempts++;
            }
        });
        this.ws.on("error", (error) => {
            if (this.config.logging) console.error(error);
        });
    }

    private handlePacket(packet: Packet.Packet) {
        if (packet.packet === Packet.ConnectResponse.name) {
            const connectResponse = packet.connect_response;
            if (!this.taClient.Self && connectResponse.self) {
                this.taClient.init(connectResponse);
            }
        }
        this.taClient.handlePacket(packet);
    }

    sendPacket(packet: Packet.Packet) {
        packet.from = this.taClient.Self?.id ?? uuidv4();
        this.ws.send(packet.serializeBinary());
    }

    sendEvent(event: Packet.Event) {
        this.sendPacket(new Packet.Packet({ event }));
    }

    // TA Helper functions

    async createMatch(players: Models.Player[]) {
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

    async closeMatch(match: Models.Match) {
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
            characteristics: [Models.Characteristic.fromObject({
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

        this.sendPacket(new Packet.Packet({
            forwarding_packet: new Packet.ForwardingPacket({
                forward_to: playerIds,
                packet: new Packet.Packet({
                    load_song: new Packet.LoadSong({
                        level_id: taMatch.selected_level.level_id
                    })
                })
            })
        }));
        setTimeout(() => {
            this.sendEvent(new Packet.Event({
                match_updated_event: new Packet.Event.MatchUpdatedEvent({ match: taMatch })
            }));
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
        this.sendEvent(new Packet.Event({
            match_updated_event: new Packet.Event.MatchUpdatedEvent({ match: match })
        }));

        setTimeout(() => {
            this.sendPacket(new Packet.Packet({
                forwarding_packet: new Packet.ForwardingPacket({
                    forward_to: playerIds,
                    packet: new Packet.Packet({
                        play_song: playSong
                    })
                })
            }));
        }, 500);
    }

    returnToMenu(ids: string[]) {
        this.sendPacket(new Packet.Packet({
            forwarding_packet: new Packet.ForwardingPacket({
                forward_to: ids,
                packet: new Packet.Packet({
                    command: new Packet.Command({
                        command_type: Packet.Command.CommandTypes.ReturnToMenu,
                    })
                })
            })
        }));
    }

    close() {
        if (this.ws?.readyState == 1) {
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