import { Characteristic } from "./characteristic";
import { Player } from "./player";
import { PreviewBeatmapLevel } from "./previewBeatmapLevel";
import { User } from "./User";

export interface Match {
    Guid: string;
    Players: Player[];
    Leader: User;
    SelectedLevel?: PreviewBeatmapLevel;
    SelectedCharacteristic?: Characteristic;
    SelectedDifficulty: BeatmapDifficulty;
    StartTime?: string;
}

export enum BeatmapDifficulty {
    Easy,
    Normal,
    Hard,
    Expert,
    ExpertPlus
}