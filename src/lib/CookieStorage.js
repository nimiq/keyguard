/* global Nimiq */
/* global CookieJar */
/* global Errors */

/**
 * @typedef {{isEncrypted: boolean, chunkCount: number, encryptionInitVector?: Uint8Array}} CookieMetadata
 */

/**
 * A library for using cookies for storing arbitrary data. The lib automatically takes care of encoding the data into
 * cookies, taking size and character restrictions of cookies into account. Additionally, data is encrypted by default,
 * because cookies are sent to the server unless intercepted, which the Keyguard does via a cookie stripping service
 * worker. However, there might still be situations in which the cookies are sent to the server, for example if the user
 * turns Javascript off or the service worker is not activated yet. The encryption keys should only be handled and
 * passed on the client side, and not be leaked to the server.
 *
 * The CookieStorage can be a viable alternative for cases where other storage types like sessionStorage, localStorage
 * or indexedDB are partitioned between the Keyguard running in a top-level context and as an iframe, in which case
 * data set in the top-level context are not accessible in the iframe, and vice-versa. Cookies on the other hand are
 * shared between these contexts.
 *
 * Not to be confused with the browser-native, experimental CookieStore which is a more modern way of plain cookie
 * access.
 */
class CookieStorage {
    /**
     * @param {string} name
     * @param {Uint8Array} data
     * @param {Object} [options]
     * @param {Uint8Array=} [options.encryptionKey] Encryption key to use. If not provided, a new one will be created.
     * @param {number=} [options.maxAge] Time in seconds after which the data gets automatically deleted.
     * @param {string=} [options.namespace]
     * @returns {Promise<Uint8Array | null>} New encryption key, if one was created.
     */
    static async set(name, data, options = {}) {
        const { maxAge, namespace } = options;
        let { encryptionKey } = options;
        let createdNewKey = false;
        if (!encryptionKey) {
            encryptionKey = crypto.getRandomValues(new Uint8Array(CookieStorage.ENCRYPTION_KEY_SIZE));
            createdNewKey = true;
        }
        const encryptionInitVector = crypto.getRandomValues(new Uint8Array(CookieStorage.ENCRYPTION_INIT_VECTOR_SIZE));

        const encryptedData = new Uint8Array(await crypto.subtle.encrypt(
            /* algorithm */ {
                name: CookieStorage.ENCRYPTION_ALGORITHM,
                iv: encryptionInitVector,
            },
            await this._importEncryptionKey(encryptionKey),
            data,
        ));

        this._writeCookies(name, encryptedData, { encryptionInitVector, maxAge, namespace });

        return createdNewKey ? encryptionKey : null;
    }

    /**
     * Set a data entry without encrypting it. Although the Keyguard takes measures on a best-effort basis to avoid that
     * cookies are sent to the server via a cookie-stripping service worker, any unencrypted cookie data should still be
     * considered public. Whenever possible, set encrypted data instead, especially for secret data or data concerning
     * the user's privacy.
     * @param {string} name
     * @param {Uint8Array} data
     * @param {Object} [options]
     * @param {number=} [options.maxAge] Time in seconds after which the data gets automatically deleted.
     * @param {string=} [options.namespace]
     */
    static setPublicUnencrypted(name, data, options) {
        this._writeCookies(name, data, options);
    }

    /**
     * @param {string} name
     * @param {Object} [options]
     * @param {Uint8Array=} [options.encryptionKey] Must be passed for encrypted entries.
     * @param {string=} [options.namespace]
     * @returns {Promise<Uint8Array | null>}
     */
    static async get(name, options = {}) {
        const { encryptionKey, namespace } = options;
        const dataAndMetadata = this._readCookies(name, namespace);
        if (!dataAndMetadata) return null;
        const { data, metadata } = dataAndMetadata;
        if (!metadata.isEncrypted) return data;
        if (!encryptionKey) throw new Errors.KeyguardError('Encryption key must be passed for getting encrypted data.');
        return new Uint8Array(await crypto.subtle.decrypt(
            /* algorithm */ {
                name: CookieStorage.ENCRYPTION_ALGORITHM,
                iv: metadata.encryptionInitVector,
            },
            await this._importEncryptionKey(encryptionKey),
            data,
        ));
    }

    /**
     * @param {string} name
     * @param {string} [namespace]
     */
    static delete(name, namespace) {
        const metadata = this._getMetaData(name, namespace);
        if (!metadata) return; // Data entry does not exist.
        for (let chunk = 0; chunk < metadata.chunkCount; ++chunk) {
            CookieJar.deleteCookie(this._getChunkCookieName(name, chunk, namespace));
        }
    }

