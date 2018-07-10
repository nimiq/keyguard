class CreateHigh {
    /**
     * @param {CreateRequest} request
     * @param {Function} resolve
     * @param {Function} reject
     */
    constructor(request, resolve, reject) {
        this._resolve = resolve;
        this._reject = reject;
        this.$chooseIdenticon = /** @type {HTMLElement} */ (document.getElementById(CreateHigh.Pages.CHOOSE_IDENTICON));
        this.$recoveryWords = /** @type {HTMLElement} */ (document.getElementById(CreateHigh.Pages.RECOVERY_WORDS));
        this.$validateWords = /** @type {HTMLElement} */ (document.getElementById(CreateHigh.Pages.VALIDATE_WORDS));
        this.$setPassphrase = /** @type {HTMLElement} */ (document.getElementById(CreateHigh.Pages.SET_PASSPHRASE));

        this._chooseIdenticon = new ChooseIdenticon(request.type, this.$chooseIdenticon);
        this._recoveryWords = new RecoveryWords(this.$recoveryWords);

        this._validateWords = new ValidateWords(this.$validateWords);

        this._passphraseSetter = new PassphraseInput(true);

        const $passphraseSetter = /** @type {HTMLElement} */ (this.$setPassphrase.querySelector('.passphrase-setter'));

        $passphraseSetter.appendChild(this._passphraseSetter.getElement());

        this._passphraseGetter = new PassphraseInput(false);

        const $passphraseGetter = /** @type {HTMLElement} */ (this.$setPassphrase.querySelector('.passphrase-getter'));

        $passphraseGetter.appendChild(this._passphraseGetter.getElement());

        const $passphraseConfirm = /** @type {HTMLElement} */ (this.$setPassphrase.querySelector('.confirm'));

        /** @type {ChooseIdenticon} */
        (this._chooseIdenticon).on(
            ChooseIdenticon.EVENTS.CHOOSE_IDENTICON,
            /** @param {Key} key */
            key => {
                this._selectedKey = key;
                const keyAsUInt8 = Nimiq.BufferUtils.fromHex(key.keyPair.privateKey.toHex());
                this._recoveryWords.privateKey = keyAsUInt8;
                this._validateWords.privateKey = keyAsUInt8;
                this._validateWords.reset();
                window.location.hash = CreateHigh.Pages.PRIVACY_AGENT;
            },
        );

        this._recoveryWords.on(RecoveryWords.Events.CONTINUE, () => location.hash = CreateHigh.Pages.VALIDATE_WORDS);

        this._validateWords.on(ValidateWords.Events.BACK, () => location.hash = CreateHigh.Pages.RECOVERY_WORDS);

        this._validateWords.on(ValidateWords.Events.BACK, () => location.hash = CreateHigh.Pages.RECOVERY_WORDS);

        this._validateWords.on(ValidateWords.Events.VALIDATED, () => location.hash = CreateHigh.Pages.SET_PASSPHRASE);

        this._passphraseSetter.on(PassphraseInput.Events.PASSPHRASE_ENTERED, /** @param {string} passphrase */ passphrase => {
            this._passphrase = passphrase;
            /** @type {PassphraseInput} */ (this._passphraseSetter).reset();
            $passphraseConfirm.classList.remove('display-none');
            $passphraseSetter.classList.add('display-none');
        });

        this._passphraseGetter.on(PassphraseInput.Events.PASSPHRASE_ENTERED, /** @param {string} passphrase */ async passphrase => {
            if (this._passphrase !== passphrase) {
                this._passphraseGetter.onPassphraseIncorrect();
                this._passphraseGetter.reset();
                $passphraseConfirm.classList.add('display-none');
                $passphraseSetter.classList.remove('display-none');
            } else {
                document.body.classList.add('loading');
                this._resolve(await KeyStore.instance.put(this._selectedKey, passphrase));
            }
        });

        window.location.hash = CreateHigh.Pages.CHOOSE_IDENTICON;

        this._chooseIdenticon.generateIdenticons();
    }
}

CreateHigh.Pages = {
    CHOOSE_IDENTICON: 'choose-identicon',
    PRIVACY_AGENT: 'privacy-agent',
    RECOVERY_WORDS: 'recovery-words',
    VALIDATE_WORDS: 'validate-words',
    SET_PASSPHRASE: 'set-passphrase'
};
