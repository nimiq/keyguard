/* global Nimiq */
/* global KeyStore */
/* global Identicon */
/* global PassphraseBox */
/* global Errors */
/* global Utf8Tools */
/* global TopLevelApi */

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
            new Identicon(recipientAddress, $recipientIdenticon); // eslint-disable-line no-new
            $recipientAddress.textContent = recipientAddress;
            $recipientLabel.textContent = request.recipientLabel || '';
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

        // Set up passphrase box.
        /** @type {HTMLFormElement} */
        const $passphraseBox = (document.querySelector('#passphrase-box'));
        this._passphraseBox = new PassphraseBox($passphraseBox, {
            hideInput: !request.keyInfo.encrypted,
            buttonI18nTag: 'passphrasebox-confirm-tx',
            minLength: request.keyInfo.hasPin ? 6 : undefined,
        });

        this._passphraseBox.on(
            PassphraseBox.Events.SUBMIT,
            /** @param {string} [passphrase] */ passphrase => {
                this._onConfirm(request, resolve, reject, passphrase);
            },
        );

        // This event cannot throw a 'CANCEL' error like in other requests,
        // because for checkout we need to go back to the CheckoutOverview
        // in the Accounts Manager and not return directly to the caller.
        this._passphraseBox.on(PassphraseBox.Events.CANCEL, () => window.history.back());
    }

    /**
     * @param {ParsedSignTransactionRequest} request
     * @param {Function} resolve
     * @param {Function} reject
     * @param {string} [passphrase]
     * @returns {Promise<void>}
     * @private
     */
    async _onConfirm(request, resolve, reject, passphrase) {
        TopLevelApi.setLoading(true);
        const passphraseBuf = passphrase ? Utf8Tools.stringToUtf8ByteArray(passphrase) : undefined;
        /** @type {Key?} */
        let key = null;
        try {
            key = await KeyStore.instance.get(request.keyInfo.id, passphraseBuf);
        } catch (e) {
            if (e.message === 'Invalid key') {
                TopLevelApi.setLoading(false);
                this._passphraseBox.onPassphraseIncorrect();
                return;
            }
            reject(new Errors.CoreError(e.message));
            return;
        }
        if (!key) {
            reject(new Errors.KeyNotFoundError());
            return;
        }

        const publicKey = key.derivePublicKey(request.keyPath);
        const signature = key.sign(request.keyPath, request.transaction.serializeContent());
        const result = /** @type {SignTransactionResult} */ {
            publicKey: publicKey.serialize(),
            signature: signature.serialize(),
        };
        resolve(result);
    }

    run() {
        // Go to start page
        window.location.hash = BaseLayout.Pages.CONFIRM_TRANSACTION;
        this._passphraseBox.focus();

        // Async pre-load the crypto worker to reduce wait time at first decrypt attempt
        Nimiq.CryptoWorker.getInstanceAsync();
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
