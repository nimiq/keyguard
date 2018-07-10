class Create extends PopupApi {
    constructor() {
        super();
        this.$chooseIdenticon = /** @type {HTMLElement} */ (document.getElementById(Create.Pages.CHOOSE_IDENTICON));
        this.$recoveryWords = /** @type {HTMLElement} */ (document.getElementById(Create.Pages.RECOVERY_WORDS));
        this.$validateWords = /** @type {HTMLElement} */ (document.getElementById(Create.Pages.VALIDATE_WORDS));
        this.$setPassphrase = /** @type {HTMLElement} */ (document.getElementById(Create.Pages.SET_PASSPHRASE));
        this.$setPin = /** @type {HTMLElement} */ (document.getElementById(Create.Pages.SET_PIN));

        this._createHigh = this._createHigh.bind(this);
        this._createLow = this._createLow.bind(this);
    }

    /**
     * @param {CreateRequest} request
     */
    onRequest(request) {
        this._chooseIdenticon = new ChooseIdenticon(request.type, this.$chooseIdenticon);

        if (request.type === EncryptionType.HIGH) {
            this._createHigh();
        } else {
            this._createLow();
        }

        window.location.hash = Create.Pages.CHOOSE_IDENTICON;

        this._chooseIdenticon.generateIdenticons();
    }

    _createHigh() {
        this._recoveryWords = new RecoveryWords(this.$recoveryWords);

        this._validateWords = new ValidateWords(this.$validateWords);

        this._passphraseSetter = new PassphraseInput(true);

        const $passphraseSetter = /** @type {HTMLElement} */ (this.$setPassphrase.querySelector('.passphrase-setter'));

        $passphraseSetter.appendChild(this._passphraseSetter.getElement());

        this._passphraseGetter = new PassphraseInput(false);

        const $passphraseGetter = /** @type {HTMLElement} */ (this.$setPassphrase.querySelector('.passphrase-getter'));

        $passphraseGetter.appendChild(this._passphraseGetter.getElement());

        const $passphraseConfirm = /** @type {HTMLElement} */ (this.$setPassphrase.querySelector('.confirm'));

        this._chooseIdenticon.on(
            ChooseIdenticon.EVENTS.CHOOSE_IDENTICON,
            /** @param {Key} key */
            key => {
                this._selectedKey = key;
                const keyAsUint8 = Nimiq.BufferUtils.fromHex(key.keyPair.privateKey.toHex());
                /** @type {RecoveryWords} */ (this._recoveryWords).privateKey = keyAsUint8;
                /** @type {ValidateWords} */ (this._validateWords).privateKey = keyAsUint8;
                /** @type {ValidateWords} */ (this._validateWords).reset();
                window.location.hash = Create.Pages.PRIVACY_AGENT;
            },
        );

        this._recoveryWords.on(RecoveryWords.Events.CONTINUE, () => location.hash = Create.Pages.VALIDATE_WORDS);

        this._validateWords.on(ValidateWords.Events.BACK, () => location.hash = Create.Pages.RECOVERY_WORDS);

        this._validateWords.on(ValidateWords.Events.BACK, () => location.hash = Create.Pages.RECOVERY_WORDS);

        this._validateWords.on(ValidateWords.Events.VALIDATED, () => location.hash = Create.Pages.SET_PASSPHRASE);

        this._passphraseSetter.on(PassphraseInput.Events.PASSPHRASE_ENTERED, passphrase => {
            this._passphrase = passphrase;
            this._passphraseSetter.reset();
            $passphraseConfirm.classList.remove('display-none');
            $passphraseSetter.classList.add('display-none');
        });

        this._passphraseGetter.on(PassphraseInput.Events.PASSPHRASE_ENTERED, async passphrase => {
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
    }

    _createLow() {
        const $pinInput = this.$setPin.querySelector('.pinpad');

        this._pinInput = new PinInput($pinInput);

        this._chooseIdenticon.on(
            ChooseIdenticon.EVENTS.CHOOSE_IDENTICON,
            /** @param {Key} key */
            key => {
                this._selectedKey = key;
                window.location.hash = Create.Pages.SET_PIN;
                this._pinInput.open();
            },
        );

        const $confirmMessage = this.$setPin.querySelector('.confirm-message');
        const $notMatchingMessage = this.$setPin.querySelector('.not-matching-message');

        this._pinInput.on(PinInput.Events.PIN_ENTERED, async pin => {
            $confirmMessage.classList.add('hidden');
            $notMatchingMessage.classList.add('hidden');

            if (!this._pin) {
                this._pin = pin;
                this._pinInput.reset();
                $confirmMessage.classList.remove('hidden');
            } else if (this._pin !== pin) {
                this._pinInput.onPinIncorrect();
                this._pin = null;
                $notMatchingMessage.classList.remove('hidden');
            } else {
                document.body.classList.add('loading');
                this._resolve(await KeyStore.instance.put(this._selectedKey, pin));
            }
        });
    }
}

Create.Pages = {
    CHOOSE_IDENTICON: 'choose-identicon',
    PRIVACY_AGENT: 'privacy-agent',
    RECOVERY_WORDS: 'recovery-words',
    VALIDATE_WORDS: 'validate-words',
    SET_PASSPHRASE: 'set-passphrase',
    SET_PIN: 'set-pin',
};

runKeyguard(Create);
