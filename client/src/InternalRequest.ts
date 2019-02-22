import * as Public from './PublicRequest';

type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
type Transform<T, K extends keyof T, E> = Omit<T, K> & E;

export type PublicToInternal<T> = T extends { keyId: string }
    ? Transform<T, 'keyId', { keyId: number }>
    : T extends { id: string }
        ? Transform<T, 'id', { id: number }>
        : T;

export type InternalToPublic<T> = T extends { keyId: number }
    ? Transform<T, 'keyId', { keyId: string }>
    : T extends { id: number }
        ? Transform<T, 'id', { id: string }>
        : T;

export * from './PublicRequest';

export type DeriveAddressRequest = PublicToInternal<Public.DeriveAddressRequest>;
export type DeriveAddressesRequest = PublicToInternal<Public.DeriveAddressesRequest>;
export type RemoveKeyRequest = PublicToInternal<Public.RemoveKeyRequest>;
export type ReleaseKeyRequest = PublicToInternal<Public.ReleaseKeyRequest>;
export type SimpleRequest = PublicToInternal<Public.SimpleRequest>;
export type SignTransactionRequest = PublicToInternal<Public.SignTransactionRequest>;

export type IFrameRequest = PublicToInternal<Public.IFrameRequest>;
export type TopLevelRequest = PublicToInternal<Public.RedirectRequest>;

export type KeyInfoObject = PublicToInternal<Public.KeyInfoObject>;
export type LegacyKeyInfoObject = PublicToInternal<Public.LegacyKeyInfoObject>;
export type SingleKeyResult = PublicToInternal<Public.SingleKeyResult>;
export type KeyResult = SingleKeyResult[];

export type Result = PublicToInternal<Public.Result>;
export type Request = PublicToInternal<Public.Request>;
