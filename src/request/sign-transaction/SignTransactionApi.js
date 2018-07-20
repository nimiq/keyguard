/* global EncryptionType */
/* global KeyStore */
/* global PopupApi */
/* global Nimiq */
/* global AmountTooSmallError, NetworkMissmatchError */
/* global SignTransactionWithPassphrase, SignTransactionWithPin */
/* global TransactionType */
/* global AddressUtils */
/* global Utf8Tools */

class SignTransactionApi extends PopupApi { // eslint-disable-line no-unused-vars
    /**
     * @param {TransactionRequest} txRequest
     */
    async onRequest(txRequest) {
        // Validation
        if (!txRequest) throw new Error('Invalid request');

        // These checks throw an exception on failure
        AddressUtils.isUserFriendlyAddress(txRequest.sender);
        AddressUtils.isUserFriendlyAddress(txRequest.recipient);
        AddressUtils.isUserFriendlyAddress(txRequest.signer);
        if (txRequest.type === TransactionType.EXTENDED && typeof txRequest.extraData !== 'string') {
            throw new Error('Transaction extraData must be a string');
        }

        // Normalization
        txRequest.value = Nimiq.Policy.coinsToSatoshis(txRequest.value);
        txRequest.fee = Nimiq.Policy.coinsToSatoshis(txRequest.fee);
        txRequest.sender = AddressUtils.formatAddress(txRequest.sender);
        txRequest.recipient = AddressUtils.formatAddress(txRequest.recipient);
        txRequest.signer = AddressUtils.formatAddress(txRequest.signer);
        if (txRequest.type === TransactionType.EXTENDED) {
            txRequest.extraData = Utf8Tools.utf8ByteArrayToString(
                Utf8Tools.stringToUtf8ByteArray(txRequest.extraData || ''),
            );
        }

        switch (txRequest.type) {
        case TransactionType.BASIC:
            if (txRequest.sender !== txRequest.signer) {
                throw new Error('Sender must be signer for basic transactions');
            }

            break;
        case TransactionType.EXTENDED:
            // Validate extended transactions

            break;
        default:
            throw new Error('Invalid transaction type');
        }

        if (txRequest.value < 1) {
            throw new AmountTooSmallError();
        }

        if (txRequest.network !== Nimiq.GenesisConfig.NETWORK_NAME) {
            throw new NetworkMissmatchError(txRequest.network, Nimiq.GenesisConfig.NETWORK_NAME);
        }
        // End validation

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
