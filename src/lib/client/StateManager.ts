import { Emitter } from "../../models/EventEmitter";
import { Models } from "../../models/proto/models";
import { Packets } from "../../models/proto/packets";
import { TAEvents } from "../../models/TAEvents";
import { PlayerWithScore } from "./User";

export class StateManager {
    private _Matches: Models.Match[] = [];
    public get Matches(): Models.Match[] {
        return [...this._Matches];
    }
    private _Coordinators: Models.User[] = [];
    public get Coordinators(): Models.User[] {
        return [...this._Coordinators];
    }
    private _Players: PlayerWithScore[] = [];
    public get Players(): PlayerWithScore[] {
        return [...this._Players];
    }
    private _WebsocketUsers: Models.User[] = [];
    public get WebsocketUsers(): Models.User[] {
        return [...this._WebsocketUsers];
    }
    private _QualifierEvents: Models.QualifierEvent[] = [];
    public get QualifierEvents(): Models.QualifierEvent[] {
        return [...this._QualifierEvents];
    }

    constructor(private emitter: Emitter<TAEvents.Events>) {}

    public handlePacket(packet: Packets.Packet) {
        if (packet.has_event) {
            this.handleEvent(packet.event, packet.from);
        } else if (packet.has_command) {
            this.handleCommand(packet.command, packet.from);
        } else if (packet.has_push) {
            this.handlePush(packet.push, packet.from);
        } else if (packet.has_response) {
            this.handleResponse(packet.response, packet.from);
        } else if (packet.has_request) {
            this.handleRequest(packet.request, packet.from);
        } else if (packet.has_acknowledgement) {
            this.emitter.emit("acknowledgement", { from: packet.from, data: packet.acknowledgement });
        } else if (packet.has_forwarding_packet) {
            this.emitter.emit("forwardingPacket", { from: packet.from, data: packet.forwarding_packet });
        }
        this.emitter.emit("packet", packet);
    }

    init(connectResponse: Packets.Response.Connect) {
        this._Matches = connectResponse.state.matches;
        this._Coordinators = connectResponse.state.users.filter(x => x.client_type === Models.User.ClientTypes.Coordinator);
        this._Players = connectResponse.state.users.filter(x => x.client_type === Models.User.ClientTypes.Player).map(x => new PlayerWithScore(x));
        this._WebsocketUsers = connectResponse.state.users.filter(x => x.client_type === Models.User.ClientTypes.WebsocketConnection);
        this._QualifierEvents = connectResponse.state.events;
    }

    public reset() {
        this._Matches = [];
        this._Coordinators = [];
        this._Players = [];
        this._WebsocketUsers = [];
        this._QualifierEvents = [];
    }

    private handleCommand(command: Packets.Command, from: string) {
        if (command.has_load_song) {
            this.emitter.emit("loadSong", { from: from, data: command.load_song });
        } else if (command.has_play_song) {
            this.emitter.emit("playSong", { from: from, data: command.play_song });
        } else if (command.send_bot_message) {
            this.emitter.emit("sendBotMessage", { from: from, data: command.send_bot_message });
        } else if (command.has_show_modal) {
            this.emitter.emit("showModal", { from: from, data: command.show_modal });
        }
    }

    private handlePush(push: Packets.Push, from: string) {
        if (push.has_leaderboard_score) {
            this.emitter.emit("pushLeaderboardScore", { from: from, data: push.leaderboard_score });
        } else if (push.has_song_finished) {
            this.emitter.emit("songFinished", { from: from, data: push.song_finished });
        } else if (push.has_realtime_score) {
            this.realTimeScoreUpdated(push.realtime_score, from);
        }
    }

    private handleRequest(request: Packets.Request, from: string) {
        if (request.has_connect) {
            this.emitter.emit("connectRequest", { from: from, data: request.connect });
        } else if (request.has_leaderboard_score) {
            this.emitter.emit("leaderboardScoreRequest", { from: from, data: request.leaderboard_score });
        } else if (request.has_preload_image_for_stream_sync) {
            this.emitter.emit("preloadImageForStreamSync", { from: from, data: request.preload_image_for_stream_sync });
        }
    }

    private handleResponse(response: Packets.Response, from: string) {
        const responseData = {
            type: response.type,
            inResponseTo: response.responding_to_packet_id
        };
        if (response.has_connect) {
            this.emitter.emit("connectResponse", { from: from, data: { info: responseData, response: response.connect } });
        } else if (response.has_leaderboard_scores) {
            this.emitter.emit("leaderboardScoreResponse", { from: from, data: { info: responseData, response: response.leaderboard_scores } });
        } else if (response.has_loaded_song) {
            this.emitter.emit("loadedSong", { from: from, data: { info: responseData, response: response.loaded_song } });
        } else if (response.has_modal) {
            this.emitter.emit("modalResponse", { from: from, data: { info: responseData, response: response.modal } });
        } else if (response.has_image_preloaded) {
            this.emitter.emit("imagePreloaded", { from: from, data: { info: responseData, response: response.image_preloaded } });
        }
    }

