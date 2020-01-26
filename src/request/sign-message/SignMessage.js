/* global Nimiq */
/* global Key */
/* global KeyStore */
/* global TabWidthSelector */
/* global Identicon */
/* global PasswordBox */
/* global Utf8Tools */
/* global KeyStore */
/* global Errors */
/* global TopLevelApi */

/**
 * @callback SignMessage.resolve
 * @param {KeyguardRequest.SignatureResult} result
 */

class SignMessage {
    /**
     * @param {Parsed<KeyguardRequest.SignMessageRequest>} request
     * @param {SignMessage.resolve} resolve
     * @param {reject} reject
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
        if (typeof request.message === 'string') {
            $message.value = request.message;

            // Look for tabs
            if (request.message.includes('\t')) {
                // Init tab width selector

                /** @type {HTMLDivElement} */
                const $tabWidthSelector = ($page.querySelector('#tabwidthselector'));
                const tws = new TabWidthSelector($tabWidthSelector);

                // @ts-ignore Property 'tabSize' does not exist on type 'CSSStyleDeclaration'
                $message.style.tabSize = tws.width;

                tws.on(TabWidthSelector.Events.INPUT, width => {
                    // @ts-ignore Property 'tabSize' does not exist on type 'CSSStyleDeclaration'
                    $message.style.tabSize = width;
                });

                $page.classList.add('show-tab-width-selector');
            }
        } else {
            $message.value = Nimiq.BufferUtils.toHex(request.message);
        }

        // Set signing account
        const signerAddress = request.signer.toUserFriendlyAddress();
        new Identicon(signerAddress, $signerIdenticon); // eslint-disable-line no-new
        $signerLabel.textContent = request.signerLabel;

        // Set up password box
        /** @type {HTMLFormElement} */
        const $passwordBox = (document.querySelector('#password-box'));
        this._passwordBox = new PasswordBox($passwordBox, {
            hideInput: !request.keyInfo.encrypted,
            buttonI18nTag: 'passwordbox-sign-msg',
            minLength: request.keyInfo.hasPin ? Key.PIN_LENGTH : undefined,
        });

        this._passwordBox.on(
            PasswordBox.Events.SUBMIT,
            password => this._onConfirm(request, resolve, reject, password),
        );
    }

    /**
     * @param {Parsed<KeyguardRequest.SignMessageRequest>} request
     * @param {SignMessage.resolve} resolve
     * @param {reject} reject
     * @param {string} [password]
     * @returns {Promise<void>}
     * @private
     */
    async _onConfirm(request, resolve, reject, password) {
        TopLevelApi.setLoading(true);

        const passwordBuf = password ? Utf8Tools.stringToUtf8ByteArray(password) : undefined;

        /** @type {Key?} */
        let key = null;
        try {
            key = await KeyStore.instance.get(request.keyInfo.id, passwordBuf);
        } catch (e) {
            if (e.message === 'Invalid key') {
                TopLevelApi.setLoading(false);
                this._passwordBox.onPasswordIncorrect();
                return;
            }
            reject(new Errors.CoreError(e));
            return;
        }

        if (!key) {
            reject(new Errors.KeyNotFoundError());
            return;
        }

        const publicKey = key.derivePublicKey(request.keyPath);

        // Validate that the derived address is the same as the request's 'signer' address
        const derivedAddress = publicKey.toAddress();
        if (!derivedAddress.equals(request.signer)) {
            reject(new Errors.KeyguardError('Provided keyPath does not derive provided signer address'));
            return;
        }

        /** @type {Uint8Array} */
        let messageBytes;
        if (typeof request.message === 'string') {
            messageBytes = Utf8Tools.stringToUtf8ByteArray(request.message);
        } else {
            messageBytes = request.message;
        }

        const signature = key.signMessage(request.keyPath, messageBytes);

        /** @type {KeyguardRequest.SignatureResult} */
        const result = {
            publicKey: publicKey.serialize(),
            signature: signature.serialize(),
        };
        resolve(result);
    }

    run() {
        // Go to start page
        window.location.hash = SignMessage.Pages.SIGN_MESSAGE;
    }
}

SignMessage.Pages = {
    SIGN_MESSAGE: 'sign-message',
};
