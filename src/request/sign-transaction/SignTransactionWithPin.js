/* global SignTransaction */
/* global PinInput */
/** Handles a sign-transaction request for keys with encryption type LOW. */
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

        // set html elements
        /** @type {HTMLDivElement} */
        this.$rootElement = (document.getElementById('app'));
        /** @type {HTMLDivElement} */
        this.$button = (this.$rootElement.querySelector('#transaction-data button'));
        /** @type {HTMLDivElement} */
        this.$enterPin = (this.$rootElement.querySelector('#enter-pin'));


        // create components
        this._pinInput = new PinInput();
        this.$enterPin.appendChild(this._pinInput.getElement());

        // wire up logic
        this.$button.addEventListener('click', () => {
            this._pinInput.open();
            window.location.hash = SignTransactionWithPin.Pages.ENTER_PIN;
        });

        this._pinInput.on(PinInput.Events.PIN_ENTERED, this.handlePinInput.bind(this));
    }

    run() {
        // go to start page
        window.location.hash = SignTransactionWithPin.Pages.TRANSACTION_DATA;
    }

    /** @param {string} pin */
    async handlePinInput(pin) {
        document.body.classList.add('loading');

        try {
            const signedTx = await this._signTx(this._txRequest, pin);
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
