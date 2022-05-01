import { Acknowledgement } from "./old/acknowledgement";
import { Command } from "./old/command";
import { Connect } from "./old/connect";
import { ConnectResponse } from "./old/connectResponse";
import { Coordinator } from "./old/coordinator";
import { Event, EventType } from "./old/event";
import { File } from "./old/file";
import { LoadedSong } from "./old/loadedSong";
import { LoadSong } from "./old/loadSong";
import { Match } from "./old/match";
import { Message } from "./old/message";
import { MessageResponse } from "./old/messageResponse";
import { Packet, PacketType } from "./old/packet";
import { Player } from "./old/player";
import { PlaySong } from "./old/playSong";
import { QualifierEvent } from "./old/qualifierEvent";
import { ResponseType, Response } from "./old/response";
import { ScoreRequest } from "./old/scoreRequest";
import { ScoreRequestResponse } from "./old/scoreRequestResponse";
import { SongFinished } from "./old/songFinished";
import { SongList } from "./old/songList";
import { SubmitScore } from "./old/submitScore";

export namespace TAEventEmitter {

    export type EventMap = Record<keyof Events, any>;

    export type EventKey<T extends EventMap> = keyof T;
    export type EventReceiver<T> = (params: T) => void;

    export interface Emitter<T extends EventMap> {
        on<K extends EventKey<T>>(eventName: K, fn: EventReceiver<T[K]>): void;
        off<K extends EventKey<T>>(eventName: K, fn: EventReceiver<T[K]>): void;
        emit<K extends EventKey<T>>(eventName: K, params: T[K]): void;
    }

    export type Events = {

        'coordinatorAdded': PacketEvent<Coordinator>;
        'coordinatorLeft': PacketEvent<Coordinator>;
        'matchCreated': PacketEvent<Match>;
        'matchUpdated': PacketEvent<Match>;
        'matchDeleted': PacketEvent<Match>;
        'playerAdded': PacketEvent<Player>;
        'playerUpdated': PacketEvent<Player>;
        'playerLeft': PacketEvent<Player>;
        'qualifierEventCreated': PacketEvent<QualifierEvent>;
        'qualifierEventUpdated': PacketEvent<QualifierEvent>;
        'qualifierEventDeleted': PacketEvent<QualifierEvent>;

        'acknowledgement': PacketEvent<Acknowledgement>;
        'command': PacketEvent<Command>;
        'connect': PacketEvent<Connect>;
        'connectResponse': PacketEvent<ConnectResponse>;
        'event': PacketEvent<Event>;
        'file': PacketEvent<File>;
        'forwardingPacket': PacketEvent<Packet<any>>;
        'loadedSong': PacketEvent<LoadedSong>;
        'loadSong': PacketEvent<LoadSong>;
        'message': PacketEvent<Message>;
        'messageResponse': PacketEvent<MessageResponse>;
        'playSong': PacketEvent<PlaySong>;
        'scoreRequest': PacketEvent<ScoreRequest>;
        'scoreRequestResponse': PacketEvent<ScoreRequestResponse>;
        'songFinished': PacketEvent<SongFinished>;
        'songList': PacketEvent<SongList>;
        'submitScore': PacketEvent<SubmitScore>;
        'response': PacketEvent<Response>;
        'packet': Packet<any>;
    }

    type PacketEvent<T> = {
        from: string;
        data: T;
    }

}
