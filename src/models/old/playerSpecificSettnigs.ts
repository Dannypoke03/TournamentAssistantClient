export interface PlayerSpecificSettings {
    Options?: PlayerOptions;
}

export enum PlayerOptions {
    None = 0,
    LeftHanded = 1,
    StaticLights = 2,
    NoHud = 4,
    AdvancedHud = 8,
    ReduceDebris = 16
}