/* global ethers */
/* global TopLevelApi */
/* global SignPolygonTransaction */
/* global PolygonContractABIs */
/* global Errors */
/* global CONFIG */

/** @extends {TopLevelApi<KeyguardRequest.SignPolygonTransactionRequest>} */
class SignPolygonTransactionApi extends TopLevelApi { // eslint-disable-line no-unused-vars
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
        parsedRequest.description = this.parseOpenGsnForwardRequest(request, ['transfer', 'transferWithApproval']);
        parsedRequest.request = request.request;
        parsedRequest.relayData = this.parseOpenGsnRelayData(request);
        parsedRequest.recipientLabel = this.parseLabel(request.recipientLabel);
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
     * @param {string} path
     * @param {string} name
     * @returns {string}
     */
    parsePolygonPath(path, name) {
        if (path.match(/^m(\/[0-9]+'?)*$/) === null) {
            throw new Errors.InvalidRequestError(`${name}: Invalid path`);
        }

        let stillHardened = true;

        // Overflow check.
        const segments = path.split('/');
        for (let i = 1; i < segments.length; i++) {
            if (parseInt(segments[i], 10) >= 0x80000000) {
                throw new Errors.InvalidRequestError(`${name}: Invalid segment ${segments[i]}`);
            }

            const isHardened = segments[i][segments[i].length - 1] === '\'';
            if (isHardened && !stillHardened) {
                throw new Errors.InvalidRequestError(`${name}: Invalid hardened segment after non-hardened segment`);
            }
            stillHardened = isHardened;
        }

        return path;
    }

    /**
     *
     * @param {KeyguardRequest.PolygonTransactionInfo} request
     * @param {string[]} allowedMethods
     * @returns {PolygonTransferDescription | PolygonTransferWithApprovalDescription}
     */
    parseOpenGsnForwardRequest(request, allowedMethods) {
        const usdcTransferContract = new ethers.Contract(
            CONFIG.USDC_TRANSFER_CONTRACT_ADDRESS,
            PolygonContractABIs.USDC_TRANSFER_CONTRACT_ABI,
        );

        // eslint-disable-next-line operator-linebreak
        const description =
            /** @type {PolygonTransferDescription | PolygonTransferWithApprovalDescription} */
            (usdcTransferContract.interface.parseTransaction({
                data: request.request.data,
                value: request.request.value,
            }));

        if (!allowedMethods.includes(description.name)) {
            throw new Errors.InvalidRequestError('Requested Polygon contract method is invalid');
        }

        if (description.args.token !== CONFIG.USDC_CONTRACT_ADDRESS) {
            throw new Errors.InvalidRequestError('Invalid USDC token contract in request data');
        }

        // Also check that approval object exists when method is transferWithApproval
        if (description.name === 'transferWithApproval') {
            if (!request.approval) {
                throw new Errors.InvalidRequestError('`approval` object required for transferWithApproval method');
            }
        }

        return description;
    }

    /**
     *
     * @param {KeyguardRequest.PolygonTransactionInfo} request
     * @returns {KeyguardRequest.RelayData}
     */
    parseOpenGsnRelayData(request) {
        // TODO: Parse it
        return request.relayData;
    }

    get Handler() {
        return SignPolygonTransaction;
    }
}
