/**
 * Note: the @import syntax is not supported in our current typescript version yet. Once we update to typescript 5.5,
 * this should lead to an error regarding the duplicate declaration of KeyguardCommand, which would serve as a nice
 * reminder to update the code here. The advantage of the @import syntax is, that it would additionally import the
 * KeyguardCommand namespace, which currently we cannot import or replicate (unless in a separate .d.ts file).
 * @import { KeyguardCommand } from '../../client/src/KeyguardCommand'
 *
 * @typedef {import('../../client/src/KeyguardCommand').KeyguardCommand} KeyguardCommandType - Enum type union,
 *  i.e. KeyguardCommand.CREATE | KeyguardCommand.REMOVE | ...
 * @typedef {typeof import('../../client/src/KeyguardCommand').KeyguardCommand} KeyguardCommandObjectType - Type of the
 *  object defining the enum, i.e. { CREATE: KeyguardCommand.CREATE, REMOVE: KeyguardCommand.REMOVE, ... }
 */
/**
 * @template {keyof KeyguardCommandObjectType} K
 * @typedef {`${KeyguardCommandObjectType[K]}`} KeyguardCommandStringType<K> - const string type of enum value for K
 */

/**
 * Reimplementation of the Keyguard client's KeyguardCommand enum, with identical type and enum values. It is fully type
 * checked to be identical to the original, without any missing, superfluous or deviating entries.
 * We do not however replicate the KeyguardCommand namespace, e.g. KeyguardCommand.CREATE can not be accessed as type,
 * but as value only. To get the associated type, (typeof KeyguardCommand)['CREATE'] must be used instead.
 * @enum {KeyguardCommandType}
 * @satisfies {KeyguardCommandObjectType}
 */
