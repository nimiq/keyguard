/* global Constants */
/* global TopLevelApi */
/* global ImportFile */
/* global Nimiq */
/* global Key */
/* global Errors */

class ImportApi extends TopLevelApi {
    constructor() {
        super();

        this._encryptedKey = new Nimiq.SerialBuffer(0);

        /** @type {Nimiq.Secret.Type} */
        this._keyType = Nimiq.Secret.Type.ENTROPY;
        this._hasPin = false;
    }

    /**
     * @param {KeyguardRequest.ImportRequest} request
     */
    async onRequest(request) {
        const parsedRequest = this.parseRequest(request);
        const importFileHandler = new ImportFile(parsedRequest, this.resolve.bind(this), this.reject.bind(this));

        // Global cancel link
        /** @type {HTMLElement} */
        const $appName = (document.querySelector('#app-name'));
        $appName.textContent = request.appName;
        /** @type {HTMLButtonElement} */
        const $cancelLink = ($appName.parentNode);
        $cancelLink.classList.remove('display-none');
        $cancelLink.addEventListener('click', () => this.reject(new Errors.RequestCanceled()));

        importFileHandler.run();
    }

    run() {
        window.location.hash = ImportApi.Pages.FILE_IMPORT;

        // Async pre-load the crypto worker to reduce wait time at first decrypt attempt
        Nimiq.CryptoWorker.getInstanceAsync();
    }

    /**
     * @param {KeyguardRequest.ImportRequest} request
     * @returns {KeyguardRequest.ImportRequest}
     */
    parseRequest(request) {
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

ImportApi.Pages = {
    FILE_IMPORT: 'file-import',
    ENTER_PASSPHRASE: 'enter-passphrase',
    SET_PASSPHRASE: 'set-passphrase',
    PRIVACY_AGENT: 'privacy',
    ENTER_WORDS: 'words',
    CHOOSE_KEY_TYPE: 'choose-key-type',
};

ImportApi.SESSION_STORAGE_KEY_PREFIX = 'nimiq_key_';
