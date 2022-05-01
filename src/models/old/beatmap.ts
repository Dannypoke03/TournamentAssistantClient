import { Characteristic } from "./characteristic";
import { BeatmapDifficulty } from "./match";

export interface Beatmap {
    Name?: string;
    LevelId: string;
    Characteristic: Characteristic;
    Difficulty: BeatmapDifficulty;
}