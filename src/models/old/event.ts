export interface Event {
    Type: EventType;
    ChangedObject: any;
}

export enum EventType {
    PlayerAdded,
    PlayerUpdated,
    PlayerLeft,
    CoordinatorAdded,
    CoordinatorLeft,
    MatchCreated,
    MatchUpdated,
    MatchDeleted,
    QualifierEventCreated,
    QualifierEventUpdated,
    QualifierEventDeleted,
    HostAdded,
    HostRemoved
}