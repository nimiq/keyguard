/* global TopLevelApi */
/* global SignMessage */
/* global Errors */

/** @extends {TopLevelApi<KeyguardRequest.SignMessageRequest>} */
class SignMessageApi extends TopLevelApi { // eslint-disable-line no-unused-vars
    /**
     * @param {KeyguardRequest.SignMessageRequest} request
     * @returns {Promise<Parsed<KeyguardRequest.SignMessageRequest>>}
     */
    async parseRequest(request) {
        if (!request) {
            throw new Errors.InvalidRequestError('request is required');
        }

        const parsedRequest = {};
        parsedRequest.appName = this.parseAppName(request.appName);
        parsedRequest.keyInfo = await this.parseKeyId(request.keyId);
        parsedRequest.keyLabel = this.parseLabel(request.keyLabel);
        parsedRequest.keyPath = this.parsePath(request.keyPath, 'keyPath');
        parsedRequest.message = this.parseMessage(request.message);
        parsedRequest.signerLabel = /** @type {string} */ (this.parseLabel(request.signerLabel, false));
        parsedRequest.signer = this.parseAddress(request.signer, 'signer');

        return parsedRequest;
    }

    get Handler() {
        return SignMessage;
    }
}
