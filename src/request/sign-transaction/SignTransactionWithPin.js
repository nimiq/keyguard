/* global SignTransaction */
/* global PinInput */


/**
 * Handles a sign-transaction request for keys with encryption type LOW.
 */
class SignTransactionWithPin extends SignTransaction {
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

        this.fillTransactionDetails(txRequest);

        /** @type {HTMLElement} */
        const $button = (document.querySelector('#transaction-data button'));
        /** @type {HTMLDivElement} */
        const $enterPinPage = (document.querySelector('#enter-pin'));

        $button.addEventListener('click', () => {
            window.location.hash = SignTransactionWithPin.Pages.ENTER_PIN;
        });

        // Go to start page
        window.location.hash = SignTransactionWithPin.Pages.TRANSACTION_DATA;

        // Set up pin input page
        this._pinInput = new PinInput();
        $enterPinPage.appendChild(this._pinInput.getElement());
        this._pinInput.on(PinInput.Events.PIN_ENTERED, this.handlePinInput.bind(this));
    }

    run() {
        // go to start page
        window.location.hash = SignTransactionWithPin.Pages.TRANSACTION_DATA;
        window.addEventListener('hashchange', () => {
            if (window.location.hash.substr(1) === SignTransactionWithPin.Pages.ENTER_PIN) {
                this._pinInput.open();
            } else {
                this._pinInput.close();
            }
        });
    }

    /** @param {string} pin */
    async handlePinInput(pin) {
        document.body.classList.add('loading');

        try {
            const signedTx = await this._doSignTransaction(this._txRequest, pin);
            this._pinInput.close();
            this._resolve(signedTx);
        } catch (e) {
            console.error(e);

            document.body.classList.remove('loading');

            // Assume the pin was wrong
            this._pinInput.onPinIncorrect();
        }
    }
}

SignTransactionWithPin.Pages = {
    TRANSACTION_DATA: 'transaction-data',
    ENTER_PIN: 'enter-pin',
};
