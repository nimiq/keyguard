/* global Constants */
/* global Nimiq */
/* global SignMessagePrefix */
/* global KeyStore */
/* global CONFIG */
/* global Utf8Tools */

/**
 * @typedef {{hasPin?: boolean, rsaKeyPair?: RsaKeyPairExport}} KeyConfig
 */

class Key {
    /**
     * @param {Uint8Array} input
     * @returns {string}
     */
    static deriveHash(input) {
        return Nimiq.BufferUtils.toBase64(Nimiq.Hash.computeBlake2b(input));
    }

    /**
     * @returns {RsaKeyParams}
     */
    static get defaultRsaKeyParams() {
        return {
            kdf: CONFIG.RSA_KDF_FUNCTION,
            iterations: CONFIG.RSA_KDF_ITERATIONS,
            keySize: CONFIG.RSA_KEY_BITS,
        };
    }

    /**
     * @private
     * @param {RsaKeyParams} paramsA
     * @param {RsaKeyParams} paramsB
     * @returns {boolean}
     */
    static _areEqualRsaKeyParams(paramsA, paramsB) {
        return typeof paramsA === 'object' && typeof paramsB === 'object'
            && paramsA.kdf === paramsB.kdf
            && paramsA.iterations === paramsB.iterations
            && paramsA.keySize === paramsB.keySize;
    }

    /**
     * @private
     * @param {RsaKeyParams} params
     * @returns {boolean}
     */
    static _areDefaultRsaKeyParams(params) {
        return Key._areEqualRsaKeyParams(params, Key.defaultRsaKeyParams);
    }

    /**
     * @param {Nimiq.Entropy|Nimiq.PrivateKey} secret
     * @param {KeyConfig} [config]
     */
    constructor(secret, config = {}) {
        this._secret = secret;
        this._hasPin = Boolean(config.hasPin);
        this._rsaKeyPair = config.rsaKeyPair;
        /** @type {string?} */
        this._id = null;
        this._defaultAddress = this.deriveAddress(Constants.DEFAULT_DERIVATION_PATH);
    }

    /**
     * @param {string} path
     * @returns {Nimiq.PublicKey}
     */
    derivePublicKey(path) {
        return Nimiq.PublicKey.derive(this.derivePrivateKey(path));
    }

    /**
     * @param {string} path
     * @returns {Nimiq.Address}
     */
    deriveAddress(path) {
        return this.derivePublicKey(path).toAddress();
    }

    /**
     * @param {string} path
     * @param {Uint8Array} data
     * @returns {Nimiq.Signature}
     */
    sign(path, data) {
        const privateKey = this.derivePrivateKey(path);
        const publicKey = Nimiq.PublicKey.derive(privateKey);
        return Nimiq.Signature.create(privateKey, publicKey, data);
    }

    /**
     * Partially sign a multisig transaction
     *
     * @param {string} path
     * @param {Uint8Array} data
     * @param {Nimiq.CommitmentPair[]} ownCommitmentPairs
     * @param {{publicKey: Nimiq.PublicKey, commitments: Nimiq.Commitment[]}[]} otherSigners
     * @returns {Nimiq.PartialSignature}
     */
    signPartially(path, data, ownCommitmentPairs, otherSigners) {
        const privateKey = this.derivePrivateKey(path);
        const publicKey = Nimiq.PublicKey.derive(privateKey);
        const otherPublicKeys = otherSigners.map(({ publicKey: pubKey }) => pubKey);
        const otherCommitments = otherSigners.map(({ commitments }) => commitments);

        return Nimiq.PartialSignature.create(
            privateKey,
            publicKey,
            ownCommitmentPairs,
            otherPublicKeys,
            otherCommitments,
            data,
        );
    }

