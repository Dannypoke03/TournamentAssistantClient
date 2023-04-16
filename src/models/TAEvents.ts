import { Models } from "./proto/models";
import { Packets } from "./proto/packets";

export namespace TAEvents {
    export type Events = {
        /* USER EVENTS */
        userAdded: PacketEvent<Models.User>;
        userUpdated: PacketEvent<Models.User>;
        userLeft: PacketEvent<Models.User>;

        /* MATCH EVENTS */
        matchCreated: PacketEvent<Models.Match>;
        matchUpdated: PacketEvent<Models.Match>;
        matchDeleted: PacketEvent<Models.Match>;

        /* QUALIFIER EVENTS */
        qualifierEventCreated: PacketEvent<Models.QualifierEvent>;
        qualifierEventUpdated: PacketEvent<Models.QualifierEvent>;
        qualifierEventDeleted: PacketEvent<Models.QualifierEvent>;

        /* COMMANDS */
        loadSong: PacketEvent<Packets.Command.LoadSong>;
        playSong: PacketEvent<Packets.Command.PlaySong>;
        sendBotMessage: PacketEvent<Packets.Command.SendBotMessage>;
        showModal: PacketEvent<Packets.Command.ShowModal>;

        /* PUSH EVENTS */
        pushLeaderboardScore: PacketEvent<Models.LeaderboardScore>;
        songFinished: PacketEvent<Packets.Push.SongFinished>;
        realtimeScore: PacketEvent<Models.RealtimeScore>;

        /* REQUESTS */
        connectRequest: PacketEvent<Packets.Request.Connect>;
        leaderboardScoreRequest: PacketEvent<Packets.Request.LeaderboardScore>;
        preloadImageForStreamSync: PacketEvent<Packets.Request.PreloadImageForStreamSync>;

        /* RESPONSES */
        connectResponse: PacketEvent<ResponsePacketData<Packets.Response.Connect>>;
        leaderboardScoreResponse: PacketEvent<ResponsePacketData<Packets.Response.LeaderboardScores>>;
        loadedSong: PacketEvent<ResponsePacketData<Packets.Response.LoadedSong>>;
        modalResponse: PacketEvent<ResponsePacketData<Packets.Response.Modal>>;
        imagePreloaded: PacketEvent<ResponsePacketData<Packets.Response.ImagePreloaded>>;

        /* OTHER */
        acknowledgement: PacketEvent<Packets.Acknowledgement>;
        forwardingPacket: PacketEvent<Packets.ForwardingPacket>;
        packet: Packets.Packet;

        /* GENERAL EVENTS */
        wsConnected: string;
        taConnected: string;
        close: void;
        error: unknown;
    };

    export type PacketEvent<T> = {
        from: string;
        data: T;
    };

    export type ResponsePacketData<T> = {
        response: T;
        info: {
            type: Packets.Response.ResponseType;
            inResponseTo: string;
        };
    };
}
