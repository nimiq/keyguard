declare type DOMEvent = Event & {
    target: Element,
    data: any,
};

declare interface RpcServerInstance {
}

declare interface Window {
    TRANSLATIONS: any;
    clipboardData: any;
}

declare interface Newable {
    new(...args: any[]): any;
}

type ParsedSignTransactionRequest = {
    keyInfo: Keyguard.KeyInfo
    keyPath: string
    transaction: Nimiq.ExtendedTransaction

    keyLabel?: string
    senderLabel?: string
    recipientLabel?: string
}
