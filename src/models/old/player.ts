import { SongList } from "./songList";
import { Team } from "./team";
import { User } from "./User";

export interface Player extends User {
    UserId: string;
    Team: Team;
    PlayState: PlayStates;
    DownloadState: DownloadStates;
    Score: number;
    Combo: number;
    Misses: number;
    Accuracy: number;
    SongPosition: number;
    SongList: SongList;
    ModList: string[];
    StreamScreenCoordinates: Point;
    StreamDelayMs: number;
    StreamSyncStartMs: number;
}

export enum PlayStates {
    Waiting,
    InGame
}

export enum DownloadStates {
    None,
    Downloading,
    Downloaded,
    DownloadError
}

export interface Point {
    x: number;
    y: number;
}