// simplified from https://github.com/lukewarlow/user-agent-data-types/blob/master/index.d.ts
declare interface Navigator {
    readonly userAgentData?: {
        readonly platform: string;
        readonly brands: Array<{
            readonly brand: string;
            readonly version: string;
        }>;
        getHighEntropyValues(hints: string[]): Promise<{
            readonly architecture?: string;
            readonly platformVersion?: string;
        }>;
    };
}
