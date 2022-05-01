import { GameplayParameters } from "./gameplayParameters";

export interface QualifierEvent {
    EventId: string;
    Name: string;
    // guild: Guild;
    // infoChannel: Channel;
    QualifierMaps: GameplayParameters[];
    SendScoresToInfoChannel: boolean;
    Flags: number;
}

export enum EventSettings {
    None = 0,
    HideScoreFromPlayers = 1,
    DisableScoresaberSubmission = 2
}