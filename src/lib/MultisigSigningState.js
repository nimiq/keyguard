/* global Nimiq */

/**
 * The state of one MuSig2 signing session of one signer, handed out by the Keyguard in round 1 (together with the
 * signer's commitments) and handed back to the Keyguard for signing in round 2.
 *
 * The Keyguard never accepts commitment secrets from the caller. Instead, the secrets are derived deterministically
 * from the signer's private key and the state, and the state is authenticated with a MAC that is also keyed by the
 * private key. This way, the caller can neither inject chosen secrets, nor modify the state, for example to re-use it
 * for a different transaction. The state is not secret.
 *
 * Binary layout (all integers big-endian):
 *
 *   version          1 byte
 *   deviceId        16 bytes  random ID of the Keyguard instance which created the state
 *   salt            32 bytes  random per signing session
 *   createdAt        8 bytes  unix timestamp in ms
 *   expiresAt        8 bytes  unix timestamp in ms
 *   contentHash     32 bytes  Blake2b of the serialized content of the transaction to sign
 *   multisigHash    32 bytes  Blake2b of the multisig's sorted public keys and number of signers
 *   signerPublicKey 32 bytes  public key of the signer which created the state
 *   mac             32 bytes  HMAC over all of the above
 */
class MultisigSigningState {
    /**
     * @param {{
     *     version: number,
     *     deviceId: Uint8Array,
     *     salt: Uint8Array,
     *     createdAt: number,
     *     expiresAt: number,
     *     contentHash: Uint8Array,
     *     multisigHash: Uint8Array,
     *     signerPublicKey: Nimiq.PublicKey,
     *     mac: Uint8Array,
     * }} fields
     */
    constructor({
        version,
        deviceId,
        salt,
        createdAt,
        expiresAt,
        contentHash,
        multisigHash,
        signerPublicKey,
        mac,
    }) {
        this.version = version;
        this.deviceId = deviceId;
        this.salt = salt;
        this.createdAt = createdAt;
        this.expiresAt = expiresAt;
        this.contentHash = contentHash;
        this.multisigHash = multisigHash;
        this.signerPublicKey = signerPublicKey;
        this.mac = mac;
    }

    /**
     * Creates a new signing state for a fresh signing session.
     *
     * @param {Nimiq.PrivateKey} privateKey - The signer's private key
     * @param {{
     *     deviceId: Uint8Array,
     *     transactionContent: Uint8Array,
     *     publicKeys: Nimiq.PublicKey[],
     *     numberOfSigners: number,
     *     now?: number,
     *     salt?: Uint8Array,
     * }} params - `now` and `salt` are only meant to be overwritten in tests.
     * @returns {MultisigSigningState}
     */
    static create(privateKey, {
        deviceId,
        transactionContent,
        publicKeys,
        numberOfSigners,
        now = Date.now(),
        salt = window.crypto.getRandomValues(new Uint8Array(MultisigSigningState.SALT_SIZE)),
    }) {
        if (deviceId.length !== MultisigSigningState.DEVICE_ID_SIZE) throw new Error('Invalid device id');
        if (salt.length !== MultisigSigningState.SALT_SIZE) throw new Error('Invalid salt');

        const state = new MultisigSigningState({
            version: MultisigSigningState.VERSION,
            deviceId,
            salt,
            createdAt: now,
            expiresAt: now + MultisigSigningState.MAX_AGE,
            contentHash: MultisigSigningState.hashContent(transactionContent),
            multisigHash: MultisigSigningState.hashMultisig(publicKeys, numberOfSigners),
            signerPublicKey: Nimiq.PublicKey.derive(privateKey),
            mac: new Uint8Array(MultisigSigningState.MAC_SIZE),
        });
        state.mac = state._computeMac(privateKey);
        return state;
    }

    /**
     * Parses the structure of a serialized state. Does not verify its authenticity, see `verify`.
     *
     * @param {unknown} bytes
     * @returns {MultisigSigningState}
     */
    static deserialize(bytes) {
        if (!(bytes instanceof Uint8Array)) throw new Error('State must be a Uint8Array');
        if (bytes.length !== MultisigSigningState.SERIALIZED_SIZE) throw new Error('Invalid state length');
        if (bytes[0] !== MultisigSigningState.VERSION) throw new Error('Unsupported state version');

        let offset = 0;
        /** @param {number} length */
        const read = length => {
            const slice = bytes.slice(offset, offset + length);
            offset += length;
            return slice;
        };

        const version = read(1)[0];
        const deviceId = read(MultisigSigningState.DEVICE_ID_SIZE);
        const salt = read(MultisigSigningState.SALT_SIZE);
        const createdAt = MultisigSigningState._readUint64(read(8));
        const expiresAt = MultisigSigningState._readUint64(read(8));
        const contentHash = read(32);
        const multisigHash = read(32);
        const signerPublicKey = new Nimiq.PublicKey(read(32));
        const mac = read(MultisigSigningState.MAC_SIZE);

        return new MultisigSigningState({
            version,
            deviceId,
            salt,
            createdAt,
            expiresAt,
            contentHash,
            multisigHash,
            signerPublicKey,
            mac,
        });
    }

