import { Coordinator } from "./coordinator";
import { CoreServer } from "./coreServer";
import { Match } from "./match";
import { Player } from "./player";
import { QualifierEvent } from "./qualifierEvent";
import { ServerSettings } from "./serverSettings";

export interface State {
    ServerSettings: ServerSettings;
    Players: Player[];
    Coordinators: Coordinator[];
    Matches: Match[];
    Events: QualifierEvent[];
    KnownHosts: CoreServer[];
}