/* global Constants */
/* global Nimiq */
/* global KeyStore */
/* global Identicon */
/* global PassphraseBox */
/* global Utf8Tools */
/* global KeyStore */
/* global Errors */
/* global TopLevelApi */

class SignMessage {
    /**
     * @param {Parsed<KeyguardRequest.SignMessageRequest>} request
     * @param {Function} resolve
     * @param {Function} reject
     */
    constructor(request, resolve, reject) {
        /** @type {HTMLDivElement} */
        const $page = (document.getElementById(SignMessage.Pages.SIGN_MESSAGE));

        /** @type {HTMLDivElement} */
        const $signerIdenticon = ($page.querySelector('#signer-identicon'));

        /** @type {HTMLDivElement} */
        const $signerLabel = ($page.querySelector('#signer-label'));

        /** @type {HTMLInputElement} */
        const $message = ($page.querySelector('#message'));

        // Set message
        if (Utf8Tools.isValidUtf8(request.message)) {
            $message.value = Utf8Tools.utf8ByteArrayToString(request.message);
        } else {
            $message.value = Nimiq.BufferUtils.toHex(request.message);
        }

        // Set signing account
        const signerAddress = request.signer.toUserFriendlyAddress();
        new Identicon(signerAddress, $signerIdenticon); // eslint-disable-line no-new
        $signerLabel.textContent = request.signerLabel;

        // Set up passphrase box
        /** @type {HTMLFormElement} */
        const $passphraseBox = (document.querySelector('#passphrase-box'));
        this._passphraseBox = new PassphraseBox($passphraseBox, {
            hideInput: !request.keyInfo.encrypted,
            buttonI18nTag: 'passphrasebox-sign-msg',
            minLength: request.keyInfo.hasPin ? 6 : undefined,
            // hideCancel: true,
        });

        this._passphraseBox.on(
            PassphraseBox.Events.SUBMIT,
            passphrase => this._onConfirm(request, resolve, reject, passphrase),
        );
    }

    /**
     * @param {Parsed<KeyguardRequest.SignMessageRequest>} request
     * @param {Function} resolve
     * @param {Function} reject
     * @param {string} [passphrase]
     * @returns {Promise<void>}
     * @private
     */
    async _onConfirm(request, resolve, reject, passphrase) {
        TopLevelApi.setLoading(true);

        const passphraseBuf = passphrase ? Utf8Tools.stringToUtf8ByteArray(passphrase) : undefined;

        /** @type {Key | null} */
        let key = null;
        try {
            /** @type {Key} */ // Request parsing already validates that the key exists
            key = (await KeyStore.instance.get(request.keyInfo.id, passphraseBuf));
        } catch (e) {
            if (e.message === 'Invalid key') {
                TopLevelApi.setLoading(false);
                this._passphraseBox.onPassphraseIncorrect();
                return;
            }
            reject(new Errors.CoreError(e));
            return;
        }

        const publicKey = key.derivePublicKey(request.keyPath);

        // Validate that the derived address is the same as the request's 'signer' address
        const derivedAddress = publicKey.toAddress();
        if (!derivedAddress.equals(request.signer)) {
            reject(new Errors.KeyguardError('Provided keyPath does not derive provided signer address'));
            return;
        }

        const signingResult = key.signMessage(request.keyPath, request.message);

        const result = /** @type {KeyguardRequest.SignMessageResult} */ ({
            publicKey: publicKey.serialize(),
            signature: signingResult.signature.serialize(),
            data: signingResult.data,
        });
        resolve(result);
    }

    run() {
        // Go to start page
        window.location.hash = SignMessage.Pages.SIGN_MESSAGE;
        if (TopLevelApi.getDocumentWidth() > Constants.MIN_WIDTH_FOR_AUTOFOCUS) {
            this._passphraseBox.focus();
        }
    }
}

SignMessage.Pages = {
    SIGN_MESSAGE: 'sign-message',
};
