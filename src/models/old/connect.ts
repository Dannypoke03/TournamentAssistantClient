export interface Connect {
    ClientType: ConnectTypes;
    Name: string;
    UserId: string;
    ClientVersion: number;
}

export enum ConnectTypes {
    Player,
    Coordinator,
    TemporaryConnection
}