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
 * @param {KeyguardRequest.SignTransactionResult | KeyguardRequest.SignTransactionResult[]} result
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

        const isMultiTransaction = request.transactions.length > 1;
        this.$accountDetails = /** @type {HTMLElement} */ (this.$el.querySelector('#account-details'));

        if (isMultiTransaction) {
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
                : isMultiTransaction
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

    /** @param {Parsed<KeyguardRequest.SignTransactionRequest>} request */
    _renderSingleTransactionView(request) {
        const transaction = request.transactions[0];

        const $sender = /** @type {HTMLLinkElement} */ (this.$el.querySelector('.single-transaction .sender'));
        const senderAddressInfo = new AddressInfo({
            userFriendlyAddress: transaction.sender.toUserFriendlyAddress(),
            label: request.senderLabel || null,
            imageUrl: null,
            accountLabel: request.keyLabel || null,
        });
        senderAddressInfo.renderTo($sender);
        $sender.addEventListener('click', () => {
            this._openDetails(senderAddressInfo);
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
        const recipientAddressInfo = new AddressInfo({
            userFriendlyAddress: recipientAddress,
            label: recipientLabel,
            imageUrl: recipientImage,
            accountLabel: null,
        }, request.layout === SignTransactionApi.Layouts.CASHLINK);
        recipientAddressInfo.renderTo($recipient);
        if (request.layout !== SignTransactionApi.Layouts.CASHLINK) {
            $recipient.addEventListener('click', () => {
                this._openDetails(recipientAddressInfo);
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

    /** @param {Parsed<KeyguardRequest.SignTransactionRequest>} request */
    _renderMultiTransactionView(request) {
        // Add 'multi' class — controls heading visibility via hide-* and shows multi-transaction view
        this.$el.classList.add('multi');

        const $multiTx = /** @type {HTMLElement} */ (this.$el.querySelector('.multi-transaction'));

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
        const $count = /** @type {HTMLElement} */ ($multiTx.querySelector('#transaction-count'));
        I18n.translateToHtmlContent($count, 'sign-tx-multi-count', { count: String(request.transactions.length) });

        // Render transaction list
        const $list = /** @type {HTMLElement} */ ($multiTx.querySelector('#transaction-list'));
        for (const tx of request.transactions) {
            const $card = this._createTransactionListEntry(tx);
            $list.appendChild($card);
        }

        // Render totals
        const $totalValue = /** @type {HTMLElement} */ ($multiTx.querySelector('#total-value-amount'));
        $totalValue.textContent = NumberFormatting.formatNumber(lunasToCoins(Number(totalValue)));

        const $totalFees = /** @type {HTMLElement} */ ($multiTx.querySelector('#total-fees-amount'));
        $totalFees.textContent = NumberFormatting.formatNumber(lunasToCoins(Number(totalFee)));
    }

    /**
     * @param {Nimiq.Transaction} tx
     * @returns {HTMLElement}
     */
    _createTransactionListEntry(tx) {
        const $entry = document.createElement('div');
        $entry.className = 'transaction-list-entry';

        const senderAddress = tx.sender.toUserFriendlyAddress();
        const recipientAddress = tx.recipient.toUserFriendlyAddress();
        const senderAddressInfo = new AddressInfo({
            userFriendlyAddress: senderAddress,
            label: null,
            imageUrl: null,
            accountLabel: null,
        });
        const recipientAddressInfo = new AddressInfo({
            userFriendlyAddress: recipientAddress,
            label: null,
            imageUrl: null,
            accountLabel: null,
        });

        // Sender identicon (clickable → opens sender details)
        const $senderIcon = new Identicon(senderAddress).getElement();
        $senderIcon.classList.add('tx-sender');
        $senderIcon.addEventListener('click', () => this._openDetails(senderAddressInfo));
        $entry.appendChild($senderIcon);

        // Arrow
        const $arrow = document.createElement('span');
        $arrow.className = 'tx-arrow';
        $arrow.textContent = '\u2192'; // →
        $entry.appendChild($arrow);

        // Recipient identicon (clickable → opens recipient details)
        const $recipientIcon = new Identicon(recipientAddress).getElement();
        $recipientIcon.classList.add('tx-recipient');
        $recipientIcon.addEventListener('click', () => this._openDetails(recipientAddressInfo));
        $entry.appendChild($recipientIcon);

        // Details container
        const $details = document.createElement('div');
        $details.className = 'tx-details';

        // Sender address (clickable → opens sender details)
        const $senderAddr = document.createElement('div');
        $senderAddr.className = 'tx-address address tx-sender-address tx-sender';
        $senderAddr.textContent = senderAddress;
        $senderAddr.addEventListener('click', () => this._openDetails(senderAddressInfo));
        $details.appendChild($senderAddr);

        // Recipient address (clickable → opens recipient details)
        const $recipientAddr = document.createElement('div');
        $recipientAddr.className = 'tx-address address tx-recipient-address tx-recipient';
        $recipientAddr.textContent = recipientAddress;
        $recipientAddr.addEventListener('click', () => this._openDetails(recipientAddressInfo));
        $details.appendChild($recipientAddr);

        // Transaction data (contract creation, staking info, etc.)
        const formattedData = TransactionDataFormatting.formatTransactionData(tx);
        if (formattedData) {
            const $txData = document.createElement('div');
            $txData.className = 'tx-data nq-text-s';
            $txData.textContent = formattedData;
            $details.appendChild($txData);
            I18n.observer.on(
                I18n.Events.LANGUAGE_CHANGED,
                () => { $txData.textContent = TransactionDataFormatting.formatTransactionData(tx); },
            );
        }

        $entry.appendChild($details);

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

        $entry.appendChild($amounts);

        return $entry;
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

        const privateKey = key.derivePrivateKey(request.keyPath);
        const keyPair = Nimiq.KeyPair.derive(privateKey);
        const publicKey = keyPair.publicKey;

        /** @type {KeyguardRequest.SignTransactionResult[]} */
        const results = request.transactions.map(transaction => {
            const isStakingTx = transaction.senderType === Nimiq.AccountType.Staking
                || transaction.recipientType === Nimiq.AccountType.Staking;

            if (isStakingTx) {
                // For staking transactions, use `transaction.sign()` for automatically generating
                // the staker / validator signature proof in the recipient data. The same keypair as
                // for signing the transaction will be used for this. Arbitrary signature proofs for
                // a different staker or validator address are not supported — the request parser
                // rejects incoming staking transactions that carry a user-provided proof.
                transaction.sign(keyPair);

                return {
                    publicKey: publicKey.serialize(),
                    signature: transaction.proof.subarray(transaction.proof.length - 64),
                    serializedTx: transaction.serialize(),
                };
            }

            // For non-staking transactions, use the manual signing approach.
            // Note however, that this will not return a valid HTLC redemption signature proof.
            // It has to be built manually from the signature.
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

    run() {
        // Go to start page
        window.location.hash = SignTransaction.Pages.CONFIRM_TRANSACTION;
    }
}

SignTransaction.Pages = {
    CONFIRM_TRANSACTION: 'confirm-transaction',
};
