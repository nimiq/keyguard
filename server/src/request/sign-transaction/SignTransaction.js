/* global Nimiq */
/* global KeyStore */
/* global Identicon */
/* global PassphraseInput */

class SignTransaction {
    /**
     * @param {ParsedSignTransactionRequest} request
     * @param {Function} resolve
     * @param {Function} reject
     */
    constructor(request, resolve, reject) {
        /** @type {HTMLDivElement} */
        const $transaction = (document.querySelector('#confirm-transaction .transaction'));

        /** @type {HTMLDivElement} */
        const $senderIdenticon = ($transaction.querySelector('#sender-identicon'));
        /** @type {HTMLDivElement} */
        const $recipientIdenticon = ($transaction.querySelector('#recipient-identicon'));

        /** @type {HTMLDivElement} */
        const $senderLabel = ($transaction.querySelector('#sender-label'));
        /** @type {HTMLDivElement} */
        const $recipientLabel = ($transaction.querySelector('#recipient-label'));

        /** @type {HTMLDivElement} */
        const $senderAddress = ($transaction.querySelector('#sender-address'));
        /** @type {HTMLDivElement} */
        const $recipientAddress = ($transaction.querySelector('#recipient-address'));

        /** @type {HTMLDivElement} */
        const $value = ($transaction.querySelector('#value'));
        /** @type {HTMLDivElement} */
        const $fee = ($transaction.querySelector('#fee'));
        /** @type {HTMLDivElement} */
        const $data = ($transaction.querySelector('#data'));

        // Set sender data.
        const transaction = request.transaction;
        const senderAddress = transaction.sender.toUserFriendlyAddress();
        new Identicon(senderAddress, $senderIdenticon); // eslint-disable-line no-new
        $senderAddress.textContent = senderAddress;
        if (request.senderLabel) {
            $senderLabel.classList.remove('display-none');
            $senderLabel.textContent = request.senderLabel;
        }

        // Set recipient data.
        const recipientAddress = transaction.recipient.toUserFriendlyAddress();
        new Identicon(recipientAddress, $recipientIdenticon); // eslint-disable-line no-new
        $recipientAddress.textContent = recipientAddress;
        if (request.recipientLabel) {
            $recipientLabel.classList.remove('display-none');
            $recipientLabel.textContent = request.recipientLabel;
        }

        // Set value and fee.
        const total = transaction.value + transaction.fee;
        $value.textContent = Nimiq.Policy.satoshisToCoins(total).toString();
        if (transaction.fee > 0) {
            $fee.textContent = Nimiq.Policy.satoshisToCoins(transaction.fee).toString();
            /** @type {HTMLDivElement} */
            const $feeSection = ($transaction.querySelector('.fee-section'));
            $feeSection.classList.remove('display-none');
        }

        // Set transaction extra data.
        if (transaction.data.byteLength > 0) {
            // FIXME Detect and use proper encoding.
            $data.textContent = Nimiq.BufferUtils.toAscii(transaction.data);
            /** @type {HTMLDivElement} */
            const $dataSection = ($transaction.querySelector('.data-section'));
            $dataSection.classList.remove('display-none');
        }

        /** @type {HTMLFormElement} */
        const $confirmForm = (document.querySelector('#confirm-transaction form'));
        $confirmForm.addEventListener('submit', event => this._onConfirm(request, resolve, reject, event));

        // Set up passphrase input.
        /** @type {HTMLDivElement} */
        const $passphraseInput = ($confirmForm.querySelector('#passphrase-input'));
        this._passphraseInput = new PassphraseInput($passphraseInput);
        if (!request.keyInfo.encrypted) {
            $passphraseInput.classList.add('display-none');
        }

        /** @type {HTMLDivElement} */
        this.$error = ($confirmForm.querySelector('#error'));
    }

    /**
     * @param {ParsedSignTransactionRequest} request
     * @param {Function} resolve
     * @param {Function} reject
     * @param {Event} event
     * @returns {Promise<void>}
     * @private
     */
    async _onConfirm(request, resolve, reject, event) {
        event.preventDefault();

        document.body.classList.add('loading');
        this.$error.classList.add('hidden');

        try {
            // XXX Passphrase encoding
            const passphrase = Nimiq.BufferUtils.fromAscii(this._passphraseInput.text);
            const key = await KeyStore.instance.get(request.keyInfo.id, passphrase);
            if (!key) {
                reject(new Error('Failed to retrieve key'));
                return;
            }

            const publicKey = key.derivePublicKey(request.keyPath);
            const signature = key.sign(request.keyPath, request.transaction.serializeContent());
            const result = /** @type {SignTransactionResult} */ {
                publicKey: Nimiq.BufferUtils.toBase64(publicKey.serialize()),
                signature: Nimiq.BufferUtils.toBase64(signature.serialize()),
            };
            resolve(result);
        } catch (e) {
            console.error(e);
            document.body.classList.remove('loading');

            // Assume the passphrase was wrong
            this._passphraseInput.onPassphraseIncorrect();
            this.$error.classList.remove('hidden');
        }
    }

    run() {
        // Go to start page
        window.location.hash = SignTransaction.Pages.CONFIRM_TRANSACTION;
        this._passphraseInput.focus();
    }
}

SignTransaction.Pages = {
    CONFIRM_TRANSACTION: 'confirm-transaction',
};
