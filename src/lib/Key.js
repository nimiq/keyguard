/* global Constants */
/* global Nimiq */
/* global SignMessageConstants */
/* global KeyStore */
/* global CONFIG */

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
     * @returns {EncryptionKeyParams}
     */
    static get defaultEncryptionKeyParams() {
        return {
            kdf: CONFIG.RSA_KDF_FUNCTION,
            iterations: CONFIG.RSA_KDF_ITERATIONS,
            keySize: CONFIG.RSA_KEY_BITS,
        };
    }

    /**
     * @param {EncryptionKeyParams} paramsA
     * @param {EncryptionKeyParams} paramsB
     * @returns {boolean}
     */
    static _isEncryptionKeyParamsEqual(paramsA, paramsB) {
        return typeof paramsA === 'object' && typeof paramsB === 'object'
            && paramsA.kdf === paramsB.kdf
            && paramsA.iterations === paramsB.iterations
            && paramsA.keySize === paramsB.keySize;
    }

    /**
     * @param {EncryptionKeyParams} params
     * @returns {boolean}
     */
    static _isDefaultEncryptionKeyParams(params) {
        return Key._isEncryptionKeyParamsEqual(params, Key.defaultEncryptionKeyParams);
    }

    /**
     * @param {Nimiq.Entropy|Nimiq.PrivateKey} secret
     * @param {KeyConfig} [config]
     */
    constructor(secret, config = {}) {
        this._secret = secret;
        this._hasPin = Boolean(config.hasPin);
        /** @type {string?} */
        this._id = null;
        this._defaultAddress = this.deriveAddress(Constants.DEFAULT_DERIVATION_PATH);

        this.rsaKeyPair = config.rsaKeyPair;
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
     * @param {Nimiq.PublicKey[]} signerPublicKeys
     * @param {Nimiq.RandomSecret} secret
     * @param {Nimiq.Commitment} aggregatedCommitment
     * @returns {Nimiq.PartialSignature}
     */
    signPartially(path, data, signerPublicKeys, secret, aggregatedCommitment) {
        const privateKey = this.derivePrivateKey(path);
        const publicKey = Nimiq.PublicKey.derive(privateKey);
        signerPublicKeys.sort((a, b) => a.compare(b));
        return Nimiq.PartialSignature.create(
            privateKey,
            publicKey,
            signerPublicKeys,
            secret,
            aggregatedCommitment,
            data,
        );
    }

    /**
     * @param {string} path
     * @param {Uint8Array} message - A byte array
     * @returns {Nimiq.Signature}
     */
    signMessage(path, message) {
        const msgLength = message.byteLength;
        const msgLengthAsString = msgLength.toString(10);

        /**
         * Adding a prefix to the message makes the calculated signature recognisable as
         * a Nimiq specific signature. This and the hashing prevents misuse where a malicious
         * request can sign arbitrary data (e.g. a transaction) and use the signature to
         * impersonate the victim. (https://github.com/ethereum/wiki/wiki/JSON-RPC#eth_sign)
         */
        const dataLength = SignMessageConstants.SIGN_MSG_PREFIX.length
                         + msgLengthAsString.length
                         + msgLength;

        // Construct buffer
        const data = new Nimiq.SerialBuffer(dataLength);
        data.write(Nimiq.BufferUtils.fromUtf8(SignMessageConstants.SIGN_MSG_PREFIX));
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
     * @param {EncryptionKeyParams} keyParams
     * @returns {Promise<CryptoKey>}
     */
    async getRsaPrivateKey(keyParams) {
        if (!this.rsaKeyPair || !Key._isEncryptionKeyParamsEqual(keyParams, this.rsaKeyPair.keyParams)) {
            this.rsaKeyPair = await this._computeRsaKeyPair(keyParams);
            if (Key._isDefaultEncryptionKeyParams(keyParams)) {
                await KeyStore.instance.setRsaKeypair(this.id, this.rsaKeyPair);
            }
        }

        return window.crypto.subtle.importKey(
            'pkcs8',
            this.rsaKeyPair.privateKey,
            { name: 'RSA-OAEP', hash: 'SHA-256' },
            false, // Prevent extraction
            ['decrypt'],
        );
    }

    /**
     * @param {EncryptionKeyParams} keyParams
     * @returns {Promise<CryptoKey>}
     */
    async getRsaPublicKey(keyParams) {
        if (!this.rsaKeyPair || !Key._isEncryptionKeyParamsEqual(keyParams, this.rsaKeyPair.keyParams)) {
            this.rsaKeyPair = await this._computeRsaKeyPair(keyParams);
            if (Key._isDefaultEncryptionKeyParams(keyParams)) {
                await KeyStore.instance.setRsaKeypair(this.id, this.rsaKeyPair);
            }
        }

        return window.crypto.subtle.importKey(
            'spki',
            this.rsaKeyPair.publicKey,
            { name: 'RSA-OAEP', hash: 'SHA-256' },
            true, // Allow extraction
            ['encrypt'],
        );
    }

    /**
     * @param {EncryptionKeyParams} keyParams
     * @returns {Promise<RsaKeyPairExport>}
     */
    async _computeRsaKeyPair(keyParams) {
        const iframe = document.createElement('iframe');
        iframe.classList.add('rsa-sandboxed-iframe'); // Styles in common.css hide this class
        iframe.setAttribute('sandbox', 'allow-scripts');
        iframe.src = '../../lib/rsa/sandboxed/RSAKeysIframe.html'; // Relative path from a request URL
        /** @type {Promise<void>} */
        const loadPromise = new Promise(resolve => iframe.addEventListener('load', () => resolve()));
        document.body.appendChild(iframe);
        await loadPromise;

        if (!iframe.contentWindow) {
            throw new Error('Could not load sandboxed RSA iframe');
        }

        // Extend 32-byte secret into 1024-byte seed as bytestring
        /** @type {Nimiq.SerialBuffer} */
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
            seed: Nimiq.BufferUtils.toAscii(seed), // seed is a bytestring
            keySize: keyParams.keySize,
        }, '*');

        /** @type {(keyPair: RsaKeyPairExport) => void} */
        let resolver;
        /** @type {Promise<RsaKeyPairExport>} */
        const resultPromise = new Promise(resolve => {
            resolver = resolve;
        });

        /**
         * @param {MessageEvent} event
         */
        function onMessage(event) {
            if (event.source === event.target) {
                // console.log("Ignored same-window event:", event);
                return;
            }

            /** @type {{privateKey: ArrayBuffer, publicKey: ArrayBuffer}} */
            const data = event.data;
            if (!('privateKey' in data) || !('publicKey' in data)) return;

            window.removeEventListener('message', onMessage);

            resolver({
                privateKey: new Uint8Array(data.privateKey),
                publicKey: new Uint8Array(data.publicKey),
                keyParams,
            });
        }

        // Listen for result from iframe
        window.addEventListener('message', onMessage);

        return resultPromise;
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
