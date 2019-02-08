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
     * @param {HTMLDivElement} $page
     * @param {ParsedSignMessageRequest} request
     * @param {Function} resolve
     * @param {Function} reject
     */
    constructor($page, request, resolve, reject) {
        /** @type {HTMLDivElement} */
        const $signerIdenticon = ($page.querySelector('#signer-identicon'));

        /** @type {HTMLDivElement} */
        const $signerLabel = ($page.querySelector('#signer-label'));

        /** @type {HTMLDivElement} */
        const $signerAddress = ($page.querySelector('#signer-address'));

        /** @type {HTMLInputElement} */
        const $message = ($page.querySelector('#message'));

        // Set signing account.
        const signerAddress = request.signer.toUserFriendlyAddress();
        new Identicon(signerAddress, $signerIdenticon); // eslint-disable-line no-new
        $signerAddress.textContent = signerAddress;
        if (request.signerLabel) {
            $signerLabel.textContent = request.signerLabel;
            $signerLabel.classList.remove('display-none');
        }

        // Set message.
        if (Utf8Tools.isValidUtf8(request.message)) {
            $message.value = Utf8Tools.utf8ByteArrayToString(request.message);
        } else {
            $message.value = Nimiq.BufferUtils.toHex(request.message);
        }

        // Set up passphrase box.
        /** @type {HTMLFormElement} */
        const $passphraseBox = (document.querySelector('#passphrase-box'));
        this._passphraseBox = new PassphraseBox($passphraseBox, {
            hideInput: !request.keyInfo.encrypted,
            buttonI18nTag: 'passphrasebox-sign-msg',
            minLength: request.keyInfo.hasPin ? 6 : undefined,
        });

        this._passphraseBox.on(
            PassphraseBox.Events.SUBMIT,
            passphrase => this._onConfirm(request, resolve, reject, passphrase),
        );

        // This event cannot throw a 'CANCEL' error like in other requests,
        // because for sign-message we need to go back to the SignMessageOverview
        // in the Accounts Manager and not return directly to the caller.
        this._passphraseBox.on(PassphraseBox.Events.CANCEL, () => window.history.back());
    }

    /**
     * @param {ParsedSignMessageRequest} request
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
            key = await KeyStore.instance.get(request.keyInfo.id, passphraseBuf);
        } catch (e) {
            if (e.message === 'Invalid key') {
                TopLevelApi.setLoading(false);
                this._passphraseBox.onPassphraseIncorrect();
                return;
            }
            reject(new Errors.CoreError(e.message));
            return;
        }

        if (!key) {
            reject(new Errors.KeyNotFoundError());
            return;
        }

        const publicKey = key.derivePublicKey(request.keyPath);

        // Validate that derived address is the same as the request's 'signer' address
        const derivedAddress = publicKey.toAddress();
        if (!derivedAddress.equals(request.signer)) {
            reject(new Errors.KeyguardError('Provided keyPath does not refer to provided signer address'));
            return;
        }

        // Buffer length has already been validated during request parsing in SignMessageApi,
        // thus key.signMessage cannot throw a length error.
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
        window.location.hash = SignMessage.Pages.AUTHORIZE;
        this._passphraseBox.focus();

        // Async pre-load the crypto worker to reduce wait time at first decrypt attempt
        Nimiq.CryptoWorker.getInstanceAsync();
    }
}

SignMessage.Pages = {
    AUTHORIZE: 'authorize',
};
