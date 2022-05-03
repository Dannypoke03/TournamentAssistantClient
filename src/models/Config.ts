export interface Config {
    autoReconnect: boolean;
    autoReconnectInterval: number;
    autoReconnectMaxRetries: number;
    logging: boolean;
    handshakeTimeout: number;
    autoInit: boolean;
    sendToSocket: ((data: any) => void) | null;
}