    /**
     * @param {string} path
     * @param {Uint8Array} message - A byte array
     * @param {SignMessagePrefix} [prefix=SignMessagePrefix.SIGNED_MESSAGE]
     * @returns {Nimiq.Signature}
     */
    signMessage(path, message, prefix = SignMessagePrefix.SIGNED_MESSAGE) {
        const msgLength = message.byteLength;
        const msgLengthAsString = msgLength.toString(10);

        /**
         * Adding a prefix to the message makes the calculated signature recognisable as
         * a Nimiq specific signature. This and the hashing prevents misuse where a malicious
         * request can sign arbitrary data (e.g. a transaction) and use the signature to
         * impersonate the victim. (https://github.com/ethereum/wiki/wiki/JSON-RPC#eth_sign)
         */
        const dataLength = prefix.length + msgLengthAsString.length + msgLength;

        // Construct buffer
        const data = new Nimiq.SerialBuffer(dataLength);
        data.write(Nimiq.BufferUtils.fromUtf8(prefix));
        data.write(Nimiq.BufferUtils.fromUtf8(msgLengthAsString));
        data.write(message);

        // Hash data before signing (uses SHA256, because it is the widest available)
        const hash = Nimiq.Hash.computeSha256(data);

        return this.sign(path, hash);
    }

    /**
     * @param {string} path
     * @returns {Nimiq.PrivateKey}
     */
    derivePrivateKey(path) {
        return this._secret instanceof Nimiq.Entropy
            ? this._secret.toExtendedPrivateKey().derivePath(path).privateKey
            : this._secret;
    }

    /**
     * @param {Uint8Array} hkdfSalt
     * @param {string} useCase - Allows to generate a separate AES key per use case.
     * @param {Partial<AesKeyGenParams>} [aesParams={name:'AES-GCM',length:256}]
     * @returns {Promise<CryptoKey>}
     */
    async getAesKey(hkdfSalt, useCase, aesParams) {
        const hkdfHashAlgorithm = 'SHA-256';
        if (hkdfSalt.byteLength * 8 < 256) {
            // Salt too short, see developer.mozilla.org/en-US/docs/Web/API/HkdfParams#salt.
            throw new Error(`HKDF salt length should be at least the output length of used hash ${hkdfHashAlgorithm}`);
        }
        const hkdfParams = {
            name: 'HKDF',
            hash: hkdfHashAlgorithm,
            salt: hkdfSalt,
            info: Utf8Tools.stringToUtf8ByteArray(useCase),
        };
        const hkdfKeyMaterial = await window.crypto.subtle.importKey(
            /* format */ 'raw',
            /* keyData */ this.secret.serialize(),
            /* algorithm */ hkdfParams, // The key material is to be used in a HKDF derivation.
            /* extractable */ false,
            /* keyUsages */ ['deriveKey'],
        );

        /** @type {AesKeyGenParams} */
        const aesEffectiveParams = {
            // Default to AES-GCM as it's authenticated, which means that it includes checks that the ciphertext has not
            // been modified, see developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/encrypt#aes-gcm
            name: aesParams && aesParams.name ? aesParams.name : 'AES-GCM',
            length: aesParams && aesParams.length ? aesParams.length : 256,
        };
        /** @type {KeyUsage[]} */
        const aesKeyUsages = aesEffectiveParams.name === 'AES-KW'
            // AES-KW's doesn't require an initialization vector, but only supports wrapping and encrypted data length
            // must be a multiple of 8, see developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/wrapKey#aes-kw.
            ? ['wrapKey', 'unwrapKey']
            : ['encrypt', 'decrypt', 'wrapKey', 'unwrapKey'];

        // Derive AES key from key material via a HKDF key derivation.
        // HKDF is a suitable key derivation function in this case, because the key material has a very high entropy,
        // see developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/deriveKey#key_derivation_algorithms.
        // Note that HKDF is not computationally expensive, unlike PBKDF2, and thus we can compute the AES key on the
        // fly, and don't really need to cache or persist it. Instead, it's in fact used as encryption key for other
        // persisted data.
        return window.crypto.subtle.deriveKey(
            /* algorithm */ hkdfParams,
            /* baseKey */ hkdfKeyMaterial,
            /* derivedKeyAlgorithm */ aesEffectiveParams,
            /* extractable */ false,
            /* keyUsages */ aesKeyUsages,
        );
    }