    /**
     * @param {string} name
     * @param {string} [namespace]
     * @returns {boolean}
     */
    static has(name, namespace) {
        return !!CookieJar.readCookie(this._getChunkCookieName(name, 0, namespace));
    }

    /**
     * @param {string} name
     * @param {Uint8Array} data
     * @param {{encryptionInitVector?: Uint8Array, maxAge?: number, namespace?: string}} [options]
     * @private
     */
    static _writeCookies(name, data, options = {}) {
        const { encryptionInitVector, maxAge, namespace } = options;
        const previousMetadata = this._getMetaData(name, namespace);
        const previousChunkCount = previousMetadata ? previousMetadata.chunkCount : 0;

        const metadata = {
            chunkCount: 1, // preliminary
            isEncrypted: !!encryptionInitVector,
            // Note: the encryption init vector does not need to be secret, and can be stored in plain text in the
            // cookie, see https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/encrypt#parameters.
            encryptionInitVector,
        };
        let encodedMetadata = this._encodeMetadata(metadata);
        const completeData = new Uint8Array(encodedMetadata.byteLength + data.byteLength);
        completeData.set(encodedMetadata);
        completeData.set(data, encodedMetadata.length);

        let chunkCount = 0;
        /** @type {string | null} */
        let remainingDataToWrite = this._toBase64UrlWithoutPadding(completeData);
        do {
            const chunkCookieName = this._getChunkCookieName(name, chunkCount, namespace);
            remainingDataToWrite = CookieJar.writeCookie(chunkCookieName, remainingDataToWrite, maxAge);
            chunkCount += 1;
        } while (remainingDataToWrite);

        if (chunkCount > metadata.chunkCount) {
            // We have more than one chunk and have to update the preliminary chunkCount.
            // Overwrite the encoded metadata and the first chunk cookie. The remaining data does not change or shift.
            metadata.chunkCount = chunkCount;
            encodedMetadata = this._encodeMetadata(metadata);
            completeData.set(encodedMetadata);
            const firstChunkCookieName = this._getChunkCookieName(name, 0, namespace);
            CookieJar.writeCookie(firstChunkCookieName, this._toBase64UrlWithoutPadding(completeData), maxAge);
        }

        // Delete old excess cookies.
        for (let chunkToDelete = chunkCount; chunkToDelete < previousChunkCount; ++chunkToDelete) {
            CookieJar.deleteCookie(this._getChunkCookieName(name, chunkToDelete, namespace));
        }
    }

    /**
     * @param {string} name
     * @param {string} [namespace]
     * @returns {{metadata: CookieMetadata, data: Uint8Array} | null}
     * @private
     */
    static _readCookies(name, namespace) {
        const metadata = this._getMetaData(name, namespace);
        if (!metadata) return null;

        let cookieDataBase64Url = '';
        for (let chunk = 0; chunk < metadata.chunkCount; ++chunk) {
            const chunkData = CookieJar.readCookie(this._getChunkCookieName(name, chunk, namespace));
            if (!chunkData) return null;
            cookieDataBase64Url += chunkData;
        }

        const data = Nimiq.BufferUtils.fromBase64Url(cookieDataBase64Url)
            .subarray(this._calculateEncodedMetadataSize(metadata));
        return { data, metadata };
    }

    /**
     * @param {string} name
     * @param {string} [namespace]
     * @returns {CookieMetadata | null}
     * @private
     */
    static _getMetaData(name, namespace) {
        const firstChunk = CookieJar.readCookie(this._getChunkCookieName(name, 0, namespace));
        if (!firstChunk) return null;
        // Read enough base64 data to include the longest possible metadata, if the cookie is long enough.
        return this._decodeMetadata(Nimiq.BufferUtils.fromBase64Url(firstChunk.substring(
            0,
            CookieStorage.MAX_ENCODED_METADATA_SIZE_BASE64,
        )));
    }

    /* eslint-disable no-bitwise */
    /**
     * @param {Uint8Array} encodedMetadata
     * @returns {CookieMetadata}
     * @private
     */
    static _decodeMetadata(encodedMetadata) {
        if (!encodedMetadata.byteLength) throw new Errors.KeyguardError('Invalid CookieStorage metadata.');
        const isEncrypted = !!(encodedMetadata[0] & 0b1);
        const chunkCount = encodedMetadata[0] >> 1;
        /** @type {Uint8Array | undefined} */
        let encryptionInitVector;

        if (isEncrypted) {
            encryptionInitVector = encodedMetadata.subarray(1, 1 + CookieStorage.ENCRYPTION_INIT_VECTOR_SIZE);
            if (encryptionInitVector.byteLength !== CookieStorage.ENCRYPTION_INIT_VECTOR_SIZE) {
                // not enough data provided
                throw new Errors.KeyguardError('Invalid CookieStorage metadata.');
            }
        }

        return {
            isEncrypted,
            chunkCount,
            encryptionInitVector,
        };
    }

