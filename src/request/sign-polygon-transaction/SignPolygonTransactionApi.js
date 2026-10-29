/* global TopLevelApi */
/* global PolygonRequestParserMixin */
/* global SignPolygonTransaction */
/* global Errors */
/* global CONFIG */
/* global PolygonGasless */
/* global PolygonGaslessHtlc */
/* global NimiqGaslessCore */

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
        parsedRequest.token = this.parsePolygonAddress(request.token, 'token');
        // Only for display: the HTLC pays out its amount minus the fee, whatever is shown here.
        parsedRequest.amount = this.parseNonNegativeIntegerString(request.amount, 'amount');

        // Also validates the token
        PolygonGasless.stablecoin(parsedRequest.token);

        const settlement = request.request;
        if (typeof settlement !== 'object' || settlement === null) {
            throw new Errors.InvalidRequestError('request must be an object');
        }
        parsedRequest.request = {
            from: this.parsePolygonAddress(settlement.from, 'request.from'),
            id: this.parseBytes32(settlement.id, 'request.id'),
            target: this.parsePolygonAddress(settlement.target, 'request.target'),
            fee: this.parseNonNegativeIntegerString(settlement.fee, 'request.fee'),
            relay: this.parsePolygonAddress(settlement.relay, 'request.relay'),
        };
        if (parsedRequest.request.target !== parsedRequest.request.from) {
            throw new Errors.InvalidRequestError('request.target must be request.from');
        }
        PolygonGaslessHtlc.checkFeeAndRelay(parsedRequest.request.fee, parsedRequest.request.relay, 'request');
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
        parsedRequest.tokenNonce = this.parsePositiveInteger(request.tokenNonce, true, 'tokenNonce');
        if (request.corrects !== undefined) {
            parsedRequest.corrects = this.parseGaslessTransferRequestFields(request.corrects, 'corrects');
        }
        parsedRequest.intent = SignPolygonTransactionApi.createIntent(
            this.parseGaslessTransfer(request.request, 'request'),
            parsedRequest.tokenNonce,
            parsedRequest.corrects,
        );

        return parsedRequest;
    }

    /**
     * Builds and validates the transfer intent against the pins, the fee limit and, for a new version of a payment,
     * the correction rules. The typed data to sign is built from the intent, never taken from the caller.
     *
     * @param {KeyguardRequest.PolygonGaslessTransfer} transfer
     * @param {number} tokenNonce
     * @param {GaslessTransferRequest} [corrects]
     * @returns {GaslessTransferIntent}
     */
    static createIntent(transfer, tokenNonce, corrects) {
        const now = PolygonGasless.now();
        // A new version of a payment must not expire before the version it corrects.
        const deadline = Math.max(
            now + NimiqGaslessCore.DEFAULT_DEADLINE_SECONDS,
            corrects ? Number(corrects.deadline) : 0,
        );
        try {
            return NimiqGaslessCore.createTransferIntent(PolygonGasless.pins(), {
                // The intent nonce is the sender's `nonces(from)` for a new payment, which the Keyguard cannot read
                // itself. A correction must keep the nonce of the version it corrects, which the SDK checks.
                ...transfer,
                // Always a permit, which expires with the intent. USDT0's META_TX approval never expires.
                authMode: 'permit',
                deadline,
                tokenNonce,
                corrects,
            }, now, {
                maxAcceptableFee: CONFIG.POLYGON_GASLESS_MAX_ACCEPTABLE_FEE,
            });
        } catch (error) {
            if (error instanceof NimiqGaslessCore.GaslessValidationError) {
                throw new Errors.InvalidRequestError(`${error.field}: ${error.message} (${error.code})`);
            }
            throw error;
        }
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
            token: this.parsePolygonAddress(token, `${name}.token`),
            from: this.parsePolygonAddress(from, `${name}.from`),
            to: this.parsePolygonAddress(to, `${name}.to`),
            amount: this.parseNonNegativeIntegerString(amount, `${name}.amount`),
            fee: this.parseNonNegativeIntegerString(fee, `${name}.fee`),
            relay: this.parsePolygonAddress(relay, `${name}.relay`),
            nonce: this.parseNonNegativeIntegerString(nonce, `${name}.nonce`),
        };
    }

    /**
     * @param {unknown} request
     * @param {string} name
     * @returns {GaslessTransferRequest}
     */
    parseGaslessTransferRequestFields(request, name) {
        const transfer = this.parseGaslessTransfer(request, name);
        const { deadline } = /** @type {KeyguardRequest.PolygonGaslessTransferRequest} */ (request);
        try {
            return NimiqGaslessCore.normalizeTransferRequest({
                ...transfer,
                deadline: this.parseNonNegativeIntegerString(deadline, `${name}.deadline`),
            });
        } catch (error) {
            if (error instanceof NimiqGaslessCore.GaslessValidationError) {
                throw new Errors.InvalidRequestError(`${name}: ${error.message}`);
            }
            throw error;
        }
    }

    get Handler() {
        return SignPolygonTransaction;
    }
}
