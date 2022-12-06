/* global BitcoinRequestParserMixin */
/* global TopLevelApi */
/* global Create */
/* global Errors */

class CreateApi extends BitcoinRequestParserMixin(TopLevelApi) { // eslint-disable-line no-unused-vars
    /**
     * @param {KeyguardRequest.CreateRequest} request
     * @returns {Promise<Parsed<KeyguardRequest.CreateRequest>>}
     */
    async parseRequest(request) {
        if (!request) {
            throw new Errors.InvalidRequestError('request is required');
        }

        const parsedRequest = {};
        parsedRequest.appName = this.parseAppName(request.appName);
        parsedRequest.defaultKeyPath = this.parsePath(request.defaultKeyPath, 'defaultKeyPath');
        parsedRequest.enableBackArrow = this.parseBoolean(request.enableBackArrow);
        parsedRequest.bitcoinXPubPath = this.parseBitcoinPath(request.bitcoinXPubPath, 'bitcoinXPubPath');
        parsedRequest.polygonAccountPath = this.parsePath(request.polygonAccountPath, 'polygonAccountPath');

        return parsedRequest;
    }

    get Handler() {
        return Create;
    }
}
