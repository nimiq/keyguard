/**
 * Import the types of the client's enums, including their namespaces, such that for example SignMessagePrefix and
 * SignMessagePrefix.SIGNED_MESSAGE can be used as types. The enum values are replicated below via replicateEnum, as the
 * TypeScript enums of the client can not be imported at runtime.
 * @import { SignMessagePrefix } from '../../client/src/SignMessagePrefix'
 * @import { KeyguardCommand } from '../../client/src/KeyguardCommand'
 */

// eslint-disable-next-line valid-jsdoc
/**
 * Replicates an enum with its original type:
 * Given a type of an enum definition to replicate and an object that should replicate that definition, type checks that
 * the passed definition is in fact identical to the original, without any missing, superfluous or deviating entries
 * (deviating string values). Given that the enum object is identical to the original based on its type, it then returns
 * that enum definition again, but with an asserted type of the intended, original enum definition.
 * Thus, the returned result has the actual same type as the original enum, where entries (which match the original
 * string values) are of the enum type instead of a simple string type.
 *
 * This approach only replicates the enum value/object. The enum type and namespace are imported via an @ import rule.
 *
 * Numerical enums are currently not covered by this implementation.
 *
 * @example
 * // The passed type needs to be the type of the enum definition object, not the enum type itself, i.e. typeof MyEnum
 * // instead of MyEnum. It can be passed as generic via a type assertion of replicateEnum. Full example:
 * /**
 *  * @ import { MyEnum } from './path/to/my/enum'
 *  * /
 * const MyEnum = (/** @ type {typeof replicateEnum<typeof import('./path/to/my/enum').MyEnum>} * / (replicateEnum))({
 *     KEY_A: 'value-a',
 *     KEY_B: 'value-b',
 *     ...
 * });
 *
 * @template {Record<string, string>} EnumDefinitionToReplicate
 * @param {{ [K in keyof EnumDefinitionToReplicate]: `${EnumDefinitionToReplicate[K]}` }} enumDefinition
 * @returns {EnumDefinitionToReplicate}
 */
function replicateEnum(enumDefinition) {
    return /** @type {EnumDefinitionToReplicate} */ (Object.freeze(enumDefinition));
}

/**
 * Replication of the Keyguard client's SignMessagePrefix enum, with identical type and enum values.
 * @typedef {typeof import('../../client/src/SignMessagePrefix').SignMessagePrefix} SignMessagePrefixObjectType
 */
// eslint-disable-next-line no-unused-vars
const SignMessagePrefix = (/** @type {typeof replicateEnum<SignMessagePrefixObjectType>} */ (replicateEnum))({
    SIGNED_MESSAGE: '\x16Nimiq Signed Message:\n',
    CONNECT_CHALLENGE: '\x19Nimiq Connect Challenge:\n',
});

/**
 * Replication of the Keyguard client's KeyguardCommand enum, with identical type and enum values.
 * @typedef {typeof import('../../client/src/KeyguardCommand').KeyguardCommand} KeyguardCommandObjectType
 */
// eslint-disable-next-line no-unused-vars
const KeyguardCommand = (/** @type {typeof replicateEnum<KeyguardCommandObjectType>} */ (replicateEnum))({
    CREATE: 'create',
    REMOVE: 'remove-key',
    IMPORT: 'import',
    EXPORT: 'export',
    CHANGE_PASSWORD: 'change-password',
    SIGN_TRANSACTION: 'sign-transaction',
    CREATE_MULTISIG_COMMITMENTS: 'create-multisig-commitments',
    SIGN_MULTISIG_TRANSACTION: 'sign-multisig-transaction',
    SIGN_STAKING: 'sign-staking',
    SIGN_MESSAGE: 'sign-message',
    CONNECT_ACCOUNT: 'connect',
    DERIVE_ADDRESS: 'derive-address',

    // Bitcoin
    SIGN_BTC_TRANSACTION: 'sign-btc-transaction',
    DERIVE_BTC_XPUB: 'derive-btc-xpub',

    // Polygon
    SIGN_POLYGON_TRANSACTION: 'sign-polygon-transaction',
    DERIVE_POLYGON_ADDRESS: 'derive-polygon-address',

    // Swap
    SIGN_SWAP: 'sign-swap',

    // Iframe requests
    LIST: 'list',
    HAS_KEYS: 'hasKeys',
    DERIVE_ADDRESSES: 'deriveAddresses',
    RELEASE_KEY: 'releaseKey',

    // SwapIframe requests
    SIGN_SWAP_TRANSACTIONS: 'signSwapTransactions',

    // Deprecated iframe requests
    LIST_LEGACY_ACCOUNTS: 'listLegacyAccounts',
    HAS_LEGACY_ACCOUNTS: 'hasLegacyAccounts',
    MIGRATE_ACCOUNTS_TO_KEYS: 'migrateAccountsToKeys',
});
