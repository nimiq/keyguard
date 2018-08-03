/* global Nimiq */
/* global KeyStore */
/* global PopupApi */
/* global SignTransaction */

class SignTransactionApi extends PopupApi { // eslint-disable-line no-unused-vars
    /**
     * @param {SignTransactionRequest} request
     */
    async onRequest(request) {
        const parsedRequest = await SignTransactionApi._parseRequest(request);
        const handler = new SignTransaction(parsedRequest, this.resolve.bind(this), this.reject.bind(this));
        handler.run();
    }

    /**
     * @param {SignTransactionRequest} request
     * @returns {Promise<ParsedSignTransactionRequest>}
     * @private
     */
    static async _parseRequest(request) {
        if (!request) {
            throw new Error('Empty request');
        }

        // Check that keyId is given.
        if (typeof request.keyId !== 'string' || !request.keyId) {
            throw new Error('keyId is required');
        }

        // Check that key exists.
        const keyInfo = await KeyStore.instance.getInfo(request.keyId);
        if (!keyInfo) {
            throw new Error('Unknown keyId');
        }

        // Check that keyPath is given.
        if (typeof request.keyPath !== 'string' || !request.keyPath) {
            throw new Error('keyPath is required');
        }

        // FIXME Validate path.

        // Parse transaction.
        const transaction = SignTransactionApi._parseTransaction(request);

        // Check that the transaction is for the correct network.
        if (transaction.networkId !== Nimiq.GenesisConfig.NETWORK_ID) {
            throw new Error('Transaction is not valid in this network');
        }

        // Check that sender != recipient.
        if (transaction.recipient.equals(transaction.sender)) {
            throw new Error('Sender and recipient must not match');
        }

        // Check sender / recipient account type.
        const accountTypes = new Set([Nimiq.Account.Type.BASIC, Nimiq.Account.Type.VESTING, Nimiq.Account.Type.HTLC]);
        if (!accountTypes.has(transaction.senderType) || !accountTypes.has(transaction.recipientType)) {
            throw new Error('Invalid sender type');
        }

        // Validate labels.
        const labels = [request.keyLabel, request.senderLabel, request.recipientLabel];
        if (labels.some(label => label !== undefined && (typeof label !== 'string' || label.length > 64))) {
            throw new Error('Invalid label');
        }

        return /** @type {ParsedSignTransactionRequest} */ {
            keyInfo,
            keyPath: request.keyPath,
            transaction,

            keyLabel: request.keyLabel,
            senderLabel: request.senderLabel,
            recipientLabel: request.recipientLabel,
        };
    }

    /**
     * @param {SignTransactionRequest} request
     * @returns {Nimiq.ExtendedTransaction}
     * @private
     */
    static _parseTransaction(request) {
        const sender = Nimiq.Address.fromString(request.sender);
        const senderType = request.senderType || Nimiq.Account.Type.BASIC;
        const recipient = Nimiq.Address.fromString(request.recipient);
        const recipientType = request.recipientType || Nimiq.Account.Type.BASIC;
        const flags = request.flags || Nimiq.Transaction.Flag.NONE;
        const data = (request.data && Nimiq.BufferUtils.fromBase64(request.data)) || new Uint8Array(0);
        const networkId = Nimiq.GenesisConfig.CONFIGS[request.network].NETWORK_ID;
        return new Nimiq.ExtendedTransaction(
            sender,
            senderType,
            recipient,
            recipientType,
            request.value,
            request.fee,
            request.validityStartHeight,
            flags,
            data,
            new Uint8Array(0), // proof
            networkId,
        );
    }
}
