import { ConnectTypes } from "../models/old/connect";
import { ConnectResponse } from "../models/old/connectResponse";
import { Packet, PacketType } from "../models/old/packet";
import { Client } from "./client";
import WebSocket from "ws";
import { Player } from "../models/old/player";
import { BeatmapDifficulty, Match } from "../models/old/match";
import { uuidv4 } from "../utils/helpers";
import { Event, EventType } from "../models/old/event";
import { PreviewBeatmapLevel } from "../models/old/previewBeatmapLevel";
import { LoadSong } from "../models/old/loadSong";
import { ForwardingPacket } from "../models/old/forwardingPacket";
import { GameOptions, GameplayModifiers } from "../models/old/gameplayModifiers";
import { Beatmap } from "../models/old/beatmap";
import { GameplayParameters } from "../models/old/gameplayParameters";
import { PlayerOptions } from "../models/old/playerSpecificSettnigs";
import { PlaySong } from "../models/old/playSong";
import { CommandTypes } from "../models/old/command";
import { Message } from "../models/old/message";
import { Config } from "../models/Config";

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
            const packetData = {
                ClientType: ConnectTypes.Coordinator,
                Name: this.name,
                ClientVersion: 46,
                Password: this.password ?? undefined,
                UserId: this.userId ?? "",
            };
            const packet = new Packet<PacketType.Connect>(packetData, PacketType.Connect);
            this.sendPacket(packet);
        };
        this.ws.on("message", (event) => {
            this.handlePacket(JSON.parse(event.toString()));
        });
        this.ws.on("close", () => {
            if (this.config.logging && this.taClient.State?.ServerSettings?.ServerName) console.error(`Socket Closed - ${this.taClient?.State?.ServerSettings?.ServerName}`);
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

    private handlePacket(packet: Packet<any>) {
        if (packet.Type === PacketType.ConnectResponse) {
            const connectResponse: ConnectResponse = packet.SpecificPacket;
            if (!this.taClient.Self && connectResponse.Self) {
                this.taClient.init(connectResponse);
            }
        }
        this.taClient.handlePacket(packet);
    }

    sendPacket<T extends PacketType>(packet: Packet<T>) {
        this.ws.send(JSON.stringify(packet));
    }

    // TA Helper functions

    async createMatch(players: Player[]) {
        const match: Match = {
            Guid: uuidv4(),
            Players: players,
            Leader: this.taClient.Self!,
            SelectedDifficulty: 0
        };
        const SpecificPacket: Event = {
            Type: EventType.MatchCreated,
            ChangedObject: match,
        };
        this.sendPacket(this.taClient.createPacket(SpecificPacket, PacketType.Event));
        return match.Guid;
    }

    async closeMatch(match: Match) {
        const SpecificPacket: Event = {
            Type: EventType.MatchDeleted,
            ChangedObject: match,
        };
        this.sendPacket(this.taClient.createPacket(SpecificPacket, PacketType.Event));
    }

    async sendMessage(ids: string[], msg: Message) {
        const specificPacket2: ForwardingPacket = {
            ForwardTo: ids,
            Type: PacketType.Message,
            SpecificPacket: msg,
        };
        this.sendPacket(this.taClient.createPacket(specificPacket2, PacketType.ForwardingPacket));
    }

    async loadSong(songName: string, hash: string, difficulty: BeatmapDifficulty, taMatch: Match) {
        const matchMap: PreviewBeatmapLevel = {
            LevelId: `custom_level_${hash.toUpperCase()}`,
            Name: songName,
            Characteristics: [{
                SerializedName: "Standard",
                Difficulties: [
                    difficulty
                ]
            }],
            Loaded: true,
        };

        taMatch.SelectedLevel = matchMap;
        taMatch.SelectedCharacteristic = matchMap.Characteristics[0];
        taMatch.SelectedDifficulty = difficulty;

        const updateMatchPacket: Event = {
            Type: EventType.MatchUpdated,
            ChangedObject: taMatch,
        };

        const playerIds = taMatch.Players.map((x) => x.Id);
        const loadSongPacket: ForwardingPacket = {
            ForwardTo: playerIds,
            Type: PacketType.LoadSong,
            SpecificPacket: {
                LevelId: taMatch.SelectedLevel.LevelId,
                CustomHostUrl: null,
            },
        };

        this.sendPacket(this.taClient.createPacket(loadSongPacket, PacketType.ForwardingPacket));
        setTimeout(() => {
            this.sendPacket(this.taClient.createPacket(updateMatchPacket, PacketType.Event));
        }, 500);
    }

    playSong(match: Match, withSync = false, ids?: string[]) {
        const gm: GameplayModifiers = { Options: GameOptions.None };
        const beatMap: Beatmap = {
            Characteristic: match.SelectedCharacteristic!,
            Difficulty: match.SelectedDifficulty,
            LevelId: match.SelectedLevel!.LevelId,
            Name: match.SelectedLevel!.Name,
        };
        const gameplayParam: GameplayParameters = {
            PlayerSettings: {
                Options: PlayerOptions.None,
            },
            GameplayModifiers: gm,
            Beatmap: beatMap,
        };

        const playSong: PlaySong = {
            GameplayParameters: gameplayParam,
            FloatingScoreboard: false,
            StreamSync: withSync,
            DisablePause: true,
            DisableFail: true,
        };
        const playerIds = ids ? ids : match.Players.map((x) => x.Id);
        const playSongPacket: ForwardingPacket = {
            ForwardTo: playerIds,
            Type: PacketType.PlaySong,
            SpecificPacket: playSong,
        };

        const curTime = new Date();
        curTime.setSeconds(curTime.getSeconds() + 2);
        match.StartTime = curTime.toISOString();
        this.sendPacket(this.taClient.createPacket({
            Type: EventType.MatchUpdated,
            ChangedObject: match,
        }, PacketType.Event));

        setTimeout(() => {
            this.sendPacket(this.taClient.createPacket(playSongPacket, PacketType.ForwardingPacket));
        }, 500);
    }

    returnToMenu(ids: string[]) {
        const specificPacket: ForwardingPacket = {
            ForwardTo: ids,
            Type: PacketType.Command,
            SpecificPacket: {
                commandType: CommandTypes.ReturnToMenu,
            },
        };
        this.sendPacket(this.taClient.createPacket(specificPacket, PacketType.ForwardingPacket));
    }

    close() {
        if (this.ws?.readyState == 1) {
            const SpecificPacket: Event = {
                Type: EventType.CoordinatorLeft,
                ChangedObject: this.taClient.Self,
            };
            this.sendPacket(this.taClient.createPacket(SpecificPacket, PacketType.Event));
            this.ws.close();
        }
    }

}