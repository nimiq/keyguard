/* global Nimiq */
/* global Key */
/* global KeyStore */
// /* global SignMultisigTransactionApi */
/* global PasswordBox */
/* global Errors */
/* global Utf8Tools */
/* global TopLevelApi */
/* global AddressInfo */
// /* global PaymentInfoLine */
/* global Constants */
/* global NumberFormatting */
/* global I18n */
/* global MultisigUtils */
/* global LoginFileAccountIcon */
/* global Identicon */

/**
 * @callback SignMultisigTransaction.resolve
 * @param {KeyguardRequest.SignMultisigTransactionResult} result
 */

class SignMultisigTransaction {
    /**
     * @param {Parsed<KeyguardRequest.SignMultisigTransactionRequest>} request
     * @param {SignMultisigTransaction.resolve} resolve
     * @param {reject} reject
     */
    constructor(request, resolve, reject) {
        this._request = request;
        /** @type {HTMLElement} */
        this.$el = (document.getElementById(SignMultisigTransaction.Pages.CONFIRM_TRANSACTION));
        this.$el.classList.add(request.layout);

        const transaction = request.transaction;

        /** @type {HTMLElement} */
        this.$accountDetails = (this.$el.querySelector('#account-details'));

        /** @type {HTMLLinkElement} */
        const $sender = (this.$el.querySelector('.accounts .sender'));
        this._senderAddressInfo = new AddressInfo({
            userFriendlyAddress: transaction.sender.toUserFriendlyAddress(),
            label: request.senderLabel,
            imageUrl: null,
            accountLabel: null,
            multisig: {
                signers: request.multisigConfig.numberOfSigners,
                participants: request.multisigConfig.publicKeys.length,
            },
        });
        this._senderAddressInfo.renderTo($sender);
        $sender.addEventListener('click', () => {
            this._openDetails(this._senderAddressInfo);
        });

        /** @type {HTMLLinkElement} */
        const $recipient = (this.$el.querySelector('.accounts .recipient'));
        const recipientAddress = transaction.recipient.toUserFriendlyAddress();
        /* eslint-disable no-nested-ternary */
        // eslint-disable-next-line operator-linebreak
        const recipientLabel = /* 'shopOrigin' in request && !!request.shopOrigin
            ? request.shopOrigin.split('://')[1]
            : */ 'recipientLabel' in request && !!request.recipientLabel
                ? request.recipientLabel
                : null;
        /** @type {URL | null} */
        /* eslint-enable no-nested-ternary */
        // eslint-disable-next-line operator-linebreak
        const recipientImage = /* 'shopLogoUrl' in request && !!request.shopLogoUrl
            ? request.shopLogoUrl
            : */ null;
        this._recipientAddressInfo = new AddressInfo({
            userFriendlyAddress: recipientAddress,
            label: recipientLabel,
            imageUrl: recipientImage,
            accountLabel: null,
        }/* , request.layout === SignMultisigTransactionApi.Layouts.CASHLINK */);
        this._recipientAddressInfo.renderTo($recipient);
        // if (request.layout !== SignMultisigTransactionApi.Layouts.CASHLINK) {
        $recipient.addEventListener('click', () => {
            this._openDetails(this._recipientAddressInfo);
        });
        // }

        // /** @type {HTMLElement} */
        // const $paymentInfoLine = (this.$el.querySelector('.payment-info-line'));
        // if (request.layout === SignMultisigTransactionApi.Layouts.CHECKOUT) {
        //     // eslint-disable-next-line no-new
        //     new PaymentInfoLine(Object.assign({}, request, {
        //         recipient: recipientAddress,
        //         label: recipientLabel || recipientAddress,
        //         imageUrl: request.shopLogoUrl,
        //         amount: request.transaction.value,
        //         currency: /** @type {'nim'} */ ('nim'),
        //         unitsToCoins: Nimiq.Policy.lunasToCoins,
        //         networkFee: request.transaction.fee,
        //     }), $paymentInfoLine);
        // } else {
        //     $paymentInfoLine.remove();
        // }

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
        $value.textContent = NumberFormatting.formatNumber(Nimiq.Policy.lunasToCoins(transaction.value));
        if ($fee && transaction.fee > 0) {
            $fee.textContent = NumberFormatting.formatNumber(Nimiq.Policy.lunasToCoins(transaction.fee));
            /** @type {HTMLDivElement} */
            const $feeSection = (this.$el.querySelector('.fee-section'));
            $feeSection.classList.remove('display-none');
        }

        // if (request.layout === SignMultisigTransactionApi.Layouts.CASHLINK
        //  && Nimiq.BufferUtils.equals(transaction.data, Constants.CASHLINK_FUNDING_DATA)) {
        //     if (request.cashlinkMessage) {
        //         $data.textContent = request.cashlinkMessage;
        //         /** @type {HTMLDivElement} */
        //         const $dataSection = (this.$el.querySelector('.data-section'));
        //         $dataSection.classList.remove('display-none');
        //     }
        /* } else */ if ($data && transaction.data.byteLength > 0) {
            // Set transaction extra data.
            $data.textContent = this._formatData(transaction);
            /** @type {HTMLDivElement} */
            const $dataSection = (this.$el.querySelector('.data-section'));
            $dataSection.classList.remove('display-none');
        }

        // Set up user and account names
        /** @type {HTMLDivElement} */
        const $nameSection = (this.$el.querySelector('.user-and-account-names'));
        if (request.multisigConfig.userName) {
            $nameSection.classList.add('approving-as');
            /** @type {HTMLDivElement} */
            const $userName = ($nameSection.querySelector('.user-name'));
            $userName.textContent = request.multisigConfig.userName;
        } else {
            $nameSection.classList.add('approving-with');
        }
        /** @type {HTMLDivElement} */
        const $accountName = ($nameSection.querySelector('.account-name'));
        $accountName.textContent = request.keyLabel;

        // Set up account icon
        /** @type {HTMLDivElement} */
        const $loginFileIcon = ($nameSection.querySelector('.login-file-account-icon'));
        if (request.keyInfo.type === Nimiq.Secret.Type.ENTROPY) {
            // eslint-disable-next-line no-new
            new LoginFileAccountIcon(request.keyInfo.defaultAddress.toUserFriendlyAddress(), $loginFileIcon);
        } else {
            // Show identicon for legacy accounts (which must be supported to support Team Nimiq Multisig)
            $loginFileIcon.innerHTML = ''; // Remove LoginFile icon
            // eslint-disable-next-line no-new
            new Identicon(request.keyInfo.defaultAddress.toUserFriendlyAddress(), $loginFileIcon);
        }


        // Set up password box.
        /** @type {HTMLFormElement} */
        const $passwordBox = (document.querySelector('#password-box'));
        this._passwordBox = new PasswordBox($passwordBox, {
            hideInput: !request.keyInfo.encrypted,
            buttonI18nTag: /* request.layout === SignMultisigTransactionApi.Layouts.CASHLINK
                ? 'passwordbox-create-cashlink'
                : */ 'passwordbox-confirm-tx',
            minLength: request.keyInfo.hasPin ? Key.PIN_LENGTH : undefined,
        });

        this._passwordBox.on(
            PasswordBox.Events.SUBMIT,
            /** @param {string} [password] */ password => {
                this._onConfirm(request, resolve, reject, password);
            },
        );

        // if ('expires' in request && request.expires) {
        //     setTimeout(() => reject(new Errors.RequestExpired()), request.expires - Date.now());
        // }
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
     * @param {Parsed<KeyguardRequest.SignMultisigTransactionRequest>} request
     * @param {SignMultisigTransaction.resolve} resolve
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

        // Verify publicKey is part of the signing public keys
        if (!request.multisigConfig.signerPublicKeys.find(pubKey => pubKey.equals(publicKey))) {
            reject(new Errors.InvalidRequestError('Selected key is not part of the multisig transaction signers'));
            return;
        }

        /** @type {Nimiq.RandomSecret} */
        let aggregatedSecret;
        if ('aggregatedSecret' in request.multisigConfig.secret) {
            aggregatedSecret = request.multisigConfig.secret.aggregatedSecret;
        } else {
            // If we only have encrypted secrets, decrypt them and aggregate them with the bScalar
            const rsaKey = await key.getRsaPrivateKey();

            /** @type {Uint8Array[]} */
            let secrets;
            try {
                secrets = await Promise.all(request.multisigConfig.secret.encryptedSecrets.map(
                    async encrypted => new Uint8Array(
                        await window.crypto.subtle.decrypt({ name: 'RSA-OAEP' }, rsaKey, encrypted),
                    ),
                ));
            } catch (e) {
                reject(new Errors.InvalidRequestError(`Cannot decrypt secrets: ${e.message}`));
                return;
            }

            try {
                aggregatedSecret = await MultisigUtils.aggregateSecrets(secrets, request.multisigConfig.secret.bScalar);
            } catch (e) {
                reject(new Errors.InvalidRequestError(`Cannot aggregate secrets: ${e.message}`));
                return;
            }
        }

        const signature = key.signPartially(
            request.keyPath,
            request.transaction.serializeContent(),
            request.multisigConfig.signerPublicKeys,
            aggregatedSecret,
            request.multisigConfig.aggregatedCommitment,
        );

        /** @type {KeyguardRequest.SignMultisigTransactionResult} */
        const result = {
            publicKey: publicKey.serialize(),
            signature: signature.serialize(),
        };
        resolve(result);
    }

    run() {
        // Go to start page
        window.location.hash = SignMultisigTransaction.Pages.CONFIRM_TRANSACTION;
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

SignMultisigTransaction.Pages = {
    CONFIRM_TRANSACTION: 'confirm-transaction',
};
