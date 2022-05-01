export interface Response {
    Type: ResponseType;
    Message: string;
}

export enum ResponseType {
    Success,
    Fail
}