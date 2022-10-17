/* global Nimiq */
/* global Key */
/* global KeyStore */
/* global IqonHash */
/* global LoginFileConfig */
/* global Identicon */
/* global PasswordBox */
/* global Utf8Tools */
/* global KeyStore */
/* global Errors */
/* global TopLevelApi */

/**
 * @callback Connect.resolve
 * @param {KeyguardRequest.ConnectResult} result
 */

class Connect {
    /**
     * @param {Parsed<KeyguardRequest.ConnectRequest>} request
     * @param {Connect.resolve} resolve
     * @param {reject} reject
     */
    constructor(request, resolve, reject) {
        /** @type {HTMLDivElement} */
        const $page = (document.getElementById(Connect.Pages.CONNECT_ACCOUNT));

        /** @type {HTMLSpanElement} */
        const $appName = ($page.querySelector('.app-name'));
        $appName.textContent = request.appName;

        /** @type {HTMLImageElement} */
        const $appIcon = ($page.querySelector('.app-icon'));
        $appIcon.src = request.appLogoUrl.href;
        $appIcon.alt = `${request.appName} logo`;

        /** @type {HTMLDivElement} */
        const $loginFileIcon = ($page.querySelector('.login-file-icon'));
        if (request.keyInfo.type === Nimiq.Secret.Type.ENTROPY) {
            const bgColorClassName = LoginFileConfig[
                IqonHash.getBackgroundColorIndex(request.keyInfo.defaultAddress.toUserFriendlyAddress())
            ].className;
            $loginFileIcon.classList.add(bgColorClassName);
        } else {
            // Show identicon for legacy accounts (which must be supported to support Team Nimiq Multisig)
            $loginFileIcon.innerHTML = ''; // Remove LoginFile icon
            // eslint-disable-next-line no-new
            new Identicon(request.keyInfo.defaultAddress.toUserFriendlyAddress(), $loginFileIcon);
        }

        /** @type {HTMLButtonElement} */
        const $button = ($page.querySelector('.nq-button.continue'));

        // Set up password box
        /** @type {HTMLFormElement} */
        const $passwordBox = (document.querySelector('#password-box'));
        this._passwordBox = new PasswordBox($passwordBox, {
            hideInput: !request.keyInfo.encrypted,
            buttonI18nTag: 'passwordbox-connect-account',
            minLength: request.keyInfo.hasPin ? Key.PIN_LENGTH : undefined,
        });

        $button.addEventListener('click', () => {
            $button.classList.add('display-none');
            $passwordBox.classList.remove('display-none');
        });

        this._passwordBox.on(
            PasswordBox.Events.SUBMIT,
            password => this._onConfirm(request, resolve, reject, password),
        );
    }

    /**
     * @param {Parsed<KeyguardRequest.ConnectRequest>} request
     * @param {Connect.resolve} resolve
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

        /** @type {KeyguardRequest.SignatureResult[]} */
        const signatures = [];

        for (const keyPath of request.requestedKeyPaths) {
            const publicKey = key.derivePublicKey(keyPath);

            /** @type {Uint8Array} */
            const messageBytes = Utf8Tools.stringToUtf8ByteArray(request.challenge);
            const signature = key.signMessage(keyPath, messageBytes);

            signatures.push({
                publicKey: publicKey.serialize(),
                signature: signature.serialize(),
            });
        }

        /** @type {KeyguardRequest.ConnectResult} */
        const result = {
            signatures,
            encryptionKey: {
                format: 'spki',
                keyData: new Uint8Array(await window.crypto.subtle.exportKey('spki', await key.getRsaPublicKey())),
                algorithm: { name: 'RSA-OAEP', hash: 'SHA-256' },
                keyUsages: ['encrypt'],
            },
        };

        resolve(result);
    }

    run() {
        // Go to start page
        window.location.hash = Connect.Pages.CONNECT_ACCOUNT;
    }
}

Connect.Pages = {
    CONNECT_ACCOUNT: 'connect-account',
};
