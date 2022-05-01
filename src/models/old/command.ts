export interface Command {
    CommandType: CommandTypes;
}

export enum CommandTypes {
    Heartbeat,
    ReturnToMenu,
    ScreenOverlay_ShowPng,
    ScreenOverlay_ShowGreen,
    DelayTest_Finish
}