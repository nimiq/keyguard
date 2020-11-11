/* global Nimiq */
/* global BitcoinEnabledTopLevelApi */
/* global DeriveBtcXPub */
/* global Errors */

/** @extends {BitcoinEnabledTopLevelApi<KeyguardRequest.DeriveBtcXPubRequest>} */
class DeriveBtcXPubApi extends BitcoinEnabledTopLevelApi { // eslint-disable-line no-unused-vars
    /**
     * @param {KeyguardRequest.DeriveBtcXPubRequest} request
     * @returns {Promise<Parsed<KeyguardRequest.DeriveBtcXPubRequest>>}
     */
    async parseRequest(request) {
        if (!request) {
            throw new Errors.InvalidRequestError('request is required');
        }

        const parsedRequest = {};
        parsedRequest.appName = this.parseAppName(request.appName);
        parsedRequest.keyInfo = await this.parseKeyId(request.keyId);
        if (parsedRequest.keyInfo.type === Nimiq.Secret.Type.PRIVATE_KEY) {
            throw new Errors.InvalidRequestError('Cannot derive a Bitcoin XPub for single-address accounts');
        }
        parsedRequest.keyLabel = this.parseLabel(request.keyLabel);
        parsedRequest.bitcoinXPubPath = this.parseBitcoinPath(request.bitcoinXPubPath, 'bitcoinXPubPath');

        return parsedRequest;
    }

    get Handler() {
        return DeriveBtcXPub;
    }
}
