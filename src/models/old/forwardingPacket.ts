import { PacketType } from "./packet";

export interface ForwardingPacket {
    ForwardTo: string[];
    Type: PacketType;
    SpecificPacket: any;
}