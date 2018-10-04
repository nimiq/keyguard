/* global Nimiq */
/* global KeyStore */
// /* global Identicon */
/* global PassphraseBox */
/* global Utf8Tools */

class SignMessage {
    /**
     * @param {HTMLDivElement} $page
     * @param {KeyguardRequest.ParsedSignMessageRequest} request
     * @param {Function} resolve
     * @param {Function} reject
     */
    constructor($page, request, resolve, reject) {
        // /** @type {HTMLDivElement} */
        // const $signerIdenticon = ($page.querySelector('#signer-identicon'));

        // /** @type {HTMLDivElement} */
        // const $signerLabel = ($page.querySelector('#signer-label'));

        // /** @type {HTMLDivElement} */
        // const $signerAddress = ($page.querySelector('#signer-address'));

        /** @type {HTMLInputElement} */
        const $message = ($page.querySelector('#message'));

        // // Set signing account.
        // const signer = KeyStore.instance.get()
        // const signerAddress = transaction.sender.toUserFriendlyAddress();
        // new Identicon(signerAddress, $signerIdenticon); // eslint-disable-line no-new
        // $signerAddress.textContent = signerAddress;
        // if (request.signerLabel) {
        //     $signerLabel.classList.remove('display-none');
        //     $signerLabel.textContent = request.signerLabel;
        // }

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
     * @param {string} passphrase
     * @returns {Promise<void>}
     * @private
     */
    async _onConfirm(request, resolve, reject, passphrase) {
        document.body.classList.add('loading');

        try {
            // XXX Passphrase encoding
            const passphraseBuf = Nimiq.BufferUtils.fromAscii(passphrase);
            const key = await KeyStore.instance.get(request.keyInfo.id, passphraseBuf);
            if (!key) {
                reject(new Error('Failed to retrieve key'));
                return;
            }

            const publicKey = key.derivePublicKey(request.keyPath);
            const signature = key.signMessage(request.keyPath, request.message);
            const result = /** @type {SignMessageResult} */ {
                publicKey: publicKey.serialize(),
                signature: signature.serialize(),
            };
            resolve(result);
        } catch (e) {
            console.error(e);
            document.body.classList.remove('loading');

            // Assume the passphrase was wrong
            this._passphraseBox.onPassphraseIncorrect();
        }
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
