export interface SocketTransport {
    send: (data: any) => void;
    close: () => void;
    onClose: () => void;
    onOpen: () => void;
    onMessage: (event: Buffer) => void;
    onError: (event: Error) => void;
    connected: boolean;
}