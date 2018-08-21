import { KeyguardCommand } from './RequestTypes';
export declare class RequestBehavior {
    static getAllowedOrigin(endpoint: string): string;
    static getRequestUrl(endpoint: string, command: KeyguardCommand): string;
    private _targetUrl;
    private _localState;
    constructor(targetUrl?: string, localState?: any);
    request(endpoint: string, command: KeyguardCommand, args: any[]): Promise<void>;
}
