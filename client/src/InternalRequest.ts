import * as Public from './PublicRequest';

type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
type Transform<T, K extends keyof T, E> = Omit<T, K> & E;

export type PublicToInternal<T> = T extends { keyId: string }
    ? Transform<T, 'keyId', { keyId: number }>
    : T extends { id: string }
        ? Transform<T, 'id', { id: number }>
        : T;

export * from './PublicRequest';

export type KeyInfoObject = PublicToInternal<Public.KeyInfoObject>;
export type LegacyKeyInfoObject = PublicToInternal<Public.LegacyKeyInfoObject>;
export type SimpleRequest = PublicToInternal<Public.SimpleRequest>;
export type RemoveKeyRequest = PublicToInternal<Public.RemoveKeyRequest>;
export type KeyResult = PublicToInternal<Public.KeyResult>;
export type DeriveAddressRequest = PublicToInternal<Public.DeriveAddressRequest>;
export type DeriveAddressesRequest = PublicToInternal<Public.DeriveAddressesRequest>;
export type ReleaseKeyRequest = PublicToInternal<Public.ReleaseKeyRequest>;
export type SignMessageRequest = PublicToInternal<Public.SignMessageRequest>;
export type SignTransactionRequest = PublicToInternal<Public.SignTransactionRequest>;
export type TopLevelRequest = PublicToInternal<Public.TopLevelRequest>;
export type IFrameRequest = PublicToInternal<Public.IFrameRequest>;
export type Request = PublicToInternal<Public.Request>;
export type RpcResult = PublicToInternal<Public.RpcResult>;
