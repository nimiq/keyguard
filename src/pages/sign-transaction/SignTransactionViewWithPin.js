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

        // construct UI
        const rootElement = document.getElementById('app');

        if (!rootElement) {
            this.fire('error', new InvalidDOMError());
            return;
        }

        const $button = rootElement.querySelector('#transaction-data button');
        const $enterPin = rootElement.querySelector('#enter-pin');

        if (!$button || !$enterPin) {
            this.fire('error', new InvalidDOMError());
            return;
        }

        $button.addEventListener('click', () => location.hash = SignTransactionWithPin.Pages.ENTER_PIN);

        this.$pinInput = new PinInput();

        $enterPin.appendChild(this.$pinInput.getElement());

        this.$pinInput.open();

        this.$pinInput.on(PinInput.Events.PIN_ENTERED, this.handlePinInput.bind(this));

        // go to start page
        location.hash = SignTransactionWithPin.Pages.TRANSACTION_DATA;
    }

    /**
     * @param {string} pin
     */
    async handlePinInput(pin) {
        document.body.classList.add('loading');

        try {
            const signedTx = await this._signTx(this._txRequest, pin);
            this.fire('result', signedTx);
        } catch (e) {
            // assume the pin was wrong
            console.error(e);

            document.body.classList.remove('loading');

            this.$pinInput.onPinIncorrect();
        }
    }
}

SignTransactionWithPin.Pages = {
    TRANSACTION_DATA: 'transaction-data',
    ENTER_PIN: 'enter-pin'
};
