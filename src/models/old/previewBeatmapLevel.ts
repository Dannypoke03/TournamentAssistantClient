import { Characteristic } from "./characteristic";

export interface PreviewBeatmapLevel {
    LevelId: string;
    Name: string;
    Characteristics: Characteristic[];
    Loaded: boolean;
}