import { Client, Models, Packets } from "../src/index";

describe("Client Test", () => {
    let client: Client;
    let player: Client;
    let coordinator: Client;

    beforeAll(() => {
        client = new Client("Test Client", {
            url: "ws://tournamentassistant.net:2053"
        });
        player = new Client("Test Player", {
            url: "ws://tournamentassistant.net:2053",
            options: {
                connectionMode: Models.User.ClientTypes.Player
            }
        });
        coordinator = new Client("Test Coord", {
            url: "ws://tournamentassistant.net:2053",
            options: {
                connectionMode: Models.User.ClientTypes.Coordinator
            }
        });
    });

    afterAll(async () => {
        client.close();
        player.close();
        coordinator.close();
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
            url: "ws://cool-broken-site-link:2053",
            options: {
                handshakeTimeout: 100,
                autoReconnect: false
            }
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
            url: "ws://cool-broken-site-link:2053",
            options: {
                handshakeTimeout: 100,
                autoReconnect: false
            }
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

    let testMatchGuid: string;
    let testMatch: Models.Match | null;
    test("Create Match", done => {
        client.once("matchCreated", m => {
            try {
                expect(testMatchGuid).toBe(m.data.guid);
                done();
            } catch (error) {
                done(error);
            }
        });

        testMatchGuid = client.createMatch([player.Self, coordinator.Self]);
        expect(testMatchGuid).toBeDefined();
    });

    test("Get Match", () => {
        testMatch = client.getMatch(testMatchGuid) ?? null;
        expect(testMatch).toBeDefined();
    });

    test("Update Match", done => {
        if (!testMatch) throw Error("Test match is null");
        testMatch.selected_difficulty = 1;
        client.once("matchUpdated", m => {
            try {
                expect(m.data.selected_difficulty).toBe(1);
                done();
            } catch (error) {
                done(error);
            }
        });
        client.updateMatch(testMatch);
    });

    test("Get Match Players", () => {
        if (!testMatch) throw Error("Test match is null");
        const players = client.getMatchPlayers(testMatch);
        expect(players).toBeDefined();
        expect(players.length).toBe(1);
    });

    test("Get Match Coordinators", () => {
        if (!testMatch) throw Error("Test match is null");
        const coords = client.getMatchCoordinators(testMatch);
        expect(coords).toBeDefined();
        expect(coords.length).toBe(1);
    });

    test("Get Match Coordinator", () => {
        if (!testMatch) throw Error("Test match is null");
        const websocketUsers = client.getMatchWebsocketUsers(testMatch);
        expect(websocketUsers).toBeDefined();
        expect(websocketUsers.length).toBe(1);
    });

    test("Get Match Users", () => {
        if (!testMatch) throw Error("Test match is null");
        const users = client.getMatchUsers(testMatch);
        expect(users).toBeDefined();
        expect(users.length).toBe(3);
    });

    test("Load Song", done => {
        if (!testMatch) throw Error("Test match is null");
        player.once("loadSong", m => {
            try {
                expect(m.data.level_id).toBeDefined();
                done();
            } catch (error) {
                done(error);
            }
        });
        client.loadSong("Test", "0000000000000", 0, testMatch);
    });

    test("Play Song", done => {
        if (!testMatch) throw Error("Test match is null");
        player.once("playSong", m => {
            try {
                expect(m.data).toBeDefined();
                done();
            } catch (error) {
                done(error);
            }
        });
        client.once("matchUpdated", m => {
            expect(new Date(m.data.start_time).getTime()).toBeDefined();
            expect(new Date(m.data.start_time).getTime()).toBeLessThan(Date.now() + 2000);
            expect(new Date(m.data.start_time).getTime()).toBeGreaterThan(Date.now() - 5000);
        });
        client.playSong(testMatch);
    });

    test("Delete Match", done => {
        if (!testMatch) throw Error("Test match is null");
        client.once("matchDeleted", m => {
            try {
                expect(m.data.guid).toBe(testMatchGuid);
                expect(client.getMatch(testMatchGuid)).toBeUndefined();
                done();
            } catch (error) {
                done(error);
            }
        });
        client.closeMatch(testMatch);
    });

    test("Send Message", done => {
        client.once("showModal", m => {
            try {
                expect(m.data.message_text).toBe("Test");
                done();
            } catch (error) {
                done(error);
            }
        });
        client.sendMessage(
            [client.Self.guid],
            new Packets.Command.ShowModal({
                modal_id: "test",
                message_title: "Test",
                message_text: "Test",
                can_close: false
            })
        );
    });

    test("Get websocket user", () => {
        expect(client.getWebsocketUser(client.Self.guid)).toBeDefined();
    });

    test("Get Player", () => {
        expect(client.getPlayer(player.Self.guid)).toBeDefined();
    });

    test("Get Coordinator", () => {
        expect(client.getCoordinator(coordinator.Self.guid)).toBeDefined();
    });

    test("Reset", () => {
        client.reset();
        expect(client.users.length).toBe(0);
        expect(client.State.users.length).toBe(0);
    });
});
