/* global TopLevelApi */
/* global PolygonRequestParserMixin */
/* global PolygonGasless */
/* global NimiqGaslessCore */
/* global SignPolygonTransaction */
/* global Errors */
/* global CONFIG */

class SignPolygonTransactionApi extends PolygonRequestParserMixin(TopLevelApi) { // eslint-disable-line no-unused-vars
    /**
     * @param {KeyguardRequest.SignPolygonTransactionRequest} request
     * @returns {Promise<Parsed<KeyguardRequest.SignPolygonTransactionRequest>>}
     */
    async parseRequest(request) {
        if (!request) {
            throw new Errors.InvalidRequestError('request is required');
        }

        /** @type {Parsed<KeyguardRequest.SignPolygonTransactionRequest>} */
        const parsedRequest = {};
        parsedRequest.appName = this.parseAppName(request.appName);
        parsedRequest.keyInfo = await this.parseKeyId(request.keyId);
        parsedRequest.keyLabel = /** @type {string} */ (this.parseLabel(request.keyLabel, false, 'keyLabel'));
        parsedRequest.keyPath = this.parsePolygonPath(request.keyPath, 'keyPath');
        parsedRequest.recipientLabel = this.parseLabel(request.recipientLabel);
        parsedRequest.tokenNonce = this.parsePositiveInteger(request.tokenNonce, true, 'tokenNonce');
        if (request.corrects !== undefined) {
            parsedRequest.corrects = this.parseGaslessTransferRequest(request.corrects, 'corrects');
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
     * @param {string} [nonce] - The intent nonce of an intent built before, to rebuild it with a new deadline.
     * @returns {GaslessTransferIntent}
     */
    static createIntent(transfer, tokenNonce, corrects, nonce) {
        const now = PolygonGasless.now();
        // A new version of a payment must not expire before the version it corrects.
        const deadline = Math.max(
            now + NimiqGaslessCore.DEFAULT_DEADLINE_SECONDS,
            corrects ? Number(corrects.deadline) : 0,
        );
        try {
            return NimiqGaslessCore.createTransferIntent(PolygonGasless.pins(), {
                ...transfer,
                // Always a permit, which expires with the intent. USDT0's META_TX approval never expires.
                authMode: 'permit',
                deadline,
                tokenNonce,
                // Without `corrects` and `nonce`, the SDK draws a fresh random nonce: a new payment.
                nonce,
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
        } = /** @type {KeyguardRequest.PolygonGaslessTransfer} */ (transfer);
        return {
            token: this.parsePolygonAddress(token, `${name}.token`),
            from: this.parsePolygonAddress(from, `${name}.from`),
            to: this.parsePolygonAddress(to, `${name}.to`),
            amount: this.parseNonNegativeIntegerString(amount, `${name}.amount`),
            fee: this.parseNonNegativeIntegerString(fee, `${name}.fee`),
            relay: this.parsePolygonAddress(relay, `${name}.relay`),
        };
    }

    /**
     * @param {unknown} request
     * @param {string} name
     * @returns {GaslessTransferRequest}
     */
    parseGaslessTransferRequest(request, name) {
        const transfer = this.parseGaslessTransfer(request, name);
        const { nonce, deadline } = /** @type {KeyguardRequest.PolygonGaslessTransferRequest} */ (request);
        try {
            return NimiqGaslessCore.normalizeTransferRequest({
                ...transfer,
                nonce,
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
