/* global Nimiq */
/* global KeyStore */
/* global Identicon */
/* global PassphraseBox */
/* global Utf8Tools */
/* global KeyStore */

class SignMessage {
    /**
     * @param {HTMLDivElement} $page
     * @param {KeyguardRequest.ParsedSignMessageRequest} request
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
        this._passphraseBox.on(PassphraseBox.Events.CANCEL, () => reject(new Error('CANCEL')));

        /** @type {HTMLElement} */
        const $appName = (document.querySelector('#app-name'));
        $appName.textContent = request.appName;
        /** @type {HTMLButtonElement} */
        const $cancelLink = ($appName.parentNode);
        $cancelLink.classList.remove('display-none');
        $cancelLink.addEventListener('click', () => reject(new Error('CANCEL')));
    }

    /**
     * @param {KeyguardRequest.ParsedSignMessageRequest} request
     * @param {Function} resolve
     * @param {Function} reject
     * @param {string} [passphrase]
     * @returns {Promise<void>}
     * @private
     */
    async _onConfirm(request, resolve, reject, passphrase) {
        document.body.classList.add('loading');

        // XXX Passphrase encoding
        const passphraseBuf = passphrase ? Nimiq.BufferUtils.fromAscii(passphrase) : undefined;

        /** @type {Key | null} */
        let key = null;
        try {
            key = await KeyStore.instance.get(request.keyInfo.id, passphraseBuf);
        } catch (e) {
            console.error(e);
            document.body.classList.remove('loading');

            // Assume the passphrase was wrong
            this._passphraseBox.onPassphraseIncorrect();
        }

        if (!key) {
            reject(new Error('Failed to retrieve key'));
            return;
        }

        const publicKey = key.derivePublicKey(request.keyPath);

        // Validate that derived address is the same as the request's 'signer' address
        const derivedAddress = publicKey.toAddress();
        if (!derivedAddress.equals(request.signer)) {
            reject(new Error('Provided keyPath does not refer to provided signer address'));
        }

        const signature = key.signMessage(request.keyPath, request.message);

        const result = /** @type {SignMessageResult} */ {
            publicKey: publicKey.serialize(),
            signature: signature.serialize(),
        };
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
