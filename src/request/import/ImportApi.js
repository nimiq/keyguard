/* global TopLevelApi */
/* global ImportFile */
/* global Errors */

class ImportApi extends TopLevelApi {
    /**
     * @param {KeyguardRequest.ImportRequest} request
     * @returns {Promise<KeyguardRequest.ImportRequest>}
     */
    async parseRequest(request) {
        if (!request) {
            throw new Errors.InvalidRequestError('request is required');
        }

        const parsedRequest = {};
        parsedRequest.appName = this.parseAppName(request.appName);
        parsedRequest.defaultKeyPath = this.parsePath(request.defaultKeyPath, 'defaultKeyPath');
        parsedRequest.requestedKeyPaths = this.parsePathsArray(request.requestedKeyPaths, ' requestKeyPaths');

        return parsedRequest;
    }

    get Handler() {
        return ImportFile;
    }
}

ImportApi.SESSION_STORAGE_KEY_PREFIX = 'nimiq_key_';
