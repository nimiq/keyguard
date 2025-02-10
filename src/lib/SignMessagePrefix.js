/**
 * Note: the @import syntax is not supported in our current typescript version yet. Once we update to typescript 5.5,
 * this should lead to an error regarding the duplicate declaration of SignMessagePrefix, which would serve as a nice
 * reminder to update the code here. The advantage of the @import syntax is, that it would additionally import the
 * SignMessagePrefix namespace, which currently we cannot import or replicate (unless in a separate .d.ts file).
 * @import { SignMessagePrefix } from '../../client/src/SignMessagePrefix'
 *
 * @typedef {import('../../client/src/SignMessagePrefix').SignMessagePrefix} SignMessagePrefixType - Enum type union,
 *  i.e. SignMessagePrefix.SIGNED_MESSAGE | SignMessagePrefix.CONNECT_CHALLENGE | ...
 * @typedef {typeof import('../../client/src/SignMessagePrefix').SignMessagePrefix} SignMessagePrefixObjectType - Type
 *  of the object defining the enum, i.e. { SIGNED_MESSAGE: SignMessagePrefix.SIGNED_MESSAGE, CONNECT_CHALLENGE: ... }
 */
/**
 * @template {keyof SignMessagePrefixObjectType} K
 * @typedef {`${SignMessagePrefixObjectType[K]}`} SignMessagePrefixStringType<K> - const string type of enum value for K
 */

/**
 * Reimplementation of the Keyguard client's SignMessagePrefix enum, with identical type and enum values. It is fully
 * type checked to be identical to the original, without any missing, superfluous or deviating entries.
 * We do not however replicate the SignMessagePrefix namespace, e.g. SignMessagePrefix.SIGNED_MESSAGE can not be
 * accessed as type, but as value only. To get the associated type, (typeof SignMessagePrefix)['SIGNED_MESSAGE'] must be
 * used instead.
 * @enum {SignMessagePrefixType}
 * @satisfies {SignMessagePrefixObjectType}
 */
const SignMessagePrefix = Object.freeze({ // eslint-disable-line no-unused-vars
    SIGNED_MESSAGE: /** @type {SignMessagePrefixObjectType['SIGNED_MESSAGE']} */ (
        /** @satisfies {SignMessagePrefixStringType<'SIGNED_MESSAGE'>} */ ('\x16Nimiq Signed Message:\n')),
    CONNECT_CHALLENGE: /** @type {SignMessagePrefixObjectType['CONNECT_CHALLENGE']} */ (
        /** @satisfies {SignMessagePrefixStringType<'CONNECT_CHALLENGE'>} */ ('\x19Nimiq Connect Challenge:\n')),
});
