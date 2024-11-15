/* global TopLevelApi */
/* global SignStaking */
/* global Errors */
/* global Nimiq */

/** @extends {TopLevelApi<KeyguardRequest.SignStakingRequest>} */
class SignStakingApi extends TopLevelApi { // eslint-disable-line no-unused-vars
    /**
     * @param {KeyguardRequest.SignStakingRequest} request
     * @returns {Promise<Parsed<KeyguardRequest.SignStakingRequest>>}
     */
    async parseRequest(request) {
        if (!request) {
            throw new Errors.InvalidRequestError('request is required');
        }

        /** @type {Parsed<KeyguardRequest.SignStakingRequest>} */
        const parsedRequest = {};
        parsedRequest.appName = this.parseAppName(request.appName);
        parsedRequest.keyInfo = await this.parseKeyId(request.keyId);
        parsedRequest.keyLabel = this.parseLabel(request.keyLabel);
        parsedRequest.keyPath = this.parsePath(request.keyPath, 'keyPath');
        parsedRequest.senderLabel = this.parseLabel(request.senderLabel);
        parsedRequest.recipientLabel = this.parseLabel(request.recipientLabel);

        parsedRequest.transactions = this.parseStakingTransaction(request.transaction);
        parsedRequest.plain = parsedRequest.transactions.map(tx => tx.toPlain());

        if (parsedRequest.plain.length > 2) {
            throw new Errors.InvalidRequestError('Only a maximum of two transactions are allowed in a single request');
        }

        if (parsedRequest.plain.length === 2) {
            // Ensure the transactions are for stake retiring and removal, in this order
            if (parsedRequest.plain[0].data.type !== 'retire-stake') {
                throw new Errors.InvalidRequestError('First transaction must be a retire stake transaction');
            }
            if (parsedRequest.plain[1].senderData.type !== 'remove-stake') {
                throw new Errors.InvalidRequestError('Second transaction must be a remove stake transaction');
            }
        }

        return parsedRequest;
    }

    /**
     * Checks that the given layout is valid
     * @param {unknown} transactions
     * @returns {Nimiq.Transaction[]}
     */
    parseStakingTransaction(transactions) {
        if (!transactions) {
            throw new Errors.InvalidRequestError('transaction is required');
        }

        if (!Array.isArray(transactions)) {
            transactions = [transactions];
        }

        if (/** @type {any[]} */ (transactions).length === 0) {
            throw new Errors.InvalidRequestError('transaction must not be empty');
        }

        const txs = /** @type {any[]} */ (transactions).map(transaction => {
            if (!(transaction instanceof Uint8Array)) {
                throw new Errors.InvalidRequestError('transaction must be a Uint8Array');
            }
            const tx = Nimiq.Transaction.fromAny(Nimiq.BufferUtils.toHex(transaction));

            if (tx.senderType !== Nimiq.AccountType.Staking && tx.recipientType !== Nimiq.AccountType.Staking) {
                throw new Errors.InvalidRequestError('transaction must be a staking transaction');
            }

            // Parsing the transaction does not validate any of it's fields.
            // TODO: Validate all fields like tx.verify() would?

            return tx;
        });

        return txs;
    }

    get Handler() {
        return SignStaking;
    }
}
