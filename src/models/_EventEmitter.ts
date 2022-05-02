import { Models } from "./proto/models";
import { Packet } from "./proto/packets";

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

        "coordinatorAdded": PacketEvent<Models.Coordinator>;
        "coordinatorLeft": PacketEvent<Models.Coordinator>;
        "matchCreated": PacketEvent<Models.Match>;
        "matchUpdated": PacketEvent<Models.Match>;
        "matchDeleted": PacketEvent<Models.Match>;
        "playerAdded": PacketEvent<Models.Player>;
        "playerUpdated": PacketEvent<Models.Player>;
        "playerLeft": PacketEvent<Models.Player>;
        "qualifierEventCreated": PacketEvent<Models.QualifierEvent>;
        "qualifierEventUpdated": PacketEvent<Models.QualifierEvent>;
        "qualifierEventDeleted": PacketEvent<Models.QualifierEvent>;

        "acknowledgement": PacketEvent<Packet.Acknowledgement>;
        "command": PacketEvent<Packet.Command>;
        "connect": PacketEvent<Packet.Connect>;
        "connectResponse": PacketEvent<Packet.ConnectResponse>;
        "event": PacketEvent<Packet.Event>;
        "file": PacketEvent<Packet.File>;
        "forwardingPacket": PacketEvent<Packet.ForwardingPacket>;
        "loadedSong": PacketEvent<Packet.LoadedSong>;
        "loadSong": PacketEvent<Packet.LoadSong>;
        // "message": PacketEvent<Packet.Message>;
        // "messageResponse": PacketEvent<Packet.MessageResponse>;
        "playSong": PacketEvent<Packet.PlaySong>;
        "scoreRequest": PacketEvent<Packet.ScoreRequest>;
        "scoreRequestResponse": PacketEvent<Packet.ScoreRequestResponse>;
        "songFinished": PacketEvent<Packet.SongFinished>;
        // "songList": PacketEvent<Packet.SongList>;
        "submitScore": PacketEvent<Packet.SubmitScore>;
        "response": PacketEvent<Packet.Response>;
        "packet": Packet.Packet;
    }

    type PacketEvent<T> = {
        from: string;
        data: T;
    }

}
