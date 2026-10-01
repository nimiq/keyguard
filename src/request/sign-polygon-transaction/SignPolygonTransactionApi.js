/* global ethers */
/* global TopLevelApi */
/* global PolygonRequestParserMixin */
/* global SignPolygonTransaction */
/* global PolygonContractABIs */
/* global Errors */
/* global CONFIG */
/* global PolygonGasless */
/* global NimiqGaslessCore */

class SignPolygonTransactionApi extends PolygonRequestParserMixin(TopLevelApi) { // eslint-disable-line no-unused-vars
    /**
     * @param {KeyguardRequest.SignPolygonTransactionRequest
     *     | KeyguardRequest.SignPolygonGaslessTransferRequest} request
     * @returns {Promise<Parsed<KeyguardRequest.SignPolygonTransactionRequest>
     *     | Parsed<KeyguardRequest.SignPolygonGaslessTransferRequest>>}
     */
    async parseRequest(request) {
        if (!request) {
            throw new Errors.InvalidRequestError('request is required');
        }

        if (!('relayData' in request)) {
            return this.parseGaslessTransferRequest(request);
        }

        /** @type {Parsed<KeyguardRequest.SignPolygonTransactionRequest>} */
        const parsedRequest = {};
        parsedRequest.appName = this.parseAppName(request.appName);
        parsedRequest.keyInfo = await this.parseKeyId(request.keyId);
        parsedRequest.keyLabel = /** @type {string} */ (this.parseLabel(request.keyLabel, false, 'keyLabel'));
        parsedRequest.keyPath = this.parsePolygonPath(request.keyPath, 'keyPath');
        [parsedRequest.request, parsedRequest.description] = this.parseOpenGsnForwardRequest(request);
        parsedRequest.relayData = this.parseOpenGsnRelayData(request.relayData);
        parsedRequest.senderLabel = this.parseLabel(request.senderLabel); // Used for HTLC refunds
        parsedRequest.recipientLabel = this.parseLabel(request.recipientLabel);
        if (request.amount !== undefined) {
            parsedRequest.amount = this.parsePositiveInteger(request.amount, false, 'amount');
        }
        if (request.token !== undefined) {
            parsedRequest.token = this.parsePolygonAddress(request.token, 'token');
        }
        if (request.approval !== undefined) {
            parsedRequest.approval = {
                tokenNonce: this.parsePositiveInteger(
                    request.approval.tokenNonce,
                    true,
                    'approval.tokenNonce',
                ),
            };
        }
        if (request.permit !== undefined) {
            parsedRequest.permit = {
                tokenNonce: this.parsePositiveInteger(
                    request.permit.tokenNonce,
                    true,
                    'permit.tokenNonce',
                ),
            };
        }

        return parsedRequest;
    }

