/* global Nimiq */
/* global TopLevelApi */
/* global DeriveAddress */
/* global Errors */

class DeriveAddressApi extends TopLevelApi { // eslint-disable-line no-unused-vars
    /**
     * @param {KeyguardRequest.DeriveAddressRequest} request
     * @returns {Promise<Parsed<KeyguardRequest.DeriveAddressRequest>>}
     */
    async parseRequest(request) {
        if (!request) {
            throw new Errors.InvalidRequestError('request is required');
        }

        const parsedRequest = {};
        parsedRequest.appName = this.parseAppName(request.appName);
        parsedRequest.keyInfo = await this.parseKeyId(request.keyId);
        if (parsedRequest.keyInfo.type === Nimiq.Secret.Type.PRIVATE_KEY) {
            throw new Errors.InvalidRequestError('Cannot derive addresses for single-address accounts');
        }
        parsedRequest.keyLabel = this.parseLabel(request.keyLabel);
        parsedRequest.baseKeyPath = this.parsePath(request.baseKeyPath, 'baseKeyPath');
        parsedRequest.indicesToDerive = this.parseIndicesArray(request.indicesToDerive);

        return parsedRequest;
    }

    get Handler() {
        return DeriveAddress;
    }
}
