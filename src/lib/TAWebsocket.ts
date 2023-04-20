import EventEmitter from "events";
import WebSocket from "ws";
import { Config } from "../models/Config";
import { Emitter } from "../models/EventEmitter";
import { ITransport } from "../models/Transport";
import { Models } from "../models/proto/models";
import { Packets } from "../models/proto/packets";

export interface ConnectionOptions {
    url: string;
    password?: string;
    options?: Partial<Config>;
}

export class TAWebsocket {
    readonly url: string;
    readonly password?: string;

    private ws: WebSocket | null = null;

    private _config: Config;

    public get config(): Config {
        return { ...this._config };
    }

    private reconnectAttempts = -1;
    private reconnectTimeout: NodeJS.Timeout | null = null;

    private sendToSocket: (data: any) => void = d => this.ws?.send(d);

    public emitter: Emitter<ITransport.Events> = new EventEmitter();

    constructor({ url, password, options }: ConnectionOptions) {
        this._config = this.loadConfig(options);
        this.url = url;
        this.password = password;

        if (this.config.autoInit) this.init();
        if (this.config.sendToSocket) {
            this.sendToSocket = this.config.sendToSocket;
        }
        if (this.config.autoReconnectMaxRetries !== -1) this.reconnectAttempts = 1;
    }

    private loadConfig(config?: Partial<Config>): Config {
        return {
            autoReconnect: true,
            autoReconnectInterval: 10000,
            autoReconnectMaxRetries: -1,
            handshakeTimeout: 0,
            autoInit: true,
            sendToSocket: null,
            connectionMode: Models.User.ClientTypes.WebsocketConnection,
            ...config
        };
    }

    private init() {
        this.ws = new WebSocket(this.url);
        this.ws.binaryType = "arraybuffer";
        const connectTimeout = setTimeout(() => {
            if (this.ws?.readyState !== WebSocket.OPEN && this.config.handshakeTimeout > 0) {
                this.ws?.close();
                this.ws = null;
            }
        }, this.config.handshakeTimeout);
        this.ws.addEventListener("open", () => {
            clearTimeout(connectTimeout);
            this.emitter.emit("open");
        });
        this.ws.addEventListener("message", event => {
            if (event.data instanceof ArrayBuffer) {
                try {
                    const packet = Packets.Packet.deserializeBinary(new Uint8Array(event.data));
                    this.emitter.emit("message", packet);
                } catch (error) {
                    this.emitter.emit("error", error);
                }
            } else {
                this.emitter.emit("error", "Warn: Received non-binary message");
            }
        });
        this.ws.addEventListener("close", () => {
            this.emitter.emit("disconnected");
            if (this.config.autoReconnect && !this.reconnectTimeout && this.reconnectAttempts <= this.config.autoReconnectMaxRetries) {
                this.ws?.removeAllListeners();
                this.ws = null;
                this.reconnectTimeout = setTimeout(() => {
                    this.reconnectTimeout = null;
                    this.init();
                }, this.config.autoReconnectInterval);
                if (this.config.autoReconnectMaxRetries !== -1) this.reconnectAttempts++;
            }
        });
        this.ws.addEventListener("error", e => {
            this.emitter.emit("error", e);
        });
    }

    sendPacket(packet: Packets.Packet) {
        this.sendToSocket(packet.serializeBinary());
    }

    close() {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.close();
        }
    }
}
