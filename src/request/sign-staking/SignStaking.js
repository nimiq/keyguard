/* global Nimiq */
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

        const publicKey = key.derivePublicKey(request.keyPath);

        const stakingTypesWithSignatureData = [
            SignStakingApi.IncomingStakingType.CREATE_STAKER,
            SignStakingApi.IncomingStakingType.UPDATE_STAKER,
            SignStakingApi.IncomingStakingType.RETIRE_STAKER,
            SignStakingApi.IncomingStakingType.REACTIVATE_STAKER,
        ];

        if (stakingTypesWithSignatureData.includes(request.type)) {
            // The tx signature of the staker is set in the data
            const signature = key.sign(request.keyPath, request.transaction.serializeContent());
            const proof = Nimiq.SignatureProof.singleSig(publicKey, signature);

            const data = new Nimiq.SerialBuffer(request.transaction.data);
            data.writePos = data.length - Nimiq.SignatureProof.SINGLE_SIG_SIZE;
            data.write(proof.serialize());

            // Reconstruct transaction (as transaction.data is readonly)
            const tx = request.transaction;
            request.transaction = new Nimiq.ExtendedTransaction(
                tx.sender, tx.senderType,
                tx.recipient, tx.recipientType,
                tx.value, tx.fee,
                tx.validityStartHeight, tx.flags,
                data, // <= data replaced here
                tx.proof, tx.networkId,
            );
        }

        // Regular tx signature of the sender
        const signature = key.sign(request.keyPath, request.transaction.serializeContent());

        /** @type {KeyguardRequest.SignStakingResult} */
        const result = {
            publicKey: publicKey.serialize(),
            signature: signature.serialize(),
            data: request.transaction.data,
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
        // TODO: Decode staking data

        return Utf8Tools.isValidUtf8(transaction.data)
            ? Utf8Tools.utf8ByteArrayToString(transaction.data)
            : Nimiq.BufferUtils.toHex(transaction.data);
    }
}

SignStaking.Pages = {
    CONFIRM_STAKING: 'confirm-staking',
};
