/** Handles a sign-transaction request for keys with encryption type LOW.
 *  Calls this.fire('result', [result]) when done or this.fire('error', [error]) to return with an error.
 */
class SignTransactionWithPin extends SignTransactionView {

    get $rootElement() {
        const element = document.getElementById('app');
        if (!element) throw new InvalidDOMError();
        return element;
    }

    get $button() {
        const element = this.$rootElement.querySelector('#transaction-data button');
        if (!element) throw new InvalidDOMError();
        return element;
    }

    get $enterPin() {
        const element = this.$rootElement.querySelector('#transaction-data button');
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

        this.$button.addEventListener('click', () => location.hash = SignTransactionWithPin.Pages.ENTER_PIN);

        this._pinInput = new PinInput();

        this.$enterPin.appendChild(this._pinInput.getElement());

        this._pinInput.open();

        this._pinInput.on(PinInput.Events.PIN_ENTERED, this.handlePinInput.bind(this));

        // go to start page
        location.hash = SignTransactionWithPin.Pages.TRANSACTION_DATA;
    }

    /** @param {string} pin */
    async handlePinInput(pin) {
        document.body.classList.add('loading');

        try {
            const signedTx = await this._signTx(this._txRequest, pin);
            this.fire('result', signedTx);
        } catch (e) {
            // assume the pin was wrong
            console.error(e);

            document.body.classList.remove('loading');

            this._pinInput.onPinIncorrect();
        }
    }
}

SignTransactionWithPin.Pages = {
    TRANSACTION_DATA: 'transaction-data',
    ENTER_PIN: 'enter-pin'
};
