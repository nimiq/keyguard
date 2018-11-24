/* global Nimiq */
/* global KeyStore */
/* global TopLevelApi */
/* global SignMessage */
/* global Utf8Tools */

class SignMessageApi extends TopLevelApi { // eslint-disable-line no-unused-vars
    /**
     * @param {KeyguardRequest.SignMessageRequest} request
     */
    async onRequest(request) {
        /** @type {KeyguardRequest.ParsedSignMessageRequest} */
        let parsedRequest;
        try {
            parsedRequest = await SignMessageApi._parseRequest(request);
        } catch (e) {
            this.reject(e);
            return;
        }

        /** @type {HTMLDivElement} */
        const $page = (document.getElementById(SignMessage.Pages.AUTHORIZE));

        const handler = new SignMessage(
            $page,
            parsedRequest,
            this.resolve.bind(this),
            this.reject.bind(this),
        );

        handler.run();
    }

    /**
     * @param {KeyguardRequest.SignMessageRequest} request
     * @returns {Promise<KeyguardRequest.ParsedSignMessageRequest>}
     * @private
     */
    static async _parseRequest(request) {
        if (!request) {
            throw new Error('Empty request');
        }

        // Check that keyId is given.
        if (!request.keyId || typeof request.keyId !== 'string') {
            throw new Error('keyId is required');
        }

        // Check that key exists.
        const keyInfo = await KeyStore.instance.getInfo(request.keyId);
        if (!keyInfo) {
            throw new Error('Unknown keyId');
        }

        // Check that keyPath is given.
        if (!request.keyPath || typeof request.keyPath !== 'string') {
            throw new Error('keyPath is required');
        }

        // Check that keyPath is valid.
        if (!Nimiq.ExtendedPrivateKey.isValidPath(request.keyPath)) {
            throw new Error('Invalid keyPath');
        }

        // Parse message.
        const message = SignMessageApi._parseMessage(request.message);

        // Validate labels.
        const labels = [request.keyLabel, request.accountLabel];
        if (labels.some(label => label !== undefined && (typeof label !== 'string' || label.length > 64))) {
            throw new Error('Invalid label');
        }

        return /** @type {ParsedSignMessageRequest} */ {
            appName: request.appName,
            keyInfo,
            keyPath: request.keyPath,
            keyLabel: request.keyLabel,
            accountLabel: request.accountLabel,
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
        throw new Error('Type of message must be a String or Uint8Array');
    }
}
