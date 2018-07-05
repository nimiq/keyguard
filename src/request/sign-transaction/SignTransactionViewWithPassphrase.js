/** Handles a sign-transaction request for keys with encryption type HIGH.
 *  Calls this.fire('result', [result]) when done or this.fire('error', [error]) to return with an error.
 */
class SignTransactionWithPassphrase extends SignTransactionView {

    get $rootElement() {
        const element = document.getElementById('app');
        if (!element) throw new InvalidDOMError();
        return element;
    }

    get $transactionData() {
        const element = this.$rootElement.querySelector('#transaction-data');
        if (!element) throw new InvalidDOMError();
        return element;
    }

    get $error() {
        const element = this.$rootElement.querySelector('#enter-passphrase #error');
        if (!element) throw new InvalidDOMError();
        return element;
    }

    /**
     * @param {TransactionRequest} txRequest
     */
    constructor(txRequest) {
        super();

        this._txRequest = txRequest;

        // construct UI

        // TODO add identicons and other tx data to UI

        this._passphraseInput = new PassphraseInput();

        this.$transactionData.appendChild(this._passphraseInput.getElement());

        this._passphraseInput.on(PassphraseInput.Events.PASSPHRASE_ENTERED, this._handlePassphraseInput.bind(this));

        location.hash = SignTransactionWithPassphrase.Pages.ENTER_PASSPHRASE;
    }

    /** @param {string} passphrase */
    async _handlePassphraseInput(passphrase) {
        document.body.classList.add('loading');

        this.$error.textContent = '';

        try {
            const signedTx = await this._signTx(this._txRequest, passphrase);
            this.fire('result', signedTx);
        } catch (e) {
            // assume the passphrase was wrong
            console.error(e);

            document.body.classList.remove('loading');

            this._passphraseInput.reset();

            // TODO i18n
            this.$error.textContent = 'Wrong Pass Phrase, please try again';
        }
    }
}

SignTransactionWithPassphrase.Pages = {
    ENTER_PASSPHRASE: 'enter-passphrase'
};
