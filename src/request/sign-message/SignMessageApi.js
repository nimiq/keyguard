/* global Nimiq */
/* global KeyStore */
/* global TopLevelApi */
/* global SignMessage */
/* global Utf8Tools */
/* global Errors */
class SignMessageApi extends TopLevelApi { // eslint-disable-line no-unused-vars
    /**
     * @param {KeyguardRequest.SignMessageRequest} request
     */
    async onRequest(request) {
        const parsedRequest = await SignMessageApi._parseRequest(request);
        /** @type {HTMLDivElement} */
        const $page = (document.getElementById(SignMessage.Pages.AUTHORIZE));

        const handler = new SignMessage(
            $page,
            parsedRequest,
            this.resolve.bind(this),
            this.reject.bind(this),
        );

        /** @type {HTMLElement} */
        const $appName = (document.querySelector('#app-name'));
        $appName.textContent = request.appName;
        /** @type {HTMLButtonElement} */
        const $cancelLink = ($appName.parentNode);
        $cancelLink.classList.remove('display-none');
        $cancelLink.addEventListener('click', () => this.reject(new Errors.Cancel()));

        handler.run();
    }

    /**
     * @param {KeyguardRequest.SignMessageRequest} request
     * @returns {Promise<KeyguardRequest.ParsedSignMessageRequest>}
     * @private
     */
    static async _parseRequest(request) {
        if (!request) {
            throw new Errors.InvalidRequest('Empty request');
        }

        // Check that keyId is given.
        if (!request.keyId || typeof request.keyId !== 'string') {
            throw new Errors.InvalidRequest('keyId is required');
        }

        // Check that key exists.
        const keyInfo = await KeyStore.instance.getInfo(request.keyId);
        if (!keyInfo) {
            throw new Errors.InvalidRequest('Unknown keyId');
        }

        // Check that keyPath is given.
        if (!request.keyPath || typeof request.keyPath !== 'string') {
            throw new Errors.InvalidRequest('keyPath is required');
        }

        // Check that keyPath is valid.
        if (!Nimiq.ExtendedPrivateKey.isValidPath(request.keyPath)) {
            throw new Errors.InvalidRequest('Invalid keyPath');
        }

        // Parse and validate message.
        const message = SignMessageApi._parseMessage(request.message);
        if (message.length > 255) {
            throw new Errors.InvalidRequest('Message must not exceed 255 bytes');
        }

        // Validate signer address
        const address = new Nimiq.Address(request.signer);

        // Validate labels.
        const labels = [request.keyLabel, request.signerLabel];
        if (labels.some(label => label !== undefined && (typeof label !== 'string' || label.length > 64))) {
            throw new Errors.InvalidRequest('Invalid label');
        }

        return /** @type {ParsedSignMessageRequest} */ {
            appName: request.appName,
            keyInfo,
            keyPath: request.keyPath,
            keyLabel: request.keyLabel,
            signer: address,
            signerLabel: request.signerLabel,
            message,
        };
    }

    /**
     * @param {Uint8Array | string} message
     * @returns {Uint8Array}
     * @private
     */
    static _parseMessage(message) {
        if (message instanceof Uint8Array) return message;
        if (typeof message === 'string') return Utf8Tools.stringToUtf8ByteArray(message);
        throw new Errors.InvalidRequest('Type of message must be a String or Uint8Array');
    }
}
