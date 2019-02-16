/* global TopLevelApi */
/* global Create */
/* global Errors */

class CreateApi extends TopLevelApi { // eslint-disable-line no-unused-vars
    /**
     * @param {KeyguardRequest.CreateRequest} request
     */
    async onRequest(request) {
        const handler = new Create(request, this.resolve.bind(this), this.reject.bind(this));
        handler.run();
    }

    /**
     * @param {KeyguardRequest.CreateRequest} request
     * @returns {Promise<KeyguardRequest.CreateRequest>}
     */
    async parseRequest(request) {
        if (!request) {
            throw new Errors.InvalidRequestError('request is required');
        }

        const parsedRequest = {};
        parsedRequest.appName = this.parseAppName(request.appName);
        parsedRequest.defaultKeyPath = this.parsePath(request.defaultKeyPath, 'defaultKeyPath');

        return parsedRequest;
    }
}
