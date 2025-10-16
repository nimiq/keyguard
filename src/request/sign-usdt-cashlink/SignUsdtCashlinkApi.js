/* global ethers */
/* global TopLevelApi */
/* global PolygonRequestParserMixin */
/* global SignUsdtCashlink */
/* global PolygonContractABIs */
/* global Errors */
/* global CONFIG */

class SignUsdtCashlinkApi extends PolygonRequestParserMixin(TopLevelApi) { // eslint-disable-line no-unused-vars
    /**
     * @param {KeyguardRequest.SignUsdtCashlinkRequest} request
     * @returns {Promise<Parsed<KeyguardRequest.SignUsdtCashlinkRequest>>}
     */
    async parseRequest(request) {
        if (!request) {
            throw new Errors.InvalidRequestError('request is required');
        }

        /** @type {Parsed<KeyguardRequest.SignUsdtCashlinkRequest>} */
        const parsedRequest = {};
        parsedRequest.appName = this.parseAppName(request.appName);
        parsedRequest.keyInfo = await this.parseKeyId(request.keyId);
        parsedRequest.keyLabel = /** @type {string} */ (this.parseLabel(request.keyLabel, false));
        parsedRequest.keyPath = this.parsePolygonPath(request.keyPath, 'keyPath');
        parsedRequest.senderLabel = this.parseLabel(request.senderLabel);
        parsedRequest.cashlinkMessage = /** @type {string} */ (this.parseMessage(request.cashlinkMessage, true));

        // Parse the polygon transaction request
        const [forwardRequest, description] = this.parseOpenGsnForwardRequest(request);

        parsedRequest.request = forwardRequest;
        parsedRequest.description = description;
        parsedRequest.relayData = this.parseOpenGsnRelayData(request.relayData);
        parsedRequest.approval = request.approval;

        // Validate that this is a USDT transfer
        if (forwardRequest.to !== CONFIG.BRIDGED_USDT_CASHLINK_CONTRACT_ADDRESS) {
            throw new Errors.InvalidRequestError('USDT cashlink must use BRIDGED_USDT_CASHLINK_CONTRACT_ADDRESS contract');
        }

        // Validate that the token is USDT
        if (description.args.token !== CONFIG.BRIDGED_USDT_CONTRACT_ADDRESS) {
            throw new Errors.InvalidRequestError('USDT cashlink must use BRIDGED_USDT_CONTRACT_ADDRESS as token');
        }

        // Validate that the function is transferWithApproval
        if (description.name !== 'transferWithApproval') {
            throw new Errors.InvalidRequestError('USDT cashlink only supports transferWithApproval function');
        }

        // Validate approval data
        if (!parsedRequest.approval || typeof parsedRequest.approval.tokenNonce !== 'number') {
            throw new Errors.InvalidRequestError('USDT cashlink requires approval with tokenNonce');
        }

        return parsedRequest;
    }

    /**
     *
     * @param {KeyguardRequest.PolygonTransactionInfo} request
     * @returns {[KeyguardRequest.OpenGsnForwardRequest, PolygonTransferWithApprovalDescription]}
     */
    parseOpenGsnForwardRequest(request) {
        const forwardRequest = this.parseOpenGsnForwardRequestRoot(request.request);

        let description;
        if (forwardRequest.to === CONFIG.BRIDGED_USDT_CASHLINK_CONTRACT_ADDRESS) {
            const transferContract = new ethers.Contract(
                forwardRequest.to,
                PolygonContractABIs.BRIDGED_USDT_TRANSFER_CONTRACT_ABI,
            );

            description = /** @type {PolygonTransferWithApprovalDescription} */(
                transferContract.interface.parseTransaction({
                    data: forwardRequest.data,
                    value: forwardRequest.value,
                })
            );

            if (!['transferWithApproval'].includes(description.name)) {
                throw new Errors.InvalidRequestError('Requested Polygon contract method is invalid for USDT cashlink');
            }
        } else {
            throw new Errors.InvalidRequestError('USDT cashlink request.to address is not allowed');
        }

        return [forwardRequest, description];
    }

    get Handler() {
        return SignUsdtCashlink;
    }
}
