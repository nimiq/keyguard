/* global Nimiq */
/* global KeyStore */
/* global Identicon */
/* global PassphraseInput */

class BaseLayout {
    /**
     * @param {ParsedSignTransactionRequest} request
     * @param {Function} resolve
     * @param {Function} reject
     */
    constructor(request, resolve, reject) {
        /** @type {HTMLDivElement} */
        const $pageBody = (document.querySelector('#confirm-transaction .transaction'));

        /** @type {HTMLDivElement} */
        const $senderIdenticon = ($pageBody.querySelector('#sender-identicon'));
        /** @type {HTMLDivElement} */
        const $recipientIdenticon = ($pageBody.querySelector('#recipient-identicon'));

        /** @type {HTMLDivElement} */
        const $senderLabel = ($pageBody.querySelector('#sender-label'));
        /** @type {HTMLDivElement} */
        const $recipientLabel = ($pageBody.querySelector('#recipient-label'));

        /** @type {HTMLDivElement} */
        const $senderAddress = ($pageBody.querySelector('#sender-address'));
        /** @type {HTMLDivElement} */
        const $recipientAddress = ($pageBody.querySelector('#recipient-address'));

        /** @type {HTMLDivElement} */
        const $value = ($pageBody.querySelector('#value'));
        /** @type {HTMLDivElement} */
        const $fee = ($pageBody.querySelector('#fee'));
        /** @type {HTMLDivElement} */
        const $data = ($pageBody.querySelector('#data'));

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
        if ($recipientAddress) {
            const recipientAddress = transaction.recipient.toUserFriendlyAddress();
            if (request.layout === 'checkout') {
                new Identicon(undefined, $recipientIdenticon); // eslint-disable-line no-new
            } else {
                new Identicon(recipientAddress, $recipientIdenticon); // eslint-disable-line no-new
            }
            $recipientAddress.textContent = recipientAddress;
            if (request.recipientLabel) {
                $recipientLabel.classList.remove('display-none');
                $recipientLabel.textContent = request.recipientLabel;
            }
        }

        // Set value and fee.
        const total = transaction.value + transaction.fee;
        const totalNim = Nimiq.Policy.satoshisToCoins(total);

        $value.textContent = this._formatNumber(totalNim);

        if ($fee && transaction.fee > 0) {
            $fee.textContent = Nimiq.Policy.satoshisToCoins(transaction.fee).toString();
            /** @type {HTMLDivElement} */
            const $feeSection = ($pageBody.querySelector('.fee-section'));
            $feeSection.classList.remove('display-none');
        }

        // Set transaction extra data.
        if ($data && transaction.data.byteLength > 0) {
            // FIXME Detect and use proper encoding.
            $data.textContent = Nimiq.BufferUtils.toAscii(transaction.data);
            /** @type {HTMLDivElement} */
            const $dataSection = ($pageBody.querySelector('.data-section'));
            $dataSection.classList.remove('display-none');
        }

        /** @type {HTMLFormElement} */
        const $confirmForm = (document.querySelector('#confirm-transaction form'));
        $confirmForm.addEventListener('submit', event => this._onConfirm(request, resolve, reject, event));

        // Set up passphrase input.
        /** @type {HTMLDivElement} */
        const $passphraseInput = ($confirmForm.querySelector('#passphrase-input'));
        this._passphraseInput = new PassphraseInput($passphraseInput);

        /** @type {HTMLButtonElement} */
        const $submitButton = ($confirmForm.querySelector('.submit-button'));

        if (!request.keyInfo.encrypted) {
            $passphraseInput.classList.add('display-none');
            $submitButton.classList.remove('display-none');
        } else {
            this._passphraseInput.input.addEventListener('input', () => {
                $submitButton.classList.toggle('display-none', this._passphraseInput.input.value.length === 0);
            });
        }

        /** @type {HTMLDivElement} */
        this.$error = ($confirmForm.querySelector('#error'));

        /** @type {HTMLAnchorElement} */
        const $backButton = (document.querySelector('.page-header .page-header-back-button'));
        if ($backButton) $backButton.addEventListener('click', () => reject(new Error('Canceled')));

        /** @type HTMLAnchorElement */
        const $formCancel = ($confirmForm.querySelector('a.cancel'));
        $formCancel.addEventListener('click', () => reject(new Error('Canceled')));

        /** @type {HTMLElement} */
        const $appName = (document.querySelector('#app-name'));
        $appName.textContent = request.appName;
        /** @type HTMLAnchorElement */
        const $cancelLink = ($appName.parentNode);
        $cancelLink.classList.remove('display-none');
        $cancelLink.addEventListener('click', () => window.close());
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
        this.$error.classList.add('display-none');

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
                publicKey: publicKey.serialize(),
                signature: signature.serialize(),
            };
            resolve(result);
        } catch (e) {
            console.error(e);
            document.body.classList.remove('loading');

            // Assume the passphrase was wrong
            this._passphraseInput.onPassphraseIncorrect();
            this.$error.classList.remove('display-none');
        }
    }

    run() {
        // Go to start page
        window.location.hash = BaseLayout.Pages.CONFIRM_TRANSACTION;
        this._passphraseInput.focus();
    }

    /**
     * @param {number} value
     * @param {number} [maxDecimals]
     * @param {number} [minDecimals]
     * @returns {string}
     */
    _formatNumber(value, maxDecimals = 5, minDecimals = 2) {
        const roundingFactor = 10 ** maxDecimals;
        value = Math.floor(value * roundingFactor) / roundingFactor;

        const result = parseFloat(value.toFixed(minDecimals)) === value
            ? value.toFixed(minDecimals)
            : value.toString();

        if (Math.abs(value) < 10000) return result;

        // Add thin spaces (U+202F) every 3 digits. Stop at the decimal separator if there is one.
        const regexp = minDecimals > 0 ? /(\d)(?=(\d{3})+\.)/g : /(\d)(?=(\d{3})+$)/g;
        return result.replace(regexp, '$1\u202F');
    }
}

BaseLayout.Pages = {
    CONFIRM_TRANSACTION: 'confirm-transaction',
};
