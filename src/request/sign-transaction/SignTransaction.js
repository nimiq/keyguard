/* global Nimiq */
/* global Key */
/* global KeyStore */
/* global SignTransactionApi */
/* global PasswordBox */
/* global SignTransactionApi */
/* global Errors */
/* global Utf8Tools */
/* global TopLevelApi */
/* global AddressInfo */
/* global PaymentInfoLine */
/* global Constants */
/* global NumberFormatting */
/* global I18n */

/**
 * @callback SignTransaction.resolve
 * @param {KeyguardRequest.SignTransactionResult} result
 */

class SignTransaction {
    /**
     * @param {Parsed<KeyguardRequest.SignTransactionRequest>} request
     * @param {SignTransaction.resolve} resolve
     * @param {reject} reject
     */
    constructor(request, resolve, reject) {
        this._request = request;
        /** @type {HTMLElement} */
        this.$el = (document.getElementById(SignTransaction.Pages.CONFIRM_TRANSACTION));
        this.$el.classList.add(request.layout);

        const transaction = request.transaction;

        /** @type {HTMLElement} */
        this.$accountDetails = (this.$el.querySelector('#account-details'));

        /** @type {HTMLLinkElement} */
        const $sender = (this.$el.querySelector('.accounts .sender'));
        this._senderAddressInfo = new AddressInfo({
            userFriendlyAddress: transaction.sender.toUserFriendlyAddress(),
            label: request.senderLabel || null,
            imageUrl: null,
            accountLabel: request.keyLabel || null,
        });
        this._senderAddressInfo.renderTo($sender);
        $sender.addEventListener('click', () => {
            this._openDetails(this._senderAddressInfo);
        });

        /** @type {HTMLLinkElement} */
        const $recipient = (this.$el.querySelector('.accounts .recipient'));
        const recipientAddress = transaction.recipient.toUserFriendlyAddress();
        /* eslint-disable no-nested-ternary */
        const recipientLabel = 'shopOrigin' in request && !!request.shopOrigin
            ? request.shopOrigin.split('://')[1]
            : 'recipientLabel' in request && !!request.recipientLabel
                ? request.recipientLabel
                : null;
        /* eslint-enable no-nested-ternary */
        const recipientImage = 'shopLogoUrl' in request && !!request.shopLogoUrl
            ? request.shopLogoUrl
            : null;
        this._recipientAddressInfo = new AddressInfo({
            userFriendlyAddress: recipientAddress,
            label: recipientLabel,
            imageUrl: recipientImage,
            accountLabel: null,
        }, request.layout === SignTransactionApi.Layouts.CASHLINK);
        this._recipientAddressInfo.renderTo($recipient);
        if (request.layout !== SignTransactionApi.Layouts.CASHLINK) {
            $recipient.addEventListener('click', () => {
                this._openDetails(this._recipientAddressInfo);
            });
        }

        /** @type {HTMLElement} */
        const $paymentInfoLine = (this.$el.querySelector('.payment-info-line'));
        if (request.layout === SignTransactionApi.Layouts.CHECKOUT) {
            // eslint-disable-next-line no-new
            new PaymentInfoLine(Object.assign({}, request, {
                recipient: recipientAddress,
                label: recipientLabel || recipientAddress,
                imageUrl: request.shopLogoUrl,
                lunaAmount: request.transaction.value,
            }), $paymentInfoLine);
        } else {
            $paymentInfoLine.remove();
        }

        /** @type {HTMLButtonElement} */
        const $closeDetails = (this.$accountDetails.querySelector('#close-details'));
        $closeDetails.addEventListener('click', this._closeDetails.bind(this));

        /** @type {HTMLDivElement} */
        const $value = (this.$el.querySelector('#value'));
        /** @type {HTMLDivElement} */
        const $fee = (this.$el.querySelector('#fee'));
        /** @type {HTMLDivElement} */
        const $data = (this.$el.querySelector('#data'));

        // Set value and fee.
        $value.textContent = NumberFormatting.formatNumber(Nimiq.Policy.satoshisToCoins(transaction.value));
        if ($fee && transaction.fee > 0) {
            $fee.textContent = NumberFormatting.formatNumber(Nimiq.Policy.satoshisToCoins(transaction.fee));
            /** @type {HTMLDivElement} */
            const $feeSection = (this.$el.querySelector('.fee-section'));
            $feeSection.classList.remove('display-none');
        }

        if (request.layout === SignTransactionApi.Layouts.CASHLINK
         && Nimiq.BufferUtils.equals(transaction.data, Constants.CASHLINK_FUNDING_DATA)) {
            if (request.cashlinkMessage) {
                $data.textContent = request.cashlinkMessage;
                /** @type {HTMLDivElement} */
                const $dataSection = (this.$el.querySelector('.data-section'));
                $dataSection.classList.remove('display-none');
            }
        } else if ($data && transaction.data.byteLength > 0) {
            // Set transaction extra data.
            $data.textContent = this._formatData(transaction);
            /** @type {HTMLDivElement} */
            const $dataSection = (this.$el.querySelector('.data-section'));
            $dataSection.classList.remove('display-none');
        }

        // Set up password box.
        /** @type {HTMLFormElement} */
        const $passwordBox = (document.querySelector('#password-box'));
        this._passwordBox = new PasswordBox($passwordBox, {
            hideInput: !request.keyInfo.encrypted,
            buttonI18nTag: request.layout === SignTransactionApi.Layouts.CASHLINK
                ? 'passwordbox-create-cashlink'
                : 'passwordbox-confirm-tx',
            minLength: request.keyInfo.hasPin ? Key.PIN_LENGTH : undefined,
        });

        this._passwordBox.on(
            PasswordBox.Events.SUBMIT,
            /** @param {string} [password] */ password => {
                this._onConfirm(request, resolve, reject, password);
            },
        );

        if ('expires' in request && request.expires) {
            setTimeout(() => reject(new Errors.RequestExpired()), request.expires - Date.now());
        }
    }

