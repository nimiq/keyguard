/* global TopLevelApi */
/* global PolygonRequestParserMixin */
/* global SignPolygonTransaction */
/* global Errors */
/* global ethers */
/* global PolygonGasless */

class SignPolygonTransactionApi extends PolygonRequestParserMixin(TopLevelApi) { // eslint-disable-line no-unused-vars
    /**
     * @param {KeyguardRequest.SignPolygonTransactionRequest} request
     * @returns {Promise<Parsed<KeyguardRequest.SignPolygonGaslessTransferRequest>>}
     */
    async parseRequest(request) {
        if (!request) {
            throw new Errors.InvalidRequestError('request is required');
        }

        switch (request.operation) {
            case undefined:
            case 'transfer':
                return this.parseGaslessTransferRequest(request);
            default:
                throw new Errors.InvalidRequestError('Invalid operation');
        }
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
        if (request.corrects !== undefined) {
            parsedRequest.corrects = this.parseGaslessTransferRequestFields(request.corrects, 'corrects');
        }
        parsedRequest.request = SignPolygonTransactionApi.createTransferRequest(
            this.parseGaslessTransfer(request.request, 'request'),
            parsedRequest.corrects,
        );

        return parsedRequest;
    }

    /**
     * Validates the transfer against the pinned deployment, the fee limit and, for a new version of a payment, the
     * correction rules, and sets its deadline. Expects addresses with their checksum and canonical integer strings,
     * see parseGaslessTransfer.
     *
     * @param {KeyguardRequest.PolygonGaslessTransfer} transfer
     * @param {KeyguardRequest.PolygonGaslessTransferRequest} [corrects]
     * @returns {KeyguardRequest.PolygonGaslessTransferRequest}
     */
    static createTransferRequest(transfer, corrects) {
        // Fails early if gasless transfers are not configured
        PolygonGasless.contract();

        // Also validates the token
        PolygonGasless.stablecoin(transfer.token);
        PolygonGasless.checkFeeAndRelay(transfer.fee, transfer.relay, 'request');

        if (transfer.from === ethers.constants.AddressZero) {
            throw new Errors.InvalidRequestError('request.from must not be the zero address');
        }

        const amount = ethers.BigNumber.from(transfer.amount);
        if (amount.isZero()) {
            throw new Errors.InvalidRequestError('request.amount must not be zero');
        }
        if (amount.add(transfer.fee).gt(ethers.constants.MaxUint256)) {
            throw new Errors.InvalidRequestError('request.amount plus request.fee must fit into 256 bits');
        }

        if (PolygonGasless.isDeniedRecipient(transfer.to)) {
            throw new Errors.InvalidRequestError(
                'request.to must not be the zero address, a token or a Nimiq contract',
            );
        }

        // The intent nonce is the sender's `nonces(from)` for a new payment, which the Keyguard cannot read itself. All
        // versions of a payment keep their nonce, so that at most one of them executes.
        if (corrects && (
            corrects.from !== transfer.from
            || corrects.token !== transfer.token
            || corrects.to !== transfer.to
            || corrects.nonce !== transfer.nonce
        )) {
            throw new Errors.InvalidRequestError(
                'request must keep the from, token, to and nonce of the version it corrects',
            );
        }

        const now = PolygonGasless.now();
        // A new version of a payment must not expire before the version it corrects.
        const deadline = Math.max(
            now + PolygonGasless.DEFAULT_DEADLINE_SECONDS,
            corrects ? Number(corrects.deadline) : 0,
        );
        if (deadline > now + PolygonGasless.MAX_DEADLINE_SECONDS) {
            throw new Errors.InvalidRequestError('corrects.deadline is too far in the future');
        }

        return {
            token: transfer.token,
            from: transfer.from,
            to: transfer.to,
            amount: transfer.amount,
            fee: transfer.fee,
            relay: transfer.relay,
            nonce: transfer.nonce,
            deadline: deadline.toString(),
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
            amount: this.parseUint256String(amount, `${name}.amount`),
            fee: this.parseUint256String(fee, `${name}.fee`),
            relay: this.parseChecksummedPolygonAddress(relay, `${name}.relay`),
            nonce: this.parseUint256String(nonce, `${name}.nonce`),
        };
    }

    /**
     * @param {unknown} request
     * @param {string} name
     * @returns {KeyguardRequest.PolygonGaslessTransferRequest}
     */
    parseGaslessTransferRequestFields(request, name) {
        const transfer = this.parseGaslessTransfer(request, name);
        const { deadline } = /** @type {KeyguardRequest.PolygonGaslessTransferRequest} */ (request);
        return {
            ...transfer,
            deadline: this.parseUint256String(deadline, `${name}.deadline`),
        };
    }

    get Handler() {
        return SignPolygonTransaction;
    }
}