    private handleEvent(event: Packets.Event, from: string) {
        if (event.user_added_event) {
            this.userAdded(event.user_added_event.user, from);
        } else if (event.user_left_event) {
            this.userLeft(event.user_left_event.user, from);
        } else if (event.user_updated_event) {
            this.userUpdated(event.user_updated_event.user, from);
        } else if (event.match_created_event) {
            this.matchCreated(event.match_created_event.match, from);
        } else if (event.match_updated_event) {
            this.matchUpdated(event.match_updated_event.match, from);
        } else if (event.match_deleted_event) {
            this.matchDeleted(event.match_deleted_event.match, from);
        } else if (event.qualifier_created_event) {
            this.qualifierEventCreated(event.qualifier_created_event.event, from);
        } else if (event.qualifier_updated_event) {
            this.qualifierEventUpdated(event.qualifier_updated_event.event, from);
        } else if (event.qualifier_deleted_event) {
            this.qualifierEventDeleted(event.qualifier_deleted_event.event, from);
        }
    }

    private userAdded(data: Models.User, from: string) {
        switch (data.client_type) {
            case Models.User.ClientTypes.Player: {
                const index = this.Players.findIndex(x => x.guid === data.guid);
                if (index == -1) this._Players.push(new PlayerWithScore(data));
                break;
            }
            case Models.User.ClientTypes.Coordinator: {
                const index2 = this.Coordinators.findIndex(x => x.guid === data.guid);
                if (index2 == -1) this._Coordinators.push(data);
                break;
            }
            case Models.User.ClientTypes.WebsocketConnection: {
                const index3 = this.WebsocketUsers.findIndex(x => x.guid === data.guid);
                if (index3 == -1) this._WebsocketUsers.push(data);
                break;
            }
            default:
                break;
        }
        this.emitter.emit("userAdded", { from: from, data: data });
    }

    private userLeft(data: Models.User, from: string) {
        switch (data.client_type) {
            case Models.User.ClientTypes.Player: {
                const index = this.Players.findIndex(x => x.guid === data.guid);
                if (index > -1) this._Players.splice(index, 1);
                break;
            }
            case Models.User.ClientTypes.Coordinator: {
                const index2 = this.Coordinators.findIndex(x => x.guid === data.guid);
                if (index2 > -1) this._Coordinators.splice(index2, 1);
                break;
            }
            case Models.User.ClientTypes.WebsocketConnection: {
                const index3 = this.WebsocketUsers.findIndex(x => x.guid === data.guid);
                if (index3 > -1) this._WebsocketUsers.splice(index3, 1);
                break;
            }
            default:
                break;
        }
        this.emitter.emit("userLeft", { from: from, data: data });
    }

    private userUpdated(user: Models.User, from: string) {
        switch (user.client_type) {
            case Models.User.ClientTypes.Player: {
                const index = this.Players.findIndex(x => x.guid === user.guid);
                if (index > -1) this.Players[index].updateUser(user);
                break;
            }
            case Models.User.ClientTypes.Coordinator: {
                const index2 = this.Coordinators.findIndex(x => x.guid === user.guid);
                if (index2 > -1) this._Coordinators[index2] = user;
                break;
            }
            case Models.User.ClientTypes.WebsocketConnection: {
                const index3 = this.WebsocketUsers.findIndex(x => x.guid === user.guid);
                if (index3 > -1) this._WebsocketUsers[index3] = user;
                break;
            }
            default:
                break;
        }
        this.emitter.emit("userUpdated", { from: from, data: user });
    }

    private realTimeScoreUpdated(data: Packets.Push.RealtimeScore, from: string) {
        const index = this.Players.findIndex(x => x.guid === data.user_guid);
        if (index > -1) this.Players[index].updateScore(data);
        this.emitter.emit("realtimeScore", { from: from, data: data });
    }

    private matchCreated(match: Models.Match, from: string) {
        if (!this.Matches.find(x => x.guid === match.guid)) this._Matches.push(match);
        this.emitter.emit("matchCreated", { from: from, data: match });
    }

    private matchUpdated(match: Models.Match, from: string) {
        const index = this.Matches.findIndex(x => x.guid == match.guid) ?? -1;
        if (index > -1) {
            this._Matches[index] = match;
            this.emitter.emit("matchUpdated", { from: from, data: match });
        }
    }

    private matchDeleted(match: Models.Match, from: string) {
        const index = this.Matches.findIndex(x => x.guid == match.guid) ?? -1;
        if (index > -1) {
            this._Matches.splice(index, 1);
            this.emitter.emit("matchDeleted", { from: from, data: match });
        }
    }

    private qualifierEventCreated(event: Models.QualifierEvent, from: string) {
        const index = this.QualifierEvents.findIndex(x => x.guid == event.guid);
        if (index == -1) {
            this._QualifierEvents.push(event);
            this.emitter.emit("qualifierEventCreated", { from: from, data: event });
        }
    }

    private qualifierEventUpdated(event: Models.QualifierEvent, from: string) {
        const index = this.QualifierEvents.findIndex(x => x.guid == event.guid);
        if (index && index > -1) {
            this._QualifierEvents[index] = event;
            this.emitter.emit("qualifierEventUpdated", { from: from, data: event });
        }
    }

    private qualifierEventDeleted(event: Models.QualifierEvent, from: string) {
        const index = this.QualifierEvents.findIndex(x => x.guid == event.guid);
        if (index && index > -1) {
            this._QualifierEvents.splice(index, 1);
            this.emitter.emit("qualifierEventDeleted", { from: from, data: event });
        }
    }
}
