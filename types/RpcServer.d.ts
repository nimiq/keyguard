declare namespace Rpc {
    interface Message {
        origin: string;
        data: object;
    }

    interface ResponseMessage extends Message {
        data: {
            id: number;
            status: ResponseStatus;
            result: any;
        };
    }
    interface PostMessage extends Message {
        source: string;
    }
    interface RedirectRequest {
        origin: string;
        data: {
            id: number;
            command: string;
            args: any[];
        };
        returnURL: string;
    }
    enum ResponseStatus {
        OK = "ok",
        ERROR = "error"
    }

    class State {
        readonly id: number;
        readonly origin: string;
        readonly data: any;
        readonly returnURL: string | null;
        static fromJSON(json: string): State;
        constructor(message: MessageEvent | RedirectRequest | PostMessage);
        toJSON(): string;
        reply(status: ResponseStatus, result: any): void;
    }

    type CommandHandler = (state: State, ...args: any[]) => any;

    class RpcServer {
        constructor(allowedOrigin: string);
        onRequest(command: string, fn: CommandHandler): void;
        init(): void;
        close(): void;
    }
}
