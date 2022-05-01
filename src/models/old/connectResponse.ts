import { Response } from "./response";
import { State } from "./state";
import { User } from "./User";

export interface ConnectResponse extends Response {
    Self: User;
    State: State;
    ServerVersion: number;
}