export interface File {
    FileId: string;
    Intent: Intentions;
    Compressed: boolean;
    Data: string;
}

export enum Intentions {
    None,
    SetPngToShowWhenTriggered,
    ShowPngImmediately
}