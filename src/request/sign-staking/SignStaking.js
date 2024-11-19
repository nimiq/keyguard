/* global Nimiq */
/* global Key */
/* global KeyStore */
/* global PasswordBox */
/* global Errors */
/* global Utf8Tools */
/* global TopLevelApi */
/* global AddressInfo */
/* global NumberFormatting */
/* global lunasToCoins */
/* global I18n */

/**
 * @callback SignStaking.resolve
 * @param {KeyguardRequest.SignStakingResult[]} result
 */

class SignStaking {
    /**
     * @param {Parsed<KeyguardRequest.SignStakingRequest>} request
     * @param {SignStaking.resolve} resolve
     * @param {reject} reject
     */
    constructor(request, resolve, reject) {
        this._request = request;
        this.$el = /** @type {HTMLElement} */ (document.getElementById(SignStaking.Pages.CONFIRM_STAKING));

        this.$headline = /** @type {HTMLElement} */ (this.$el.querySelector('#headline'));
        this.$accountDetails = /** @type {HTMLElement} */ (this.$el.querySelector('#account-details'));

        const $sender = /** @type {HTMLLinkElement} */ (this.$el.querySelector('.accounts .sender'));
        const $recipient = /** @type {HTMLLinkElement} */ (this.$el.querySelector('.accounts .recipient'));

        const transaction = request.plain[request.plain.length - 1];

        /** @type {Nimiq.Address | undefined} */
        let validatorAddress;

        let displayValue = transaction.value;

        if (transaction.recipientType === 'staking') {
            switch (transaction.data.type) {
                case 'create-staker':
                    if (transaction.data.delegation) {
                        validatorAddress = Nimiq.Address.fromUserFriendlyAddress(transaction.data.delegation);
                    }
                case 'add-stake': // eslint-disable-line no-fallthrough
                    validatorAddress = validatorAddress || request.validatorAddress;

                    if (!validatorAddress) {
                        throw new Errors.InvalidRequestError('No delegation or validatorAddress provided');
                    }

                    this.$headline.textContent = I18n.translatePhrase('sign-staking-heading-stake');
                    this._senderAddressInfo = new AddressInfo({ // From user
                        userFriendlyAddress: transaction.sender,
                        label: request.senderLabel || null,
                        imageUrl: null,
                        accountLabel: request.keyLabel || null,
                    });
                    this._recipientAddressInfo = new AddressInfo({ // To validator
                        userFriendlyAddress: validatorAddress.toUserFriendlyAddress(),
                        label: request.recipientLabel || null,
                        imageUrl: request.validatorImageUrl || null,
                        accountLabel: null,
                    });
                    break;
                case 'update-staker': { // Change validator
                    if (transaction.data.newDelegation) {
                        validatorAddress = Nimiq.Address.fromUserFriendlyAddress(transaction.data.newDelegation);
                    }

                    if (!validatorAddress) {
                        throw new Errors.InvalidRequestError('No newDelegation provided');
                    }

                    if (!request.amount) {
                        throw new Errors.InvalidRequestError('No amount provided');
                    }
                    displayValue = request.amount;

                    const fromValidatorAddress = request.validatorAddress;
                    if (!fromValidatorAddress) {
                        throw new Errors.InvalidRequestError('No fromValidatorAddress provided');
                    }

                    this.$headline.textContent = I18n.translatePhrase('sign-staking-heading-change');
                    this._senderAddressInfo = new AddressInfo({ // From previous validator
                        userFriendlyAddress: fromValidatorAddress.toUserFriendlyAddress(),
                        label: request.senderLabel || null,
                        imageUrl: request.fromValidatorImageUrl || null,
                        accountLabel: request.keyLabel || null,
                    });
                    this._recipientAddressInfo = new AddressInfo({ // To new validator
                        userFriendlyAddress: validatorAddress.toUserFriendlyAddress(),
                        label: request.recipientLabel || null,
                        imageUrl: request.validatorImageUrl || null,
                        accountLabel: null,
                    });
                    break;
                }
                case 'set-active-stake':
                case 'retire-stake':
                    validatorAddress = request.validatorAddress;

                    if (!validatorAddress) {
                        throw new Errors.InvalidRequestError('No validatorAddress provided');
                    }

                    if (!request.amount) {
                        throw new Errors.InvalidRequestError('No amount provided');
                    }
                    displayValue = request.amount;

                    this.$headline.textContent = I18n.translatePhrase('sign-staking-heading-unstake');
                    this._senderAddressInfo = new AddressInfo({ // From validator
                        userFriendlyAddress: validatorAddress.toUserFriendlyAddress(),
                        label: request.recipientLabel || null,
                        imageUrl: request.validatorImageUrl || null,
                        accountLabel: null,
                    });
                    this._recipientAddressInfo = new AddressInfo({ // To User
                        userFriendlyAddress: transaction.sender,
                        label: request.senderLabel || null,
                        imageUrl: null,
                        accountLabel: request.keyLabel || null,
                    });
                    break;
                case 'create-validator':
                case 'update-validator':
                case 'deactivate-validator':
                case 'reactivate-validator':
                case 'retire-validator':
                default:
                    this.$headline.textContent = I18n.translatePhrase('sign-tx-heading-tx');
                    this._senderAddressInfo = new AddressInfo({
                        userFriendlyAddress: transaction.sender,
                        label: request.senderLabel || null,
                        imageUrl: null,
                        accountLabel: request.keyLabel || null,
                    });
                    this._recipientAddressInfo = new AddressInfo({
                        userFriendlyAddress: transaction.recipient,
                        label: request.recipientLabel || null,
                        imageUrl: null,
                        accountLabel: null,
                    });
                    break;
            }
        } else {
            switch (transaction.senderData.type) {
                case 'remove-stake':
                    validatorAddress = request.validatorAddress;

                    if (!validatorAddress) {
                        throw new Errors.InvalidRequestError('No validatorAddress provided');
                    }

                    this.$headline.textContent = I18n.translatePhrase('sign-staking-heading-unstake');
                    this._senderAddressInfo = new AddressInfo({ // From validator
                        userFriendlyAddress: validatorAddress.toUserFriendlyAddress(),
                        label: request.senderLabel || null,
                        imageUrl: request.validatorImageUrl || null,
                        accountLabel: null,
                    });
                    this._recipientAddressInfo = new AddressInfo({ // To User
                        userFriendlyAddress: transaction.recipient,
                        label: request.recipientLabel || null,
                        imageUrl: null,
                        accountLabel: request.keyLabel || null,
                    });
                    break;
                case 'delete-validator':
                default:
                    this.$headline.textContent = I18n.translatePhrase('sign-tx-heading-tx');
                    this._senderAddressInfo = new AddressInfo({
                        userFriendlyAddress: transaction.sender,
                        label: request.senderLabel || null,
                        imageUrl: null,
                        accountLabel: null,
                    });
                    this._recipientAddressInfo = new AddressInfo({
                        userFriendlyAddress: transaction.recipient,
                        label: request.recipientLabel || null,
                        imageUrl: null,
                        accountLabel: request.keyLabel || null,
                    });
                    break;
            }
        }

        this._senderAddressInfo.renderTo($sender);
        $sender.addEventListener('click', () => {
            this._openDetails(this._senderAddressInfo);
        });

        this._recipientAddressInfo.renderTo($recipient);
        $recipient.addEventListener('click', () => {
            this._openDetails(this._recipientAddressInfo);
        });

        const $closeDetails = /** @type {HTMLButtonElement} */ (this.$accountDetails.querySelector('#close-details'));
        $closeDetails.addEventListener('click', this._closeDetails.bind(this));

        const $value = /** @type {HTMLDivElement} */ (this.$el.querySelector('#value'));
        const $fee = /** @type {HTMLDivElement} */ (this.$el.querySelector('#fee'));

        // Set value and fee.
        $value.textContent = NumberFormatting.formatNumber(lunasToCoins(displayValue));
        if ($fee && transaction.fee > 0) {
            $fee.textContent = NumberFormatting.formatNumber(lunasToCoins(transaction.fee));
            const $feeSection = /** @type {HTMLDivElement} */ (this.$el.querySelector('.fee-section'));
            $feeSection.classList.remove('display-none');
        }

        // Set up password box.
        const $passwordBox = /** @type {HTMLFormElement} */ (document.querySelector('#password-box'));
        this._passwordBox = new PasswordBox($passwordBox, {
            hideInput: !request.keyInfo.encrypted,
            buttonI18nTag: 'passwordbox-confirm-tx',
            minLength: request.keyInfo.hasPin ? Key.PIN_LENGTH : undefined,
        });

        this._passwordBox.on(
            PasswordBox.Events.SUBMIT,
            /** @param {string} [password] */ password => {
                this._onConfirm(request, resolve, reject, password);
            },
        );
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
     * @param {Parsed<KeyguardRequest.SignStakingRequest>} request
     * @param {SignStaking.resolve} resolve
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
            if ((e instanceof Error ? e.message : e) === 'Invalid key') {
                TopLevelApi.setLoading(false);
                this._passwordBox.onPasswordIncorrect();
                return;
            }
            reject(new Errors.CoreError(
                e instanceof Error || typeof e === 'string' ? e : new Error(/** @type {any} */ (e)),
            ));
            return;
        }
        if (!key) {
            reject(new Errors.KeyNotFoundError());
            return;
        }

        const powPrivateKey = key.derivePrivateKey(request.keyPath);

        const privateKey = Nimiq.PrivateKey.deserialize(powPrivateKey.serialize());
        const keyPair = Nimiq.KeyPair.derive(privateKey);

        const results = request.transactions.map(transaction => {
            transaction.sign(keyPair);

            /** @type {KeyguardRequest.SignStakingResult} */
            const result = {
                publicKey: keyPair.publicKey.serialize(),
                signature: transaction.proof.subarray(transaction.proof.length - 64),
                transaction: transaction.serialize(),
            };

            return result;
        });

        resolve(results);
    }

    run() {
        // Go to start page
        window.location.hash = SignStaking.Pages.CONFIRM_STAKING;
    }
}

SignStaking.Pages = {
    CONFIRM_STAKING: 'confirm-staking',
};
