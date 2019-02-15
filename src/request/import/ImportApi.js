/* global TopLevelApi */
/* global ImportFile */
/* global Errors */

class ImportApi extends TopLevelApi {
    /**
     * @param {KeyguardRequest.ImportRequest} request
     */
    async onRequest(request) {
        const importFileHandler = new ImportFile(request, this.resolve.bind(this), this.reject.bind(this));

        // Global cancel link
        /** @type {HTMLElement} */
        const $appName = (document.querySelector('#app-name'));
        $appName.textContent = request.appName;
        /** @type {HTMLButtonElement} */
        const $cancelLink = ($appName.parentNode);
        $cancelLink.classList.remove('display-none');
        $cancelLink.addEventListener('click', () => this.reject(new Errors.RequestCanceled()));

        importFileHandler.run();
        TopLevelApi.setLoading(false);
    }

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
}

ImportApi.SESSION_STORAGE_KEY_PREFIX = 'nimiq_key_';
