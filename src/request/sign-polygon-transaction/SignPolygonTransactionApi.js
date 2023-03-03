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
        parsedRequest.description = this.parseOpenGsnForwardRequest(
            request,
            ['transfer', 'transferWithApproval', 'refund'],
        );
        parsedRequest.request = request.request;
        parsedRequest.relayData = this.parseOpenGsnRelayData(request);
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

        return parsedRequest;
    }

    /**
     *
     * @param {KeyguardRequest.PolygonTransactionInfo} request
     * @param {string[]} allowedMethods
     * @returns {PolygonTransferDescription | PolygonTransferWithApprovalDescription | PolygonRefundDescription}
     */
    parseOpenGsnForwardRequest(request, allowedMethods) {
        /** @type {PolygonTransferDescription | PolygonTransferWithApprovalDescription | PolygonRefundDescription} */
        let description;

        try {
            const usdcTransferContract = new ethers.Contract(
                CONFIG.USDC_TRANSFER_CONTRACT_ADDRESS,
                PolygonContractABIs.USDC_TRANSFER_CONTRACT_ABI,
            );

            /** @type {PolygonTransferDescription | PolygonTransferWithApprovalDescription} */
            description = (usdcTransferContract.interface.parseTransaction({
                data: request.request.data,
                value: request.request.value,
            }));
        } catch (error) {
            const usdcHtlcContract = new ethers.Contract(
                CONFIG.USDC_HTLC_CONTRACT_ADDRESS,
                PolygonContractABIs.USDC_HTLC_CONTRACT_ABI,
            );

            /** @type {PolygonRefundDescription} */
            description = (usdcHtlcContract.interface.parseTransaction({
                data: request.request.data,
                value: request.request.value,
            }));
        }

        if (!allowedMethods.includes(description.name)) {
            throw new Errors.InvalidRequestError('Requested Polygon contract method is invalid');
        }

        if (description.name === 'transfer' || description.name === 'transferWithApproval') {
            if (description.args.token !== CONFIG.USDC_CONTRACT_ADDRESS) {
                throw new Errors.InvalidRequestError('Invalid USDC token contract in request data');
            }
        }

        // Check that amount exists when method is 'refund'
        if (description.name === 'refund') {
            if (!request.amount) {
                throw new Errors.InvalidRequestError('`amount` required for refund method');
            }
        }

        // Check that approval object exists when method is 'transferWithApproval'
        if (description.name === 'transferWithApproval') {
            if (!request.approval) {
                throw new Errors.InvalidRequestError('`approval` object required for transferWithApproval method');
            }
        }

        return description;
    }

    get Handler() {
        return SignPolygonTransaction;
    }
}
