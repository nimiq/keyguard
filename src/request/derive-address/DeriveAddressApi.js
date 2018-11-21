/* global TopLevelApi */
/* global DeriveAddress */
/* global Key */
/* global KeyStore */
/* global Nimiq */

class DeriveAddressApi extends TopLevelApi { // eslint-disable-line no-unused-vars
    /**
     * @param {KeyguardRequests.DeriveAddressRequest} request
     */
    async onRequest(request) {
        const parsedRequest = await DeriveAddressApi._parseRequest(request);
        const handler = new DeriveAddress(parsedRequest, this.resolve.bind(this), this.reject.bind(this));
        handler.run();
    }

    /**
     * @param {KeyguardRequests.DeriveAddressRequest} request
     * @returns {Promise<KeyguardRequests.ParsedDeriveAddressRequest>}
     * @private
     */
    static async _parseRequest(request) {
        if (!request) {
            throw new Error('Empty request');
        }

        if (!request.appName || typeof request.appName !== 'string') {
            throw new Error('appName is required');
        }

        if (!request.keyId || typeof request.keyId !== 'string') {
            throw new Error('keyId is required');
        }

        // Check that key exists.
        const keyInfo = await KeyStore.instance.getInfo(request.keyId);
        if (!keyInfo) {
            throw new Error('Unknown keyId');
        }

        if (keyInfo.type === Key.Type.LEGACY) {
            throw new Error('Cannot derive addresses for single-account wallets');
        }

        if (!request.baseKeyPath || !Nimiq.ExtendedPrivateKey.isValidPath(request.baseKeyPath)) {
            throw new Error('Invalid baseKeyPath');
        }

        if (!request.indicesToDerive || !(request.indicesToDerive instanceof Array)) {
            throw new Error('Invalid indicesToDerive');
        }

        return {
            appName: request.appName,
            keyInfo,
            keyLabel: request.keyLabel,
            baseKeyPath: request.baseKeyPath,
            indicesToDerive: request.indicesToDerive,
        };
    }
}