    /**
     *
     * @param {KeyguardRequest.PolygonTransactionInfo} request
     * @returns {[
     *     KeyguardRequest.OpenGsnForwardRequest,
     *     | PolygonRedeemDescription
     *     | PolygonRedeemWithSecretInDataDescription
     *     | PolygonRefundDescription
     *     | PolygonSwapDescription
     *     | PolygonSwapWithApprovalDescription,
     * ]}
     */
    parseOpenGsnForwardRequest(request) {
        const forwardRequest = this.parseOpenGsnForwardRequestRoot(request.request);

        /**
         * @type {PolygonRedeemDescription
         *        | PolygonRedeemWithSecretInDataDescription
         *        | PolygonRefundDescription
         *        | PolygonSwapDescription
         *        | PolygonSwapWithApprovalDescription}
         */
        let description;

        // Plain transfers are gasless transfers, see parseGaslessTransferRequest.
        if (forwardRequest.to === CONFIG.NATIVE_USDC_HTLC_CONTRACT_ADDRESS) {
            const htlcContract = new ethers.Contract(
                CONFIG.NATIVE_USDC_HTLC_CONTRACT_ADDRESS,
                PolygonContractABIs.NATIVE_USDC_HTLC_CONTRACT_ABI,
            );

            // eslint-disable-next-line max-len
            description = /** @type {PolygonRedeemDescription | PolygonRedeemWithSecretInDataDescription | PolygonRefundDescription} */ (
                htlcContract.interface.parseTransaction({
                    data: forwardRequest.data,
                    value: forwardRequest.value,
                })
            );

            if (!['redeem', 'redeemWithSecretInData', 'refund'].includes(description.name)) {
                throw new Errors.InvalidRequestError('Requested Polygon contract method is invalid');
            }
        } else if (forwardRequest.to === CONFIG.BRIDGED_USDT_HTLC_CONTRACT_ADDRESS) {
            // The HTLC contract for bridged USDT is the same as for bridged USDC (legacy).

            if (!request.token) {
                throw new Errors.InvalidRequestError('`token` is required for calling the bridged HTLC contract');
            }

            // Since users can refund a bridged USDC swap even years later, we need to still
            // support this legacy contract.
            if (request.token === CONFIG.BRIDGED_USDC_CONTRACT_ADDRESS) {
                const htlcContract = new ethers.Contract(
                    CONFIG.BRIDGED_USDC_HTLC_CONTRACT_ADDRESS,
                    PolygonContractABIs.BRIDGED_USDC_HTLC_CONTRACT_ABI,
                );

                description = /** @type {PolygonRefundDescription} */ (
                    htlcContract.interface.parseTransaction({
                        data: forwardRequest.data,
                        value: forwardRequest.value,
                    })
                );

                if (!['refund'].includes(description.name)) {
                    throw new Errors.InvalidRequestError('Requested Polygon contract method is invalid');
                }
            } else if (request.token === CONFIG.BRIDGED_USDT_CONTRACT_ADDRESS) {
                const htlcContract = new ethers.Contract(
                    CONFIG.BRIDGED_USDT_HTLC_CONTRACT_ADDRESS,
                    PolygonContractABIs.BRIDGED_USDT_HTLC_CONTRACT_ABI,
                );

                // eslint-disable-next-line max-len
                description = /** @type {PolygonRedeemDescription | PolygonRedeemWithSecretInDataDescription | PolygonRefundDescription} */ (
                    htlcContract.interface.parseTransaction({
                        data: forwardRequest.data,
                        value: forwardRequest.value,
                    })
                );

                if (!['redeem', 'redeemWithSecretInData', 'refund'].includes(description.name)) {
                    throw new Errors.InvalidRequestError('Requested Polygon contract method is invalid');
                }
            } else {
                throw new Errors.InvalidRequestError('Invalid `token`');
            }
        } else if (forwardRequest.to === CONFIG.USDC_SWAP_CONTRACT_ADDRESS) {
            const transferContract = new ethers.Contract(
                CONFIG.USDC_SWAP_CONTRACT_ADDRESS,
                PolygonContractABIs.SWAP_CONTRACT_ABI,
            );

            description = /** @type {PolygonSwapDescription | PolygonSwapWithApprovalDescription} */(
                transferContract.interface.parseTransaction({
                    data: forwardRequest.data,
                    value: forwardRequest.value,
                })
            );

            if (description.args.token !== CONFIG.BRIDGED_USDC_CONTRACT_ADDRESS) {
                throw new Errors.InvalidRequestError('Invalid USDC token contract in request data');
            }

            if (!['swap', 'swapWithApproval'].includes(description.name)) {
                throw new Errors.InvalidRequestError('Requested Polygon contract method is invalid');
            }

            // Ensure swap `targetAmount` is not too low
            const inputAmount = /** @type {PolygonSwapDescription | PolygonSwapWithApprovalDescription} */ (description)
                .args
                .amount;
            const targetAmount = /** @type {PolygonSwapDescription | PolygonSwapWithApprovalDescription} */ (description) // eslint-disable-line max-len
                .args
                .targetAmount;
            // Allow 1% slippage for swaps on Polygon mainnet, but up to 5% for testnet
            const maxTargetAmountSlippage = CONFIG.POLYGON_CHAIN_ID === 137 ? 1 : 5;
            const minTargetAmount = inputAmount.mul(100 - maxTargetAmountSlippage).div(100);
            if (targetAmount.lt(minTargetAmount)) {
                throw new Errors.InvalidRequestError(
                    'Requested USDC swap `targetAmount` is too low',
                );
            }
        } else {
            throw new Errors.InvalidRequestError('request.to address is not allowed');
        }

        // Check that amount exists when request is for refund or redeem, and unset for other methods.
        if (['redeem', 'redeemWithSecretInData', 'refund'].includes(description.name) !== !!request.amount) {
            throw new Errors.InvalidRequestError(
                '`amount` is only allowed for contract methods "refund", "redeem" and "redeemWithSecretInData"',
            );
        }

        // Permits are only used by gasless transfers
        if (request.permit) {
            throw new Errors.InvalidRequestError('`permit` object is not allowed');
        }

        // Check that approval object exists when method is 'swapWithApproval', and unset for other methods.
        if ((description.name === 'swapWithApproval') !== !!request.approval) {
            throw new Errors.InvalidRequestError('`approval` object is only allowed for contract method '
                + '"swapWithApproval"');
        }

        return [forwardRequest, description];
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
    parseGaslessTransferRequestFields(request, name) {
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
