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



        /** @type {HTMLDivElement} */
        const $passphraseConfirm = (this.$setPassphrase.querySelector('.confirm'));

        // create components
        this._chooseIdenticon = new ChooseIdenticon(this.$chooseIdenticon);
        /** @type {HTMLElement} */
        const $privacyAgentContainer = (this.$privacyAgent.querySelector('.agent'));
        this._privacyAgent = new PrivacyAgent($privacyAgentContainer);
        this._recoveryWords = new RecoveryWords(this.$recoveryWords);
        this._validateWords = new ValidateWords(this.$validateWords);
        this._setPassphrase = new SetPassphrase(this.$setPassphrase);

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
                window.location.hash = CreateHigh.Pages.SET_PASSPHRASE;
            },
        );

        this._setPassphrase.on(SetPassphrase.Events.CHOOSE, /** @param {string} passphrase */ (passphrase) => {
            this._passphrase = passphrase;
            this._setPassphrase.reset();
            window.location.hash = CreateHigh.Pages.PRIVACY_AGENT;
        });

        this._privacyAgent.on(PrivacyAgent.Events.CONFIRM, () => {
            window.location.hash = CreateHigh.Pages.RECOVERY_WORDS;
        });

        this._recoveryWords.on(RecoveryWords.Events.CONTINUE, () => {
            window.location.hash = CreateHigh.Pages.VALIDATE_WORDS;
        });

        this._validateWords.on(ValidateWords.Events.BACK, () => {
            window.location.hash = CreateHigh.Pages.RECOVERY_WORDS;
        });

        this._validateWords.on(ValidateWords.Events.VALIDATED, async () => {
            document.body.classList.add('loading');
            const key = new Key(this._selectedKeyPair, request.type);
            this._resolve(await KeyStore.instance.put(key, this._passphrase));
        });
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
