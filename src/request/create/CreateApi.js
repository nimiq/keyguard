/* global TopLevelApi */
/* global Create */
/* global Nimiq */

class CreateApi extends TopLevelApi { // eslint-disable-line no-unused-vars
    /**
     * @param {KeyguardRequests.CreateRequest} request
     */
    async onRequest(request) {
        const parsedRequest = CreateApi._parseRequest(request);
        const handler = new Create(parsedRequest, this.resolve.bind(this), this.reject.bind(this));
        handler.run();
    }

    /**
     * @param {KeyguardRequests.CreateRequest} request
     * @returns {KeyguardRequests.CreateRequest}
     * @private
     */
    static _parseRequest(request) {
        if (!request) {
            throw new Error('Empty request');
        }

        if (typeof request.appName !== 'string' || !request.appName) {
            throw new Error('appName is required');
        }

        if (!request.defaultKeyPath || !Nimiq.ExtendedPrivateKey.isValidPath(request.defaultKeyPath)) {
            throw new Error('Invalid defaultKeyPath');
        }

        return request;
    }
}