    /**
     * @returns {RsaKeyPairExport | undefined}
     */
    getRsaKeyPairIfExists() {
        return this._rsaKeyPair;
    }

    /**
     * Sets a known RSA key pair, or computes and sets the RSA key pair for the given key params. The RSA key is
     * calculated deterministically based on _secret, such that the same RSA key is generated for the same key params.
     * Warning: the key computation is computationally expensive.
     * @param {RsaKeyPairExport | RsaKeyParams} keyOrKeyParams
     * @param {boolean} [persist=true]
     * @returns {Promise<RsaKeyPairExport>}
     */
    async setRsaKeyPair(keyOrKeyParams, persist = true) {
        const oldRsaKeyPair = this._rsaKeyPair;
        if ('privateKey' in keyOrKeyParams) {
            // A key was passed.
            this._rsaKeyPair = keyOrKeyParams;
        } else if (!this._rsaKeyPair || !Key._areEqualRsaKeyParams(keyOrKeyParams, this._rsaKeyPair.keyParams)) {
            // Key params were passed. Only compute the RSA key pair if they differ from the old key's params, as the
            // computation is expensive.
            this._rsaKeyPair = await this._computeRsaKeyPair(keyOrKeyParams);
        }
        if ((!oldRsaKeyPair || !Key._areEqualRsaKeyParams(this._rsaKeyPair.keyParams, oldRsaKeyPair.keyParams))
            && Key._areDefaultRsaKeyParams(this._rsaKeyPair.keyParams)
            && persist) {
            // Persist if the key changed, matches the default params, and persisting is requested.
            await KeyStore.instance.setRsaKeypair(this, this._rsaKeyPair);
        }
        return this._rsaKeyPair;
    }

    /**
     * @param {RsaKeyParams} keyParams
     * @returns {Promise<CryptoKey>}
     */
    async getRsaPrivateKey(keyParams) {
        const rsaKeyPair = await this.setRsaKeyPair(keyParams);
        return window.crypto.subtle.importKey(
            'pkcs8',
            rsaKeyPair.privateKey,
            { name: 'RSA-OAEP', hash: 'SHA-256' },
            false, // Prevent extraction
            ['decrypt'],
        );
    }

    /**
     * @param {RsaKeyParams} keyParams
     * @returns {Promise<CryptoKey>}
     */
    async getRsaPublicKey(keyParams) {
        const rsaKeyPair = await this.setRsaKeyPair(keyParams);
        return window.crypto.subtle.importKey(
            'spki',
            rsaKeyPair.publicKey,
            { name: 'RSA-OAEP', hash: 'SHA-256' },
            true, // Allow extraction
            ['encrypt'],
        );
    }

