/* global Nimiq */
/* global Utf8Tools */

/**
 * Usage:
 * <script src="lib/key.js"></script>
 *
 * const key = new Key(keypair, type);
 * const key = await Key.loadEncrypted('encrypted keypair as hex', passphrase);
 *
 * const tx = key.createTransaction(recipient, value, fee, validityStartHeight);
 * const tx = key.createTransactionWithMessage(recipient, value, fee, validityStartHeight, message);
 * const tx = key.createVestingPayoutTransaction(sender, value, fee, validityStartHeight, [message]);
 * const tx = key.createExtendedTransaction(
 *    sender, [senderType], recipient, [recipientType],
 *    value, fee, validityStartHeight, [extraData], [isContractCreation]
 * );
 *
 * const msg = key.signMessage('message');
 *
 */
class Key { // eslint-disable-line no-unused-vars
    /**
     * @param {Uint8Array | string} buf - Keypair, as byte array or HEX string
     * @param {EncryptionType} type
     * @returns {Key}
     */
    static loadPlain(buf, type) {
        if (typeof buf === 'string') {
            buf = Nimiq.BufferUtils.fromHex(buf);
        }

        if (!buf || buf.byteLength === 0) {
            throw new Error('Invalid Key seed');
        }

        return new Key(Nimiq.KeyPair.unserialize(new Nimiq.SerialBuffer(buf)), type);
    }

    /**
     * @param {Uint8Array | string} buf - Encrypted keypair
     * @param {Uint8Array | string} passphrase - Passphrase, as byte array or ASCII string
     * @param {EncryptionType} type
     * @returns {Promise<Key>}
     */
    static async loadEncrypted(buf, passphrase, type) {
        if (typeof buf === 'string') {
            buf = Nimiq.BufferUtils.fromHex(buf);
        }

        if (typeof passphrase === 'string') {
            passphrase = Nimiq.BufferUtils.fromAscii(passphrase);
        }

        const keyPair = await Nimiq.KeyPair.fromEncrypted(new Nimiq.SerialBuffer(buf), passphrase);
        return new Key(keyPair, type);
    }


    /**
     * @param {string} friendlyAddress
     * @returns {Nimiq.Address}
     */
    static getUnfriendlyAddress(friendlyAddress) {
        return Nimiq.Address.fromUserFriendlyAddress(friendlyAddress);
    }

    /**
     * Create a new Key object.
     *
     * @param {Nimiq.KeyPair} keyPair - Key pair for this key
     * @param {EncryptionType} type - Low or high security (passphrase or pin encoded, respectively)
     */
    constructor(keyPair, type) {
        this._keyPair = keyPair; // Plain key pair, not encrypted
        this.address = this._keyPair.publicKey.toAddress();
        this.userFriendlyAddress = this.address.toUserFriendlyAddress();
        this.type = type;
    }

    /**
     * Sign a generic message.
     *
     * @param {string | Uint8Array} message - A utf-8 string or byte array (max 255 bytes)
     * @returns {SignedMessageResult}
     */
    signMessage(message) {
        /**
         * Adding a prefix to the message makes the calculated signature recognisable as
         * a Nimiq specific signature. This prevents misuse where a malicious request can
         * sign arbitrary data (e.g. a transaction) and use the signature to impersonate
         * the victim. (https://github.com/ethereum/wiki/wiki/JSON-RPC#eth_sign)
         */
        const prefix = 'Nimiq Signed Message:\n';
        const prefixBytes = new Nimiq.SerialBuffer(Utf8Tools.stringToUtf8ByteArray(prefix));
        const prefixLength = prefixBytes.length;

        /** @type {Nimiq.SerialBuffer} */
        let msgBytes;
        if (typeof message === 'string') {
            msgBytes = new Nimiq.SerialBuffer(Utf8Tools.stringToUtf8ByteArray(message));
        } else {
            msgBytes = new Nimiq.SerialBuffer(message);
        }

        const msgLength = msgBytes.length;

        if (msgLength > 255) {
            throw new Error('Message must not exceed 255 bytes');
        }

        const bufLength = 1 /* prefixBytes length value */
            + prefixLength
            + 1 /* msgBytes length value */
            + msgLength;

        // Construct buffer
        const buf = new Nimiq.SerialBuffer(bufLength);
        buf.writeUint8(prefixLength);
        buf.write(prefixBytes);
        buf.writeUint8(msgLength);
        buf.write(msgBytes);

        const proof = this._makeSignatureProof(buf);
        return { message, proof };
    }

    /**
     * Create a basic transaction with this key as the sender that is signed by this key.
     *
     * @param {Nimiq.Address | string} recipient - Address of the transaction receiver
     * @param {number} value - Number of satoshis to send
     * @param {number} fee - Number of satoshis to set as fee
     * @param {number} validityStartHeight - The validityStartHeight for the transaction
     * @returns {Nimiq.BasicTransaction} A prepared and signed Transaction object (to be sent to the network)
     */
    createTransaction(recipient, value, fee, validityStartHeight) {
        if (typeof recipient === 'string') {
            recipient = Key.getUnfriendlyAddress(recipient);
        }

        const transaction = new Nimiq.BasicTransaction(
            this.keyPair.publicKey,
            recipient,
            value,
            fee,
            validityStartHeight,
        );

        const proof = this._makeSignatureProof(transaction.serializeContent());
        transaction.proof = proof.serialize();

        return transaction;
    }

