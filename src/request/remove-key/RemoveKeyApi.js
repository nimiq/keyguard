/* global TopLevelApi */
/* global RemoveKey */
/* global Errors */

class RemoveKeyApi extends TopLevelApi { // eslint-disable-line no-unused-vars
    /**
     * @param {ParsedRemoveKeyRequest} request
     */
    async onRequest(request) {
        const removeKeyHandler = new RemoveKey(request, this.resolve.bind(this), this.reject.bind(this));
        removeKeyHandler.run();
    }

    /**
     * @param {KeyguardRequest.RemoveKeyRequest} request
     * @returns {Promise<ParsedRemoveKeyRequest>}
     */
    async parseRequest(request) {
        if (!request) {
            throw new Errors.InvalidRequestError('request is required');
        }

        const parsedRequest = {};
        parsedRequest.appName = this.parseAppName(request.appName);
        parsedRequest.keyInfo = await this.parseKeyId(request.keyId);
        const parsedLabel = this.parseLabel(request.keyLabel);

        if (parsedLabel === undefined) {
            throw new Errors.InvalidRequestError('keyLabel must be a string');
        }

        parsedRequest.keyLabel = parsedLabel;

        return parsedRequest;
    }
}
