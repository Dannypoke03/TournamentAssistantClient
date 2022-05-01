import { uuidv4 } from "../../utils/helpers";
import { Acknowledgement } from "./acknowledgement";
import { Command } from "./command";
import { Connect } from "./connect";
import { ConnectResponse } from "./connectResponse";
import { Event } from "./event";
import { File } from "./file";
import { ForwardingPacket } from "./forwardingPacket";
import { LoadedSong } from "./loadedSong";
import { LoadSong } from "./loadSong";
import { Message } from "./message";
import { MessageResponse } from "./messageResponse";
import { PlaySong } from "./playSong";
import { ScoreRequest } from "./scoreRequest";
import { ScoreRequestResponse } from "./scoreRequestResponse";
import { SongFinished } from "./songFinished";
import { SongList } from "./songList";
import { SubmitScore } from "./submitScore";

export class Packet<T extends PacketType> implements Packet<T> {
    Id: string;
    From: string;

    Type: T;
    SpecificPacket: PacketMapping[T];

    constructor(specificPacket: PacketMapping[T], type: T, from?: string) {
        this.From = from ?? uuidv4();
        this.Id = uuidv4();
        this.Type = type;
        this.SpecificPacket = specificPacket;
    }
}

export enum PacketType {
    Acknowledgement,
    Command,
    Connect,
    ConnectResponse,
    Event,
    File,
    ForwardingPacket,
    LoadedSong,
    LoadSong,
    PlaySong,
    Response,
    ScoreRequest,
    ScoreRequestResponse,
    SendBotMessage,
    SongFinished,
    SongList,
    SubmitScore,
    Message,
    MessageResponse
}

export type PacketMapping = {
    0: Acknowledgement;
    1: Command;
    2: Connect;
    3: ConnectResponse;
    4: Event;
    5: File;
    6: ForwardingPacket;
    7: LoadedSong;
    8: LoadSong;
    9: PlaySong;
    10: Response;
    11: ScoreRequest;
    12: ScoreRequestResponse;
    13: never;
    14: SongFinished;
    15: SongList;
    16: SubmitScore;
    17: Message;
    18: MessageResponse;
}