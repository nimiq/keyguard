/* global SignTransaction */
/* global PassphraseInput */

/**
 * Handles a sign-transaction request for keys with encryption type HIGH.
 */
class SignTransactionWithPassphrase extends SignTransaction {
    /**
     * @param {Keyguard.TransactionRequest} txRequest
     * @param {Function} resolve
     * @param {Function} reject
     */
    constructor(txRequest, resolve, reject) {
        super();
        this._txRequest = txRequest;
        this._resolve = resolve;
        this._reject = reject;

        /** @type {HTMLDivElement} */
        const $enterPassphrase = (document.querySelector('#enter-passphrase'));

        /** @type {HTMLDivElement} */
        this.$error = ($enterPassphrase.querySelector('#error'));

        /** @type {HTMLFormElement} */
        const $passphraseInput = ($enterPassphrase.querySelector('#passphrase-input'));

        const $transaction = this.fillTransactionDetails(txRequest);
        $enterPassphrase.insertBefore($transaction, $passphraseInput);

        // Set up passphrase input
        this._passphraseInput = new PassphraseInput(false, $passphraseInput);
        this._passphraseInput.on(PassphraseInput.Events.PASSPHRASE_ENTERED, this._handlePassphraseInput.bind(this));
    }

    run() {
        // Go to start page
        window.location.hash = SignTransactionWithPassphrase.Pages.ENTER_PASSPHRASE;
        this._passphraseInput.focus();
    }

    /** @param {string} passphrase */
    async _handlePassphraseInput(passphrase) {
        document.body.classList.add('loading');

        this.$error.classList.add('hidden');

        try {
            const signedTx = await this._doSignTransaction(this._txRequest, passphrase);
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
