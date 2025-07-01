/**
 * Prepend a prefix to signed messages to prevent signing arbitrary data (which could e.g. be a valid transaction) and
 * use of the signature to impersonate the victim (https://github.com/ethereum/wiki/wiki/JSON-RPC#eth_sign). Similarly,
 * separate prefixes are used for distinct use cases, e.g. to prevent that a connect challenge is signed as a valid user
 * message, especially if blind signing is involved.
 * The prefixes also make the message recognizable as a Nimiq specific signature for a specific use case.
 *
 * The first byte encodes the length of the remaining prefix.
 */
export enum SignMessagePrefix {
    SIGNED_MESSAGE = '\x16Nimiq Signed Message:\n',
    CONNECT_CHALLENGE = '\x19Nimiq Connect Challenge:\n', // blind signed, thus must be distinct from other messages
}
