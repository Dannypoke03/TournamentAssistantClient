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
        console.log(packet.packet);
        // switch (packet.Type) {
        //     case PacketType.ConnectResponse:
        //         break;
        //     case PacketType.Event:
        //         const event: Event = packet.SpecificPacket;
        //         switch (event.Type) {
        //             case EventType.CoordinatorAdded:
        //                 this.coordinatorAdded(event.ChangedObject, packet.From);
        //                 break;
        //             case EventType.CoordinatorLeft:
        //                 this.coordinatorLeft(event.ChangedObject, packet.From);
        //                 break;
        //             case EventType.MatchCreated:
        //                 this.matchCreated(event.ChangedObject, packet.From);
        //                 break;
        //             case EventType.MatchUpdated:
        //                 this.matchUpdated(event.ChangedObject, packet.From);
        //                 break;
        //             case EventType.MatchDeleted:
        //                 this.matchDeleted(event.ChangedObject, packet.From);
        //                 break;
        //             case EventType.PlayerAdded:
        //                 this.playerAdded(event.ChangedObject, packet.From);
        //                 break;
        //             case EventType.PlayerUpdated:
        //                 this.playerUpdated(event.ChangedObject, packet.From);
        //                 break;
        //             case EventType.PlayerLeft:
        //                 this.playerLeft(event.ChangedObject, packet.From);
        //                 break;
        //             case EventType.QualifierEventCreated:
        //                 this.qualifierEventCreated(event.ChangedObject, packet.From);
        //                 break;
        //             case EventType.QualifierEventUpdated:
        //                 this.qualifierEventUpdated(event.ChangedObject, packet.From);
        //                 break;
        //             case EventType.QualifierEventDeleted:
        //                 this.qualifierEventDeleted(event.ChangedObject, packet.From);
        //                 break;
        //             default:
        //                 break;
        //         }
        //         break;
        //     case PacketType.ForwardingPacket:
        //         packet.SpecificPacket.From = packet.From;
        //         // this.handlePacket(packet.SpecificPacket);
        //         this._event.emit('forwardingPacket', { from: packet.From, data: packet.SpecificPacket });
        //         break;
        //     case PacketType.Acknowledgement:
        //         this._event.emit('acknowledgement', { from: packet.From, data: packet.SpecificPacket });
        //         break;
        //     case PacketType.Command:
        //         this._event.emit('command', { from: packet.From, data: packet.SpecificPacket });
        //         break;
        //     case PacketType.Connect:
        //         this._event.emit('connect', { from: packet.From, data: packet.SpecificPacket });
        //         break;
        //     case PacketType.File:
        //         this._event.emit('file', { from: packet.From, data: packet.SpecificPacket });
        //         break;
        //     case PacketType.LoadedSong:
        //         this._event.emit('loadedSong', { from: packet.From, data: packet.SpecificPacket });
        //         break;
        //     case PacketType.LoadSong:
        //         this._event.emit('loadSong', { from: packet.From, data: packet.SpecificPacket });
        //         break;
        //     case PacketType.Response:
        //         this._event.emit('response', { from: packet.From, data: packet.SpecificPacket });
        //         break;
        //     case PacketType.ScoreRequest:
        //         this._event.emit('scoreRequest', { from: packet.From, data: packet.SpecificPacket });
        //         break;
        //     case PacketType.ScoreRequestResponse:
        //         this._event.emit('scoreRequestResponse', { from: packet.From, data: packet.SpecificPacket });
        //         break;
        //     case PacketType.SongFinished:
        //         this._event.emit('songFinished', { from: packet.From, data: packet.SpecificPacket });
        //         break;
        //     case PacketType.SongList:
        //         this._event.emit('songList', { from: packet.From, data: packet.SpecificPacket });
        //         break;
        //     case PacketType.SubmitScore:
        //         this._event.emit('submitScore', { from: packet.From, data: packet.SpecificPacket });
        //         break;
        //     case PacketType.Message:
        //         this._event.emit('message', { from: packet.From, data: packet.SpecificPacket });
        //         break;
        //     case PacketType.MessageResponse:
        //         this._event.emit('messageResponse', { from: packet.From, data: packet.SpecificPacket });
        //         break;
        // }
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