import EventEmitter from "events";
import { Models, Packets, StateManager } from "../src";

describe("State Manager Tests", () => {
    const emitter = new EventEmitter();
    const sm = new StateManager(emitter);

    describe("Events", () => {
        test("User Added Event", done => {
            emitter.once("userAdded", () => {
                done();
            });
            sm.handlePacket(
                new Packets.Packet({
                    event: new Packets.Event({
                        user_added_event: new Packets.Event.UserAddedEvent({
                            user: new Models.User({
                                guid: "5"
                            })
                        })
                    })
                })
            );
        });

        test("User Updated Event", done => {
            emitter.once("userUpdated", () => {
                done();
            });
            sm.handlePacket(
                new Packets.Packet({
                    event: new Packets.Event({
                        user_updated_event: new Packets.Event.UserUpdatedEvent({
                            user: new Models.User({
                                guid: "5"
                            })
                        })
                    })
                })
            );
        });

        test("User Left Event", done => {
            emitter.once("userLeft", () => {
                done();
            });
            sm.handlePacket(
                new Packets.Packet({
                    event: new Packets.Event({
                        user_left_event: new Packets.Event.UserLeftEvent({
                            user: new Models.User({
                                guid: "5"
                            })
                        })
                    })
                })
            );
        });

        test("Match Created Event", done => {
            emitter.once("matchCreated", () => {
                done();
            });
            sm.handlePacket(
                new Packets.Packet({
                    event: new Packets.Event({
                        match_created_event: new Packets.Event.MatchCreatedEvent({
                            match: new Models.Match({
                                guid: "5"
                            })
                        })
                    })
                })
            );
        });

        test("Match Updated Event", done => {
            emitter.once("matchUpdated", () => {
                done();
            });
            sm.handlePacket(
                new Packets.Packet({
                    event: new Packets.Event({
                        match_updated_event: new Packets.Event.MatchUpdatedEvent({
                            match: new Models.Match({
                                guid: "5"
                            })
                        })
                    })
                })
            );
        });

        test("Match Deleted Event", done => {
            emitter.once("matchDeleted", () => {
                done();
            });
            sm.handlePacket(
                new Packets.Packet({
                    event: new Packets.Event({
                        match_deleted_event: new Packets.Event.MatchDeletedEvent({
                            match: new Models.Match({
                                guid: "5"
                            })
                        })
                    })
                })
            );
        });

        test("Qualifier Event Created", done => {
            emitter.once("qualifierEventCreated", () => {
                done();
            });
            sm.handlePacket(
                new Packets.Packet({
                    event: new Packets.Event({
                        qualifier_created_event: new Packets.Event.QualifierCreatedEvent({
                            event: new Models.QualifierEvent({
                                guid: "5"
                            })
                        })
                    })
                })
            );
        });

        test("Qualifier Event Updated", done => {
            emitter.once("qualifierEventUpdated", () => {
                done();
            });
            sm.handlePacket(
                new Packets.Packet({
                    event: new Packets.Event({
                        qualifier_updated_event: new Packets.Event.QualifierUpdatedEvent({
                            event: new Models.QualifierEvent({
                                guid: "5"
                            })
                        })
                    })
                })
            );
        });

        test("Qualifier Event Deleted", done => {
            emitter.once("qualifierEventDeleted", () => {
                done();
            });
            sm.handlePacket(
                new Packets.Packet({
                    event: new Packets.Event({
                        qualifier_deleted_event: new Packets.Event.QualifierDeletedEvent({
                            event: new Models.QualifierEvent({
                                guid: "5"
                            })
                        })
                    })
                })
            );
        });
    });

    describe("Command", () => {
        test("Command - Load Song", done => {
            emitter.once("loadSong", () => {
                done();
            });
            sm.handlePacket(
                new Packets.Packet({
                    command: new Packets.Command({
                        load_song: new Packets.Command.LoadSong({
                            level_id: "5"
                        })
                    })
                })
            );
        });

        test("Command - Play Song", done => {
            emitter.once("playSong", () => {
                done();
            });
            sm.handlePacket(
                new Packets.Packet({
                    command: new Packets.Command({
                        play_song: new Packets.Command.PlaySong({})
                    })
                })
            );
        });

        test("Command - Send Bot Message", done => {
            emitter.once("sendBotMessage", () => {
                done();
            });
            sm.handlePacket(
                new Packets.Packet({
                    command: new Packets.Command({
                        send_bot_message: new Packets.Command.SendBotMessage({
                            message: "5"
                        })
                    })
                })
            );
        });

        test("Command - Show Modal", done => {
            emitter.once("showModal", () => {
                done();
            });
            sm.handlePacket(
                new Packets.Packet({
                    command: new Packets.Command({
                        show_modal: new Packets.Command.ShowModal({
                            message_text: "5"
                        })
                    })
                })
            );
        });
    });

    describe("Push", () => {
        test("Push - Leaderboard Score", done => {
            emitter.once("leaderboardScore", () => {
                done();
            });
            sm.handlePacket(
                new Packets.Packet({
                    push: new Packets.Push({
                        leaderboard_score: new Packets.Push.LeaderboardScore({
                            score: new Models.LeaderboardScore({
                                score: 5
                            })
                        })
                    })
                })
            );
        });
    });
});
