import { Packets } from "./proto/packets";

export namespace ITransport {
    export interface Events {
        open: void;
        disconnected: void;
        message: Packets.Packet;
        error: unknown;
    }
}
