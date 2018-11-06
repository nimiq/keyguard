interface Newable {
    new(...args: any[]): any
}

type DOMEvent = Event & {
    target: Element
    data: any
}

interface Window {
    rpcServer: Rpc.RpcServer
    KeyStore: any
    TRANSLATIONS: dict
}