    /**
     * @param {AddressInfo} which
     */
    _openDetails(which) {
        which.renderTo(
            /** @type {HTMLElement} */(this.$accountDetails.querySelector('#details')),
            true,
        );
        this.$el.classList.add('account-details-open');
    }

    _closeDetails() {
        this.$el.classList.remove('account-details-open');
    }

    /**
     * @param {Parsed<KeyguardRequest.SignTransactionRequest>} request
     * @param {SignTransaction.resolve} resolve
     * @param {reject} reject
     * @param {string} [password]
     * @returns {Promise<void>}
     * @private
     */
    async _onConfirm(request, resolve, reject, password) {
        TopLevelApi.setLoading(true);
        const passwordBuf = password ? Utf8Tools.stringToUtf8ByteArray(password) : undefined;
        /** @type {Key?} */
        let key = null;
        try {
            key = await KeyStore.instance.get(request.keyInfo.id, passwordBuf);
        } catch (e) {
            if (e.message === 'Invalid key') {
                TopLevelApi.setLoading(false);
                this._passwordBox.onPasswordIncorrect();
                return;
            }
            reject(new Errors.CoreError(e));
            return;
        }
        if (!key) {
            reject(new Errors.KeyNotFoundError());
            return;
        }

        const publicKey = key.derivePublicKey(request.keyPath);
        const signature = key.sign(request.keyPath, request.transaction.serializeContent());

        /** @type {KeyguardRequest.SignTransactionResult} */
        const result = {
            publicKey: publicKey.serialize(),
            signature: signature.serialize(),
        };
        resolve(result);
    }

    run() {
        // Go to start page
        window.location.hash = SignTransaction.Pages.CONFIRM_TRANSACTION;
    }

    /**
     * @param {Nimiq.Transaction} transaction
     * @returns {string}
     */
    _formatData(transaction) {
        if (Nimiq.BufferUtils.equals(transaction.data, Constants.CASHLINK_FUNDING_DATA)) {
            return I18n.translatePhrase('funding-cashlink');
        }

        if (transaction.hasFlag(Nimiq.Transaction.Flag.CONTRACT_CREATION)) {
            // TODO: Decode contract creation transactions
            // return ...
        }

        return Utf8Tools.isValidUtf8(transaction.data)
            ? Utf8Tools.utf8ByteArrayToString(transaction.data)
            : Nimiq.BufferUtils.toHex(transaction.data);
    }
}

SignTransaction.Pages = {
    CONFIRM_TRANSACTION: 'confirm-transaction',
};
