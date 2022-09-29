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
        /* USER EVENTS */
        "userAdded": PacketEvent<Models.User>;
        "userUpdated": PacketEvent<Models.User>;
        "userLeft": PacketEvent<Models.User>;
        
        /* MATCH EVENTS */
        "matchCreated": PacketEvent<Models.Match>;
        "matchUpdated": PacketEvent<Models.Match>;
        "matchDeleted": PacketEvent<Models.Match>;

        /* QUALIFIER EVENTS */
        "qualifierEventCreated": PacketEvent<Models.QualifierEvent>;
        "qualifierEventUpdated": PacketEvent<Models.QualifierEvent>;
        "qualifierEventDeleted": PacketEvent<Models.QualifierEvent>;

        /* COMMANDS */
        "loadSong": PacketEvent<Packets.Command.LoadSong>;
        "playSong": PacketEvent<Packets.Command.PlaySong>;
        "sendBotMessage": PacketEvent<Packets.Command.SendBotMessage>;
        "showModal": PacketEvent<Packets.Command.ShowModal>;

        /* PUSH EVENTS */
        "pushLeaderboardScore": PacketEvent<Packets.Push.LeaderboardScore>;
        "songFinished": PacketEvent<Packets.Push.SongFinished>;
        "realtimeScore": PacketEvent<Packets.Push.RealtimeScore>;

        /* REQUESTS */
        "connectRequest": PacketEvent<Packets.Request.Connect>;
        "leaderboardScoreRequest": PacketEvent<Packets.Request.LeaderboardScore>;
        "preloadImageForStreamSync": PacketEvent<Packets.Request.PreloadImageForStreamSync>;

        /* RESPONSES */
        "connectResponse": PacketEvent<ResponsePacketData<Packets.Response.Connect>>;
        "leaderboardScoreResponse": PacketEvent<ResponsePacketData<Packets.Response.LeaderboardScores>>;
        "loadedSong": PacketEvent<ResponsePacketData<Packets.Response.LoadedSong>>;
        "modalResponse": PacketEvent<ResponsePacketData<Packets.Response.Modal>>;
        "imagePreloaded": PacketEvent<ResponsePacketData<Packets.Response.ImagePreloaded>>;

        "acknowledgement": PacketEvent<Packets.Acknowledgement>;
        "forwardingPacket": PacketEvent<Packets.ForwardingPacket>;


        // // "command": PacketEvent<Packets.Command>;
        // "event": PacketEvent<Packets.Event>;
        // // "file": PacketEvent<Packets.File>;
        // // "message": PacketEvent<Packets.Command.ShowModal>;
        // // "messageResponse": PacketEvent<Packets.Response.Modal>;
        // "scoreRequest": PacketEvent<Packets.Request.LeaderboardScore>;
        // "scoreRequestResponse": PacketEvent<Packets.Response.LeaderboardScores>;
        // // "songList": PacketEvent<Packet.SongList>;
        // "submitScore": PacketEvent<Packets.Push.LeaderboardScore>;
        // "response": PacketEvent<Packets.Response>;
        "packet": Packets.Packet;
    }

    type PacketEvent<T> = {
        from: string;
        data: T;
    }

    type ResponsePacketData<T> = {
        response: T;
        info: {
            type: Packets.Response.ResponseType;
            inResponseTo: string;
        }
    }

}
