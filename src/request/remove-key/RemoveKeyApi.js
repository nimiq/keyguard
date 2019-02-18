/* global TopLevelApi */
/* global RemoveKey */
/* global Errors */

class RemoveKeyApi extends TopLevelApi { // eslint-disable-line no-unused-vars
    /**
<<<<<<< HEAD
     * @param {Parsed<KeyguardRequest.RemoveKeyRequest>} request
     */
    async onRequest(request) {
        const removeKeyHandler = new RemoveKey(request, this.resolve.bind(this), this.reject.bind(this));
        this.setGlobalCloseButtonText(`${I18n.translatePhrase('back-to')} ${request.appName}`);
        removeKeyHandler.run();
    }

    /**
=======
>>>>>>> master
     * @param {KeyguardRequest.RemoveKeyRequest} request
     * @returns {Promise<Parsed<KeyguardRequest.RemoveKeyRequest>>}
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

    get Handler() {
        return RemoveKey;
    }
}
