/* global Nimiq */
/* global KeyStore */
/* global PassphraseBox */
/* global Errors */
/* global Utf8Tools */
/* global TopLevelApi */
/* global SignTransactionApi */
/* global AddressInfo */

class SignTransaction {
    /**
     * @param {KeyguardRequest.ParsedSignTransactionRequest} request
     * @param {Function} resolve
     * @param {Function} reject
     */
    constructor(request, resolve, reject) {
        this._request = request;
        /** @type {HTMLElement} */
        this.$el = (document.getElementById('layout-container'));
        this.$el.classList.add(request.layout);

        const transaction = request.transaction;

        /** @type {HTMLElement} */
        this.$accountDetails = (this.$el.querySelector('#account-details'));

        /** @type {HTMLLinkElement} */
        const $sender = (this.$el.querySelector('.account.sender'));
        this._senderAddressInfo = new AddressInfo(
            $sender,
            {
                userFriendlyAddress: transaction.sender.toUserFriendlyAddress(),
                label: request.senderLabel || transaction.sender.toUserFriendlyAddress(),
                imageUrl: null,
                accountLabel: null,
            },
        );
        /** @type {HTMLLinkElement} */
        const $senderDetails = (this.$el.querySelector('#details > .sender'));
        // eslint-disable-next-line no-new
        new AddressInfo(
            $senderDetails,
            {
                userFriendlyAddress: transaction.sender.toUserFriendlyAddress(),
                label: request.senderLabel || 'Unnamed Contact',
                imageUrl: null,
                accountLabel: request.keyLabel || null,
            },
        );

        /** @type {HTMLLinkElement} */
        const $recipient = (this.$el.querySelector('.account.recipient'));

        /** @type {HTMLLinkElement} */
        const $recipientDetails = (this.$el.querySelector('#details > .recipient'));
        switch (request.layout) {
        case SignTransactionApi.Layouts.CHECKOUT:
            this._recipientAddressInfo = new AddressInfo(
                $recipient,
                {
                    userFriendlyAddress: transaction.recipient.toUserFriendlyAddress(),
                    label: /** @type {string} */ (request.shopOrigin).split('://')[1],
                    imageUrl: request.shopLogoUrl || null,
                    accountLabel: null,
                },
            );
            // eslint-disable-next-line no-new
            new AddressInfo(
                $recipientDetails,
                {
                    userFriendlyAddress: transaction.recipient.toUserFriendlyAddress(),
                    label: /** @type {string} */ (request.shopOrigin).split('://')[1],
                    imageUrl: request.shopLogoUrl || null,
                    accountLabel: null,
                },
            );
            break;
        case SignTransactionApi.Layouts.STANDARD:
        default:
            this._recipientAddressInfo = new AddressInfo(
                $recipient,
                {
                    userFriendlyAddress: transaction.recipient.toUserFriendlyAddress(),
                    label: request.recipientLabel || transaction.recipient.toUserFriendlyAddress(),
                    imageUrl: null,
                    accountLabel: null,
                },
            );
            // eslint-disable-next-line no-new
            new AddressInfo(
                $recipientDetails,
                {
                    userFriendlyAddress: transaction.recipient.toUserFriendlyAddress(),
                    label: request.recipientLabel || 'Unnamed Contact',
                    imageUrl: null,
                    accountLabel: null,
                },
            );
            break;
        }

        this._senderAddressInfo.on(AddressInfo.Event.CLICKED, () => {
            this._openDetails('sender');
        });
        this._recipientAddressInfo.on(AddressInfo.Event.CLICKED, () => {
            this._openDetails('recipient');
        });

        /** @type {HTMLButtonElement} */
        const $closeDetails = (this.$accountDetails.querySelector('#close-details'));
        $closeDetails.addEventListener('click', this._closeDetails.bind(this));
        /** @type {HTMLElement} */
        const $background = (this.$el.querySelector('#background-overlay'));
        $background.addEventListener('click', this._closeDetails.bind(this));

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
            $fee.textContent = this._formatNumber(Nimiq.Policy.satoshisToCoins(transaction.fee));
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
    }

    /**
     * @param {'sender' | 'recipient'} which
     */
    _openDetails(which) {
        const $el = this.$accountDetails.querySelector(`#details > .${which}`);
        if ($el) {
            $el.classList.remove('display-none');
        }
        this.$el.classList.add('account-details-open');
    }

    _closeDetails() {
        const $el = this.$accountDetails.querySelector('#details > div:not(.display-none)');
        if ($el) {
            $el.classList.add('display-none');
        }
        this.$el.classList.remove('account-details-open');
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
        // Async pre-load the crypto worker to reduce wait time at first decrypt attempt
        if (this._request.keyInfo.encrypted) {
            Nimiq.CryptoWorker.getInstanceAsync();
        }
        // Go to start page
        window.location.hash = SignTransaction.Pages.CONFIRM_TRANSACTION;
        const width = window.innerWidth
                || document.documentElement.clientWidth
                || document.getElementsByTagName('body')[0].clientWidth;
        if (width > 600) this._passphraseBox.focus();
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

SignTransaction.Pages = {
    CONFIRM_TRANSACTION: 'confirm-transaction',
};
