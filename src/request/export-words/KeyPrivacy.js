/* global I18n */
/* global Nimiq */
/* global Key */
/* global PassphraseInput */
/* global PrivacyWarning */

class KeyPrivacy extends Nimiq.Observable { // eslint-disable-line no-unused-vars
    /**
     * @param {HTMLElement} [$el]
     */
    constructor($el) {
        super();
        this.$el = KeyPrivacy._createElement($el);

        /** @type {HTMLElement} */
        const $privacyWarning = (this.$el.querySelector('.agent'));
        this._privacyWarning = new PrivacyWarning($privacyWarning);

        /** @type {HTMLElement} */
        const $passphrase = (this.$el.querySelector('.passphrase'));
        this._passphrase = new PassphraseInput($passphrase);

        /** @type {HTMLElement} */
        const $continue = (this.$el.querySelector('.continue'));
        $continue.addEventListener('click', () => {
            this.fire(KeyPrivacy.Events.PASSWORD_SUBMIT, this._passphrase.text);
        });
    }

    /**
     * @param {HTMLElement} [existingElement]
     * @returns {HTMLElement}
     */
    static _createElement(existingElement) {
        /** @type HTMLElement */
        const element = existingElement || document.createElement('div');

        /* eslint-disable max-len */
        element.innerHTML = `
            <h1 data-18n="create-backup-account-header">Backup your Account</h1>
            <div class="grow"></div>
            <div class="agent"></div>
            <div class="grow"></div>
            <p>The recovery words will not be encrypted with your password. Enter your password to unlock <strong class="key-label-friendlyid">the key</strong>.</p>
            <div class="passphrase"></div>
            <div class="grow"></div>
            <button class="continue">Show words</button>
        `;
        /* eslint-enable max-len */

        I18n.translateDom(element);
        return element;
    }

    /**
     * @param {string} keyId
     * @param {string | undefined} keyLabel
     */
    setFriendlyKey(keyId, keyLabel) {
        const $keyLabelFriendlyId = /** @type {HTMLElement} */ (document.querySelector('.key-label-friendlyid'));
        const userFriendlyId = Key.idToUserFriendlyId(keyId);
        $keyLabelFriendlyId.textContent = keyLabel !== undefined ? `${keyLabel} (${userFriendlyId})` : userFriendlyId;
    }

    async onPassphraseIncorrect() {
        this._passphrase.onPassphraseIncorrect();
    }
}

KeyPrivacy.Events = {
    PASSWORD_SUBMIT: 'key-privacy-password',
};
