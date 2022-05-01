import { Beatmap } from "./beatmap";
import { Player } from "./player";

export interface SongFinished {
    User: Player;
    Beatmap: Beatmap;
    Type: CompletionType;
    Score: number;
}

export enum CompletionType {
    Passed,
    Failed,
    Quit
}