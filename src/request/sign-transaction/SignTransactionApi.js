/* global EncryptionType */
/* global KeyStore */
/* global PopupApi */
/* global Nimiq */
/* global AmountTooSmallError, NetworkMissmatchError */
/* global SignTransactionWithPassphrase, SignTransactionWithPin */
/* global TransactionType */
/* global AddressUtils */

class SignTransactionApi extends PopupApi { // eslint-disable-line no-unused-vars
    /**
     * @param {TransactionRequest} txRequest
     */
    async onRequest(txRequest) {
        // Validation
        if (!txRequest) throw new Error('Invalid request');

        if (txRequest.type === TransactionType.EXTENDED) {
            throw new Error('Extended transaction signing is not yet implemented');
        } else if (txRequest.type === TransactionType.BASIC) {
            if (txRequest.sender !== txRequest.signer) {
                throw new Error('Sender must be signer for basic transactions');
            }
        } else {
            throw new Error('Invalid transaction type');
        }

        // These checks throw an exception on failure
        AddressUtils.isUserFriendlyAddress(txRequest.sender);
        AddressUtils.isUserFriendlyAddress(txRequest.recipient);
        AddressUtils.isUserFriendlyAddress(txRequest.signer);

        if (Nimiq.Policy.coinsToSatoshis(txRequest.value) < 1) {
            throw new AmountTooSmallError();
        }

        if (txRequest.network !== Nimiq.GenesisConfig.NETWORK_NAME) {
            throw new NetworkMissmatchError(txRequest.network, Nimiq.GenesisConfig.NETWORK_NAME);
        }
        // End validation

        // Normalization
        txRequest.value = Nimiq.Policy.coinsToSatoshis(txRequest.value);
        txRequest.fee = Nimiq.Policy.coinsToSatoshis(txRequest.fee);
        txRequest.sender = AddressUtils.formatAddress(txRequest.sender);
        txRequest.recipient = AddressUtils.formatAddress(txRequest.recipient);
        txRequest.signer = AddressUtils.formatAddress(txRequest.signer);
        // txRequest.extraData = Utf8Tools.utf8ByteArrayToString(Utf8Tools.stringToUtf8ByteArray(txRequest.extraData));

        // Get signer key type
        let keyType;
        if (txRequest.mockKeyType) keyType = txRequest.mockKeyType;
        else {
            const keyStore = KeyStore.instance;
            keyType = await keyStore.getType(txRequest.signer);
        }

        const handler = keyType === EncryptionType.HIGH
            ? new SignTransactionWithPassphrase(txRequest, this.resolve.bind(this), this.reject.bind(this))
            : new SignTransactionWithPin(txRequest, this.resolve.bind(this), this.reject.bind(this));

        handler.run();
    }
}