const KeyguardCommand = Object.freeze({ // eslint-disable-line no-unused-vars
    CREATE: /** @type {KeyguardCommandObjectType['CREATE']} */ (
        /** @satisfies {KeyguardCommandStringType<'CREATE'>} */ ('create')),
    REMOVE: /** @type {KeyguardCommandObjectType['REMOVE']} */ (
        /** @satisfies {KeyguardCommandStringType<'REMOVE'>} */ ('remove-key')),
    IMPORT: /** @type {KeyguardCommandObjectType['IMPORT']} */ (
        /** @satisfies {KeyguardCommandStringType<'IMPORT'>} */ ('import')),
    EXPORT: /** @type {KeyguardCommandObjectType['EXPORT']} */ (
        /** @satisfies {KeyguardCommandStringType<'EXPORT'>} */ ('export')),
    CHANGE_PASSWORD: /** @type {KeyguardCommandObjectType['CHANGE_PASSWORD']} */ (
        /** @satisfies {KeyguardCommandStringType<'CHANGE_PASSWORD'>} */ ('change-password')),
    SIGN_TRANSACTION: /** @type {KeyguardCommandObjectType['SIGN_TRANSACTION']} */ (
        /** @satisfies {KeyguardCommandStringType<'SIGN_TRANSACTION'>} */ ('sign-transaction')),
    SIGN_MULTISIG_TRANSACTION: /** @type {KeyguardCommandObjectType['SIGN_MULTISIG_TRANSACTION']} */ (
        /** @satisfies {KeyguardCommandStringType<'SIGN_MULTISIG_TRANSACTION'>} */ ('sign-multisig-transaction')),
    SIGN_STAKING: /** @type {KeyguardCommandObjectType['SIGN_STAKING']} */ (
        /** @satisfies {KeyguardCommandStringType<'SIGN_STAKING'>} */ ('sign-staking')),
    SIGN_MESSAGE: /** @type {KeyguardCommandObjectType['SIGN_MESSAGE']} */ (
        /** @satisfies {KeyguardCommandStringType<'SIGN_MESSAGE'>} */ ('sign-message')),
    CONNECT_ACCOUNT: /** @type {KeyguardCommandObjectType['CONNECT_ACCOUNT']} */ (
        /** @satisfies {KeyguardCommandStringType<'CONNECT_ACCOUNT'>} */ ('connect')),
    DERIVE_ADDRESS: /** @type {KeyguardCommandObjectType['DERIVE_ADDRESS']} */ (
        /** @satisfies {KeyguardCommandStringType<'DERIVE_ADDRESS'>} */ ('derive-address')),

    // Bitcoin
    SIGN_BTC_TRANSACTION: /** @type {KeyguardCommandObjectType['SIGN_BTC_TRANSACTION']} */ (
        /** @satisfies {KeyguardCommandStringType<'SIGN_BTC_TRANSACTION'>} */ ('sign-btc-transaction')),
    DERIVE_BTC_XPUB: /** @type {KeyguardCommandObjectType['DERIVE_BTC_XPUB']} */ (
        /** @satisfies {KeyguardCommandStringType<'DERIVE_BTC_XPUB'>} */ ('derive-btc-xpub')),

    // Polygon
    SIGN_POLYGON_TRANSACTION: /** @type {KeyguardCommandObjectType['SIGN_POLYGON_TRANSACTION']} */ (
        /** @satisfies {KeyguardCommandStringType<'SIGN_POLYGON_TRANSACTION'>} */ ('sign-polygon-transaction')),
    DERIVE_POLYGON_ADDRESS: /** @type {KeyguardCommandObjectType['DERIVE_POLYGON_ADDRESS']} */ (
        /** @satisfies {KeyguardCommandStringType<'DERIVE_POLYGON_ADDRESS'>} */ ('derive-polygon-address')),

    // Swap
    SIGN_SWAP: /** @type {KeyguardCommandObjectType['SIGN_SWAP']} */ (
        /** @satisfies {KeyguardCommandStringType<'SIGN_SWAP'>} */ ('sign-swap')),

    // Iframe requests
    LIST: /** @type {KeyguardCommandObjectType['LIST']} */ (
        /** @satisfies {KeyguardCommandStringType<'LIST'>} */ ('list')),
    HAS_KEYS: /** @type {KeyguardCommandObjectType['HAS_KEYS']} */ (
        /** @satisfies {KeyguardCommandStringType<'HAS_KEYS'>} */ ('hasKeys')),
    DERIVE_ADDRESSES: /** @type {KeyguardCommandObjectType['DERIVE_ADDRESSES']} */ (
        /** @satisfies {KeyguardCommandStringType<'DERIVE_ADDRESSES'>} */ ('deriveAddresses')),
    RELEASE_KEY: /** @type {KeyguardCommandObjectType['RELEASE_KEY']} */ (
        /** @satisfies {KeyguardCommandStringType<'RELEASE_KEY'>} */ ('releaseKey')),

    // SwapIframe requests
    SIGN_SWAP_TRANSACTIONS: /** @type {KeyguardCommandObjectType['SIGN_SWAP_TRANSACTIONS']} */ (
        /** @satisfies {KeyguardCommandStringType<'SIGN_SWAP_TRANSACTIONS'>} */ ('signSwapTransactions')),

    // Deprecated iframe requests
    LIST_LEGACY_ACCOUNTS: /** @type {KeyguardCommandObjectType['LIST_LEGACY_ACCOUNTS']} */ (
        /** @satisfies {KeyguardCommandStringType<'LIST_LEGACY_ACCOUNTS'>} */ ('listLegacyAccounts')),
    HAS_LEGACY_ACCOUNTS: /** @type {KeyguardCommandObjectType['HAS_LEGACY_ACCOUNTS']} */ (
        /** @satisfies {KeyguardCommandStringType<'HAS_LEGACY_ACCOUNTS'>} */ ('hasLegacyAccounts')),
    MIGRATE_ACCOUNTS_TO_KEYS: /** @type {KeyguardCommandObjectType['MIGRATE_ACCOUNTS_TO_KEYS']} */ (
        /** @satisfies {KeyguardCommandStringType<'MIGRATE_ACCOUNTS_TO_KEYS'>} */ ('migrateAccountsToKeys')),
});
