/* global Constants */
/* global Nimiq */
/* global SignMessagePrefix */
/* global KeyStore */
/* global CONFIG */
/* global Utf8Tools */

/**
 * @typedef {{hasPin?: boolean, rsaKeyPair?: RsaKeyPair}} KeyConfig
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
    static _areRsaKeyParamsEqual(paramsA, paramsB) {
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
    static _areRsaKeyParamsDefault(params) {
        return Key._areRsaKeyParamsEqual(params, Key.defaultRsaKeyParams);
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
     * @overload
     * Deterministically derive a secret from the key's secret via a HKDF key derivation. The use of HKDF ensures that
     * derived secrets can be exposed securely without exposing the underlying key's secret.
     * @param {string} useCase - Allows to generate a separate secret per use case.
     * @param {number} derivedSecretLength - Size in bytes.
     * @returns {Promise<Uint8Array>}
     */
    /**
     * @overload
     * Deterministically derive a secret from the key's secret via a HKDF key derivation. The use of HKDF ensures that
     * derived secrets can be exposed securely without exposing the underlying key's secret.
     * To further protect the underlying secret reducing the risk of making brute-forcing the key's secret more feasible
     * by serving as a cheap hint for the correct secret, the generated secret can be made computationally expensive to
     * generate, by applying an additional, computationally expensive kdf. While such practice has been done in the past
     * for example for the RSA Seed, it is rather to be categorized as security theater, and not really needed due to
     * the high entropy of the seed.
     * @param {string} useCase - Allows to generate a separate secret per use case.
     * @param {number} derivedSecretLength - Size in bytes.
     * @param {'PBKDF2-SHA512' | 'Argon2d' | 'Argon2id'} additionalKdfAlgorithm
     * @param {number} additionalKdfIterations
     * @returns {Promise<Uint8Array>}
     */
    /**
     * @param {string} useCase
     * @param {number} derivedSecretLength
     * @param {'PBKDF2-SHA512' | 'Argon2d' | 'Argon2id'} [additionalKdfAlgorithm]
     * @param {number} [additionalKdfIterations]
     * @returns {Promise<Uint8Array>}
     */
    async deriveSecret(useCase, derivedSecretLength, additionalKdfAlgorithm, additionalKdfIterations) {
        const seedBytes = this.secret.serialize();

        if (!!additionalKdfAlgorithm && !additionalKdfIterations) {
            throw new Error('additionalKdfIterations must be specified if specifying additionalKdfAlgorithm');
        }

        if (useCase === 'RSA Seed' && additionalKdfAlgorithm === 'PBKDF2-SHA512') {
            // Legacy implementation for the RSA Seed kept for compatibility. Does not involve an additional HKDF.
            const salt = this._defaultAddress.serialize();
            const pbkdf2Params = {
                name: 'PBKDF2',
                hash: 'SHA-512',
                salt,
                iterations: additionalKdfIterations,
            };
            const pbkdf2KeyMaterial = await window.crypto.subtle.importKey(
                /* format */ 'raw',
                /* keyData */ seedBytes,
                /* algorithm */ pbkdf2Params, // The key material is to be used in a PBKDF2 derivation.
                /* extractable */ false,
                /* keyUsages */ ['deriveBits'],
            );
            return new Uint8Array(await window.crypto.subtle.deriveBits(
                /* algorithm */ pbkdf2Params,
                /* baseKey */ pbkdf2KeyMaterial,
                /* length */ derivedSecretLength * 8,
            ));
        }

        // As we want to deterministically derive secrets, we have to use a deterministic salt too, instead of a random
        // salt. This leverages the fact that the underlying seed is already a very high entropy input, and thus no
        // random salt is required for additional entropy, rainbow table resistance or resilience to reused input
        // (typically password reuse).
        // We generate a salt specific to the kdf parameters. We do not, however, include the useCase in the salt, as
        // the salt should not be controllable by an attacker, see datatracker.ietf.org/doc/html/rfc5869#section-3.4,
        // eprint.iacr.org/2010/264.pdf#page=10.33 and blog.trailofbits.com/2025/01/28/best-practices-for-key-derivation
        // Instead, it's applied via HKDF's info parameter during the final key expansion phase.
        const saltCustomization = Utf8Tools.stringToUtf8ByteArray([
            derivedSecretLength,
            ...(additionalKdfAlgorithm ? [additionalKdfAlgorithm, additionalKdfIterations] : []),
        ].join());
        // We use HKDF to derive the salt. This will likely not add much to the security of the final derived secret
        // compared to simply using just saltCustomization as salt directly, as it is still just derived from the seed
        // and the kdf parameters, but it shouldn't hurt either, and HKDF is cheap. Notably though, by doing this, the
        // salt isn't independent of the key material anymore, which requires special care, especially avoiding creation
        // of attacker controllable salts.
        const saltHkdfParams = {
            name: 'HKDF',
            hash: 'SHA-512', // use a long hash, as we're creating a long salt
            salt: saltCustomization,
            info: saltCustomization,
        };
        const saltHkdfKeyMaterial = await window.crypto.subtle.importKey(
            /* format */ 'raw',
            /* keyData */ seedBytes,
            /* algorithm */ saltHkdfParams, // The key material is to be used in a HKDF derivation.
            /* extractable */ false,
            /* keyUsages */ ['deriveBits'],
        );
        const salt = new Uint8Array(await window.crypto.subtle.deriveBits(
            /* algorithm */ saltHkdfParams,
            /* baseKey */ saltHkdfKeyMaterial,
            // For HKDF, the salt should ideally be as long as the output of the used Hash function, see
            // https://datatracker.ietf.org/doc/html/rfc5869#section-3.1, and we'll use SHA-512 in the final HKDF.
            /* length */ 512,
        ));

        let finalKeyMaterial;
        // length in bytes
        const finalKeyMaterialLength = additionalKdfAlgorithm
            ? 64 // if we apply an additional kdf, we might as well stretch the key material
            : seedBytes.length;
        switch (additionalKdfAlgorithm) {
            case undefined:
                // No additional kdf to apply. The key is derived directly from the seed via the final HKDF.
                finalKeyMaterial = seedBytes;
                break;
            case 'PBKDF2-SHA512': {
                const pbkdf2Params = {
                    name: 'PBKDF2',
                    hash: 'SHA-512',
                    salt,
                    iterations: additionalKdfIterations,
                };
                const pbkdf2KeyMaterial = await window.crypto.subtle.importKey(
                    /* format */ 'raw',
                    /* keyData */ seedBytes,
                    /* algorithm */ pbkdf2Params, // The key material is to be used in a PBKDF2 derivation.
                    /* extractable */ false,
                    /* keyUsages */ ['deriveBits'],
                );
                finalKeyMaterial = new Uint8Array(await window.crypto.subtle.deriveBits(
                    /* algorithm */ pbkdf2Params,
                    /* baseKey */ pbkdf2KeyMaterial,
                    /* length */ finalKeyMaterialLength * 8,
                ));
                break;
            }
            case 'Argon2d': {
                // Argon2d isn't supported by the browser's subtle crypto APIs and Nimiq PoS only provides a synchronous
                // method for Argon2d, but we can get away with not having to run a web worker by using the asynchronous
                // otpKdf, from which the Argon2d hash can be reconstructed by canceling out the dummy data via a second
                // xor.
                const dummyData = new Uint8Array(finalKeyMaterialLength);
                const iterations = /** @type {number} */ (additionalKdfIterations);
                finalKeyMaterial = Nimiq.BufferUtils.xor(
                    await Nimiq.CryptoUtils.otpKdf(dummyData, seedBytes, salt, iterations),
                    dummyData,
                );
                break;
            }
            case 'Argon2id': {
                // Argon2id isn't supported by the browser's subtle crypto API and Nimiq PoS only provides a synchronous
                // method for it. We run it in a worker to avoid blocking the main thread. This unfortunately introduces
                // some overhead by having to start the worker thread and having to load Nimiq in the worker.
                // We need to specify the Nimiq PoS module as absolute path, as the worker's import.meta is a blob url.
                // Note that this path gets adapted by the build script for production.
                const nimiqPath = new URL('../../../node_modules/@nimiq/core/web/index.js', window.location.href).href;
                const workerScript = new Blob([`
                    import * as Nimiq from '${nimiqPath}';
                    self.addEventListener('message', async event => {
                        try {
                            if (typeof event.data !== 'object') throw new Error('Unexpected worker message');
                            const { seedBytes, salt, kdfIterations, length } = event.data;
                            await Nimiq.default();
                            const response = Nimiq.Hash.computeNimiqArgon2id(
                                seedBytes,
                                salt,
                                kdfIterations,
                                length,
                            );
                            self.postMessage(response, { transfer: [response.buffer] });
                        } catch (e) {
                            const errorMessage = e instanceof Error ? e.message : String(e);
                            self.postMessage('Error in deriveSecret Argon2id worker: ' + errorMessage);
                        }
                    });
                `], { type: 'text/javascript' });
                const workerUrl = URL.createObjectURL(workerScript);
                const worker = new Worker(workerUrl, { type: 'module' });
                try {
                    finalKeyMaterial = await new Promise((resolve, reject) => {
                        worker.onmessage = event => {
                            worker.onmessage = null;
                            worker.onerror = null;
                            if (event.data instanceof Uint8Array) {
                                resolve(event.data);
                            } else {
                                reject(event.data);
                            }
                        };
                        worker.onerror = error => {
                            worker.onmessage = null;
                            worker.onerror = null;
                            const errorMessage = error instanceof Error ? error.message : String(error);
                            reject(new Error(`Error in deriveSecret Argon2id worker: ${errorMessage}`));
                        };
                        worker.postMessage(
                            // eslint-disable-next-line object-curly-newline
                            { seedBytes, salt, kdfIterations: additionalKdfIterations, length: finalKeyMaterialLength },
                            { transfer: [seedBytes.buffer, salt.buffer] },
                        );
                    });
                } finally {
                    URL.revokeObjectURL(workerUrl);
                    worker.terminate();
                }
                break;
            }
            default:
                throw new Error(`Unsupported KDF algorithm: ${additionalKdfAlgorithm}`);
        }

        // Derive the final key specific to the useCase via a HKDF.
        const finalHkdfParams = {
            name: 'HKDF',
            // Use SHA-512 for cheaper derivation of longer derivedSecretLengths and better quantum resistance.
            hash: 'SHA-512',
            salt,
            info: Utf8Tools.stringToUtf8ByteArray([
                useCase,
                // Derive different secrets for legacy PrivateKey based accounts and modern Entropy based accounts, even
                // if their underlying secret bytes are the same.
                this.secret instanceof Nimiq.PrivateKey ? 'PrivateKey' : 'Entropy',
            ].join()),
        };
        const finalHkdfKeyMaterial = await window.crypto.subtle.importKey(
            /* format */ 'raw',
            /* keyData */ finalKeyMaterial,
            /* algorithm */ finalHkdfParams, // The key material is to be used in a HKDF derivation.
            /* extractable */ false,
            /* keyUsages */ ['deriveBits'],
        );
        return new Uint8Array(await window.crypto.subtle.deriveBits(
            /* algorithm */ finalHkdfParams,
            /* baseKey */ finalHkdfKeyMaterial,
            /* length */ derivedSecretLength * 8,
        ));
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
     * Sets a known RSA key pair and persists it, if requested and the key's parameters match the default parameters.
     * @param {RsaKeyPair} keyPair
     * @param {boolean} persist
     */
    async setRsaKeyPair(keyPair, persist) {
        this._rsaKeyPair = keyPair;
        // Persist if requested and the key params match the default params.
        if (!persist || !Key._areRsaKeyParamsDefault(keyPair.keyParams)) return;
        await KeyStore.instance.setRsaKeypair(this, keyPair);
    }

    /**
     * @returns {RsaKeyPair | undefined}
     */
    getRsaKeyPairIfExists() {
        return this._rsaKeyPair;
    }

    /**
     * @param {RsaKeyParams} keyParams
     * @returns {Promise<CryptoKey>}
     */
    async getRsaPrivateKey(keyParams) {
        const rsaKeyPair = await this._getOrComputeRsaKeyPair(keyParams);
        return rsaKeyPair.privateKey;
    }

    /**
     * @param {RsaKeyParams} keyParams
     * @returns {Promise<CryptoKey>}
     */
    async getRsaPublicKey(keyParams) {
        const rsaKeyPair = await this._getOrComputeRsaKeyPair(keyParams);
        return rsaKeyPair.publicKey;
    }

    /**
     * @private
     * If the key has already previously been set, or computed and cached, that key is returned. If no cached key is
     * available, the key is computed, which is computationally very expensive, and then cached.
     * @param {RsaKeyParams} keyParams
     * @returns {Promise<RsaKeyPair>}
     */
    async _getOrComputeRsaKeyPair(keyParams) {
        const oldRsaKeyPair = this.getRsaKeyPairIfExists();
        if (oldRsaKeyPair && Key._areRsaKeyParamsEqual(keyParams, oldRsaKeyPair.keyParams)) return oldRsaKeyPair;
        const rsaKeyPair = await this._computeRsaKeyPair(keyParams);
        await this.setRsaKeyPair(rsaKeyPair, /* persist */ Key._areRsaKeyParamsDefault(keyParams));
        return rsaKeyPair;
    }

    /**
     * @private
     * Deterministically computes an RSA keypair from _secret for the given key params via the RSAKeysIframe.
     * @param {RsaKeyParams} keyParams
     * @returns {Promise<RsaKeyPair>}
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

        // Extend 32-byte secret into 1024-byte seed
        /** @type {Uint8Array} */
        let seed;
        switch (keyParams.kdf) {
            case 'PBKDF2-SHA512':
                seed = await this.deriveSecret('RSA Seed', 1024, keyParams.kdf, keyParams.iterations);
                break;
            default:
                throw new Error(`Unsupported KDF function: ${keyParams.kdf}`);
        }

        await loadPromise;

        if (!iframe.contentWindow) {
            throw new Error('Could not load sandboxed RSA iframe');
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

        return new Promise((resolve, reject) => {
            /**
             * @param {MessageEvent} event
             */
            async function onMessage(event) {
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

                try {
                    const rsaAlgorithmParams = { name: 'RSA-OAEP', hash: 'SHA-256' };
                    const privateKey = await window.crypto.subtle.importKey(
                        /* format */ 'pkcs8',
                        data.privateKey,
                        rsaAlgorithmParams,
                        /* extractable */ true, // to be exportable in KeyStore
                        /* keyUsages */ ['decrypt'],
                    );
                    const publicKey = await window.crypto.subtle.importKey(
                        /* format */ 'spki',
                        data.publicKey,
                        rsaAlgorithmParams,
                        /* extractable */ true, // to be exportable in KeyStore
                        /* keyUsages */ ['encrypt'],
                    );

                    resolve({
                        privateKey,
                        publicKey,
                        keyParams,
                    });
                } catch (e) {
                    reject(e);
                }
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
