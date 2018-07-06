class Create extends RequestApi {

    constructor() {
        super();

        this.$chooseIdenticon = /** @type {HTMLElement} */ (document.getElementById('choose-identicon'));
    }

    /**
     * @param {CreateRequest} request
     */
    onRequest(request) {
        this._chooseIdenticon = new ChooseIdenticon(request.type, this.$chooseIdenticon);

        this._chooseIdenticon.on(
            ChooseIdenticon.EVENTS.CHOOSE_IDENTICON,
            /** @param {Nimiq.KeyPair} keyPair */
            keyPair => {
                location.hash = Create.Pages.BACKUP;
            }
        );

        location.hash = Create.Pages.CHOOSE_IDENTICON;

        this._chooseIdenticon.generateIdenticons();
    }
}

Create.Pages = {
    CHOOSE_IDENTICON: 'choose-identicon',
    BACKUP: 'backup',
    SHOW_WORDS: 'show-words',
    VALIDATE_WORDS: 'validate-words',
    SET_PASSPHRASE: 'set-passphrase',
    SET_PIN: 'set-pin'
};

runKeyguard(Create);