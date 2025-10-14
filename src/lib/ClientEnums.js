/**
 * Note: the @import syntax is not supported in our current typescript version yet. Once we update to typescript 5.5,
 * this should lead to an error regarding the duplicate declaration of the enums, which would serve as a nice reminder
 * to update the @ enum code here. The advantage of the @import syntax is, that it would additionally import the enum
 * namespaces, which currently we cannot import or replicate (unless in a separate .d.ts file).
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
 * This approach replicates the enum type (via @ enum) and the enum value/object, but not the enum namespace, e.g.
 * MyEnum.A can not be accessed as type, but as value only. To get the associated type, (typeof MyEnum)['A'] mused be
 * used instead. To import the namespace, use an @import rule.
 *
 * Numerical enums are currently not covered by this implementation.
 *
 * @example
 * // The passed type needs to be the type of the enum definition object, not the enum type itself, i.e. typeof MyEnum
 * // instead of MyEnum. It can be passed as generic via a type assertion of replicateEnum. Full example:
 * /**
 *  * @ enum {import('./path/to/my/enum').MyEnum}
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
 * @enum {import('../../client/src/SignMessagePrefix').SignMessagePrefix}
 * @typedef {typeof import('../../client/src/SignMessagePrefix').SignMessagePrefix} SignMessagePrefixObjectType
 */
// eslint-disable-next-line no-unused-vars
const SignMessagePrefix = (/** @type {typeof replicateEnum<SignMessagePrefixObjectType>} */ (replicateEnum))({
    SIGNED_MESSAGE: '\x16Nimiq Signed Message:\n',
    CONNECT_CHALLENGE: '\x19Nimiq Connect Challenge:\n',
});

/**
 * Replication of the Keyguard client's KeyguardCommand enum, with identical type and enum values.
 * @enum {import('../../client/src/KeyguardCommand').KeyguardCommand}
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

    // USDT Cashlink
    SIGN_USDT_CASHLINK: 'sign-usdt-cashlink',

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
