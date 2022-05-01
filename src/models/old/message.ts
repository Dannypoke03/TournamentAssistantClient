export interface Message {
    Id: string;
    MessageTitle: string;
    MessageText: string;
    CanClose: boolean;
    Option1?: MessageOption | null;
    Option2?: MessageOption | null;
}

export interface MessageOption {
    Label: string;
    Value: string;
}