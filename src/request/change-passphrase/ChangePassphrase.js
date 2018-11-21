/* global Nimiq */
/* global PassphraseBox */
/* global PassphraseSetterBox */
/* global KeyStore */

class ChangePassphrase {
    /**
     * if a complete page is missing it will be created.
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

        this._create();
    }

    run() {
        /** @type {PassphraseBox} */ (this._enterPassphrasePassphraseBox).reset();
        window.location.hash = ChangePassphrase.Pages.ENTER_PASSPHRASE;
        /** @type {PassphraseBox} */ (this._enterPassphrasePassphraseBox).focus();
    }

    _create() {
        /** @type {HTMLElement} */
        const $enterPassphrasePage = (
            document.getElementById(ChangePassphrase.Pages.ENTER_PASSPHRASE)
                ? document.getElementById(ChangePassphrase.Pages.ENTER_PASSPHRASE)
                : this._buildEnterPassphrase()
        );
        /** @type {HTMLElement} */
        const $setPassphrasePage = (
            document.getElementById(ChangePassphrase.Pages.SET_PASSPHRASE)
                ? document.getElementById(ChangePassphrase.Pages.SET_PASSPHRASE)
                : this._buildSetPassphrase()
        );

        /** @type {HTMLFormElement} */
        const $enterPassphrasePassphraseBox = ($enterPassphrasePage.querySelector('.passphrase-box'));
        /** @type {HTMLFormElement} */
        const $sertPassphrasePassphraseBox = ($setPassphrasePage.querySelector('.passphrase-box'));

        this._enterPassphrasePassphraseBox = new PassphraseBox(
            $enterPassphrasePassphraseBox, {
                buttonI18nTag: 'passphrasebox-continue',
                hideInput: !this._request.keyInfo.encrypted,
            },
        );
        this._setPassphrasePassphraseBox = new PassphraseSetterBox($sertPassphrasePassphraseBox);

        this._enterPassphrasePassphraseBox.on(PassphraseBox.Events.CANCEL, this._reject.bind(this));
        this._enterPassphrasePassphraseBox.on(PassphraseBox.Events.SUBMIT, async phrase => {
            document.body.classList.add('loading');
            try {
                const passphrase = phrase ? Nimiq.BufferUtils.fromAscii(phrase) : undefined;
                const key = await KeyStore.instance.get(this._request.keyInfo.id, passphrase);
                if (!key) {
                    this._reject(new Error('No key'));
                }
                this._key = key;
                /** @type {PassphraseSetterBox} */ (this._setPassphrasePassphraseBox).reset();
                window.location.hash = ChangePassphrase.Pages.SET_PASSPHRASE;
                /** @type {PassphraseSetterBox} */ (this._setPassphrasePassphraseBox).focus();
            } catch (e) {
                console.log(e); // TODO: Assume Passphrase was incorrect
                /** @type {PassphraseBox} */(this._enterPassphrasePassphraseBox).onPassphraseIncorrect();
            } finally {
                document.body.classList.remove('loading');
            }
        });

        this._setPassphrasePassphraseBox.on(
            PassphraseSetterBox.Events.SUBMIT,
            /** @param {string} passphrase */ passphrase => {
                document.body.classList.add('loading');
                this._passphrase = passphrase;
                this._finish();
            },
        );

        this._setPassphrasePassphraseBox.on(PassphraseSetterBox.Events.SKIP, () => {
            this._finish();
        });
    }

    _buildEnterPassphrase() {
        const $el = document.createElement('div');
        $el.id = ChangePassphrase.Pages.ENTER_PASSPHRASE;
        $el.classList.add('page');
        $el.innerHTML = `
            <div class="page-header">
                <h1 data-i18n="change-passphrase-heading">Change your passphrase</h1>
            </div>

            <div class="page-body">
                <p data-i18n="change-paragraph">
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

    _buildSetPassphrase() {
        const $el = document.createElement('div');
        $el.id = ChangePassphrase.Pages.SET_PASSPHRASE;
        $el.classList.add('page');
        $el.innerHTML = `
            <div class="page-header">
                <a tabindex="0" class="page-header-back-button icon-back-arrow"></a>
                <h1 data-i18n="change-passphrase-heading">Change your passphrase</h1>
            </div>

            <div class="page-body">
                <p data-i18n="change-set-paragraph">
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

    async _finish() {
        if (this._key) {
            const passphrase = this._passphrase.length > 0 ? Nimiq.BufferUtils.fromAscii(this._passphrase) : undefined;
            await KeyStore.instance.put(this._key, passphrase);

            const result = {
                success: true,
            };
            this._resolve(result);
        }
        this._reject(new Error('Bypassed Password'));
    }
}

ChangePassphrase.Pages = {
    ENTER_PASSPHRASE: 'enter-passphrase',
    SET_PASSPHRASE: 'set-passphrase',
};