    /**
     * @param {CookieMetadata} metadata
     * @returns {Uint8Array}
     * @private
     */
    static _encodeMetadata(metadata) {
        const encryptionInitVectorSize = metadata.encryptionInitVector ? metadata.encryptionInitVector.byteLength : 0;
        if (metadata.chunkCount > 127
            || (metadata.isEncrypted && !metadata.encryptionInitVector)
            || (metadata.encryptionInitVector && encryptionInitVectorSize !== CookieStorage.ENCRYPTION_INIT_VECTOR_SIZE)
        ) throw new Errors.KeyguardError('Invalid CookieStorage metadata.');
        const encodedMetadata = new Uint8Array(this._calculateEncodedMetadataSize(metadata));
        encodedMetadata[0] = (metadata.chunkCount << 1) | (metadata.isEncrypted ? 0b1 : 0b0);

        if (metadata.encryptionInitVector) {
            encodedMetadata.set(metadata.encryptionInitVector, 1);
        }
        return encodedMetadata;
    }
    /* eslint-enable no-bitwise */

    /**
     * @param {CookieMetadata} metadata
     * @returns {number}
     * @private
     */
    static _calculateEncodedMetadataSize(metadata) {
        return /* encoded isEncrypted flag + chunkCount */ 1
            + (metadata.isEncrypted && metadata.encryptionInitVector ? metadata.encryptionInitVector.byteLength : 0);
    }

    /**
     * @param {Uint8Array} data
     * @returns {string}
     * @private
     */
    static _toBase64UrlWithoutPadding(data) {
        return Nimiq.BufferUtils.toBase64Url(data).replace(/\.+$/, ''); // remove trailing padding
    }

    /**
     * @param {string} name
     * @param {number} chunk
     * @param {string} [namespace = CookieJar.Cookie.NAMESPACE_COOKIE_STORAGE]
     * @returns {string}
     * @private
     */
    static _getChunkCookieName(name, chunk, namespace = CookieJar.Cookie.NAMESPACE_COOKIE_STORAGE) {
        name = CookieJar.sanitizeCookieName(name, /* encodeInvalidChars */ false);
        namespace = CookieJar.sanitizeCookieName(namespace, /* encodeInvalidChars */ false);
        return `${namespace}${name}${chunk !== 0 ? `${chunk.toString(36)}` : ''}`;
    }

    /**
     * @param {Uint8Array} encryptionKey
     * @returns {Promise<CryptoKey>}
     * @private
     */
    static async _importEncryptionKey(encryptionKey) {
        if (encryptionKey.byteLength !== CookieStorage.ENCRYPTION_KEY_SIZE) {
            throw new Errors.KeyguardError('Invalid encryption key.');
        }
        return crypto.subtle.importKey(
            /* format */ 'raw',
            encryptionKey,
            /* algorithm */ CookieStorage.ENCRYPTION_ALGORITHM,
            /* extractable */ false,
            /* key usages */ ['encrypt', 'decrypt'],
        );
    }
}
// Symmetric AES encryption; use GCM variant because it provides built-in ciphertext authentication, see
// https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/encrypt#supported_algorithms. For us, this means it
// automatically checks whether the decryption key passed matches the ciphertext to be decrypted, and we don't have to
// check the decrypted content with an integrity hash ourselves. For this purpose, an authentication tag of 128 bit is
// appended to the ciphertext, see https://w3c.github.io/webcrypto/#aes-gcm-operations.
CookieStorage.ENCRYPTION_ALGORITHM = 'AES-GCM';
// 32 bytes; although AES-GCM's block size is 128 bit, the key size can be longer than that, see section 5.1 in
// https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38d.pdf
CookieStorage.ENCRYPTION_KEY_SIZE = 256 / 8;
// 12 bytes; as recommended in 5.2.1.1 of https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38d.pdf
CookieStorage.ENCRYPTION_INIT_VECTOR_SIZE = 96 / 8;
// @ts-expect-error _calculateEncodedMetadataSize is private
CookieStorage.MAX_ENCODED_METADATA_SIZE = CookieStorage._calculateEncodedMetadataSize({
    isEncrypted: true,
    chunkCount: 1,
    encryptionInitVector: new Uint8Array(CookieStorage.ENCRYPTION_INIT_VECTOR_SIZE),
});
// Our base64 encoding doesn't have to take padding into account because we represent base64 without padding.
CookieStorage.MAX_ENCODED_METADATA_SIZE_BASE64 = Math.ceil(CookieStorage.MAX_ENCODED_METADATA_SIZE * 4 / 3);
