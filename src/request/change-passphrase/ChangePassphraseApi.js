/* global TopLevelApi */
/* global ChangePassphrase */
/* global Errors */
/* global I18n */

class ChangePassphraseApi extends TopLevelApi { // eslint-disable-line no-unused-vars
    /**
     * @param {ParsedSimpleRequest} request
     */
    async onRequest(request) {
        const handler = new ChangePassphrase(request, this.resolve.bind(this), this.reject.bind(this));
        this.setGlobalCloseButtonText(`${I18n.translatePhrase('back-to')} ${request.appName}`);
        handler.run();
    }

    /**
     * @param {KeyguardRequest.SimpleRequest} request
     * @returns {Promise<ParsedSimpleRequest>}
     */
    async parseRequest(request) {
        if (!request) {
            throw new Errors.InvalidRequestError('request is required');
        }

        const parsedRequest = {};
        parsedRequest.appName = this.parseAppName(request.appName);
        parsedRequest.keyInfo = await this.parseKeyId(request.keyId);
        parsedRequest.keyLabel = this.parseLabel(request.keyLabel);

        return parsedRequest;
    }
}