    /**
     * Create an extended transaction with this key as the sender that is signed by this key.
     *
     * @param {Nimiq.Address | string} recipient - Address of the transaction receiver
     * @param {number} value - Number of satoshis to send
     * @param {number} fee - Number of satoshis to set as fee
     * @param {number} validityStartHeight - The validityStartHeight for the transaction
     * @param {string} message - Message to add to the transaction
     * @returns {Nimiq.ExtendedTransaction} A prepared and signed Transaction object (to be sent to the network)
     */
    createTransactionWithMessage(recipient, value, fee, validityStartHeight, message) {
        return this.createExtendedTransaction(
            this.publicKey.toAddress(), Nimiq.Account.Type.BASIC,
            recipient, Nimiq.Account.Type.BASIC,
            value,
            fee,
            validityStartHeight,
            message,
        );
    }

    /**
     * Create an extended transaction that pays out vested NIM to this key and that is signed by this key.
     *
     * @param {Nimiq.Address | string} sender - Address of the transaction sending vesting contract
     * @param {number} value - Number of Satoshis to send
     * @param {number} fee - Number of satoshis to set as fee
     * @param {number} validityStartHeight - The validityStartHeight for the transaction
     * @param {string} [message] - Text to add to the transaction
     * @returns {Nimiq.ExtendedTransaction} A prepared and signed Transaction object (to be sent to the network)
     */
    createVestingPayoutTransaction(sender, value, fee, validityStartHeight, message) {
        return this.createExtendedTransaction(
            sender, Nimiq.Account.Type.VESTING,
            this.publicKey.toAddress(), Nimiq.Account.Type.BASIC,
            value,
            fee,
            validityStartHeight,
            message,
        );
    }

    /**
     * Create an extended transaction that is signed by this key.
     *
     * @param {Nimiq.Address | string} sender - Address of the transaction receiver
     * @param {Nimiq.Account.Type | null} [senderType]
     * @param {Nimiq.Address | string} recipient - Address of the transaction receiver
     * @param {Nimiq.Account.Type | null} [recipientType]
     * @param {number} value - Number of Satoshis to send
     * @param {number} fee - Number of satoshis to set as fee
     * @param {number} validityStartHeight - The validityStartHeight for the transaction
     * @param {Uint8Array | string} [extraData] - Data or utf-8 text to add to the transaction
     * @param {boolean} [isContractCreation]
     * @returns {Nimiq.ExtendedTransaction} A prepared and signed Transaction object (to be sent to the network)
     */
    createExtendedTransaction(
        sender, senderType,
        recipient, recipientType,
        value,
        fee,
        validityStartHeight,
        extraData,
        isContractCreation,
    ) {
        if (typeof sender === 'string') {
            sender = Key.getUnfriendlyAddress(sender);
        }

        if (typeof recipient === 'string') {
            recipient = Key.getUnfriendlyAddress(recipient);
        }

        if (typeof extraData === 'string') {
            extraData = Utf8Tools.stringToUtf8ByteArray(extraData);
        }

        const transaction = new Nimiq.ExtendedTransaction(
            sender, senderType || Nimiq.Account.Type.BASIC,
            recipient, recipientType || Nimiq.Account.Type.BASIC,
            value,
            fee,
            validityStartHeight,
            isContractCreation ? Nimiq.Transaction.Flag.CONTRACT_CREATION : Nimiq.Transaction.Flag.NONE,
            extraData || new Uint8Array(0),
        );

        const proof = this._makeSignatureProof(transaction.serializeContent());
        transaction.proof = proof.serialize();

        return transaction;
    }

    /**
     * Generate a signature proof for data with this key.
     *
     * @param {Uint8Array} data - The data to sign
     * @returns {Nimiq.SignatureProof} A signature proof for this transaction
     */
    _makeSignatureProof(data) {
        const signature = Nimiq.Signature.create(this.keyPair.privateKey, this.keyPair.publicKey, data);
        return Nimiq.SignatureProof.singleSig(this.keyPair.publicKey, signature);
    }

    /**
     * @param {Uint8Array | string} passphrase
     * @param {Uint8Array | string} [unlockKey]
     * @returns {Promise<Nimiq.SerialBuffer>}
     */
    async exportEncrypted(passphrase, unlockKey) {
        if (typeof passphrase === 'string') {
            passphrase = Nimiq.BufferUtils.fromAscii(passphrase);
        }

        if (typeof unlockKey === 'string') {
            unlockKey = Nimiq.BufferUtils.fromAscii(unlockKey);
        }

        return this._keyPair.exportEncrypted(passphrase, unlockKey);
    }

    /**
     * @returns {Uint8Array}
     */
    exportPlain() {
        return this._keyPair.serialize();
    }

    /** @type {boolean} */
    get isLocked() {
        return this.keyPair.isLocked;
    }

    /**
     * @param {Uint8Array | string} key
     * @returns {Promise<void>}
     */
    async lock(key) {
        if (typeof key === 'string') {
            key = Nimiq.BufferUtils.fromAscii(key);
        }

        await this.keyPair.lock(key);
    }

    relock() {
        this.keyPair.relock();
    }

    /**
     * @param {Uint8Array | string} key
     * @returns {Promise<void>}
     */
    async unlock(key) {
        if (typeof key === 'string') {
            key = Nimiq.BufferUtils.fromAscii(key);
        }

        await this.keyPair.unlock(key);
    }

    /**
     * @param {Key} o
     * @returns {boolean}
     */
    equals(o) {
        return o instanceof Key && this.keyPair.equals(o.keyPair) && this.address.equals(o.address);
    }

    /**
     * @returns {KeyInfo}
     */
    getPublicInfo() {
        /** @type {KeyInfo} */
        const keyInfo = {
            userFriendlyAddress: this.userFriendlyAddress,
            type: this.type,
        };

        return keyInfo;
    }

    /**
     * The public key of the Key owner
     * @type {Nimiq.PublicKey}
     */
    get publicKey() {
        return this._keyPair.publicKey;
    }

    /** @type {Nimiq.KeyPair} */
    get keyPair() {
        return this._keyPair;
    }
}
