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
/* global NumberFormatting */
/* global TransactionDataFormatting */
/* global I18n */
/* global lunasToCoins */
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
        this.$el = /** @type {HTMLElement} */ (
            document.getElementById(SignMultisigTransaction.Pages.CONFIRM_TRANSACTION));
        this.$el.classList.add(request.layout);

        const transaction = request.transaction;
        const multisigAddressInfo = {
            signers: request.multisigConfig.signers.length,
            participants: request.multisigConfig.publicKeys.length,
        };
        // If the multisig isn't the recipient (for example of a remove-stake transaction), assume that it's the sender,
        // even if the sender address does not match (for example for transactions from a vesting contract owned by the
        // multisig).
        const isSenderMultisig = !request.multisigAddress.equals(transaction.recipient);

        this.$accountDetails = /** @type {HTMLElement} */ (this.$el.querySelector('#account-details'));

        const $sender = /** @type {HTMLLinkElement} */ (this.$el.querySelector('.accounts .sender'));
        this._senderAddressInfo = new AddressInfo({
            userFriendlyAddress: transaction.sender.toUserFriendlyAddress(),
            label: request.senderLabel,
            imageUrl: null,
            accountLabel: null,
            multisig: isSenderMultisig ? multisigAddressInfo : undefined,
        });
        this._senderAddressInfo.renderTo($sender);
        $sender.addEventListener('click', () => {
            this._openDetails(this._senderAddressInfo);
        });

        const $recipient = /** @type {HTMLLinkElement} */ (this.$el.querySelector('.accounts .recipient'));
        const recipientAddress = transaction.recipient.toUserFriendlyAddress();
        // eslint-disable-next-line operator-linebreak
        const recipientLabel = /* 'shopOrigin' in request && !!request.shopOrigin
            ? request.shopOrigin.split('://')[1]
            : */ 'recipientLabel' in request && !!request.recipientLabel
                ? request.recipientLabel
                : null;
        /** @type {URL | null} */
        // eslint-disable-next-line operator-linebreak
        const recipientImage = /* 'shopLogoUrl' in request && !!request.shopLogoUrl
            ? request.shopLogoUrl
            : */ null;
        this._recipientAddressInfo = new AddressInfo({
            userFriendlyAddress: recipientAddress,
            label: recipientLabel,
            imageUrl: recipientImage,
            accountLabel: null,
            multisig: isSenderMultisig ? undefined : multisigAddressInfo,
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

        const $closeDetails = /** @type {HTMLButtonElement} */ (this.$accountDetails.querySelector('#close-details'));
        $closeDetails.addEventListener('click', this._closeDetails.bind(this));

        const $value = /** @type {HTMLDivElement} */ (this.$el.querySelector('#value'));
        const $fee = /** @type {HTMLDivElement} */ (this.$el.querySelector('#fee'));
        const $data = /** @type {HTMLDivElement} */ (this.$el.querySelector('#data'));

        // Set value and fee.
        $value.textContent = NumberFormatting.formatNumber(lunasToCoins(Number(transaction.value)));
        if ($fee && transaction.fee > 0) {
            $fee.textContent = NumberFormatting.formatNumber(lunasToCoins(Number(transaction.fee)));
            const $feeSection = /** @type {HTMLDivElement} */ (this.$el.querySelector('.fee-section'));
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
        // } else {
        const formattedData = TransactionDataFormatting.formatTransactionData(transaction);
        if (formattedData) {
            $data.textContent = formattedData;
            const $dataSection = /** @type {HTMLDivElement} */ (this.$el.querySelector('.data-section'));
            $dataSection.classList.remove('display-none');
            I18n.observer.on(
                I18n.Events.LANGUAGE_CHANGED,
                () => { $data.textContent = TransactionDataFormatting.formatTransactionData(transaction); },
            );
        }
        // }

        // Set up username and account name with account icon
        const $nameSection = /** @type {HTMLDivElement} */ (this.$el.querySelector('.user-and-account-names'));
        const $accountIcon = document.createElement('div');
        $accountIcon.classList.add('account-icon');
        if (request.keyInfo.type === Nimiq.Secret.Type.ENTROPY) {
            // eslint-disable-next-line no-new
            new LoginFileAccountIcon(request.keyInfo.defaultAddress.toUserFriendlyAddress(), $accountIcon);
        } else {
            // Show identicon for legacy accounts (which must be supported to support Team Nimiq Multisig)
            // eslint-disable-next-line no-new
            new Identicon(request.keyInfo.defaultAddress.toUserFriendlyAddress(), $accountIcon);
        }
        const $accountName = document.createElement('div');
        $accountName.classList.add('account-name');
        $accountName.textContent = request.keyLabel;
        const $accountIconAndName = document.createElement('div');
        $accountIconAndName.classList.add('account-icon-and-name');
        $accountIconAndName.append($accountIcon, $accountName);
        if (request.multisigConfig.userName) {
            const $userName = document.createElement('div');
            $userName.classList.add('user-name');
            $userName.textContent = request.multisigConfig.userName;
            I18n.translateToHtmlContent($nameSection, 'sign-multisig-tx-approving-as-name-with-account', {
                userName: $userName,
                accountName: $accountIconAndName,
            });
        } else {
            I18n.translateToHtmlContent($nameSection, 'sign-multisig-tx-approving-with-account', {
                accountName: $accountIconAndName,
            });
        }

        // Set up password box.
        const $passwordBox = /** @type {HTMLFormElement} */ (document.querySelector('#password-box'));
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
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            if (errorMessage === 'Invalid key') {
                TopLevelApi.setLoading(false);
                this._passwordBox.onPasswordIncorrect();
                return;
            }
            reject(new Errors.CoreError(error instanceof Error ? error : errorMessage));
            return;
        }
        if (!key) {
            reject(new Errors.KeyNotFoundError());
            return;
        }

        const publicKey = key.derivePublicKey(request.keyPath);

        // Verify publicKey is part of the signing public keys
        const ownSigner = request.multisigConfig.signers.find(signer => signer.publicKey.equals(publicKey));
        if (!ownSigner) {
            reject(new Errors.InvalidRequestError('Selected key is not part of the multisig transaction signers'));
            return;
        }

        /** @type {Nimiq.RandomSecret[]} */
        let ownCommitmentSecrets;
        if (Array.isArray(request.multisigConfig.secrets)) {
            ownCommitmentSecrets = request.multisigConfig.secrets;
        } else {
            // If we only have encrypted secrets, decrypt them first
            const rsaKey = await key.getRsaPrivateKey(request.multisigConfig.secrets.keyParams);

            try {
                ownCommitmentSecrets = await Promise.all(request.multisigConfig.secrets.encrypted.map(
                    async encrypted => new Nimiq.RandomSecret(new Uint8Array(
                        await window.crypto.subtle.decrypt(rsaKey.algorithm, rsaKey, encrypted),
                    )),
                ));
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                reject(new Errors.InvalidRequestError(`Cannot decrypt secrets: ${errorMessage}`));
                return;
            }
        }
        if (ownCommitmentSecrets.length !== ownSigner.commitments.length) {
            reject(new Errors.InvalidRequestError(
                'The number of secrets does not match the number of this signer\'s commitments',
            ));
            return;
        }
        /** @type {Nimiq.CommitmentPair[]} */
        const ownCommitmentPairs = [];
        for (let i = 0; i < ownCommitmentSecrets.length; i++) {
            ownCommitmentPairs.push(new Nimiq.CommitmentPair(
                ownCommitmentSecrets[i],
                ownSigner.commitments[i],
            ));
        }

        const signature = key.signPartially(
            request.keyPath,
            request.transaction.serializeContent(),
            ownCommitmentPairs,
            request.multisigConfig.signers.filter(signer => signer !== ownSigner),
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
}

SignMultisigTransaction.Pages = {
    CONFIRM_TRANSACTION: 'confirm-transaction',
};
