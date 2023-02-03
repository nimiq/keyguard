/* global TopLevelApi */
/* global Nimiq */
/* global DerivePolygonAddress */
/* global Errors */

/** @extends {TopLevelApi<KeyguardRequest.DerivePolygonAddressRequest>} */
class DerivePolygonAddressApi extends TopLevelApi { // eslint-disable-line no-unused-vars
    /**
     * @param {KeyguardRequest.DerivePolygonAddressRequest} request
     * @returns {Promise<Parsed<KeyguardRequest.DerivePolygonAddressRequest>>}
     */
    async parseRequest(request) {
        if (!request) {
            throw new Errors.InvalidRequestError('request is required');
        }

        const parsedRequest = {};
        parsedRequest.appName = this.parseAppName(request.appName);
        parsedRequest.keyInfo = await this.parseKeyId(request.keyId);
        if (parsedRequest.keyInfo.type === Nimiq.Secret.Type.PRIVATE_KEY) {
            throw new Errors.InvalidRequestError('Cannot derive a Polygon address for single-address accounts');
        }
        parsedRequest.keyLabel = this.parseLabel(request.keyLabel);
        parsedRequest.polygonAccountPath = this.parsePath(request.polygonAccountPath, 'polygonAccountPath');

        return parsedRequest;
    }

    get Handler() {
        return DerivePolygonAddress;
    }
}
