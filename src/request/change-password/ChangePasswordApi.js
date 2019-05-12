/* global TopLevelApi */
/* global ChangePassword */
/* global Errors */

/** @extends TopLevelApi<KeyguardRequest.SimpleRequest> */
class ChangePasswordApi extends TopLevelApi { // eslint-disable-line no-unused-vars
    /**
     * @param {KeyguardRequest.SimpleRequest} request
     * @returns {Promise<Parsed<KeyguardRequest.SimpleRequest>>}
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

    get Handler() {
        return ChangePassword;
    }
}