    /**
     * Deterministically computes an RSA keypair from _secret via the RSAKeysIframe.
     * Warning: this is computationally expensive.
     * @param {RsaKeyParams} keyParams
     * @returns {Promise<RsaKeyPairExport>}
     */
    async _computeRsaKeyPair(keyParams) {
        // Setup the RSAKeysIframe in which the actual computation of the RSA key happens via node-forge. The reason why
        // we don't use the browser crypto API instead, is that it does not support deterministic generation of RSA keys
        // from an existing secret, and the reason why node-forge is not used directly here is that we want to run it in
        // a sandbox, to reduce the attack surface from a big external dependency not thoroughly audited by us.
        const iframe = document.createElement('iframe');
        iframe.classList.add('rsa-sandboxed-iframe'); // Styles in common.css hide this class
        iframe.setAttribute('sandbox', 'allow-scripts');
        iframe.src = '../../lib/rsa/sandboxed/RSAKeysIframe.html'; // Relative path from a request URL
        /** @type {Promise<unknown>} */
        const loadPromise = new Promise(resolve => iframe.addEventListener('load', resolve));
        document.body.appendChild(iframe);
        await loadPromise;

        if (!iframe.contentWindow) {
            throw new Error('Could not load sandboxed RSA iframe');
        }

        // Extend 32-byte secret into 1024-byte seed
        /** @type {Uint8Array} */
        let seed;
        switch (keyParams.kdf) {
            case 'PBKDF2-SHA512':
                seed = Nimiq.CryptoUtils.computePBKDF2sha512(
                    this.secret.serialize(),
                    this._defaultAddress.serialize(),
                    keyParams.iterations,
                    1024, // Output size (required)
                );
                break;
            default:
                throw new Error(`Unsupported KDF function: ${keyParams.kdf}`);
        }

        // Send computation command to iframe
        iframe.contentWindow.postMessage({
            command: 'generateKey',
            seed,
            keySize: keyParams.keySize,
        }, {
            // Because the iframe has a separate sandboxed origin, we need to specify '*' as target, which is still
            // safe, as we're posting the message directly to the iframe we fully control, such that it won't have been
            // redirected to a different domain in the meantime, which could intercept the message.
            targetOrigin: '*',
            // Transfer ownership of the seed without copying the underlying ArrayBuffer.
            transfer: [seed.buffer],
        });

        return new Promise(resolve => {
            /**
             * @param {MessageEvent} event
             */
            function onMessage(event) {
                if (event.source !== iframe.contentWindow) {
                    // Reject any messages which are not from the iframe. Otherwise, the following attack is possible:
                    // A malicious site starts a Connect request in an iframe (via Hub, which then redirects to the
                    // Keyguard). Then, when the malicious site suspects that the Keyguard is waiting for the RSA key
                    // calculation, it itself sends a postmessage to the popup with an RSA key known to the attacker,
                    // which the Keyguard would willingly store and continue to use, also for other websites.
                    return;
                }

                /** @type {{privateKey: Uint8Array, publicKey: Uint8Array}} */
                const data = event.data;
                if (!('privateKey' in data) || !('publicKey' in data)) return;

                window.removeEventListener('message', onMessage);
                iframe.remove();

                resolve({
                    privateKey: data.privateKey,
                    publicKey: data.publicKey,
                    keyParams,
                });
            }

            // Listen for result from iframe
            window.addEventListener('message', onMessage);
        });
    }

    /**
     * @type {string}
     */
    get id() {
        if (!this._id) {
            this._id = this.hash;
        }
        return this._id;
    }

    /**
     * @type {Nimiq.Entropy|Nimiq.PrivateKey}
     */
    get secret() {
        return this._secret;
    }

    /**
     * @type {Nimiq.Secret.Type}
     */
    get type() {
        return this._secret instanceof Nimiq.PrivateKey
            ? Nimiq.Secret.Type.PRIVATE_KEY
            : Nimiq.Secret.Type.ENTROPY;
    }

    /**
     * @type {boolean}
     */
    get hasPin() {
        return this._hasPin;
    }

    set hasPin(hasPin) {
        /** @type {boolean} */ // Annotation required for Typescript
        this._hasPin = hasPin;
    }

    get defaultAddress() {
        return this._defaultAddress;
    }

    /**
     * @type {string}
     */
    get hash() {
        // Private keys use the address as input, as during migration of legacy accounts
        // their entropy or public key is not known, as it is stored encrypted.
        const input = this._secret instanceof Nimiq.Entropy
            ? this._secret.serialize()
            : Nimiq.PublicKey.derive(this._secret).toAddress().serialize();
        return Key.deriveHash(input);
    }

    /**
     * @param {unknown} other
     * @returns {other is Key}
     */
    equals(other) {
        return other instanceof Key
            && this.id === other.id
            && this.type === other.type
            && this.hasPin === other.hasPin
            && this.secret.equals(/** @type {Nimiq.PrivateKey} */ (other.secret))
            && this.defaultAddress.equals(other.defaultAddress);
    }
}

Key.PIN_LENGTH = 6;
