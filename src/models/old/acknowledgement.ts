export interface Acknowledgement {
    PacketId: string;
    Type: AcknowledgementType;
}

export enum AcknowledgementType {
    MessageReceived,
    FileDownloaded
}