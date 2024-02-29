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
        parsedRequest.senderLabel = this.parseLabel(request.senderLabel); // Used for HTLC refunds
        parsedRequest.recipientLabel = this.parseLabel(request.recipientLabel);
        if (request.amount !== undefined) {
            parsedRequest.amount = this.parsePositiveInteger(request.amount, false, 'amount');
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

    // eslint-disable-next-line valid-jsdoc
    /**
     *
     * @param {KeyguardRequest.PolygonTransactionInfo} request
     * @returns {[
     *     KeyguardRequest.OpenGsnForwardRequest,
     *     PolygonTransferDescription
     *     | PolygonTransferWithPermitDescription
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
         *        | PolygonRefundDescription
         *        | PolygonSwapDescription
         *        | PolygonSwapWithApprovalDescription}
         */
        let description;

        if (forwardRequest.to === CONFIG.NATIVE_USDC_TRANSFER_CONTRACT_ADDRESS) {
            const nativeUsdcTransferContract = new ethers.Contract(
                CONFIG.NATIVE_USDC_TRANSFER_CONTRACT_ADDRESS,
                PolygonContractABIs.NATIVE_USDC_TRANSFER_CONTRACT_ABI,
            );

            /** @type {PolygonTransferDescription | PolygonTransferWithPermitDescription} */
            description = (nativeUsdcTransferContract.interface.parseTransaction({
                data: forwardRequest.data,
                value: forwardRequest.value,
            }));

            if (description.args.token !== CONFIG.NATIVE_USDC_CONTRACT_ADDRESS) {
                throw new Errors.InvalidRequestError('Invalid native USDC token contract in request data');
            }

            if (!['transfer', 'transferWithPermit'].includes(description.name)) {
                throw new Errors.InvalidRequestError('Requested Polygon contract method is invalid');
            }
        } else if (forwardRequest.to === CONFIG.NATIVE_USDC_HTLC_CONTRACT_ADDRESS) {
            const usdcHtlcContract = new ethers.Contract(
                CONFIG.NATIVE_USDC_HTLC_CONTRACT_ADDRESS,
                PolygonContractABIs.NATIVE_USDC_HTLC_CONTRACT_ABI,
            );

            /** @type {PolygonRefundDescription} */
            description = (usdcHtlcContract.interface.parseTransaction({
                data: forwardRequest.data,
                value: forwardRequest.value,
            }));

            if (!['refund'].includes(description.name)) {
                throw new Errors.InvalidRequestError('Requested Polygon contract method is invalid');
            }
        } else if (forwardRequest.to === CONFIG.BRIDGED_USDC_HTLC_CONTRACT_ADDRESS) {
            const usdcHtlcContract = new ethers.Contract(
                CONFIG.BRIDGED_USDC_HTLC_CONTRACT_ADDRESS,
                PolygonContractABIs.BRIDGED_USDC_HTLC_CONTRACT_ABI,
            );

            /** @type {PolygonRefundDescription} */
            description = (usdcHtlcContract.interface.parseTransaction({
                data: forwardRequest.data,
                value: forwardRequest.value,
            }));

            if (!['refund'].includes(description.name)) {
                throw new Errors.InvalidRequestError('Requested Polygon contract method is invalid');
            }
        } else if (forwardRequest.to === CONFIG.USDC_SWAP_CONTRACT_ADDRESS) {
            const usdcTransferContract = new ethers.Contract(
                CONFIG.USDC_SWAP_CONTRACT_ADDRESS,
                PolygonContractABIs.SWAP_CONTRACT_ABI,
            );

            /** @type {PolygonSwapDescription | PolygonSwapWithApprovalDescription} */
            description = (usdcTransferContract.interface.parseTransaction({
                data: forwardRequest.data,
                value: forwardRequest.value,
            }));

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

        // Check that permit object exists when method is 'transferWithPermit', and unset for other methods.
        if ((description.name === 'transferWithPermit') !== !!request.permit) {
            throw new Errors.InvalidRequestError('`permit` object is only allowed for contract method '
                + '"transferWithPermit"');
        }

        // Check that amount exists when method is 'refund', and unset for other methods.
        if ((description.name === 'refund') !== !!request.amount) {
            throw new Errors.InvalidRequestError('`amount` is only allowed for contract method "refund"');
        }

        // Check that approval object exists when method is 'swapWithApproval', and unset for other methods.
        if ((description.name === 'swapWithApproval') !== !!request.approval) {
            throw new Errors.InvalidRequestError('`approval` object is only allowed for contract method '
                + '"swapWithApproval"');
        }

        return [forwardRequest, description];
    }

    get Handler() {
        return SignPolygonTransaction;
    }
}
