/* global Nimiq */
/* global Albatross */
/* global Key */
/* global KeyStore */
/* global PasswordBox */
/* global SignStakingApi */
/* global Errors */
/* global Utf8Tools */
/* global TopLevelApi */
/* global AddressInfo */
/* global NumberFormatting */

/**
 * @callback SignStaking.resolve
 * @param {KeyguardRequest.SignStakingResult} result
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
        const recipientLabel = 'recipientLabel' in request && !!request.recipientLabel
            ? request.recipientLabel
            : null;
        this._recipientAddressInfo = new AddressInfo({
            userFriendlyAddress: recipientAddress,
            label: recipientLabel,
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

        if ($data && transaction.data.byteLength > 0) {
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

        /** @type {Albatross.Transaction} */
        let tx;

        switch (request.type) {
            case SignStakingApi.IncomingStakingType.CREATE_STAKER:
                tx = Albatross.TransactionBuilder.newCreateStaker(
                    keyPair.toAddress(),
                    Albatross.Address.fromString(/** @type {Nimiq.Address} */ (request.delegation).toHex()),
                    BigInt(request.transaction.value),
                    BigInt(request.transaction.fee),
                    request.transaction.validityStartHeight,
                    request.transaction.networkId,
                );
                break;
            case SignStakingApi.IncomingStakingType.ADD_STAKE:
                tx = Albatross.TransactionBuilder.newStake(
                    keyPair.toAddress(),
                    keyPair.toAddress(),
                    BigInt(request.transaction.value),
                    BigInt(request.transaction.fee),
                    request.transaction.validityStartHeight,
                    request.transaction.networkId,
                );
                break;
            case SignStakingApi.IncomingStakingType.UPDATE_STAKER:
                tx = Albatross.TransactionBuilder.newUpdateStaker(
                    keyPair.toAddress(),
                    Albatross.Address.fromString(/** @type {Nimiq.Address} */ (request.delegation).toHex()),
                    Boolean(request.reactivateAllStake),
                    BigInt(request.transaction.fee),
                    request.transaction.validityStartHeight,
                    request.transaction.networkId,
                );
                break;
            case SignStakingApi.IncomingStakingType.SET_INACTIVE_STAKE:
                tx = Albatross.TransactionBuilder.newSetInactiveStake(
                    keyPair.toAddress(),
                    BigInt(request.newInactiveBalance),
                    BigInt(request.transaction.fee),
                    request.transaction.validityStartHeight,
                    request.transaction.networkId,
                );
                break;
            case SignStakingApi.IncomingStakingType.UNSTAKE:
                tx = Albatross.TransactionBuilder.newUnstake(
                    keyPair.toAddress(),
                    BigInt(request.transaction.value),
                    BigInt(request.transaction.fee),
                    request.transaction.validityStartHeight,
                    request.transaction.networkId,
                );
                break;
            default:
                throw new Errors.KeyguardError('Unreachable');
        }

        tx.sign(keyPair);

        /** @type {KeyguardRequest.SignStakingResult} */
        const result = {
            publicKey: keyPair.publicKey.serialize(),
            signature: tx.proof.subarray(tx.proof.length - 64),
            data: request.transaction.data,
            serializedTx: tx.serialize(),
        };
        resolve(result);
    }

    run() {
        // Go to start page
        window.location.hash = SignStaking.Pages.CONFIRM_STAKING;
    }

    /**
     * @param {Nimiq.Transaction} transaction
     * @returns {string}
     */
    _formatData(transaction) {
        const buf = new Nimiq.SerialBuffer(transaction.data);
        const type = buf.readUint8();
        switch (type) {
            case SignStakingApi.IncomingStakingType.CREATE_STAKER: {
                let text = 'Start staking';
                const hasDelegation = buf.readUint8() === 1;
                if (hasDelegation) {
                    const delegation = Nimiq.Address.unserialize(buf);
                    text += ` with validator ${delegation.toUserFriendlyAddress()}`;
                } else {
                    text += ' with no validator';
                }
                return text;
            }
            case SignStakingApi.IncomingStakingType.UPDATE_STAKER: {
                let text = 'Change validator';
                const hasDelegation = buf.readUint8() === 1;
                if (hasDelegation) {
                    const delegation = Nimiq.Address.unserialize(buf);
                    text += ` to validator ${delegation.toUserFriendlyAddress()}`;
                } else {
                    text += ' to no validator';
                }
                if (buf.readUint8() === 1) {
                    text += ' and reactivate all stake';
                }
                return text;
            }
            case SignStakingApi.IncomingStakingType.ADD_STAKE: {
                const staker = Nimiq.Address.unserialize(buf);
                return `Add stake for ${staker.toUserFriendlyAddress()}`;
            }
            case SignStakingApi.IncomingStakingType.SET_INACTIVE_STAKE: {
                const inactiveBalance = buf.readUint64();
                return `Set inactive stake to ${inactiveBalance / 1e5} NIM`;
            }
            default: return Nimiq.BufferUtils.toHex(transaction.data);
        }
    }
}

SignStaking.Pages = {
    CONFIRM_STAKING: 'confirm-staking',
};
