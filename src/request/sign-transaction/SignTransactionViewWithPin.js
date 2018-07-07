/** Handles a sign-transaction request for keys with encryption type LOW.
 *  Calls this.fire('result', [result]) when done or this.fire('error', [error]) to return with an error.
 */
class SignTransactionWithPin extends SignTransactionView {
    /**
     * @param {TransactionRequest} txRequest
     */
    constructor(txRequest) {
        super();

        this._txRequest = txRequest;

        this.$rootElement = /** @type {HTMLElement} */ (document.getElementById('app'));
        this.$button = /** @type {HTMLElement} */ (this.$rootElement.querySelector('#transaction-data button'));
        this.$enterPin = /** @type {HTMLElement} */ (this.$rootElement.querySelector('#enter-pin'));

        this.$button.addEventListener('click', () => {
            window.location.hash = SignTransactionWithPin.Pages.ENTER_PIN;
        });

        this._pinInput = new PinInput();

        this.$enterPin.appendChild(this._pinInput.getElement());

        this._pinInput.open();

        this._pinInput.on(PinInput.Events.PIN_ENTERED, this.handlePinInput.bind(this));

        // go to start page
        window.location.hash = SignTransactionWithPin.Pages.TRANSACTION_DATA;
    }

    /** @param {string} pin */
    async handlePinInput(pin) {
        document.body.classList.add('loading');

        try {
            const signedTx = await this._signTx(this._txRequest, pin);
            this._pinInput.close();
            this.fire('result', signedTx);
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
