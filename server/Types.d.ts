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