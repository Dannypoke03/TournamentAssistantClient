import { Client, Models, Packets } from "../src/index";

describe("Client Test", () => {
    let client: Client;

    beforeAll(() => {
        client = new Client("Test", {
            url: "ws://ta.beatsaberleague.com:2053"
        });
    });

    afterAll(async () => {
        // const r = new Promise<boolean>(resolve => {
        //     client.on("close", () => {
        //         resolve(true);
        //     });
        // });
        client.close();
        // await r;
    });

    test("Can connect", async () => {
        const r = new Promise<boolean>(resolve => {
            const timeout = setTimeout(() => {
                resolve(false);
            }, 5000);
            client.once("taConnected", () => {
                resolve(true);
                clearTimeout(timeout);
            });
        });
        expect(await r).toBe(true);
    });

    test("Subscribe & Unsubscribe to events", done => {
        const responses: Models.User[] = [];
        const handleUserUpdate = (u: any) => {
            responses.push(u);
            client.off("userUpdated", handleUserUpdate);
            client.sendEvent(
                new Packets.Event({
                    user_updated_event: new Packets.Event.UserUpdatedEvent({
                        user: client.Self
                    })
                })
            );
        };
        client.on("userUpdated", handleUserUpdate);
        client.sendEvent(
            new Packets.Event({
                user_updated_event: new Packets.Event.UserUpdatedEvent({
                    user: client.Self
                })
            })
        );
        setTimeout(() => {
            try {
                expect(responses.length).toBe(1);
                done();
            } catch (error) {
                done(error);
            }
        }, 1000);
    });

    test("Once event fires only once", done => {
        const responses: Models.User[] = [];
        const handleUserUpdate = (u: any) => {
            responses.push(u);
        };
        client.once("userUpdated", handleUserUpdate);
        for (let i = 0; i < 10; i++) {
            client.sendEvent(
                new Packets.Event({
                    user_updated_event: new Packets.Event.UserUpdatedEvent({
                        user: client.Self
                    })
                })
            );
        }
        setTimeout(() => {
            try {
                expect(responses.length).toBe(1);
                done();
            } catch (error) {
                done(error);
            }
        }, 1000);
    });

    test("Error on bad URL", done => {
        const client = new Client("Test", {
            url: "ws://cool-broken-site-link:2053"
        });
        client.on("error", () => {
            try {
                expect(1).toBe(1);
                done();
            } catch (error) {
                done(error);
            }
        });
    });

    test("Close event on bad URL", done => {
        const client = new Client("Test", {
            url: "ws://cool-broken-site-link:2053"
        });
        client.on("error", () => {
            // Do nothing
        });
        client.on("close", () => {
            try {
                expect(1).toBe(1);
                done();
            } catch (error) {
                done(error);
            }
        });
    });

    test("Can get users & self in that list", () => {
        expect(client.users).toBeDefined();
        expect(client.users.length).toBeGreaterThan(0);
        expect(client.users.find(x => x.guid === client.Self.guid)).toBeDefined();
    });

    test("State exists and has information", () => {
        expect(client.State).toBeDefined();
        expect(client.State.users).toBeDefined();
        expect(client.State.users.length).toBeGreaterThan(0);
        expect(client.State.users.find(x => x.guid === client.Self.guid)).toBeDefined();
    });

    test("Get user by guid", () => {
        expect(client.getUser(client.Self.guid)).toBeDefined();
    });
});
