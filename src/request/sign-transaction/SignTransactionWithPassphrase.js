/* global SignTransaction */
/* global PassphraseInput */
/** Handles a sign-transaction request for keys with encryption type HIGH. */
class SignTransactionWithPassphrase extends SignTransaction {
    /**
     * @param {TransactionRequest} txRequest
     * @param {Function} resolve
     * @param {Function} reject
     */
    constructor(txRequest, resolve, reject) {
        super();
        this._txRequest = txRequest;
        this._resolve = resolve;
        this._reject = reject;

        // set html elements
        /** @type {HTMLDivElement} */
        this.$rootElement = (document.getElementById('app'));

        /** @type {HTMLDivElement} */
        this.$enterPassphrase = (document.getElementById('enter-passphrase'));

        /** @type {HTMLDivElement} */
        this.$error = (this.$rootElement.querySelector('#enter-passphrase #error'));

        // TODO add identicons and other tx data to UI

        // create components
        this._passphraseInput = new PassphraseInput();
        this.$enterPassphrase.appendChild(this._passphraseInput.getElement());

        // wire up logic
        this._passphraseInput.on(PassphraseInput.Events.PASSPHRASE_ENTERED, this._handlePassphraseInput.bind(this));
    }

    run() {
        // go to start page
        window.location.hash = SignTransactionWithPassphrase.Pages.ENTER_PASSPHRASE;
    }

    /** @param {string} passphrase */
    async _handlePassphraseInput(passphrase) {
        document.body.classList.add('loading');

        this.$error.classList.add('hidden');

        try {
            const signedTx = await this._signTx(this._txRequest, passphrase);
            this._resolve(signedTx);
        } catch (e) {
            console.error(e);

            document.body.classList.remove('loading');

            // Assume the passphrase was wrong
            this._passphraseInput.onPassphraseIncorrect();

            this.$error.classList.remove('hidden');
        }
    }
}

SignTransactionWithPassphrase.Pages = {
    ENTER_PASSPHRASE: 'enter-passphrase',
};
