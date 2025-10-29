/* global ethers */
/* global TopLevelApi */
/* global PolygonRequestParserMixin */
/* global SignPolygonTransaction */
/* global PolygonContractABIs */
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
        [parsedRequest.request, parsedRequest.description] = this.parseOpenGsnForwardRequest(request);
        parsedRequest.relayData = this.parseOpenGsnRelayData(request.relayData);
        parsedRequest.layout = this.parseLayout(request.layout);
        parsedRequest.senderLabel = this.parseLabel(request.senderLabel); // Used for HTLC refunds and cashlink
        if ((!request.layout || request.layout === SignPolygonTransactionApi.Layouts.STANDARD)
            && parsedRequest.layout === SignPolygonTransactionApi.Layouts.STANDARD) {
            parsedRequest.recipientLabel = this.parseLabel(request.recipientLabel);
        } else if (request.layout === SignPolygonTransactionApi.Layouts.USDT_CASHLINK
            && parsedRequest.layout === SignPolygonTransactionApi.Layouts.USDT_CASHLINK) {
            if (request.cashlinkMessage) {
                parsedRequest.cashlinkMessage = /** @type {string} */ (this.parseMessage(request.cashlinkMessage));
            }
            // Validate that this is a USDT cashlink transaction
            if (parsedRequest.request.to !== CONFIG.BRIDGED_USDT_CASHLINK_CONTRACT_ADDRESS) {
                throw new Errors.InvalidRequestError(
                    'USDT cashlink must use BRIDGED_USDT_CASHLINK_CONTRACT_ADDRESS contract',
                );
            }
        }
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
     *     PolygonTransferDescription
     *     | PolygonTransferWithPermitDescription
     *     | PolygonTransferWithApprovalDescription
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
         * @type {PolygonTransferDescription
         *        | PolygonTransferWithPermitDescription
         *        | PolygonTransferWithApprovalDescription
         *        | PolygonRedeemDescription
         *        | PolygonRedeemWithSecretInDataDescription
         *        | PolygonRefundDescription
         *        | PolygonSwapDescription
         *        | PolygonSwapWithApprovalDescription}
         */
        let description;

        if (forwardRequest.to === CONFIG.NATIVE_USDC_TRANSFER_CONTRACT_ADDRESS) {
            const transferContract = new ethers.Contract(
                CONFIG.NATIVE_USDC_TRANSFER_CONTRACT_ADDRESS,
                PolygonContractABIs.NATIVE_USDC_TRANSFER_CONTRACT_ABI,
            );

            description = /** @type {PolygonTransferDescription | PolygonTransferWithPermitDescription} */ (
                transferContract.interface.parseTransaction({
                    data: forwardRequest.data,
                    value: forwardRequest.value,
                })
            );

            if (description.args.token !== CONFIG.NATIVE_USDC_CONTRACT_ADDRESS) {
                throw new Errors.InvalidRequestError('Invalid native USDC token contract in request data');
            }

            if (!['transfer', 'transferWithPermit'].includes(description.name)) {
                throw new Errors.InvalidRequestError('Requested Polygon contract method is invalid');
            }
        } else if (
            forwardRequest.to === CONFIG.BRIDGED_USDT_TRANSFER_CONTRACT_ADDRESS
            || forwardRequest.to === CONFIG.BRIDGED_USDT_CASHLINK_CONTRACT_ADDRESS
        ) {
            const transferContract = new ethers.Contract(
                forwardRequest.to,
                PolygonContractABIs.BRIDGED_USDT_TRANSFER_CONTRACT_ABI,
            );

            description = /** @type {PolygonTransferDescription | PolygonTransferWithApprovalDescription} */ (
                transferContract.interface.parseTransaction({
                    data: forwardRequest.data,
                    value: forwardRequest.value,
                })
            );

            if (description.args.token !== CONFIG.BRIDGED_USDT_CONTRACT_ADDRESS) {
                throw new Errors.InvalidRequestError('Invalid bridged USDT token contract in request data');
            }

            if (!['transfer', 'transferWithApproval'].includes(description.name)) {
                throw new Errors.InvalidRequestError('Requested Polygon contract method is invalid');
            }
        } else if (forwardRequest.to === CONFIG.NATIVE_USDC_HTLC_CONTRACT_ADDRESS) {
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

        // Check that permit object exists when method is 'transferWithPermit', and unset for other methods.
        if ((description.name === 'transferWithPermit') !== !!request.permit) {
            throw new Errors.InvalidRequestError('`permit` object is only allowed for contract method '
                + '"transferWithPermit"');
        }

        // Check that approval object exists when method is 'transferWithApproval' or 'swapWithApproval', and unset for
        // other methods.
        if ((
            description.name === 'transferWithApproval'
            || description.name === 'swapWithApproval'
        ) !== !!request.approval) {
            throw new Errors.InvalidRequestError('`approval` object is only allowed for contract methods '
                + '"transferWithApproval" and "swapWithApproval"');
        }

        return [forwardRequest, description];
    }

    /**
     * Checks that the given layout is valid
     * @param {unknown} layout
     * @returns {KeyguardRequest.SignPolygonTransactionRequestLayout}
     */
    parseLayout(layout) {
        if (!layout) {
            return SignPolygonTransactionApi.Layouts.STANDARD;
        }
        if (!Object.values(SignPolygonTransactionApi.Layouts).includes(/** @type {any} */ (layout))) {
            throw new Errors.InvalidRequestError('Invalid selected layout');
        }
        return /** @type KeyguardRequest.SignPolygonTransactionRequestLayout */ (layout);
    }

    get Handler() {
        return SignPolygonTransaction;
    }
}

/**
 * @enum {KeyguardRequest.SignPolygonTransactionRequestLayout}
 */
SignPolygonTransactionApi.Layouts = Object.freeze({
    STANDARD: /** @type {'standard'} */ ('standard'),
    USDT_CASHLINK: /** @type {'usdt-cashlink'} */ ('usdt-cashlink'),
});
