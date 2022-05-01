import { GameplayParameters } from "./gameplayParameters";

export interface Score {
    EventId: string;
    Parameters: GameplayParameters;
    UserId: number;
    Username: string;
    _Score: number;
    FullCombo: boolean;
    Color: string;
}