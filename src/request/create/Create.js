class Create extends PopupApi {
    constructor() {
        super();
        this.$chooseIdenticon = /** @type {HTMLElement} */ (document.getElementById(Create.Pages.CHOOSE_IDENTICON));
        this.$recoveryWords = /** @type {HTMLElement} */ (document.getElementById(Create.Pages.RECOVERY_WORDS));
        this.$validateWords = /** @type {HTMLElement} */ (document.getElementById(Create.Pages.VALIDATE_WORDS));
    }

    /**
     * @param {CreateRequest} request
     */
    onRequest(request) {
        this._chooseIdenticon = new ChooseIdenticon(request.type, this.$chooseIdenticon);

        this._recoveryWords = new RecoveryWords(this.$recoveryWords);

        this._validateWords= new ValidateWords(this.$validateWords);

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

        this._recoveryWords.on('continue', () => location.hash = Create.Pages.VALIDATE_WORDS);

        this._validateWords.on('back', () => location.hash = Create.Pages.RECOVERY_WORDS);

        window.location.hash = Create.Pages.CHOOSE_IDENTICON;

        this._chooseIdenticon.generateIdenticons();
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
