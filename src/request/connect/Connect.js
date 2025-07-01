/* global Nimiq */
/* global SignMessagePrefix */
/* global I18n */
/* global Key */
/* global KeyStore */
/* global LoginFileAccountIcon */
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
        const $page = /** @type {HTMLDivElement} */ (document.getElementById(Connect.Pages.CONNECT_ACCOUNT));

        const $connectHeading = /** @type {HTMLHeadingElement} */ ($page.querySelector('.connect-heading'));
        I18n.translateToHtmlContent($connectHeading, 'connect-heading', { appName: request.appName });

        const $appIcon = /** @type {HTMLImageElement} */ ($page.querySelector('.app-icon'));
        $appIcon.src = request.appLogoUrl.href;
        $appIcon.alt = `${request.appName} logo`;

        const $loginFileIcon = /** @type {HTMLDivElement} */ ($page.querySelector('.login-file-account-icon'));
        if (request.keyInfo.type === Nimiq.Secret.Type.ENTROPY) {
            // eslint-disable-next-line no-new
            new LoginFileAccountIcon(request.keyInfo.defaultAddress.toUserFriendlyAddress(), $loginFileIcon);
        } else {
            // Show identicon for legacy accounts (which must be supported to support Team Nimiq Multisig)
            // eslint-disable-next-line no-new
            new Identicon(request.keyInfo.defaultAddress.toUserFriendlyAddress(), $loginFileIcon);
        }

        const $addressCountInfo = /** @type {HTMLElement} */ ($page.querySelector('.address-count-info'));
        if (request.requestedKeyPaths.length > 1) {
            I18n.translateToHtmlContent($addressCountInfo, 'connect-address-count-info', {
                appName: request.appName,
                addressCount: request.requestedKeyPaths.length.toString(),
            });
            $addressCountInfo.classList.remove('display-none');
        }

        const $tooltipAddressInfo = /** @type {HTMLElement} */ ($page.querySelector('.connect-tooltip-address-info'));
        if (request.requestedKeyPaths.length === 1 && request.requestedKeyPaths[0] === 'm/44\'/242\'/0\'/0\'') {
            // Special translation for the most common case, that only the first address is used.
            I18n.translateToHtmlContent($tooltipAddressInfo, 'connect-tooltip-address-info-first-address');
        } else {
            const translateTooltipAddressInfo = () => { // eslint-disable-line require-jsdoc-except/require-jsdoc
                const listFormatter = new Intl.ListFormat([
                    I18n.language,
                    navigator.language, // fallback
                    'en-US', // en-US as last resort
                ]);
                const paths = listFormatter.format(request.requestedKeyPaths);
                I18n.translateToHtmlContent(
                    $tooltipAddressInfo,
                    'connect-tooltip-address-info-multiple-addresses',
                    { paths },
                    false,
                );
            };
            translateTooltipAddressInfo();
            I18n.observer.on(I18n.Events.LANGUAGE_CHANGED, translateTooltipAddressInfo);
        }

        // Set up password box
        const $passwordBox = /** @type {HTMLFormElement} */ (document.querySelector('#password-box'));
        this._passwordBox = new PasswordBox($passwordBox, {
            hideInput: !request.keyInfo.encrypted,
            buttonI18nTag: 'passwordbox-connect-account',
            minLength: request.keyInfo.hasPin ? Key.PIN_LENGTH : undefined,
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
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            if (errorMessage === 'Invalid key') {
                TopLevelApi.setLoading(false);
                this._passwordBox.onPasswordIncorrect();
                return;
            }
            reject(new Errors.CoreError(error instanceof Error ? error : errorMessage));
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
            // Sign the challenge with a distinct prefix, to avoid blind signing as a regular Nimiq message, which could
            // be used to impersonate the user.
            const signature = key.signMessage(keyPath, messageBytes, SignMessagePrefix.CONNECT_CHALLENGE);

            signatures.push({
                publicKey: publicKey.serialize(),
                signature: signature.serialize(),
            });
        }

        const keyParams = Key.defaultRsaKeyParams;
        const rsaPublicCryptoKey = await key.getRsaPublicKey(keyParams);

        /** @type {KeyguardRequest.ConnectResult} */
        const result = {
            signatures,
            encryptionKey: {
                format: 'spki',
                keyData: new Uint8Array(await window.crypto.subtle.exportKey('spki', rsaPublicCryptoKey)),
                algorithm: {
                    name: rsaPublicCryptoKey.algorithm.name,
                    hash: (/** @type {RsaHashedKeyAlgorithm} */ (rsaPublicCryptoKey.algorithm)).hash.name,
                },
                keyUsages: ['encrypt'],
                keyParams,
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
