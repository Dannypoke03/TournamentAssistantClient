import { Beatmap } from "./beatmap";
import { GameplayModifiers } from "./gameplayModifiers";
import { PlayerSpecificSettings } from "./playerSpecificSettnigs";

export interface GameplayParameters {
    Beatmap: Beatmap;
    PlayerSettings: PlayerSpecificSettings;
    GameplayModifiers: GameplayModifiers;
}