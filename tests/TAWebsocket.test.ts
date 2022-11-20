import { Client, Packets, TAWebsocket } from "../src";
import { ws } from "./websocketTestUtil";

describe("TAWebsocket Test", () => {
    test("Custom Socket", done => {
        ws.onopen = () => {
            const taClient = new Client("Test", {
                url: "ws://ta.beatsaberleague.com:2053",
                password: "",
                options: {
                    autoInit: false,
                    sendToSocket: (d: any) => ws.send(d)
                }
            });
            taClient.ClientConnect();
            ws.onmessage = e => {
                taClient.handlePacket(Packets.Packet.deserializeBinary(new Uint8Array(e.data as ArrayBuffer)));
            };
            taClient.on("taConnected", () => {
                done();
            });
        };
    });

    jest.setTimeout(10000);
    test("Auto Reconnect", done => {
        const client = new TAWebsocket({
            url: "ws://cool-broken-link:2053",
            password: "",
            options: {
                autoReconnectInterval: 1000,
                handshakeTimeout: 500,
                autoReconnectMaxRetries: 3
            }
        });
        let reconnects = 0;
        client.emitter.on("disconnected", () => {
            // console.log("disconnected");
            reconnects++;
        });
        client.emitter.on("error", () => {
            // oh no, anyways
        });
        setTimeout(() => {
            try {
                // Expect one more disconnect than reconnects as final failure will not trigger a reconnect
                expect(reconnects).toEqual(4);
                done();
            } catch (error) {
                done(error);
            }
        }, 7000);
    });
});
