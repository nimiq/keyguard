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
        [parsedRequest.request, parsedRequest.description] = this.parseOpenGsnForwardRequest(
            request,
            ['transfer', 'transferWithApproval', 'transferWithPermit', 'refund'],
        );
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
     * @param {Array<'transfer' | 'transferWithApproval' | 'transferWithPermit' | 'refund'>} allowedMethods
     * @returns {[
     *     KeyguardRequest.OpenGsnForwardRequest,
     *     PolygonTransferDescription
     *     | PolygonTransferWithApprovalDescription
     *     | PolygonTransferWithPermitDescription
     *     | PolygonRefundDescription,
     * ]}
     */
    parseOpenGsnForwardRequest(request, allowedMethods) {
        const forwardRequest = this.parseOpenGsnForwardRequestRoot(request.request);

        /**
         * @type {PolygonTransferDescription
         *        | PolygonTransferWithApprovalDescription
         *        | PolygonTransferWithPermitDescription
         *        | PolygonRefundDescription}
         */
        let description;

        if (forwardRequest.to === CONFIG.USDC_TRANSFER_CONTRACT_ADDRESS) {
            const usdcTransferContract = new ethers.Contract(
                CONFIG.USDC_TRANSFER_CONTRACT_ADDRESS,
                PolygonContractABIs.USDC_TRANSFER_CONTRACT_ABI,
            );

            /** @type {PolygonTransferDescription | PolygonTransferWithApprovalDescription} */
            description = (usdcTransferContract.interface.parseTransaction({
                data: forwardRequest.data,
                value: forwardRequest.value,
            }));

            if (description.args.token !== CONFIG.USDC_CONTRACT_ADDRESS) {
                throw new Errors.InvalidRequestError('Invalid USDC token contract in request data');
            }
        } else if (forwardRequest.to === CONFIG.NATIVE_USDC_TRANSFER_CONTRACT_ADDRESS) {
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
        } else if (forwardRequest.to === CONFIG.USDC_HTLC_CONTRACT_ADDRESS) {
            const usdcHtlcContract = new ethers.Contract(
                CONFIG.USDC_HTLC_CONTRACT_ADDRESS,
                PolygonContractABIs.USDC_HTLC_CONTRACT_ABI,
            );

            /** @type {PolygonRefundDescription} */
            description = (usdcHtlcContract.interface.parseTransaction({
                data: forwardRequest.data,
                value: forwardRequest.value,
            }));
        } else {
            throw new Errors.InvalidRequestError('request.to address is not allowed');
        }

        if (!allowedMethods.includes(description.name)) {
            throw new Errors.InvalidRequestError('Requested Polygon contract method is invalid');
        }

        // Check that amount exists when method is 'refund', and unset for other methods.
        if ((description.name === 'refund') !== !!request.amount) {
            throw new Errors.InvalidRequestError('`amount` is only allowed for contract method "refund"');
        }

        // Check that approval object exists when method is 'transferWithApproval', and unset for other methods.
        if ((description.name === 'transferWithApproval') !== !!request.approval) {
            throw new Errors.InvalidRequestError('`approval` object is only allowed for contract method '
                + '"transferWithApproval"');
        }

        // Check that permit object exists when method is 'transferWithPermit', and unset for other methods.
        if ((description.name === 'transferWithPermit') !== !!request.permit) {
            throw new Errors.InvalidRequestError('`permit` object is only allowed for contract method '
                + '"transferWithPermit"');
        }

        return [forwardRequest, description];
    }

    get Handler() {
        return SignPolygonTransaction;
    }
}
