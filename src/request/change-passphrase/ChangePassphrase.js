/* global Constants */
/* global PassphraseBox */
/* global PassphraseSetterBox */
/* global KeyStore */
/* global Errors */
/* global Utf8Tools */
/* global TopLevelApi */

class ChangePassphrase {
    /**
     * If a complete page is missing it will be created.
     * However these pages wil be the default pages which usually don't match the applications requirements.
     * Refer to the corresponsing _build() to see the general Structure.
     * @param {ParsedSimpleRequest} request
     * @param {Function} resolve
     * @param {Function} reject
     */
    constructor(request, resolve, reject) {
        this._resolve = resolve;
        this._request = request;
        this._reject = reject;

        /** @type {Key | null} */
        this._key = null;
        this._passphrase = '';

        /** @type {HTMLElement} */
        const $enterPassphrasePage = document.getElementById(ChangePassphrase.Pages.ENTER_PASSPHRASE)
                                  || this._buildEnterPassphrasePage();
        /** @type {HTMLElement} */
        const $setPassphrasePage = document.getElementById(ChangePassphrase.Pages.SET_PASSPHRASE)
                                || this._buildSetPassphrasePage();

        /** @type {HTMLFormElement} */
        const $enterPassphraseBox = ($enterPassphrasePage.querySelector('.passphrase-box'));
        /** @type {HTMLFormElement} */
        const $setPassphraseeBox = ($setPassphrasePage.querySelector('.passphrase-box'));

        this._enterPassphraseBox = new PassphraseBox(
            $enterPassphraseBox, {
                buttonI18nTag: 'passphrasebox-continue',
                hideInput: !this._request.keyInfo.encrypted,
                minLength: this._request.keyInfo.hasPin ? 6 : undefined,
                hideCancel: true,
            },
        );
        this._setPassphraseBox = new PassphraseSetterBox($setPassphraseeBox);
        this._enterPassphraseBox.on(PassphraseBox.Events.SUBMIT, this._passphraseSubmitted.bind(this));
        this._setPassphraseBox.on(PassphraseSetterBox.Events.SUBMIT, this._finish.bind(this));
        this._setPassphraseBox.on(PassphraseSetterBox.Events.SKIP, this._finish.bind(this));
    }

    run() {
        this._enterPassphraseBox.reset();
        window.location.hash = ChangePassphrase.Pages.ENTER_PASSPHRASE;
        if (TopLevelApi.getDocumentWidth() > Constants.MIN_WIDTH_FOR_AUTOFOCUS) {
            this._enterPassphraseBox.focus();
        }
    }

    /**
     * @param {string} phrase
     */
    async _passphraseSubmitted(phrase) {
        TopLevelApi.setLoading(true);
        const passphrase = phrase ? Utf8Tools.stringToUtf8ByteArray(phrase) : undefined;
        /** @type {Key?} */
        let key = null;
        try {
            key = await KeyStore.instance.get(this._request.keyInfo.id, passphrase);
        } catch (e) {
            if (e.message === 'Invalid key') {
                TopLevelApi.setLoading(false);
                this._enterPassphraseBox.onPassphraseIncorrect();
                return;
            }
            this._reject(new Errors.CoreError(e.message));
            return;
        }
        if (!key) {
            this._reject(new Errors.KeyNotFoundError());
            return;
        }
        this._key = key;
        this._setPassphraseBox.reset();
        window.location.hash = ChangePassphrase.Pages.SET_PASSPHRASE;
        if (TopLevelApi.getDocumentWidth() > Constants.MIN_WIDTH_FOR_AUTOFOCUS) {
            this._setPassphraseBox.focus();
        }
        TopLevelApi.setLoading(false);
    }

    /**
     * @param {string} phrase
     */
    async _finish(phrase) {
        TopLevelApi.setLoading(true);
        if (!this._key) {
            this._reject(new Errors.KeyguardError('Bypassed Password'));
            return;
        }

        // In this request, the user can only set a new password (min length: 8) or leave a key unencrypted.
        // In any case, the key is not encrypted with a 6-digit PIN anymore.
        this._key.hasPin = false;

        const passphrase = phrase ? Utf8Tools.stringToUtf8ByteArray(phrase) : undefined;

        await KeyStore.instance.put(this._key, passphrase);

        const result = {
            success: true,
        };
        this._resolve(result);
    }

    _buildEnterPassphrasePage() {
        const $el = document.createElement('div');
        $el.id = ChangePassphrase.Pages.ENTER_PASSPHRASE;
        $el.classList.add('page', 'nq-card');
        $el.innerHTML = `
            <div class="page-header nq-card-header">
                <h1 data-i18n="change-passphrase-heading" class="nq-h1">Change your passphrase</h1>
            </div>

            <div class="page-body nq-card-body">
                <p data-i18n="change-paragraph" class="nq-text">
                    Before entering your new passphrase, you must first unlock your wallet.
                </p>
            </div>

            <div class="page-footer">
                <form class="passphrase-box"></form>
            </div>
        `;
        /** @type {HTMLElement} */
        const $app = (document.getElementById('app'));
        $app.insertBefore($el, $app.children[1]);
        return $el;
    }

    _buildSetPassphrasePage() {
        const $el = document.createElement('div');
        $el.id = ChangePassphrase.Pages.SET_PASSPHRASE;
        $el.classList.add('page', 'nq-card');
        $el.innerHTML = `
            <div class="page-header nq-card-header">
                <a tabindex="0" class="page-header-back-button nq-icon arrow-left"></a>
                <h1 data-i18n="change-passphrase-heading" class="nq-h1">Change your passphrase</h1>
            </div>

            <div class="page-body nq-card-body">
                <p data-i18n="change-set-paragraph" class="nq-text">
                    Now please enter your new Passphrase and repeat it for confirmation.
                </p>
            </div>

            <div class="page-footer">
                <form class="passphrase-box"></form>
            </div>
        `;
        /** @type {HTMLElement} */
        const $app = (document.getElementById('app'));
        $app.insertBefore($el, $app.children[1]);
        return $el;
    }
}

ChangePassphrase.Pages = {
    ENTER_PASSPHRASE: 'enter-passphrase',
    SET_PASSPHRASE: 'set-passphrase',
};
