/*eslint-disable no-case-declarations */
import EventEmitter from "events";
import { Models } from "../models/proto/models";
import { Packet } from "../models/proto/packets";
import { TAEventEmitter } from "../models/_EventEmitter";


export class Client {

    public Self?: Models.User;
    public State?: Models.State;

    public isConnected = false;

    public _event: TAEventEmitter.Emitter<TAEventEmitter.Events> = new EventEmitter();

    init(connectResponse?: Packet.ConnectResponse) {
        if (connectResponse && connectResponse.response.type === Packet.Response.ResponseType.Success) {
            this.Self = connectResponse.self;
            this.State = connectResponse.state;
            this.isConnected = true;
        }
    }

    public get on() {
        return this._event.on.bind(this._event);
    }

    public reset() {
        this.State = undefined;
        this.Self = undefined;
        this.isConnected = false;
    }

    public handlePacket(packet: Packet.Packet) {
        if (!this.isConnected) return;
        this._event.emit("packet", packet);
        if (packet.event) {
            const event = packet.event;
            if (event.coordinator_added_event) {
                this.coordinatorAdded(event.coordinator_added_event.coordinator, packet.from);
            } else if (event.coordinator_left_event) {
                this.coordinatorLeft(event.coordinator_left_event.coordinator, packet.from);
            } else if (event.match_created_event) {
                this.matchCreated(event.match_created_event.match, packet.from);
            } else if (event.match_updated_event) {
                this.matchUpdated(event.match_updated_event.match, packet.from);
            } else if (event.match_deleted_event) {
                this.matchDeleted(event.match_deleted_event.match, packet.from);
            } else if (event.player_added_event) {
                this.playerAdded(event.player_added_event.player, packet.from);
            } else if (event.player_updated_event) {
                this.playerUpdated(event.player_updated_event.player, packet.from);
            } else if (event.player_left_event) {
                this.playerLeft(event.player_left_event.player, packet.from);
            } else if (event.qualifier_created_event) {
                this.qualifierEventCreated(event.qualifier_created_event.event, packet.from);
            } else if (event.qualifier_updated_event) {
                this.qualifierEventUpdated(event.qualifier_updated_event.event, packet.from);
            } else if (event.qualifier_deleted_event) {
                this.qualifierEventDeleted(event.qualifier_deleted_event.event, packet.from);
            }
        } else if (packet.forwarding_packet) {
            packet.forwarding_packet.packet.from = packet.from;
            this._event.emit("forwardingPacket", { from: packet.from, data: packet.forwarding_packet });
        } else if (packet.acknowledgement) {
            this._event.emit("acknowledgement", { from: packet.from, data: packet.acknowledgement });
        } else if (packet.command) {
            this._event.emit("command", { from: packet.from, data: packet.command });
        } else if (packet.connect) {
            this._event.emit("connect", { from: packet.from, data: packet.connect });
        } else if (packet.file) {
            this._event.emit("file", { from: packet.from, data: packet.file });
        } else if (packet.loaded_song) {
            this._event.emit("loadedSong", { from: packet.from, data: packet.loaded_song });
        } else if (packet.load_song) {
            this._event.emit("loadSong", { from: packet.from, data: packet.load_song });
        } else if (packet.response) {
            this._event.emit("response", { from: packet.from, data: packet.response });
        } else if (packet.score_request) {
            this._event.emit("scoreRequest", { from: packet.from, data: packet.score_request });
        } else if (packet.score_request_response) {
            this._event.emit("scoreRequestResponse", { from: packet.from, data: packet.score_request_response });
        } else if (packet.song_finished) {
            this._event.emit("songFinished", { from: packet.from, data: packet.song_finished });
        } else if (packet.submit_score) {
            this._event.emit("submitScore", { from: packet.from, data: packet.submit_score });
        }
    }

    coordinatorAdded(data: Models.Coordinator, from: string) {
        if (!this.isConnected) return;
        const index = this.State?.coordinators.findIndex(x => x.user.id === data.user.id);
        if (index == -1) this.State?.coordinators.push(data);
        this._event.emit("coordinatorAdded", { from: from, data: data });
    }

    coordinatorLeft(data: Models.Coordinator, from: string) {
        const index = this.State?.coordinators?.findIndex(x => x.user.id == data?.user.id) ?? -1;
        if (index > -1) {
            this.State?.coordinators.splice(index, 1);
            this._event.emit("coordinatorLeft", { from: from, data: data });
        }
    }

    matchCreated(match: Models.Match, from: string) {
        if (!this.State?.matches.find(x => x.guid === match.guid)) this.State?.matches.push(match);
        this._event.emit("matchCreated", { from: from, data: match });
    }

    matchUpdated(match: Models.Match, from: string) {
        const index = this.State?.matches.findIndex(x => x.guid == match.guid) ?? -1;
        if (index > -1 && this.State) {
            this.State.matches[index] = match;
            this._event.emit("matchUpdated", { from: from, data: match });
        }
    }

    matchDeleted(match: Models.Match, from: string) {
        const index = this.State?.matches.findIndex(x => x.guid == match.guid) ?? -1;
        if (index > -1) {
            this.State?.matches.splice(index, 1);
            this._event.emit("matchDeleted", { from: from, data: match });
        }
    }

    playerAdded(player: Models.Player, from: string) {
        this.State?.players.push(player);
        this._event.emit("playerAdded", { from: from, data: player });
    }

    playerUpdated(player: Models.Player, from: string) {
        const index = this.State?.players.findIndex(x => x.user.id == player.user.id) ?? -1;
        if (index > -1 && this.State) {
            this.State.players[index] = player;
            this._event.emit("playerUpdated", { from: from, data: player });

            // Match update
            const matches = this.State?.matches.filter(x => x.players.some(y => y.user.id === player.user.id));
            if (!matches || !this.State) return;
            for (const match of matches) {
                const p = match.players.findIndex(x => x.user.id === player.user.id);
                if (p > -1) {
                    this.State.matches[this.State.matches.indexOf(match)].players[p] = player;
                    this.matchUpdated(match, from);
                }
            }
        }
    }

    playerLeft(player: Models.Player, from: string) {
        const index = this.State?.players.findIndex(x => x.user.id == player.user.id) ?? -1;
        if (index > -1) {
            this.State?.players.splice(index, 1);
            this._event.emit("playerLeft", { from: from, data: player });
        }
    }

    qualifierEventCreated(event: Models.QualifierEvent, from: string) {
        const index = this.State?.events.findIndex(x => x.event_id == event.event_id);
        if (index == -1) {
            this.State?.events.push(event);
            this._event.emit("qualifierEventCreated", { from: from, data: event });
        }
    }

    qualifierEventUpdated(event: Models.QualifierEvent, from: string) {
        const index = this.State?.events.findIndex(x => x.event_id == event.event_id);
        if (index && index > -1 && this.State) {
            this.State.events[index] = event;
            this._event.emit("qualifierEventUpdated", { from: from, data: event });
        }
    }

    qualifierEventDeleted(event: Models.QualifierEvent, from: string) {
        const index = this.State?.events.findIndex(x => x.event_id == event.event_id);
        if (index && index > -1 && this.State) {
            this.State.events.splice(index, 1);
            this._event.emit("qualifierEventDeleted", { from: from, data: event });
        }
    }
}