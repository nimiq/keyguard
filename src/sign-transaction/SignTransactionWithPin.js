/** Handles a sign-transaction request for keys with encryption type LOW.
 *  Calls this.fire('result', [result]) when done or this.fire('error', [error]) to return with an error.
 */
class SignTransactionWithPin extends Nimiq.Observable {

    get Pages() {
        return {
            TRANSACTION_DATA: 'transaction-data',
            ENTER_PIN: 'enter-pin'
        };
    }
    /** @param {TransactionRequest} txRequest */
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

        $button.addEventListener('click', () => location.hash = this.Pages.ENTER_PIN);

        this.$pinInput = new PinInput();

        $enterPin.appendChild(this.$pinInput.getElement());

        this.$pinInput.open();

        this.$pinInput.on(PinInput.Events.PIN_ENTERED, this.handlePinInput.bind(this));

        // go to start page
        location.hash = this.Pages.TRANSACTION_DATA
    }

    /** @param {string} pin */
    async handlePinInput(pin) {
        document.body.classList.add('loading');

        const keyStore = KeyStore.instance;

        if (this._txRequest.type !== TransactionType.BASIC) {
            this.fire('error', new Error('not yet implemented'));
            return;
        }

        const {value, fee, recipient, signer, validityStartHeight} = this._txRequest;

        try {
            const key = await keyStore.get(signer, pin);
            const tx = key.createTransaction(recipient, value, fee, validityStartHeight);

            const signatureProof = Nimiq.SignatureProof.unserialize(new Nimiq.SerialBuffer(tx.proof));

            this.fire('result', {
                sender: tx.sender.toUserFriendlyAddress(),
                senderPubKey: signatureProof.publicKey.serialize(),
                recipient: tx.recipient.toUserFriendlyAddress(),
                value: Nimiq.Policy.satoshisToCoins(tx.value),
                fee: Nimiq.Policy.satoshisToCoins(tx.fee),
                validityStartHeight: tx.validityStartHeight,
                signature: signatureProof.signature.serialize(),
                extraData: Utf8Tools.utf8ByteArrayToString(tx.data),
                hash: tx.hash().toBase64()
            });
        } catch (e) {
            // assume the pin was wrong
            console.error(e);

            document.body.classList.remove('loading');

            this.$pinInput.onPinIncorrect();
        }
    }
}