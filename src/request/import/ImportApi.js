/* global TopLevelApi */
/* global ImportFile */
/* global Errors */

/** @extends {TopLevelApi<KeyguardRequest.ImportRequest>} */
class ImportApi extends TopLevelApi {
    /**
     * @param {KeyguardRequest.ImportRequest} request
     * @returns {Promise<Parsed<KeyguardRequest.ImportRequest>>}
     */
    async parseRequest(request) {
        if (!request) {
            throw new Errors.InvalidRequestError('request is required');
        }

        const parsedRequest = {};
        parsedRequest.appName = this.parseAppName(request.appName);
        parsedRequest.requestedKeyPaths = this.parsePathsArray(request.requestedKeyPaths, ' requestedKeyPaths');
        parsedRequest.isKeyLost = this.parseBoolean(request.isKeyLost);

        return parsedRequest;
    }

    get Handler() {
        return ImportFile;
    }
}

ImportApi.SESSION_STORAGE_KEY_PREFIX = 'nimiq_key_';
