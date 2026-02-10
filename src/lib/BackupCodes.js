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
        // basically derived from the secret and metadata by hashing. Also note that the deterministic nature of the
        // codes has the side effect that codes leak equality: a matching code can be unambiguously identified given the
        // other code, and backup codes of a different key can be identified as belonging to a different key, which is
        // strictly more information than would be available with random codes. For example, if a user leaks a code in
        // one email account, a potential second hacked email account can be identified as belonging to the same user if
        // two Backup Codes can be matched. However, this is as consequence of the deterministic codes, which are chosen
        // by design, and is not considered an issue. The situation would also be the same, if using random codes, but
        // including a checksum.
        const plainText = new Nimiq.SerialBuffer(/* versionAndFlags */ 1 + secretBytes.length);
        plainText.writeUint8(versionAndFlags);
        plainText.write(secretBytes);

        // We generate one code from the key via a key derivation function (kdf), which is then applied to the plaintext
        // as a one-time-pad (otp) to yield the second code.
        const derivationUseCase = `BackupCodes - ${versionAndFlags}`; // include metadata in derivation / checksum
        const code1Bytes = await key.deriveSecret(derivationUseCase, plainText.length);
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

        // Check whether our recovered key would derive the same codes, as a checksum check. Do a constant time check,
        // to avoid side-channel attacks, although unlikely that exploitable here.
        const [checksum1, checksum2] = await BackupCodes.generate(key);
        const checksum1EqualsCode1 = BackupCodes._constantTimeEqualityCheck(checksum1, code1);
        const checksum2EqualsCode2 = BackupCodes._constantTimeEqualityCheck(checksum2, code2);
        const checksum1EqualsCode2 = BackupCodes._constantTimeEqualityCheck(checksum1, code2);
        const checksum2EqualsCode1 = BackupCodes._constantTimeEqualityCheck(checksum2, code1);
        if ((!checksum1EqualsCode1 || !checksum2EqualsCode2) && (!checksum1EqualsCode2 || !checksum2EqualsCode1)) {
            throw new Error('Invalid Backup Codes: checksum mismatch');
        }

        return key;
    }

    /**
     * @param {string} char
     * @returns {boolean}
     */
    static isValidCharacter(char) {
        return BackupCodes.VALID_CHARACTER_REGEX.test(char);
    }

    /**
     * @param {string} code
     * @returns {boolean}
     */
    static isValidBackupCode(code) {
        return BackupCodes.VALID_CODE_REGEX.test(code);
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

    /**
     * @private
     * @param {string} a
     * @param {string} b
     * @returns {boolean}
     */
    static _constantTimeEqualityCheck(a, b) {
        const lenA = a.length;
        const lenB = b.length;
        const maxLen = Math.max(lenA, lenB);
        let result = 0;

        if (lenA !== lenB) {
            result |= 1;
        }

        for (let i = 0; i < maxLen; i++) {
            const charCodeA = a.charCodeAt(i) || 0;
            const charCodeB = b.charCodeAt(i) || 0;

            // XOR is 0 if the char codes are identical.
            result |= (charCodeA ^ charCodeB);
        }

        return result === 0;
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

BackupCodes.VALID_CHARACTER_REGEX = /^[A-Za-z0-9!;]$/u;
BackupCodes.VALID_CODE_REGEX = /^[A-Za-z0-9!;]{44}$/u;

/* eslint-enable no-bitwise */
