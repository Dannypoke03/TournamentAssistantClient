import { GameplayParameters } from "./gameplayParameters";

export interface PlaySong {
    GameplayParameters: GameplayParameters;
    FloatingScoreboard: boolean;
    StreamSync: boolean;
    DisablePause: boolean;
    DisableFail: boolean;
}