import { Config } from "../models/Config";
import { Models } from "../models/proto/models";
import { Packets } from "../models/proto/packets";

import EventEmitter from "events";
import { w3cwebsocket as webSock } from "websocket";
import { Emitter } from "../models/EventEmitter";
import { ITransport } from "../models/Transport";

export interface ConnectionOptions {
    url: string;
    password?: string;
    options?: Partial<Config>;
}

export class TAWebsocket {
    readonly url: string;
    readonly password?: string;

    private ws: webSock | null = null;

    private _config: Config;

    public get config(): Config {
        return { ...this._config };
    }

    private reconnectAttempts = -1;

    private sendToSocket: (data: any) => void = () => null;

    public emitter: Emitter<ITransport.Events> = new EventEmitter();

    constructor({ url, password, options }: ConnectionOptions) {
        this._config = this.loadConfig(options);
        this.url = url;
        this.password = password;

        if (this.config.autoInit) this.init();
        if (!this.config.sendToSocket) {
            this.sendToSocket = data => this.ws?.send(data);
        } else {
            this.sendToSocket = this.config.sendToSocket;
        }
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
        this.ws = new webSock(`${this.url}`);
        this.ws.binaryType = "arraybuffer";
        if (!this.ws) return;
        const connectTimeout = setTimeout(() => {
            if (this.ws?.readyState !== webSock.OPEN && this.config.handshakeTimeout > 0) {
                this.ws?.close();
                this.ws = null;
                this.init();
            }
        }, this.config.handshakeTimeout);
        this.ws.onopen = () => {
            clearTimeout(connectTimeout);
            this.emitter.emit("open");
        };
        this.ws.onmessage = event => {
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
        };
        this.ws.onclose = () => {
            this.emitter.emit("disconnected");
            if (this.config.autoReconnect && this.reconnectAttempts < this.config.autoReconnectMaxRetries) {
                setTimeout(() => {
                    this.init();
                }, this.config.autoReconnectInterval);
                if (this.reconnectAttempts !== -1) this.reconnectAttempts++;
            }
        };
        this.ws.onerror = error => {
            this.emitter.emit("error", error);
        };
    }

    sendPacket(packet: Packets.Packet) {
        this.sendToSocket(packet.serializeBinary());
    }

    close() {
        if (this.ws?.readyState === webSock.OPEN) {
            this.ws.close();
        }
    }
}
