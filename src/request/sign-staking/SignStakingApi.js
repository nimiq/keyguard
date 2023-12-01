/* global TopLevelApi */
/* global SignStaking */
/* global Errors */
/* global Nimiq */
/* global Albatross */

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

        parsedRequest.transaction = this.parseStakingTransaction(request.transaction);
        parsedRequest.plain = parsedRequest.transaction.toPlain();

        return parsedRequest;
    }

    /**
     * Checks that the given layout is valid
     * @param {unknown} transaction
     * @returns {Albatross.Transaction}
     */
    parseStakingTransaction(transaction) {
        if (!transaction) {
            throw new Errors.InvalidRequestError('transaction is required');
        }

        if (!(transaction instanceof Uint8Array)) {
            throw new Errors.InvalidRequestError('transaction must be a Uint8Array');
        }
        const tx = Albatross.Transaction.fromAny(Nimiq.BufferUtils.toHex(transaction));

        if (tx.senderType !== Albatross.AccountType.Staking && tx.recipientType !== Albatross.AccountType.Staking) {
            throw new Errors.InvalidRequestError('transaction must be a staking transaction');
        }

        // Parsing the transaction does not validate any of it's fields.
        // TODO: Validate all fields like tx.verify() would?

        return tx;
    }

    get Handler() {
        return SignStaking;
    }
}
