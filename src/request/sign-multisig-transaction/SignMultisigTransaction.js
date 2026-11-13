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
/* global MultisigSigningState */
/* global MultisigSessionStore */

/**
 * @callback SignMultisigTransaction.resolve
 * @param {KeyguardRequest.SignatureResult} result
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
        if (transaction.fee > 0) {
            $fee.textContent = NumberFormatting.formatNumber(lunasToCoins(Number(transaction.fee)));
        } else {
            const $feeSection = /** @type {HTMLDivElement} */ ($fee.parentElement);
            $feeSection.remove();
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
            I18n.observer.on(
                I18n.Events.LANGUAGE_CHANGED,
                () => { $data.textContent = TransactionDataFormatting.formatTransactionData(transaction); },
            );
        } else {
            $data.remove();
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
            'detailed',
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

        const privateKey = key.derivePrivateKey(request.keyPath);
        const publicKey = Nimiq.PublicKey.derive(privateKey);

        // Verify publicKey is part of the signing public keys
        const ownSigner = request.multisigConfig.signers.find(signer => signer.publicKey.equals(publicKey));
        if (!ownSigner) {
            reject(new Errors.InvalidRequestError('Selected key is not part of the multisig transaction signers'));
            return;
        }
        // Get a list of other signers, excluding the own signer. This works because `ownSigner` is a reference into
        // the `signers` array, so we can use object-equality.
        const otherSigners = request.multisigConfig.signers.filter(signer => signer !== ownSigner);

        // Verify the signing state. It must have been created by this key in round 1, for this transaction and
        // multisig, and must not have been modified.
        const { state, publicKeys, signers } = request.multisigConfig;
        const data = request.transaction.serializeContent();
        if (!state.verify(privateKey)) {
            reject(new Errors.InvalidRequestError('Invalid state: not created for this key, or modified'));
            return;
        }
        if (state.isExpired()) {
            reject(new Errors.RequestExpired());
            return;
        }
        if (!state.matchesTransaction(data)) {
            reject(new Errors.InvalidRequestError('Invalid state: created for a different transaction'));
            return;
        }
        if (!state.matchesMultisig(publicKeys, signers.length)) {
            reject(new Errors.InvalidRequestError('Invalid state: created for a different multisig'));
            return;
        }

        const ownCommitmentPairs = state.deriveCommitmentPairs(privateKey);
        if (ownCommitmentPairs.some((pair, i) => !pair.commitment.equals(ownSigner.commitments[i]))) {
            reject(new Errors.InvalidRequestError(
                'This signer\'s commitments do not match the ones created for this state',
            ));
            return;
        }

        // Never sign the same signing session twice with differing inputs, as that would leak the private key.
        const store = MultisigSessionStore.instance;
        const stateHash = state.hash();
        const inputsHash = MultisigSigningState.hashSigningInputs(data, signers);
        /** @type {MultisigSessionStore.Decision} */
        let decision;
        try {
            const [deviceId, usage] = await Promise.all([store.getDeviceId(), store.getUsage(stateHash)]);
            decision = MultisigSessionStore.decide({
                isOwnDevice: MultisigSigningState.constantTimeEquals(deviceId, state.deviceId),
                usage,
                inputsHash,
            });
        } catch (error) {
            reject(new Errors.KeyguardError(`Cannot access signing session records: ${String(error)}`));
            return;
        }

        if (decision === MultisigSessionStore.Decision.REFUSE) {
            reject(new Errors.InvalidRequestError(SignMultisigTransaction.ALREADY_USED_ERROR));
            return;
        }
        if (decision === MultisigSessionStore.Decision.CONFIRM) {
            TopLevelApi.setLoading(false);
            const confirmed = await this._confirmForeignSession(state.createdAt);
            if (!confirmed) {
                reject(new Errors.RequestCanceled());
                return;
            }
            TopLevelApi.setLoading(true);
        }

        // Record the use atomically right before signing, which also catches concurrent requests in multiple tabs.
        let claimed = false;
        try {
            claimed = await store.claim(stateHash, inputsHash, state.expiresAt);
        } catch (error) {
            reject(new Errors.KeyguardError(`Cannot record signing session: ${String(error)}`));
            return;
        }
        if (!claimed) {
            reject(new Errors.InvalidRequestError(SignMultisigTransaction.ALREADY_USED_ERROR));
            return;
        }

        const signature = key.signPartially(
            request.keyPath,
            data,
            ownCommitmentPairs,
            otherSigners,
        );

        // Clean up records of expired sessions. Failures are irrelevant for this request.
        store.prune().catch(() => {});

        /** @type {KeyguardRequest.SignatureResult} */
        const result = {
            publicKey: publicKey.serialize(),
            signature: signature.serialize(),
        };
        resolve(result);
    }

    /**
     * Shows a warning for signing sessions which were started on another device or browser, as approving the same
     * session on multiple devices can leak the private key.
     *
     * @param {number} sessionCreatedAt
     * @returns {Promise<boolean>} Whether the user confirmed.
     * @private
     */
    _confirmForeignSession(sessionCreatedAt) {
        const $page = /** @type {HTMLElement} */ (
            document.getElementById(SignMultisigTransaction.Pages.FOREIGN_SESSION_WARNING));
        const $createdAt = /** @type {HTMLElement} */ ($page.querySelector('.session-created-at'));
        const $confirm = /** @type {HTMLButtonElement} */ ($page.querySelector('.confirm'));
        const $cancel = /** @type {HTMLButtonElement} */ ($page.querySelector('.cancel'));

        I18n.translateToHtmlContent($createdAt, 'sign-multisig-tx-foreign-session-started', {
            time: new Date(sessionCreatedAt).toLocaleString(I18n.language),
        });

        window.location.hash = SignMultisigTransaction.Pages.FOREIGN_SESSION_WARNING;

        return new Promise(resolve => {
            const listeners = new AbortController();
            /**
             * @param {boolean} confirmed
             */
            const finish = confirmed => {
                listeners.abort();
                resolve(confirmed);
            };
            $confirm.addEventListener('click', () => finish(true), { signal: listeners.signal });
            $cancel.addEventListener('click', () => finish(false), { signal: listeners.signal });
        });
    }

    run() {
        // Go to start page
        window.location.hash = SignMultisigTransaction.Pages.CONFIRM_TRANSACTION;
    }
}

SignMultisigTransaction.Pages = {
    CONFIRM_TRANSACTION: 'confirm-transaction',
    FOREIGN_SESSION_WARNING: 'foreign-session-warning',
};

SignMultisigTransaction.ALREADY_USED_ERROR = 'This signing session has already been used with different commitments '
    + 'or signers. Start a new signing session instead.';
