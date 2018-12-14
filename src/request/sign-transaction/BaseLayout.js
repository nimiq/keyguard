/* global Nimiq */
/* global KeyStore */
/* global Identicon */
/* global PassphraseBox */
/* global Errors */
/* global Utf8Tools */
/* global TopLevelApi */

class BaseLayout {
    /**
     * @param {KeyguardRequest.ParsedSignTransactionRequest} request
     * @param {Function} resolve
     * @param {Function} reject
     * @param {HTMLElement} $recipient
     */
    constructor(request, resolve, reject, $recipient) {
        /** @type {HTMLElement} */
        this.$el = (document.getElementById('layout-container'));
        this.$el.classList.add(request.layout);

        /** @type {HTMLElement} */
        const $recipientNode = (this.$el.querySelector('.account.recipient'));
        /** @type {HTMLElement} */
        ($recipientNode.parentElement).replaceChild($recipient, $recipientNode);

        const transaction = request.transaction;

        // sender
        /** @type {HTMLDivElement} */
        const $sender = (this.$el.querySelector('.sender'));

        /** @type {HTMLDivElement} */
        const $senderIdenticon = ($sender.querySelector('.identicon'));
        // eslint-disable-next-line no-new
        new Identicon(transaction.sender.toUserFriendlyAddress(), $senderIdenticon);

        const $senderAddresses = ($sender.querySelectorAll('.address > .chunk'));
        /** @type {string[]} */
        const senderAddressChunks = (
            transaction.sender
                .toUserFriendlyAddress()
                .replace(/[+ ]/g, '').match(/.{4}/g)
        );
        $senderAddresses.forEach(($el, x) => {
            $el.textContent = senderAddressChunks[x];
        });

        if (request.senderLabel) {
            /** @type {HTMLElement} */
            const $senderLabel = ($sender.querySelector('.label'));
            $senderLabel.textContent = request.senderLabel;
            $senderLabel.classList.remove('display-none');
        }

        if (request.keyLabel) {
            /** @type {HTMLElement} */
            const $walletLabel = ($sender.querySelector('.wallet-label'));
            $walletLabel.textContent = request.keyLabel;
            $walletLabel.classList.remove('display-none');
        }

        if (request.accountBalance) {
            /** @type {HTMLElement} */
            const $balance = ($sender.querySelector('.balance'));
            $balance.textContent = this._formatNumber(Nimiq.Policy.satoshisToCoins(request.accountBalance));
            /** @type {HTMLElement} */
            ($balance.parentElement).classList.remove('display-none');
        }

        /** @type {HTMLDivElement} */
        const $value = (this.$el.querySelector('#value'));
        /** @type {HTMLDivElement} */
        const $fee = (this.$el.querySelector('#fee'));
        /** @type {HTMLDivElement} */
        const $data = (this.$el.querySelector('#data'));

        // Set value and fee.
        const total = transaction.value + transaction.fee;
        const totalNim = Nimiq.Policy.satoshisToCoins(total);

        $value.textContent = this._formatNumber(totalNim);

        if ($fee && transaction.fee > 0) {
            $fee.textContent = Nimiq.Policy.satoshisToCoins(transaction.fee).toString();
            /** @type {HTMLDivElement} */
            const $feeSection = (this.$el.querySelector('.fee-section'));
            $feeSection.classList.remove('display-none');
        }

        // Set transaction extra data.
        if ($data && transaction.data.byteLength > 0) {
            $data.textContent = Utf8Tools.utf8ByteArrayToString(transaction.data);
            /** @type {HTMLDivElement} */
            const $dataSection = (this.$el.querySelector('.data-section'));
            $dataSection.classList.remove('display-none');
        }

        // Set up passphrase box.
        /** @type {HTMLFormElement} */
        const $passphraseBox = (document.querySelector('#passphrase-box'));
        this._passphraseBox = new PassphraseBox($passphraseBox, {
            hideInput: !request.keyInfo.encrypted,
            buttonI18nTag: 'passphrasebox-confirm-tx',
            minLength: request.keyInfo.hasPin ? 6 : undefined,
            hideCancel: true,
        });

        this._passphraseBox.on(
            PassphraseBox.Events.SUBMIT,
            /** @param {string} [passphrase] */ passphrase => {
                this._onConfirm(request, resolve, reject, passphrase);
            },
        );

        /** @type {HTMLElement} */
        this.$accountDetails = (this.$el.querySelector('#account-details'));
        const $accounts = this.$el.querySelectorAll('.account');
        $accounts.forEach($item => $item.addEventListener('click', event => this._openDetails($item, event)));
        /** @type {HTMLButtonElement} */
        const $closeDetails = (this.$accountDetails.querySelector('#close-details'));
        $closeDetails.addEventListener('click', this._closeDetails.bind(this));
        /** @type {HTMLElement} */
        const $background = (this.$el.querySelector('#background-overlay'));
        $background.addEventListener('click', this._closeDetails.bind(this));
    }

    /**
     * @param {Element} $el
     * @param {Event} event
     */
    _openDetails($el, event) {
        event.preventDefault();
        /** @type {HTMLElement} */
        (this.$accountDetails.querySelector('#details')).innerHTML = $el.innerHTML;
        this.$el.classList.add('open');
    }

    _closeDetails() {
        this.$el.classList.remove('open');
    }

    /**
     * @param {KeyguardRequest.ParsedSignTransactionRequest} request
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

        // Async pre-load the crypto worker to reduce wait time at first decrypt attempt
        Nimiq.CryptoWorker.getInstanceAsync();
        /** @type {HTMLElement} */
        (this.$el.parentElement).classList.remove('display-none');
        this._passphraseBox.focus();
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
