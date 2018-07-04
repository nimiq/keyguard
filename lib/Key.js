/**
 * Usage:
 * <script src="lib/key.js"></script>
 * const key = new Key(keypair, type);
 * const key = await Key.loadEncrypted('encrypted keypair as hex', passphrase);
 */
class Key {
    /**
     * @param {Uint8Array|string} buf Keypair, as byte array or HEX string
     * @returns {Key}
     */
    static loadPlain(buf) {
        if (typeof buf === 'string') buf = /** @type {Uint8Array} */ (Nimiq.BufferUtils.fromHex(buf));
        if (!buf || buf.byteLength === 0) {
            throw new Error('Invalid Key seed');
        }
        return new Key(Nimiq.KeyPair.unserialize(new Nimiq.SerialBuffer(buf)));
    }

    /**
     * @param {Uint8Array|string} buf Encrypted keypair, as byte array or HEX string
     * @param {Uint8Array|string} passphrase Passphrase, as byte array or ASCII string
     * @returns {Promise.<Key>}
     */
    static async loadEncrypted(buf, passphrase) {
        if (typeof buf === 'string') buf = /** @type {Uint8Array} */ (Nimiq.BufferUtils.fromHex(buf));
        if (typeof passphrase === 'string') passphrase = /** @type {Uint8Array} */ (Nimiq.BufferUtils.fromAscii(passphrase));
        return new Key(await Nimiq.KeyPair.fromEncrypted(new Nimiq.SerialBuffer(buf), passphrase));
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
     * @param {typeof Nimiq.KeyPair} keyPair KeyPair owning this Key
     * @param {1|2} [type]
     */
    constructor(keyPair, type) {
        /** @type {typeof Nimiq.KeyPair} */
        this._keyPair = keyPair;
        /** @type {typeof Nimiq.Address} */
        this.address = this._keyPair.publicKey.toAddress();
        /** @type {string} */
        this.userFriendlyAddress = this.address.toUserFriendlyAddress();
        this.type = type;
    }

    /**
     * Sign a generic message
     * @param {Uint8Array|string} message
     */
    signMessage(message) {
        if (typeof message === 'string') message = /** @type {Uint8Array} */ (Nimiq.BufferUtils.fromHex(message));
        const signature = Nimiq.Signature.create(this._keyPair.privateKey, this._keyPair.publicKey, message);
        return { message, signature };
    }

    /**
     * Sign Transaction that is signed by the owner of this Key
     * @param {Nimiq.Address | string} recipient Address of the transaction receiver
     * @param {number} value Number of Satoshis to send.
     * @param {number} fee Number of Satoshis to donate to the Miner.
     * @param {number} validityStartHeight The validityStartHeight for the transaction.
     * @param {string} extraData Text to add to the transaction, requires extended format
     *
     * @param {TransactionFormat} format basic or extended
     * @returns {Nimiq.Transaction} A prepared and signed Transaction object. This still has to be sent to the network.
     */
    createTransaction(recipient, value, fee, validityStartHeight, extraData, format) {
        if (typeof recipient === 'string') {
            recipient = Key.getUnfriendlyAddress(recipient);
        }

        if (format === 'basic') {
            const transaction = new Nimiq.BasicTransaction(this._keyPair.publicKey, recipient, value, fee, validityStartHeight);
            transaction.signature = Nimiq.Signature.create(this._keyPair.privateKey, this._keyPair.publicKey, transaction.serializeContent());
            /** @type {Nimiq.Transaction} */
            return transaction;
        }

        if (format === 'extended') {
            const transaction = new Nimiq.ExtendedTransaction(
                this._keyPair.publicKey.toAddress(), Nimiq.Account.Type.BASIC,
                recipient, Nimiq.Account.Type.BASIC,
                value,
                fee,
                validityStartHeight,
                Nimiq.Transaction.Flag.NONE,
                Utf8Tools.stringToUtf8ByteArray(extraData),
            );
            const signature = Nimiq.Signature.create(this._keyPair.privateKey, this._keyPair.publicKey, transaction.serializeContent());
            const proof = Nimiq.SignatureProof.singleSig(this._keyPair.publicKey, signature);
            transaction.proof = proof.serialize();
            return transaction;
        }
        // todo extended transactions
    }

    /**
     * Sign Transaction that is signed by the owner of this Key
     * @param {typeof Nimiq.Address} sender Address of the transaction sending vesting contract
     * @param {number} value Number of Satoshis to send.
     * @param {number} fee Number of Satoshis to donate to the Miner.
     * @param {number} validityStartHeight The validityStartHeight for the transaction.
     * @param {string} extraData Text to add to the transaction, requires extended format
     * @returns {Nimiq.Transaction} A prepared and signed Transaction object. This still has to be sent to the network.
     */
    createVestingTransaction(sender, value, fee, validityStartHeight, extraData) {
        if (typeof sender === 'string') {
            sender = Key.getUnfriendlyAddress(sender);
        }

        const transaction = new Nimiq.ExtendedTransaction(
            sender, Nimiq.Account.Type.VESTING,
            this._keyPair.publicKey.toAddress(), Nimiq.Account.Type.BASIC,
            value,
            fee,
            validityStartHeight,
            Nimiq.Transaction.Flag.NONE,
            Utf8Tools.stringToUtf8ByteArray(extraData),
        );
        const signature = Nimiq.Signature.create(this._keyPair.privateKey, this._keyPair.publicKey, transaction.serializeContent());
        const proof = Nimiq.SignatureProof.singleSig(this._keyPair.publicKey, signature);
        transaction.proof = proof.serialize();
        return transaction;
    }

    /**
     * Sign a transaction by the owner of this Wallet.
     * //@param {Nimiq.Transaction} transaction The transaction to sign.
     * //@returns {Nimiq.SignatureProof} A signature proof for this transaction.
     */
    // todo Do we need this?
    /*signTransaction(transaction) {
        const signature = Nimiq.Signature.create(this._keyPair.privateKey, this._keyPair.publicKey, transaction.serializeContent());
        return Nimiq.SignatureProof.singleSig(this._keyPair.publicKey, signature);
    }*/

    /**
     * @param {Uint8Array|string} passphrase
     * @param {Uint8Array|string} [pin]
     * @return {Promise.<Uint8Array>}
     */
    exportEncrypted(passphrase, pin) {
        if (typeof passphrase === 'string') passphrase = Nimiq.BufferUtils.fromAscii(passphrase);
        if (typeof pin === 'string') pin = Nimiq.BufferUtils.fromAscii(pin);
        return this._keyPair.exportEncrypted(passphrase, pin);
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
     * @param {Uint8Array|string} key
     * @returns {Promise.<void>}
     */
    lock(key) {
        if (typeof key === 'string') key = Nimiq.BufferUtils.fromAscii(key);
        return this.keyPair.lock(key);
    }

    relock() {
        this.keyPair.relock();
    }

    /**
     * @param {Uint8Array|string} key
     * @returns {Promise.<void>}
     */
    unlock(key) {
        if (typeof key === 'string') key = Nimiq.BufferUtils.fromAscii(key);
        return this.keyPair.unlock(key);
    }

    /**
     * @param {Key} o
     * @return {boolean}
     */
    equals(o) {
        return o instanceof Key && this.keyPair.equals(o.keyPair) && this.address.equals(o.address);
    }

    /**
     * @returns {object}
     */
    getPublicInfo() {
        return {
            userFriendlyAddress: this.userFriendlyAddress,
            type: this.type
        }
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
