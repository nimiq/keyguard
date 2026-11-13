/* global TopLevelApi */
/* global PolygonRequestParserMixin */
/* global SignPolygonTransaction */
/* global Errors */
/* global ethers */
/* global PolygonGasless */
/* global PolygonGaslessHtlc */

class SignPolygonTransactionApi extends PolygonRequestParserMixin(TopLevelApi) { // eslint-disable-line no-unused-vars
    /**
     * @param {KeyguardRequest.SignPolygonTransactionRequest} request
     * @returns {Promise<Parsed<KeyguardRequest.SignPolygonGaslessTransferRequest>
     *     | Parsed<KeyguardRequest.SignPolygonHtlcSettlementRequest>>}
     */
    async parseRequest(request) {
        if (!request) {
            throw new Errors.InvalidRequestError('request is required');
        }

        switch (request.operation) {
            case undefined:
            case 'transfer':
                return this.parseGaslessTransferRequest(request);
            case 'redeem':
            case 'refund':
                return this.parseHtlcSettlementRequest(request);
            default:
                throw new Errors.InvalidRequestError('Invalid operation');
        }
    }

    /**
     * @param {KeyguardRequest.SignPolygonHtlcSettlementRequest} request
     * @returns {Promise<Parsed<KeyguardRequest.SignPolygonHtlcSettlementRequest>>}
     */
    async parseHtlcSettlementRequest(request) {
        /** @type {Parsed<KeyguardRequest.SignPolygonHtlcSettlementRequest>} */
        const parsedRequest = {};
        parsedRequest.appName = this.parseAppName(request.appName);
        parsedRequest.keyInfo = await this.parseKeyId(request.keyId);
        parsedRequest.keyLabel = /** @type {string} */ (this.parseLabel(request.keyLabel, false, 'keyLabel'));
        parsedRequest.keyPath = this.parsePolygonPath(request.keyPath, 'keyPath');
        parsedRequest.operation = request.operation;
        parsedRequest.senderLabel = this.parseLabel(request.senderLabel);
        parsedRequest.token = this.parseChecksummedPolygonAddress(request.token, 'token');
        // Only for display: the HTLC pays out its amount minus the fee, whatever is shown here.
        parsedRequest.amount = this.parseSafeIntegerString(request.amount, 'amount');

        // Also validates the token
        PolygonGasless.stablecoin(parsedRequest.token);

        const settlement = request.request;
        if (typeof settlement !== 'object' || settlement === null) {
            throw new Errors.InvalidRequestError('request must be an object');
        }
        parsedRequest.request = {
            from: this.parseChecksummedPolygonAddress(settlement.from, 'request.from'),
            id: this.parseBytes32(settlement.id, 'request.id'),
            target: this.parseChecksummedPolygonAddress(settlement.target, 'request.target'),
            fee: this.parseSafeIntegerString(settlement.fee, 'request.fee'),
            relay: this.parseChecksummedPolygonAddress(settlement.relay, 'request.relay'),
        };
        if (parsedRequest.request.target !== parsedRequest.request.from) {
            throw new Errors.InvalidRequestError('request.target must be request.from');
        }
        PolygonGasless.checkFeeAndRelay(parsedRequest.request.fee, parsedRequest.request.relay, 'request');
        // Fails early if HTLCs are not configured
        PolygonGaslessHtlc.contract();

        return parsedRequest;
    }

    /**
     * @param {KeyguardRequest.SignPolygonGaslessTransferRequest} request
     * @returns {Promise<Parsed<KeyguardRequest.SignPolygonGaslessTransferRequest>>}
     */
    async parseGaslessTransferRequest(request) {
        /** @type {Parsed<KeyguardRequest.SignPolygonGaslessTransferRequest>} */
        const parsedRequest = {};
        parsedRequest.appName = this.parseAppName(request.appName);
        parsedRequest.keyInfo = await this.parseKeyId(request.keyId);
        parsedRequest.keyLabel = /** @type {string} */ (this.parseLabel(request.keyLabel, false, 'keyLabel'));
        parsedRequest.keyPath = this.parsePolygonPath(request.keyPath, 'keyPath');
        parsedRequest.recipientLabel = this.parseLabel(request.recipientLabel);
        parsedRequest.tokenNonce = this.parseTokenNonce(request.tokenNonce, 'tokenNonce');
        parsedRequest.request = SignPolygonTransactionApi.createTransferRequest(
            this.parseGaslessTransfer(request.request, 'request'),
        );

        return parsedRequest;
    }

    /**
     * Validates the transfer against the pinned deployment and the fee limit, and sets its deadline. Expects addresses
     * with their checksum and canonical integer strings, see parseGaslessTransfer.
     *
     * @param {KeyguardRequest.PolygonGaslessTransfer} transfer
     * @returns {KeyguardRequest.PolygonGaslessTransferRequest}
     */
    static createTransferRequest(transfer) {
        // Fails early if gasless transfers are not configured
        PolygonGasless.contract();

        // Also validates the token
        PolygonGasless.stablecoin(transfer.token);
        PolygonGasless.checkFeeAndRelay(transfer.fee, transfer.relay, 'request');

        if (transfer.from === ethers.constants.AddressZero) {
            throw new Errors.InvalidRequestError('request.from must not be the zero address');
        }

        if (ethers.BigNumber.from(transfer.amount).isZero()) {
            throw new Errors.InvalidRequestError('request.amount must not be zero');
        }

        if (PolygonGasless.isDeniedRecipient(transfer.to)) {
            throw new Errors.InvalidRequestError(
                'request.to must not be the zero address, a token or a Nimiq contract',
            );
        }

        // The intent nonce is the sender's `nonces(from)` for a new payment, which the Keyguard cannot read itself. All
        // versions of a payment keep their nonce, so that at most one of them executes.
        return {
            token: transfer.token,
            from: transfer.from,
            to: transfer.to,
            amount: transfer.amount,
            fee: transfer.fee,
            relay: transfer.relay,
            nonce: transfer.nonce,
            deadline: (PolygonGasless.now() + PolygonGasless.DEADLINE_SECONDS).toString(),
        };
    }

    /**
     * @param {unknown} transfer
     * @param {string} name
     * @returns {KeyguardRequest.PolygonGaslessTransfer}
     */
    parseGaslessTransfer(transfer, name) {
        if (typeof transfer !== 'object' || transfer === null) {
            throw new Errors.InvalidRequestError(`${name} must be an object`);
        }
        const {
            token,
            from,
            to,
            amount,
            fee,
            relay,
            nonce,
        } = /** @type {KeyguardRequest.PolygonGaslessTransfer} */ (transfer);
        return {
            token: this.parseChecksummedPolygonAddress(token, `${name}.token`),
            from: this.parseChecksummedPolygonAddress(from, `${name}.from`),
            to: this.parseChecksummedPolygonAddress(to, `${name}.to`),
            amount: this.parseSafeIntegerString(amount, `${name}.amount`),
            fee: this.parseSafeIntegerString(fee, `${name}.fee`),
            relay: this.parseChecksummedPolygonAddress(relay, `${name}.relay`),
            nonce: this.parseUint256String(nonce, `${name}.nonce`),
        };
    }

    get Handler() {
        return SignPolygonTransaction;
    }
}
