/* global SignTransaction */
/* global PinInput */
/* global Identicon */
/* global Nimiq */


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

        // Set DOM references
        /** @type {HTMLDivElement} */
        this.$rootElement = (document.getElementById('app'));

        /** @type {HTMLDivElement} */
        this.$senderIdenticon = (this.$rootElement.querySelector('#sender-identicon'));
        /** @type {HTMLDivElement} */
        this.$recipientIdenticon = (this.$rootElement.querySelector('#recipient-identicon'));

        /** @type {HTMLDivElement} */
        this.$senderLabel = (this.$rootElement.querySelector('#sender-label'));
        /** @type {HTMLDivElement} */
        this.$recipientLabel = (this.$rootElement.querySelector('#recipient-label'));

        /** @type {HTMLDivElement} */
        this.$senderAddress = (this.$rootElement.querySelector('#sender-address'));
        /** @type {HTMLDivElement} */
        this.$recipientAddress = (this.$rootElement.querySelector('#recipient-address'));

        /** @type {HTMLDivElement} */
        this.$value = (this.$rootElement.querySelector('#value'));
        /** @type {HTMLDivElement} */
        this.$fee = (this.$rootElement.querySelector('#fee'));
        /** @type {HTMLDivElement} */
        this.$message = (this.$rootElement.querySelector('#message'));

        /** @type {HTMLElement} */
        this.$button = (this.$rootElement.querySelector('#transaction-data button'));
        /** @type {HTMLDivElement} */
        this.$enterPinPage = (this.$rootElement.querySelector('#enter-pin'));

        // Set data
        new Identicon(txRequest.sender, this.$senderIdenticon);
        new Identicon(txRequest.recipient, this.$recipientIdenticon);

        if (txRequest.senderLabel) {
            this.$senderLabel.classList.remove('display-none');
            this.$senderLabel.textContent = txRequest.senderLabel;
        }
        if (txRequest.recipientLabel) {
            this.$recipientLabel.classList.remove('display-none');
            this.$recipientLabel.textContent = txRequest.recipientLabel;
        }

        this.$senderAddress.textContent = txRequest.sender;
        this.$recipientAddress.textContent = txRequest.recipient;

        this.$value.textContent = Nimiq.Policy.satoshisToCoins(txRequest.value).toString();
        if (txRequest.fee > 0) {
            this.$fee.textContent = Nimiq.Policy.satoshisToCoins(txRequest.fee).toString();
            const $feeSection = this.$rootElement.querySelector('.fee-section');
            if ($feeSection) $feeSection.classList.remove('display-none');
        }

        // if (txRequest.type === TransactionType.EXTENDED && txRequest.extraData) {
        //     this.$message.textContent = extraData;
        // }

        this.$button.addEventListener('click', () => {
            window.location.hash = SignTransactionWithPin.Pages.ENTER_PIN;
        });

        // Go to start page
        window.location.hash = SignTransactionWithPin.Pages.TRANSACTION_DATA;

        // Set up pin input page
        this._pinInput = new PinInput();
        this.$enterPinPage.appendChild(this._pinInput.getElement());
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
