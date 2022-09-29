/*eslint-disable no-case-declarations */
import EventEmitter from "events";
import { Models } from "../models/proto/models";
import { Packets } from "../models/proto/packets";
import { TAEventEmitter } from "../models/_EventEmitter";


export class Client {

    public Self: Models.User;
    public State?: Models.State;

    public isConnected = false;

    public _event: TAEventEmitter.Emitter<TAEventEmitter.Events> = new EventEmitter();

    constructor(self: Models.User) {
        this.Self = self;
    }

    init(connectResponse: Packets.Response.Connect) {
        this.Self.guid = connectResponse.self_guid;
        this.State = connectResponse.state;
        this.isConnected = true;
    }

    public get on() {
        return this._event.on.bind(this._event);
    }

    public reset() {
        this.State = undefined;
        this.isConnected = false;
    }

    public handlePacket(packet: Packets.Packet) {
        if (!this.isConnected) return;
        this._event.emit("packet", packet);
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
            this._event.emit("acknowledgement", { from: packet.from, data: packet.acknowledgement });
        } else if (packet.has_forwarding_packet) {
            this._event.emit("forwardingPacket", { from: packet.from, data: packet.forwarding_packet });
        }
        
        
        
        // else if (packet.forwarding_packet) {
        //     packet.forwarding_packet.packet.from = packet.from;
        //     this._event.emit("forwardingPacket", { from: packet.from, data: packet.forwarding_packet });
        // } else if (packet.acknowledgement) {
        //     this._event.emit("acknowledgement", { from: packet.from, data: packet.acknowledgement });
        //     // } else if (packet.command) {
        //     //     this._event.emit("command", { from: packet.from, data: packet.command });
        // } else if (packet.request.connect) {
        //     this._event.emit("connectResponse", { from: packet.from, data: packet.response.connect });
        // } else if (packet.response.connect) {
        //     this._event.emit("connectResponse", { from: packet.from, data: packet.response.connect });
        //     // } else if (packet.file) {
        //     //     this._event.emit("file", { from: packet.from, data: packet.file });
        // } else if (packet.response.loaded_song) {
        //     this._event.emit("loadedSong", { from: packet.from, data: packet.response.loaded_song });
        // } else if (packet.command.load_song) {
        //     this._event.emit("loadSong", { from: packet.from, data: packet.command.load_song });
        //     // } else if (packet.response) {
        //     //     this._event.emit("response", { from: packet.from, data: packet.response });
        // } else if (packet.request.leaderboard_score) {
        //     this._event.emit("scoreRequest", { from: packet.from, data: packet.request.leaderboard_score });
        // } else if (packet.response.leaderboard_scores) {
        //     this._event.emit("scoreRequestResponse", { from: packet.from, data: packet.response.leaderboard_scores });
        // } else if (packet.push.song_finished) {
        //     this._event.emit("songFinished", { from: packet.from, data: packet.push.song_finished });
        // } else if (packet.push.leaderboard_score) {
        //     this._event.emit("submitScore", { from: packet.from, data: packet.push.leaderboard_score });
        // } else if (packet.response.modal) {
        //     this._event.emit("messageResponse", { from: packet.from, data: packet.response.modal });
        // } else if (packet.command.show_modal) {
        //     this._event.emit("message", { from: packet.from, data: packet.command.show_modal });
        // }
    }

    private handleCommand(command: Packets.Command, from: string) {
        if (command.has_load_song) {
            this._event.emit("loadSong", { from: from, data: command.load_song });
        } else if (command.has_play_song) {
            this._event.emit("playSong", { from: from, data: command.play_song });
        } else if (command.send_bot_message) {
            this._event.emit("sendBotMessage", { from: from, data: command.send_bot_message });
        } else if (command.has_show_modal) {
            this._event.emit("showModal", { from: from, data: command.show_modal });
        }
    }

    private handlePush(push: Packets.Push, from: string) {
        if (push.has_leaderboard_score) {
            this._event.emit("pushLeaderboardScore", { from: from, data: push.leaderboard_score });
        } else if (push.has_song_finished) {
            this._event.emit("songFinished", { from: from, data: push.song_finished });
        } else if (push.has_realtime_score) {
            this._event.emit("realtimeScore", { from: from, data: push.realtime_score });
        }
    }

    private handleRequest(request: Packets.Request, from: string) {
        if (request.has_connect) {
            this._event.emit("connectRequest", { from: from, data: request.connect });
        } else if (request.has_leaderboard_score) {
            this._event.emit("leaderboardScoreRequest", { from: from, data: request.leaderboard_score });
        } else if (request.has_preload_image_for_stream_sync) {
            this._event.emit("preloadImageForStreamSync", { from: from, data: request.preload_image_for_stream_sync });
        }
    }

    private handleResponse(response: Packets.Response, from: string) {
        const responseData = {
            type: response.type,
            inResponseTo: response.responding_to_packet_id,
        };
        if (response.has_connect) {
            this._event.emit("connectResponse", { from: from, data: { info: responseData, response: response.connect} });
        } else if (response.has_leaderboard_scores) {
            this._event.emit("leaderboardScoreResponse", { from: from, data: { info: responseData, response: response.leaderboard_scores} });
        } else if (response.has_loaded_song) {
            this._event.emit("loadedSong", { from: from, data: { info: responseData, response: response.loaded_song} });
        } else if (response.has_modal) {
            this._event.emit("modalResponse", { from: from, data: { info: responseData, response: response.modal} });
        } else if (response.has_image_preloaded) {
            this._event.emit("imagePreloaded", { from: from, data: { info: responseData, response: response.image_preloaded} });
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

    getUser(id: string) {
        return this.State?.users.find(x => x.guid === id);
    }

    getMatch(id: string) {
        return this.State?.matches.find(x => x.guid === id);
    }

    getEvent(id: string) {
        return this.State?.events.find(x => x.guid === id);
    }

    private userAdded(data: Models.User, from: string) {
        if (!this.isConnected) return;
        const index = this.State?.users.findIndex(x => x.guid === data.guid);
        if (index == -1) this.State?.users.push(data);
        this._event.emit("userAdded", { from: from, data: data });
    }

    private userLeft(data: Models.User, from: string) {
        const index = this.State?.users?.findIndex(x => x.guid == data?.guid) ?? -1;
        if (index > -1) {
            this.State?.users.splice(index, 1);
            this._event.emit("userLeft", { from: from, data: data });
        }
    }

    private userUpdated(player: Models.User, from: string) {
        const index = this.State?.users.findIndex(x => x.guid == player.guid) ?? -1;
        if (index > -1 && this.State) {
            this.State.users[index] = player;
            this._event.emit("userUpdated", { from: from, data: player });

            // Match update
            // const matches = this.State?.matches.filter(x => x.associated_users.some(y => y.id === player.id));
            // if (!matches || !this.State) return;
            // for (const match of matches) {
            //     const p = match.associated_users.findIndex(x => x.id === player.id);
            //     if (p > -1) {
            //         this.State.matches[this.State.matches.indexOf(match)].associated_users[p] = player;
            //         this.matchUpdated(match, from);
            //     }
            // }
        }
    }

    private matchCreated(match: Models.Match, from: string) {
        if (!this.State?.matches.find(x => x.guid === match.guid)) this.State?.matches.push(match);
        this._event.emit("matchCreated", { from: from, data: match });
    }

    private matchUpdated(match: Models.Match, from: string) {
        const index = this.State?.matches.findIndex(x => x.guid == match.guid) ?? -1;
        if (index > -1 && this.State) {
            this.State.matches[index] = match;
            this._event.emit("matchUpdated", { from: from, data: match });
        }
    }

    private matchDeleted(match: Models.Match, from: string) {
        const index = this.State?.matches.findIndex(x => x.guid == match.guid) ?? -1;
        if (index > -1) {
            this.State?.matches.splice(index, 1);
            this._event.emit("matchDeleted", { from: from, data: match });
        }
    }

    private qualifierEventCreated(event: Models.QualifierEvent, from: string) {
        const index = this.State?.events.findIndex(x => x.guid == event.guid);
        if (index == -1) {
            this.State?.events.push(event);
            this._event.emit("qualifierEventCreated", { from: from, data: event });
        }
    }

    private qualifierEventUpdated(event: Models.QualifierEvent, from: string) {
        const index = this.State?.events.findIndex(x => x.guid == event.guid);
        if (index && index > -1 && this.State) {
            this.State.events[index] = event;
            this._event.emit("qualifierEventUpdated", { from: from, data: event });
        }
    }

    private qualifierEventDeleted(event: Models.QualifierEvent, from: string) {
        const index = this.State?.events.findIndex(x => x.guid == event.guid);
        if (index && index > -1 && this.State) {
            this.State.events.splice(index, 1);
            this._event.emit("qualifierEventDeleted", { from: from, data: event });
        }
    }
}