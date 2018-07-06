/** Handles a sign-transaction request for keys with encryption type HIGH.
 *  Calls this.fire('result', [result]) when done or this.fire('error', [error]) to return with an error.
 */
class SignTransactionWithPassphrase extends SignTransactionView {

    /**
     * @param {TransactionRequest} txRequest
     */
    constructor(txRequest) {
        super();

        this._txRequest = txRequest;

        this.$rootElement = /** @type {HTMLElement} */ (document.getElementById('app'));
        this.$enterPassphrase = /** @type {HTMLElement} */ (this.$rootElement.querySelector('#enter-passphrase'));
        this.$error = /** @type {HTMLElement} */ (this.$rootElement.querySelector('#enter-passphrase #error'));

        // TODO add identicons and other tx data to UI

        this._passphraseInput = new PassphraseInput();

        this.$enterPassphrase.appendChild(this._passphraseInput.getElement());

        this._passphraseInput.on(PassphraseInput.Events.PASSPHRASE_ENTERED, this._handlePassphraseInput.bind(this));

        location.hash = SignTransactionWithPassphrase.Pages.ENTER_PASSPHRASE;
    }

    /** @param {string} passphrase */
    async _handlePassphraseInput(passphrase) {
        document.body.classList.add('loading');

        this.$error.classList.add('hidden');

        try {
            const signedTx = await this._signTx(this._txRequest, passphrase);
            this.fire('result', signedTx);
        } catch (e) {
            // assume the passphrase was wrong
            console.error(e);

            document.body.classList.remove('loading');

            this._passphraseInput.reset();

            this.$error.classList.remove('hidden');
        }
    }
}

SignTransactionWithPassphrase.Pages = {
    ENTER_PASSPHRASE: 'enter-passphrase'
};
