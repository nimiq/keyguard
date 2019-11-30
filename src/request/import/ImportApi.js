/* global TopLevelApi */
/* global ImportFile */
/* global ImportWords */
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
        parsedRequest.enableBackArrow = this.parseBoolean(request.enableBackArrow);
        parsedRequest.wordsOnly = this.parseBoolean(request.wordsOnly);
        parsedRequest.expectedKeyId = request.expectedKeyId ? await this.parseKeyId(request.expectedKeyId) : undefined;

        this._handler = parsedRequest.wordsOnly ? ImportWords : ImportFile;

        return parsedRequest;
    }

    get Handler() {
        return this._handler;
    }
}

ImportApi.SESSION_STORAGE_KEY_PREFIX = 'nimiq_key_';
