/* global TopLevelApi */
/* global Export */
/* global Errors */

class ExportApi extends TopLevelApi { // eslint-disable-line no-unused-vars
    /**
     * @param {KeyguardRequest.ExportRequest} request
     * @returns {Promise<Parsed<KeyguardRequest.ExportRequest>>}
     */
    async parseRequest(request) {
        if (!request) {
            throw new Errors.InvalidRequestError('request is required');
        }

        const parsedRequest = {};
        parsedRequest.appName = this.parseAppName(request.appName);
        parsedRequest.keyInfo = await this.parseKeyId(request.keyId);
        parsedRequest.keyLabel = this.parseLabel(request.keyLabel);
        if (request.fileOnly && request.wordsOnly) {
            throw new Errors.InvalidRequestError('fileOnly and wordsOnly can not both be set to true.');
        }
        parsedRequest.fileOnly = request.fileOnly;
        parsedRequest.wordsOnly = request.wordsOnly;

        return parsedRequest;
    }

    get Handler() {
        return Export;
    }
}
