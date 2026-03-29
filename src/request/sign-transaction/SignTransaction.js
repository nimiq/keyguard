/* global Nimiq */
/* global Key */
/* global KeyStore */
/* global SignTransactionApi */
/* global PasswordBox */
/* global Errors */
/* global Utf8Tools */
/* global TopLevelApi */
/* global AddressInfo */
/* global PaymentInfoLine */
/* global Constants */
/* global NumberFormatting */
/* global TransactionDataFormatting */
/* global I18n */
/* global Identicon */
/* global lunasToCoins */

/**
 * @callback SignTransaction.resolve
 * @param {KeyguardRequest.SignTransactionResult | KeyguardRequest.SignTransactionResults} result
 */

class SignTransaction {
    /**
     * @param {Parsed<KeyguardRequest.SignTransactionRequest>} request
     * @param {SignTransaction.resolve} resolve
     * @param {reject} reject
     */
    constructor(request, resolve, reject) {
        this._request = request;
        this.$el = /** @type {HTMLElement} */ (document.getElementById(SignTransaction.Pages.CONFIRM_TRANSACTION));
        this.$el.classList.add(request.layout);

        this._isMultiTransaction = request.transactions.length > 1;
        this.$accountDetails = /** @type {HTMLElement} */ (this.$el.querySelector('#account-details'));

        if (this._isMultiTransaction) {
            this._renderMultiTransactionView(request);
        } else {
            this._renderSingleTransactionView(request);
        }

        const $closeDetails = /** @type {HTMLButtonElement} */ (this.$accountDetails.querySelector('#close-details'));
        $closeDetails.addEventListener('click', this._closeDetails.bind(this));

        // Set up password box.
        const $passwordBox = /** @type {HTMLFormElement} */ (document.querySelector('#password-box'));
        this._passwordBox = new PasswordBox($passwordBox, {
            hideInput: !request.keyInfo.encrypted,
            buttonI18nTag: request.layout === SignTransactionApi.Layouts.CASHLINK
                ? 'passwordbox-create-cashlink'
                : this._isMultiTransaction
                    ? 'passwordbox-confirm-txs'
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
     * Renders the single transaction view (existing behavior)
     * @param {Parsed<KeyguardRequest.SignTransactionRequest>} request
     * @private
     */
    _renderSingleTransactionView(request) {
        const transaction = request.transactions[0];

        const $sender = /** @type {HTMLLinkElement} */ (this.$el.querySelector('.single-transaction .sender'));
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

        const $recipient = /** @type {HTMLLinkElement} */ (this.$el.querySelector('.single-transaction .recipient'));
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

        const $paymentInfoLine = /** @type {HTMLElement} */ (this.$el.querySelector('.payment-info-line'));
        if (request.layout === SignTransactionApi.Layouts.CHECKOUT) {
            // eslint-disable-next-line no-new
            new PaymentInfoLine(Object.assign({}, request, {
                recipient: recipientAddress,
                label: recipientLabel || recipientAddress,
                imageUrl: request.shopLogoUrl,
                amount: Number(transaction.value),
                currency: /** @type {'nim'} */ ('nim'),
                unitsToCoins: lunasToCoins,
                networkFee: Number(transaction.fee),
            }), $paymentInfoLine);
        } else {
            $paymentInfoLine.remove();
        }

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

        if (request.layout === SignTransactionApi.Layouts.CASHLINK
         && Nimiq.BufferUtils.equals(transaction.data, Constants.CASHLINK_FUNDING_DATA)) {
            if (request.cashlinkMessage) {
                $data.textContent = request.cashlinkMessage;
                const $dataSection = /** @type {HTMLDivElement} */ (this.$el.querySelector('.data-section'));
                $dataSection.classList.remove('display-none');
            }
        } else {
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
        }
    }

    /**
     * Renders the multi-transaction view
     * @param {Parsed<KeyguardRequest.SignTransactionRequest>} request
     * @private
     */
    _renderMultiTransactionView(request) {
        // Add 'multi' class to show multi-transaction heading
        this.$el.classList.add('multi');

        // Hide single-transaction view, show multi-transaction view
        const $singleTx = /** @type {HTMLElement} */ (this.$el.querySelector('.single-transaction'));
        const $multiTx = /** @type {HTMLElement} */ (this.$el.querySelector('.multi-transaction'));
        $singleTx.classList.add('display-none');
        $multiTx.classList.remove('display-none');

        // Remove payment info line (not used in multi-tx mode)
        const $paymentInfoLine = /** @type {HTMLElement} */ (this.$el.querySelector('.payment-info-line'));
        $paymentInfoLine.remove();

        // Calculate totals
        let totalValue = 0n;
        let totalFee = 0n;
        for (const tx of request.transactions) {
            totalValue += tx.value;
            totalFee += tx.fee;
        }

        // Render transaction count
        const $count = /** @type {HTMLElement} */ ($multiTx.querySelector('.transaction-count'));
        $count.textContent = I18n.translatePhrase('sign-tx-multi-count')
            .replace('{count}', String(request.transactions.length));

        // Render transaction list
        const $list = /** @type {HTMLElement} */ ($multiTx.querySelector('.transaction-list'));
        for (const tx of request.transactions) {
            const $card = this._createTransactionCard(tx);
            $list.appendChild($card);
        }

        // Render totals
        const $totalValue = /** @type {HTMLElement} */ ($multiTx.querySelector('.total-value-amount'));
        $totalValue.textContent = NumberFormatting.formatNumber(lunasToCoins(Number(totalValue)));

        const $totalFees = /** @type {HTMLElement} */ ($multiTx.querySelector('.total-fees-amount'));
        $totalFees.textContent = NumberFormatting.formatNumber(lunasToCoins(Number(totalFee)));
    }

    /**
     * Creates a transaction card element for the multi-transaction list
     * @param {Nimiq.Transaction} tx
     * @returns {HTMLElement}
     * @private
     */
    _createTransactionCard(tx) {
        const $card = document.createElement('div');
        $card.className = 'transaction-card';

        const recipientAddress = tx.recipient.toUserFriendlyAddress();

        // Identicon
        const identicon = new Identicon(recipientAddress);
        $card.appendChild(identicon.getElement());

        // Details container
        const $details = document.createElement('div');
        $details.className = 'tx-details';

        // Address (short form)
        const $address = document.createElement('div');
        $address.className = 'tx-address';
        $address.textContent = recipientAddress;
        $details.appendChild($address);

        $card.appendChild($details);

        // Value and fee container
        const $amounts = document.createElement('div');
        $amounts.className = 'tx-amounts';

        // Value
        const $value = document.createElement('div');
        $value.className = 'tx-value';
        $value.innerHTML = `${NumberFormatting.formatNumber(lunasToCoins(Number(tx.value)))}`
            + '<span class="nim-symbol"></span>';
        $amounts.appendChild($value);

        // Fee
        if (tx.fee > 0) {
            const $fee = document.createElement('div');
            $fee.className = 'tx-fee';
            $fee.innerHTML = `+ ${NumberFormatting.formatNumber(lunasToCoins(Number(tx.fee)))}`
                + ` <span class="nim-symbol"></span> ${I18n.translatePhrase('sign-tx-fee')}`;
            $amounts.appendChild($fee);
        }

        $card.appendChild($amounts);

        return $card;
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

        // Check if any transaction is a staking transaction
        const hasStakingTx = request.transactions.some(tx =>
            tx.senderType === Nimiq.AccountType.Staking || tx.recipientType === Nimiq.AccountType.Staking);

        if (hasStakingTx) {
            // For staking transactions, use the same approach as SignStaking:
            // Derive a KeyPair and call transaction.sign()
            const privateKey = key.derivePrivateKey(request.keyPath);
            const keyPair = Nimiq.KeyPair.derive(privateKey);

            /** @type {KeyguardRequest.SignTransactionResults} */
            const results = request.transactions.map(transaction => {
                transaction.sign(keyPair);

                return {
                    publicKey: keyPair.publicKey.serialize(),
                    signature: transaction.proof.subarray(transaction.proof.length - 64),
                    serializedTx: transaction.serialize(),
                };
            });

            // Backward compatible: return single result for single tx, array for multiple
            resolve(results.length === 1 ? results[0] : results);
        } else {
            // For non-staking transactions, use the existing manual signing approach
            const publicKey = key.derivePublicKey(request.keyPath);

            // Sign all transactions
            /** @type {KeyguardRequest.SignTransactionResults} */
            const results = request.transactions.map(transaction => {
                const signature = key.sign(request.keyPath, transaction.serializeContent());
                transaction.proof = Nimiq.SignatureProof.singleSig(publicKey, signature).serialize();

                return {
                    publicKey: publicKey.serialize(),
                    signature: signature.serialize(),
                    serializedTx: transaction.serialize(),
                };
            });

            // Backward compatible: return single result for single tx, array for multiple
            resolve(results.length === 1 ? results[0] : results);
        }
    }

    run() {
        // Go to start page
        window.location.hash = SignTransaction.Pages.CONFIRM_TRANSACTION;
    }
}

SignTransaction.Pages = {
    CONFIRM_TRANSACTION: 'confirm-transaction',
};
