class Create extends RequestApi {
    /**
     * @param {CreateRequest} request
     */
    onRequest(request) {
        // contains UI elements of #choose-identicon
        this._chooseIdenticon = {
            $container: /** @type {HTMLElement} */ (document.querySelector('#choose-identicon .identicon-container')),
            $loading: /** @type {HTMLElement} */ (document.querySelector('#choose-identicon .loading')),
            $confirmButton: /** @type {HTMLElement} */ (document.querySelector('#choose-identicon .backdrop button')),
            $generateMoreButton: /** @type {HTMLElement} */ (document.querySelector('#choose-identicon .generate-more')),
            $backdrop: /** @type {HTMLElement} */ (document.querySelector('#choose-identicon .backdrop'))
        };

        this._chooseIdenticon.$generateMoreButton.addEventListener('click', this._generateIdenticons);
        this._chooseIdenticon.$backdrop.addEventListener('click', this._clearSelection);



        location.hash = Create.Pages.CHOOSE_IDENTICON;
    }

    _generateIdenticons() {

    }

    _clearSelection() {

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