    /**
     * @returns {Uint8Array}
     */
    serialize() {
        const bytes = new Uint8Array(MultisigSigningState.SERIALIZED_SIZE);
        const body = this._serializeBody();
        bytes.set(body, 0);
        bytes.set(this.mac, body.length);
        return bytes;
    }

    /**
     * A unique identifier of this signing session, used as key for the record of its use.
     *
     * @returns {Uint8Array}
     */
    hash() {
        return Nimiq.Hash.computeBlake2b(this.serialize());
    }

    /**
     * Checks that the state was created by the owner of the given private key and has not been modified.
     *
     * @param {Nimiq.PrivateKey} privateKey
     * @returns {boolean}
     */
    verify(privateKey) {
        if (!this.signerPublicKey.equals(Nimiq.PublicKey.derive(privateKey))) return false;
        return MultisigSigningState.constantTimeEquals(this._computeMac(privateKey), this.mac);
    }

    /**
     * Derives this signing session's commitment pairs. The secrets are bound to the private key and the entire state,
     * such that any change to the state results in different secrets.
     *
     * Only call this for verified states, see `verify`.
     *
     * @param {Nimiq.PrivateKey} privateKey
     * @returns {Nimiq.CommitmentPair[]}
     */
    deriveCommitmentPairs(privateKey) {
        const { nonceKey } = MultisigSigningState._deriveSessionKeys(privateKey);
        const body = this._serializeBody();
        /** @type {Nimiq.CommitmentPair[]} */
        const commitmentPairs = [];
        for (let i = 0; i < MultisigSigningState.NUMBER_OF_COMMITMENTS; i++) {
            const input = new Uint8Array(body.length + 1);
            input.set(body, 0);
            input[body.length] = i;
            // The 32 bytes get reduced modulo the group order by RandomSecret, with a negligible bias of ~2^-125.
            const secretBytes = Nimiq.CryptoUtils.computeHmacSha512(nonceKey, input).slice(0, 32);
            commitmentPairs.push(Nimiq.CommitmentPair.derive(new Nimiq.RandomSecret(secretBytes)));
        }
        return commitmentPairs;
    }

    /**
     * @param {number} [now]
     * @returns {boolean}
     */
    isExpired(now = Date.now()) {
        return now > this.expiresAt;
    }

    /**
     * @param {Uint8Array} transactionContent
     * @returns {boolean}
     */
    matchesTransaction(transactionContent) {
        return MultisigSigningState.constantTimeEquals(
            MultisigSigningState.hashContent(transactionContent),
            this.contentHash,
        );
    }

    /**
     * @param {Nimiq.PublicKey[]} publicKeys
     * @param {number} numberOfSigners
     * @returns {boolean}
     */
    matchesMultisig(publicKeys, numberOfSigners) {
        return MultisigSigningState.constantTimeEquals(
            MultisigSigningState.hashMultisig(publicKeys, numberOfSigners),
            this.multisigHash,
        );
    }

    /**
     * @param {Uint8Array} transactionContent
     * @returns {Uint8Array}
     */
    static hashContent(transactionContent) {
        return Nimiq.Hash.computeBlake2b(transactionContent);
    }

    /**
     * @param {Nimiq.PublicKey[]} publicKeys
     * @param {number} numberOfSigners
     * @returns {Uint8Array}
     */
    static hashMultisig(publicKeys, numberOfSigners) {
        if (!Number.isInteger(numberOfSigners) || numberOfSigners < 1 || numberOfSigners > 255) {
            throw new Error('Invalid number of signers');
        }
        const serializedKeys = publicKeys
            .map(publicKey => publicKey.serialize())
            .sort(MultisigSigningState.compareBytes);
        const input = new Uint8Array(serializedKeys.length * 32 + 1);
        serializedKeys.forEach((key, i) => input.set(key, i * 32));
        input[input.length - 1] = numberOfSigners;
        return Nimiq.Hash.computeBlake2b(input);
    }

    /**
     * Hashes everything that goes into a partial signature besides the own private key and commitment secrets, which
     * are fixed by the state. Signing the same state twice with differing inputs would leak the private key.
     *
     * @param {Uint8Array} data - The signed data, i.e. the serialized transaction content
     * @param {Array<{ publicKey: Nimiq.PublicKey, commitments: Nimiq.Commitment[] }>} signers - All signers, in request
     *     order, including the own signer
     * @returns {Uint8Array}
     */
    static hashSigningInputs(data, signers) {
        const parts = [MultisigSigningState._uint32(data.length), data];
        parts.push(MultisigSigningState._uint32(signers.length));
        for (const signer of signers) {
            parts.push(signer.publicKey.serialize());
            parts.push(MultisigSigningState._uint32(signer.commitments.length));
            for (const commitment of signer.commitments) {
                parts.push(commitment.serialize());
            }
        }
        return Nimiq.Hash.computeBlake2b(MultisigSigningState._concat(parts));
    }

