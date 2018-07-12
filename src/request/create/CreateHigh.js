/* global RecoveryWords */
/* global ValidateWords */
/* global ChooseIdenticon */
/* global PrivacyAgent */
/* global PassphraseInput */
/* global Key */
/* global KeyStore */

class CreateHigh {
    /**
     * @param {CreateRequest} request
     * @param {Function} resolve
     * @param {Function} reject
     */
    constructor(request, resolve, reject) {
        this._resolve = resolve;
        this._reject = reject;

        // set html elements
        /** @type {HTMLDivElement} */
        this.$chooseIdenticon = (document.getElementById(CreateHigh.Pages.CHOOSE_IDENTICON));

        /** @type {HTMLDivElement} */
        this.$privacyAgent = (document.getElementById(CreateHigh.Pages.PRIVACY_AGENT));

        /** @type {HTMLDivElement} */
        this.$recoveryWords = (document.getElementById(CreateHigh.Pages.RECOVERY_WORDS));

        /** @type {HTMLDivElement} */
        this.$validateWords = (document.getElementById(CreateHigh.Pages.VALIDATE_WORDS));

        /** @type {HTMLDivElement} */
        this.$setPassphrase = (document.getElementById(CreateHigh.Pages.SET_PASSPHRASE));

        /** @type {HTMLFormElement} */
        const $passphraseSetter = (this.$setPassphrase.querySelector('.passphrase-setter'));

        /** @type {HTMLFormElement} */
        const $passphraseGetter = (this.$setPassphrase.querySelector('.passphrase-getter'));

        /** @type {HTMLDivElement} */
        const $passphraseConfirm = (this.$setPassphrase.querySelector('.confirm'));

        // create components
        this._chooseIdenticon = new ChooseIdenticon(this.$chooseIdenticon);
        this._privacyAgent = new PrivacyAgent(this.$privacyAgent);
        this._recoveryWords = new RecoveryWords(this.$recoveryWords);
        this._validateWords = new ValidateWords(this.$validateWords);
        this._passphraseSetter = new PassphraseInput(true, $passphraseSetter);
        this._passphraseGetter = new PassphraseInput(false, $passphraseGetter);

        // wire up logic
        this._chooseIdenticon.on(
            ChooseIdenticon.Events.CHOOSE_IDENTICON,
            /** @param {Nimiq.KeyPair} keyPair */
            keyPair => {
                this._selectedKeyPair = keyPair;
                const keyAsUInt8 = keyPair.privateKey.serialize();
                this._recoveryWords.privateKey = keyAsUInt8;
                this._validateWords.privateKey = keyAsUInt8;
                this._validateWords.reset();
                window.location.hash = CreateHigh.Pages.PRIVACY_AGENT;
            },
        );

        this._privacyAgent.on(PrivacyAgent.Events.CONFIRM, () => {
            window.location.hash = CreateHigh.Pages.RECOVERY_WORDS;
        });

        this._recoveryWords.on(RecoveryWords.Events.CONTINUE, () => {
            window.location.hash = CreateHigh.Pages.VALIDATE_WORDS;
        });

        this._validateWords.on(ValidateWords.Events.BACK, () => {
            window.location.hash = CreateHigh.Pages.RECOVERY_WORDS;
        });

        this._validateWords.on(ValidateWords.Events.VALIDATED, () => {
            window.location.hash = CreateHigh.Pages.SET_PASSPHRASE;
        });

        this._passphraseSetter.on(
            PassphraseInput.Events.PASSPHRASE_ENTERED,
            /** @param {string} passphrase */ passphrase => {
                this._passphrase = passphrase;
                this._passphraseSetter.reset();
                $passphraseConfirm.classList.remove('display-none');
                $passphraseSetter.classList.add('display-none');
            },
        );

        this._passphraseGetter.on(
            PassphraseInput.Events.PASSPHRASE_ENTERED,
            /** @param {string} passphrase */ async passphrase => {
                if (this._passphrase !== passphrase) {
                    this._passphraseGetter.onPassphraseIncorrect();
                    this._passphraseGetter.reset();
                    $passphraseConfirm.classList.add('display-none');
                    $passphraseSetter.classList.remove('display-none');
                } else {
                    document.body.classList.add('loading');
                    const key = new Key(this._selectedKeyPair, request.type);
                    this._resolve(await KeyStore.instance.put(key, passphrase));
                }
            },
        );
    }

    run() {
        // go to start page
        window.location.hash = CreateHigh.Pages.CHOOSE_IDENTICON;

        this._chooseIdenticon.generateIdenticons();
    }
}

CreateHigh.Pages = {
    CHOOSE_IDENTICON: 'choose-identicon',
    PRIVACY_AGENT: 'privacy-agent',
    RECOVERY_WORDS: 'recovery-words',
    VALIDATE_WORDS: 'validate-words',
    SET_PASSPHRASE: 'set-passphrase',
};
