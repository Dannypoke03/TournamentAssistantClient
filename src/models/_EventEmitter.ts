import { Models } from "./proto/models";
import { Packets } from "./proto/packets";

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

        "acknowledgement": PacketEvent<Packets.Acknowledgement>;
        "command": PacketEvent<Packets.Command>;
        "connect": PacketEvent<Packets.Connect>;
        "connectResponse": PacketEvent<Packets.ConnectResponse>;
        "event": PacketEvent<Packets.Event>;
        "file": PacketEvent<Packets.File>;
        "forwardingPacket": PacketEvent<Packets.ForwardingPacket>;
        "loadedSong": PacketEvent<Packets.LoadedSong>;
        "loadSong": PacketEvent<Packets.LoadSong>;
        "message": PacketEvent<Packets.Message>;
        "messageResponse": PacketEvent<Packets.MessageResponse>;
        "playSong": PacketEvent<Packets.PlaySong>;
        "scoreRequest": PacketEvent<Packets.ScoreRequest>;
        "scoreRequestResponse": PacketEvent<Packets.ScoreRequestResponse>;
        "songFinished": PacketEvent<Packets.SongFinished>;
        // "songList": PacketEvent<Packet.SongList>;
        "submitScore": PacketEvent<Packets.SubmitScore>;
        "response": PacketEvent<Packets.Response>;
        "packet": Packets.Packet;
    }

    type PacketEvent<T> = {
        from: string;
        data: T;
    }

}