    /**
     * @param {Uint8Array} a
     * @param {Uint8Array} b
     * @returns {boolean}
     */
    static constantTimeEquals(a, b) {
        if (a.length !== b.length) return false;
        let diff = 0;
        for (let i = 0; i < a.length; i++) {
            diff |= a[i] ^ b[i]; // eslint-disable-line no-bitwise
        }
        return diff === 0;
    }

    /**
     * @param {Uint8Array} a
     * @param {Uint8Array} b
     * @returns {number}
     */
    static compareBytes(a, b) {
        const length = Math.min(a.length, b.length);
        for (let i = 0; i < length; i++) {
            if (a[i] !== b[i]) return a[i] - b[i];
        }
        return a.length - b.length;
    }

    /**
     * @private
     * @returns {Uint8Array}
     */
    _serializeBody() {
        return MultisigSigningState._concat([
            new Uint8Array([this.version]),
            this.deviceId,
            this.salt,
            MultisigSigningState._writeUint64(this.createdAt),
            MultisigSigningState._writeUint64(this.expiresAt),
            this.contentHash,
            this.multisigHash,
            this.signerPublicKey.serialize(),
        ]);
    }

    /**
     * @private
     * @param {Nimiq.PrivateKey} privateKey
     * @returns {Uint8Array}
     */
    _computeMac(privateKey) {
        const { macKey } = MultisigSigningState._deriveSessionKeys(privateKey);
        return Nimiq.CryptoUtils.computeHmacSha512(macKey, this._serializeBody())
            .slice(0, MultisigSigningState.MAC_SIZE);
    }

    /**
     * Derives independent keys for authenticating states and for deriving commitment secrets.
     *
     * @private
     * @param {Nimiq.PrivateKey} privateKey
     * @returns {{ macKey: Uint8Array, nonceKey: Uint8Array }}
     */
    static _deriveSessionKeys(privateKey) {
        const keyBytes = privateKey.serialize();
        return {
            macKey: Nimiq.CryptoUtils.computeHmacSha512(keyBytes, MultisigSigningState._label('mac')),
            nonceKey: Nimiq.CryptoUtils.computeHmacSha512(keyBytes, MultisigSigningState._label('nonce')),
        };
    }

    /**
     * @private
     * @param {string} purpose
     * @returns {Uint8Array}
     */
    static _label(purpose) {
        const label = `Nimiq Keyguard MuSig2 signing state v${MultisigSigningState.VERSION} ${purpose}`;
        return new TextEncoder().encode(label);
    }

    /**
     * @private
     * @param {number} value
     * @returns {Uint8Array}
     */
    static _writeUint64(value) {
        if (!Number.isSafeInteger(value) || value < 0) throw new Error('Invalid timestamp');
        const bytes = new Uint8Array(8);
        new DataView(bytes.buffer).setBigUint64(0, BigInt(value));
        return bytes;
    }

    /**
     * @private
     * @param {Uint8Array} bytes
     * @returns {number}
     */
    static _readUint64(bytes) {
        const value = new DataView(bytes.buffer, bytes.byteOffset, 8).getBigUint64(0);
        if (value > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error('Invalid timestamp');
        return Number(value);
    }

    /**
     * @private
     * @param {number} value
     * @returns {Uint8Array}
     */
    static _uint32(value) {
        const bytes = new Uint8Array(4);
        new DataView(bytes.buffer).setUint32(0, value);
        return bytes;
    }

    /**
     * @private
     * @param {Uint8Array[]} parts
     * @returns {Uint8Array}
     */
    static _concat(parts) {
        const result = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
        let offset = 0;
        for (const part of parts) {
            result.set(part, offset);
            offset += part.length;
        }
        return result;
    }
}

MultisigSigningState.VERSION = 1;
MultisigSigningState.DEVICE_ID_SIZE = 16;
MultisigSigningState.SALT_SIZE = 32;
MultisigSigningState.MAC_SIZE = 32;
MultisigSigningState.SERIALIZED_SIZE = 1 + 16 + 32 + 8 + 8 + 32 + 32 + 32 + 32;
/** MuSig2 in Nimiq PoS uses exactly 2 commitments per signer (MUSIG2_PARAMETER_V). */
MultisigSigningState.NUMBER_OF_COMMITMENTS = 2;
/** How long a signing session can be used for signing after round 1. */
MultisigSigningState.MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days
