/* global Nimiq */
/* global Albatross */
/* global Key */
/* global KeyStore */
/* global PasswordBox */
/* global Errors */
/* global Utf8Tools */
/* global TopLevelApi */
/* global AddressInfo */
/* global NumberFormatting */

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
        /** @type {HTMLElement} */
        this.$el = (document.getElementById(SignStaking.Pages.CONFIRM_STAKING));

        const transaction = request.plain[request.plain.length - 1];

        /** @type {HTMLElement} */
        this.$accountDetails = (this.$el.querySelector('#account-details'));

        /** @type {HTMLLinkElement} */
        const $sender = (this.$el.querySelector('.accounts .sender'));
        this._senderAddressInfo = new AddressInfo({
            userFriendlyAddress: transaction.sender,
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
        this._recipientAddressInfo = new AddressInfo({
            userFriendlyAddress: transaction.recipient,
            label: request.recipientLabel || null,
            imageUrl: null,
            accountLabel: null,
        });
        this._recipientAddressInfo.renderTo($recipient);
        $recipient.addEventListener('click', () => {
            this._openDetails(this._recipientAddressInfo);
        });

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

        if ($data && transaction.data.raw.length) {
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

        const powPrivateKey = key.derivePrivateKey(request.keyPath);

        const privateKey = Albatross.PrivateKey.unserialize(powPrivateKey.serialize());
        const keyPair = Albatross.KeyPair.derive(privateKey);

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

    /**
     * @param {Albatross.PlainTransaction} plain
     * @returns {string}
     */
    _formatData(plain) {
        console.log(plain);
        // That either the recipient or the sender is a staking account type is validated in SignStakingApi
        // @ts-ignore Wrong type definition
        if (plain.recipientType === 3) {
            switch (plain.data.type) {
                case 'create-staker': {
                    let text = 'Start staking';
                    const { delegation } = plain.data;
                    if (delegation) {
                        text += ` with validator ${delegation}`;
                    } else {
                        text += ' with no validator';
                    }
                    return text;
                }
                case 'update-staker': {
                    let text = 'Change validator';
                    const { newDelegation, reactivateAllStake } = plain.data;
                    if (newDelegation) {
                        text += ` to validator ${newDelegation}`;
                    } else {
                        text += ' to no validator';
                    }
                    if (reactivateAllStake) {
                        text += ' and reactivate all stake';
                    }
                    return text;
                }
                case 'add-stake': {
                    const { staker } = plain.data;
                    return `Add stake to ${staker}`;
                }
                case 'set-active-stake': {
                    const { newActiveBalance } = plain.data;
                    return `Set active stake to ${newActiveBalance / 1e5} NIM`;
                }
                case 'retire-stake': {
                    const { retireStake } = plain.data;
                    return `Retire ${retireStake / 1e5} NIM stake`;
                }
                case 'create-validator': {
                    let text = `Create validator ${plain.sender}`;
                    const { rewardAddress } = plain.data;
                    if (rewardAddress !== plain.sender) {
                        text += ` with reward address ${rewardAddress}`;
                    }
                    // TODO: Somehow let users see validator key, signing key, and signal data that they are signing
                    return text;
                }
                case 'update-validator': {
                    let text = `Update validator ${plain.sender}`;
                    const {
                        newRewardAddress,
                        newVotingKey,
                        newSigningKey,
                        newSignalData,
                    } = plain.data;
                    text += ` ${plain.sender}`;
                    if (newRewardAddress) {
                        text += `, updating reward address to ${newRewardAddress}`;
                    }
                    if (newVotingKey) {
                        text += ', updating voting key';
                    }
                    if (newSigningKey) {
                        text += ', updating signing key';
                    }
                    if (newSignalData) {
                        text += ', updating signal data';
                    }
                    return text;
                }
                case 'deactivate-validator': {
                    const { validator } = plain.data;
                    return `Deactivate validator ${validator}`;
                }
                case 'reactivate-validator': {
                    const { validator } = plain.data;
                    return `Reactivate validator ${validator}`;
                }
                case 'retire-validator': {
                    return `Retire validator ${plain.sender}`;
                }
                default: {
                    return `Unrecognized in-staking data: ${plain.data.type} - ${plain.data.raw}`;
                }
            }
        } else {
            switch (plain.senderData.type) {
                case 'remove-stake': {
                    return 'Unstake';
                }
                case 'delete-validator': {
                    // Cannot show the validator address here, as the recipient can be any address and the validator
                    // address is the signer, which the Keyguard only knows after password entry.
                    return 'Delete validator';
                }
                default: {
                    return `Unrecognized out-staking data: ${plain.senderData.type} - ${plain.senderData.raw}`;
                }
            }
        }
    }
}

SignStaking.Pages = {
    CONFIRM_STAKING: 'confirm-staking',
};
