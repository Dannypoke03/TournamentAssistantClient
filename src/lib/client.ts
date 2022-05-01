/*eslint-disable no-case-declarations */
import EventEmitter from "events";
import { ConnectResponse } from "../models/old/connectResponse";
import { Coordinator } from "../models/old/coordinator";
import { Event, EventType } from "../models/old/event";
import { Match } from "../models/old/match";
import { Packet, PacketMapping, PacketType } from "../models/old/packet";
import { Player } from "../models/old/player";
import { QualifierEvent } from "../models/old/qualifierEvent";
import { ResponseType } from "../models/old/response";;
import { State } from "../models/old/state";
import { User } from "../models/old/User";
import { TAEventEmitter } from "../models/_EventEmitter";


export class Client {

    public Self?: User;
    public State?: State;

    public isConnected = false;

    public _event: TAEventEmitter.Emitter<TAEventEmitter.Events> = new EventEmitter();

    init(connectResponse?: ConnectResponse) {
        if (connectResponse && connectResponse.Type == ResponseType.Success) {
            this.Self = connectResponse.Self;
            this.State = connectResponse.State;
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

    createPacket<T extends PacketType>(specificPacket: PacketMapping[T], type: T) {
        return new Packet<T>(specificPacket, type, this.Self?.Id);
    }

    public handlePacket(packet: Packet<any>) {
        if (!this.isConnected) return;
        this._event.emit('packet', packet);
        switch (packet.Type) {
            case PacketType.ConnectResponse:
                break;
            case PacketType.Event:
                const event: Event = packet.SpecificPacket;
                switch (event.Type) {
                    case EventType.CoordinatorAdded:
                        this.coordinatorAdded(event.ChangedObject, packet.From);
                        break;
                    case EventType.CoordinatorLeft:
                        this.coordinatorLeft(event.ChangedObject, packet.From);
                        break;
                    case EventType.MatchCreated:
                        this.matchCreated(event.ChangedObject, packet.From);
                        break;
                    case EventType.MatchUpdated:
                        this.matchUpdated(event.ChangedObject, packet.From);
                        break;
                    case EventType.MatchDeleted:
                        this.matchDeleted(event.ChangedObject, packet.From);
                        break;
                    case EventType.PlayerAdded:
                        this.playerAdded(event.ChangedObject, packet.From);
                        break;
                    case EventType.PlayerUpdated:
                        this.playerUpdated(event.ChangedObject, packet.From);
                        break;
                    case EventType.PlayerLeft:
                        this.playerLeft(event.ChangedObject, packet.From);
                        break;
                    case EventType.QualifierEventCreated:
                        this.qualifierEventCreated(event.ChangedObject, packet.From);
                        break;
                    case EventType.QualifierEventUpdated:
                        this.qualifierEventUpdated(event.ChangedObject, packet.From);
                        break;
                    case EventType.QualifierEventDeleted:
                        this.qualifierEventDeleted(event.ChangedObject, packet.From);
                        break;
                    default:
                        break;
                }
                break;
            case PacketType.ForwardingPacket:
                packet.SpecificPacket.From = packet.From;
                // this.handlePacket(packet.SpecificPacket);
                this._event.emit('forwardingPacket', { from: packet.From, data: packet.SpecificPacket });
                break;
            case PacketType.Acknowledgement:
                this._event.emit('acknowledgement', { from: packet.From, data: packet.SpecificPacket });
                break;
            case PacketType.Command:
                this._event.emit('command', { from: packet.From, data: packet.SpecificPacket });
                break;
            case PacketType.Connect:
                this._event.emit('connect', { from: packet.From, data: packet.SpecificPacket });
                break;
            case PacketType.File:
                this._event.emit('file', { from: packet.From, data: packet.SpecificPacket });
                break;
            case PacketType.LoadedSong:
                this._event.emit('loadedSong', { from: packet.From, data: packet.SpecificPacket });
                break;
            case PacketType.LoadSong:
                this._event.emit('loadSong', { from: packet.From, data: packet.SpecificPacket });
                break;
            case PacketType.Response:
                this._event.emit('response', { from: packet.From, data: packet.SpecificPacket });
                break;
            case PacketType.ScoreRequest:
                this._event.emit('scoreRequest', { from: packet.From, data: packet.SpecificPacket });
                break;
            case PacketType.ScoreRequestResponse:
                this._event.emit('scoreRequestResponse', { from: packet.From, data: packet.SpecificPacket });
                break;
            case PacketType.SongFinished:
                this._event.emit('songFinished', { from: packet.From, data: packet.SpecificPacket });
                break;
            case PacketType.SongList:
                this._event.emit('songList', { from: packet.From, data: packet.SpecificPacket });
                break;
            case PacketType.SubmitScore:
                this._event.emit('submitScore', { from: packet.From, data: packet.SpecificPacket });
                break;
            case PacketType.Message:
                this._event.emit('message', { from: packet.From, data: packet.SpecificPacket });
                break;
            case PacketType.MessageResponse:
                this._event.emit('messageResponse', { from: packet.From, data: packet.SpecificPacket });
                break;
        }
    }

    coordinatorAdded(data: Coordinator, from: string) {
        if (!this.isConnected) return;
        const index = this.State?.Coordinators.findIndex(x => x.Id == data.Id);
        if (index == -1) this.State?.Coordinators.push(data);
        this._event.emit('coordinatorAdded', { from: from, data: data });
    }

    coordinatorLeft(data: Coordinator, from: string) {
        const index = this.State?.Coordinators?.findIndex(x => x.Id == data?.Id) ?? -1;
        if (index > -1) {
            this.State?.Coordinators.splice(index, 1);
            this._event.emit('coordinatorLeft', { from: from, data: data });
        }
    }

    matchCreated(match: Match, from: string) {
        if (!this.State?.Matches.find(x => x.Guid == match.Guid)) this.State?.Matches.push(match);
        this._event.emit('matchCreated', { from: from, data: match });
    }

    matchUpdated(match: Match, from: string) {
        const index = this.State?.Matches.findIndex(x => x.Guid == match.Guid) ?? -1;
        if (index > -1 && this.State) {
            this.State.Matches[index] = match;
            this._event.emit('matchUpdated', { from: from, data: match });
        }
    }

    matchDeleted(match: Match, from: string) {
        const index = this.State?.Matches.findIndex(x => x.Guid == match.Guid) ?? -1;
        if (index > -1) {
            this.State?.Matches.splice(index, 1);
            this._event.emit('matchDeleted', { from: from, data: match });
        }
    }

    playerAdded(player: Player, from: string) {
        this.State?.Players.push(player);
        this._event.emit('playerAdded', { from: from, data: player });
    }

    playerUpdated(player: Player, from: string) {
        const index = this.State?.Players.findIndex(x => x.Id == player.Id) ?? -1;
        if (index > -1 && this.State) {
            this.State.Players[index] = player;
            this._event.emit('playerUpdated', { from: from, data: player });

            // Match update
            const matches = this.State?.Matches.filter(x => x.Players.some(y => y.Id === player.Id));
            if (!matches || !this.State) return;
            for (const match of matches) {
                const p = match.Players.findIndex(x => x.Id === player.Id);
                if (p > -1) {
                    this.State.Matches[this.State.Matches.indexOf(match)].Players[p] = player;
                    this.matchUpdated(match, from);
                }
            }
        }
    }

    playerLeft(player: Player, from: string) {
        const index = this.State?.Players.findIndex(x => x.Id == player.Id) ?? -1;
        if (index > -1) {
            this.State?.Players.splice(index, 1);
            this._event.emit('playerLeft', { from: from, data: player });
        }
    }

    qualifierEventCreated(event: QualifierEvent, from: string) {
        const index = this.State?.Events.findIndex(x => x.EventId == event.EventId);
        if (index == -1) {
            this.State?.Events.push(event);
            this._event.emit('qualifierEventCreated', { from: from, data: event });
        }
    }

    qualifierEventUpdated(event: QualifierEvent, from: string) {
        const index = this.State?.Events.findIndex(x => x.EventId == event.EventId);
        if (index && index > -1 && this.State) {
            this.State.Events[index] = event;
            this._event.emit('qualifierEventUpdated', { from: from, data: event });
        }
    }

    qualifierEventDeleted(event: QualifierEvent, from: string) {
        const index = this.State?.Events.findIndex(x => x.EventId == event.EventId);
        if (index && index > -1 && this.State) {
            this.State.Events.splice(index, 1);
            this._event.emit('qualifierEventDeleted', { from: from, data: event });
        }
    }
}