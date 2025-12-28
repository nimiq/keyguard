/* global Nimiq */
/* global Key */

/* eslint-disable no-bitwise */

class BackupCodes {
    /**
     * Deterministically generate two Backup Codes which can be used together to recover the underlying key.
     * For a given key, always the same Backup Codes are generated.
     * @param {Key} key
     * @returns {Promise<[string, string]>}
     */
    static async generate(key) {
        const version = BackupCodes.VERSION;
        const flags = key.secret instanceof Nimiq.PrivateKey
            ? BackupCodes.FLAG_IS_LEGACY_PRIVATE_KEY
            : BackupCodes.FLAG_NONE;
        const versionAndFlags = (version & BackupCodes.VERSION_BIT_MASK)
            | ((flags << BackupCodes.FLAGS_BIT_SHIFT) & BackupCodes.FLAGS_BIT_MASK);
        const secretBytes = key.secret.serialize();

        // Note that we don't need to include a checksum, because the codes themselves can serve as that as they're
        // basically derived from the secret and metadata by hashing.
        const plainText = new Nimiq.SerialBuffer(/* versionAndFlags */ 1 + secretBytes.length);
        plainText.writeUint8(versionAndFlags);
        plainText.write(secretBytes);

        // We generate one code from the key via a key derivation function (kdf), which is then applied to the plaintext
        // as a one-time-pad (otp) to yield the second code. We use Argon2id as kdf (as opposed to, for example, pbkdf2)
        // due to its memory-hardness.
        const derivationUseCase = `BackupCodes - ${versionAndFlags}`; // include metadata in derivation / checksum
        const code1Bytes = await key.deriveSecret(derivationUseCase, 'Argon2id', 8, plainText.length);
        const code2Bytes = Nimiq.BufferUtils.xor(plainText, code1Bytes);

        const code1 = BackupCodes._renderCode(code1Bytes);
        const code2 = BackupCodes._renderCode(code2Bytes);
        return [code1, code2];
    }

    /**
     * @param {string} code1
     * @param {string} code2
     * @returns {Promise<Key>}
     */
    static async recoverKey(code1, code2) {
        const code1Bytes = BackupCodes._parseCode(code1);
        const code2Bytes = BackupCodes._parseCode(code2);
        if (code1Bytes.byteLength !== /* versionAndFlags */ 1 + Nimiq.Secret.SIZE
            || code2Bytes.byteLength !== code1Bytes.byteLength) {
            throw new Error('Invalid Backup Codes: invalid length');
        }
        const plainText = Nimiq.BufferUtils.xor(code1Bytes, code2Bytes);

        const versionAndFlags = plainText[0];
        const version = versionAndFlags & BackupCodes.VERSION_BIT_MASK;
        const flags = (versionAndFlags & BackupCodes.FLAGS_BIT_MASK) >> BackupCodes.FLAGS_BIT_SHIFT;

        if (version > BackupCodes.VERSION) throw new Error('Invalid Backup Codes: unsupported version');
        const isLegacyPrivateKey = !!(flags & BackupCodes.FLAG_IS_LEGACY_PRIVATE_KEY);

        const secretBytes = plainText.slice(/* versionAndFlags */ 1);
        const secret = isLegacyPrivateKey ? new Nimiq.PrivateKey(secretBytes) : new Nimiq.Entropy(secretBytes);
        const key = new Key(secret);

        // Check whether our recovered key would derive the same codes, as a checksum check.
        const [checksum1, checksum2] = await BackupCodes.generate(key);
        if (checksum1 !== code1 || checksum2 !== code2) throw new Error('Invalid Backup Codes: checksum mismatch');

        return key;
    }

    /**
     * @private
     * @param {Uint8Array} code
     * @returns {string}
     */
    static _renderCode(code) {
        return Nimiq.BufferUtils.toBase64(code)
            .replace(/=+$/g, '') // Remove trailing padding.
            // Replace special characters of base64 (+ and /) with less wide characters to keep the rendered code short.
            .replace(/\//g, '!')
            .replace(/\+/g, ';');
    }

    /**
     * @private
     * @param {string} code
     * @returns {Uint8Array}
     */
    static _parseCode(code) {
        return Nimiq.BufferUtils.fromBase64(code.replace(/!/g, '/').replace(/;/g, '+'));
    }
}

BackupCodes.VERSION = 0;
BackupCodes.FLAG_NONE = 0;
BackupCodes.FLAG_IS_LEGACY_PRIVATE_KEY = 1 << 0;
// We store the version and flags combined in a single byte, with the flags (F) being stored in the most significant
// bits and the version (V) stored in big-endian format in the least significant bits (e.g. FVVVVVVV). This gives us the
// flexibility to introduce more flags and increase version numbers without the two overlapping for quite some while.
BackupCodes.FLAGS_COUNT = 1;
BackupCodes.FLAGS_BIT_SHIFT = 8 - BackupCodes.FLAGS_COUNT;
BackupCodes.FLAGS_BIT_MASK = (0xff << BackupCodes.FLAGS_BIT_SHIFT) & 0xff;
BackupCodes.VERSION_BIT_MASK = (~BackupCodes.FLAGS_BIT_MASK) & 0xff;

/* eslint-enable no-bitwise */
