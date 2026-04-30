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

        const isSwitchValidator = request.layout === SignTransactionApi.Layouts.SWITCH_VALIDATOR;
        const isUnstaking = request.layout === SignTransactionApi.Layouts.UNSTAKING;
        const isCustomMultiTx = isSwitchValidator || isUnstaking;
        const isMultiTransaction = !isCustomMultiTx && request.transactions.length > 1;

        /** @type {string} */
        let viewClass = request.layout;
        if (isSwitchValidator) viewClass = 'switch-validator';
        else if (isUnstaking) viewClass = 'unstaking';
        else if (isMultiTransaction) viewClass = 'multi';
        this.$el.classList.add(viewClass);

        this.$accountDetails = /** @type {HTMLElement} */ (this.$el.querySelector('#account-details'));
        this.$txListDetails = /** @type {HTMLElement} */ (this.$el.querySelector('#tx-list-details'));

        if (isSwitchValidator) {
            this._renderSwitchValidatorView(
                /** @type {Parsed<KeyguardRequest.SignTransactionRequestSwitchValidator>} */ (request),
            );
        } else if (isUnstaking) {
            this._renderUnstakingView(
                /** @type {Parsed<KeyguardRequest.SignTransactionRequestUnstaking>} */ (request),
            );
        } else if (isMultiTransaction) {
            this._renderMultiTransactionView(request);
        } else {
            this._renderSingleTransactionView(request);
        }

        // Custom simplified layouts (e.g. switch-validator, unstaking) hide per-tx detail. For those,
        // expose the multi-tx list as an overlay accessible via an info icon on the page header.
        if (isCustomMultiTx) {
            this._setupTxListOverlay(request);
        }

        const $closeDetails = /** @type {HTMLButtonElement} */ (this.$accountDetails.querySelector('#close-details'));
        $closeDetails.addEventListener('click', this._closeDetails.bind(this));

        let buttonI18nTag = 'passwordbox-confirm-tx';
        if (request.layout === SignTransactionApi.Layouts.CASHLINK) buttonI18nTag = 'passwordbox-create-cashlink';
        else if (isMultiTransaction) buttonI18nTag = 'passwordbox-confirm-txs';

        const $passwordBox = /** @type {HTMLFormElement} */ (document.querySelector('#password-box'));
        this._passwordBox = new PasswordBox($passwordBox, {
            hideInput: !request.keyInfo.encrypted,
            buttonI18nTag,
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

        const $main = document.createElement('div');
        $main.className = 'tx-main';

        $main.appendChild(this._createTransactionAddressRow(senderAddress, senderAddressInfo));

        const $arrow = document.createElement('div');
        $arrow.className = 'tx-arrow';
        $arrow.innerHTML = '<svg class="nq-icon"><use xlink:href="../../../node_modules/'
            + '@nimiq/style/nimiq-style.icons.svg#nq-arrow-right"/></svg>';
        $main.appendChild($arrow);

        $main.appendChild(this._createTransactionAddressRow(recipientAddress, recipientAddressInfo));

        $main.appendChild(this._createTransactionAmounts(tx));
        $entry.appendChild($main);

        const formattedData = TransactionDataFormatting.formatTransactionData(tx);
        if (formattedData) {
            const $txData = document.createElement('div');
            $txData.className = 'tx-data';
            $txData.textContent = formattedData;
            I18n.observer.on(
                I18n.Events.LANGUAGE_CHANGED,
                () => { $txData.textContent = TransactionDataFormatting.formatTransactionData(tx); },
            );
            $entry.appendChild($txData);
        }

        return $entry;
    }

    /**
     * @param {string} userFriendlyAddress
     * @param {AddressInfo} addressInfo
     * @returns {HTMLElement}
     */
    _createTransactionAddressRow(userFriendlyAddress, addressInfo) {
        const $row = document.createElement('div');
        $row.className = 'tx-row';

        $row.appendChild(new Identicon(userFriendlyAddress).getElement());

        const $address = document.createElement('div');
        $address.className = 'tx-address address';
        $address.textContent = userFriendlyAddress;
        $row.appendChild($address);

        $row.addEventListener('click', () => this._openDetails(addressInfo));

        return $row;
    }

    /**
     * @param {Nimiq.Transaction} tx
     * @returns {HTMLElement}
     */
    _createTransactionAmounts(tx) {
        const $amounts = document.createElement('div');
        $amounts.className = 'tx-amounts';

        const $value = document.createElement('div');
        $value.className = 'tx-value';
        $value.innerHTML = `${NumberFormatting.formatNumber(lunasToCoins(Number(tx.value)))}`
            + '<span class="nim-symbol"></span>';
        $amounts.appendChild($value);

        if (tx.fee > 0) {
            const $fee = document.createElement('div');
            $fee.className = 'tx-fee';
            $fee.innerHTML = `+ ${NumberFormatting.formatNumber(lunasToCoins(Number(tx.fee)))}`
                + ` <span class="nim-symbol"></span> ${I18n.translatePhrase('sign-tx-fee')}`;
            $amounts.appendChild($fee);
        }

        return $amounts;
    }

    /** @param {Parsed<KeyguardRequest.SignTransactionRequestSwitchValidator>} request */
    _renderSwitchValidatorView(request) {
        const $paymentInfoLine = /** @type {HTMLElement} */ (this.$el.querySelector('.payment-info-line'));
        $paymentInfoLine.remove();

        const $switchView = /** @type {HTMLElement} */ (this.$el.querySelector('.switch-validator-view'));
        const $description = /** @type {HTMLElement} */ ($switchView.querySelector('.switch-subtitle-description'));
        $description.textContent = I18n.translatePhrase('sign-tx-switch-deferred-description');
        const $duration = /** @type {HTMLElement} */ ($switchView.querySelector('.switch-subtitle-duration'));
        $duration.textContent = I18n.translatePhrase('sign-tx-switch-deferred-duration');

        this._renderValidatorCard(
            /** @type {HTMLElement} */ ($switchView.querySelector('.accounts .sender')),
            request.fromValidatorAddress.toUserFriendlyAddress(),
            request.senderLabel || null,
            request.fromValidatorImageUrl || null,
            true,
        );
        this._renderValidatorCard(
            /** @type {HTMLElement} */ ($switchView.querySelector('.accounts .recipient')),
            request.validatorAddress.toUserFriendlyAddress(),
            request.recipientLabel || null,
            request.validatorImageUrl || null,
            false,
        );
    }

    /** @param {Parsed<KeyguardRequest.SignTransactionRequestUnstaking>} request */
    _renderUnstakingView(request) {
        const $paymentInfoLine = /** @type {HTMLElement} */ (this.$el.querySelector('.payment-info-line'));
        $paymentInfoLine.remove();

        const $view = /** @type {HTMLElement} */ (this.$el.querySelector('.unstaking-view'));

        // FROM: the validator the user is leaving.
        const $sender = /** @type {HTMLElement} */ ($view.querySelector('.accounts .sender'));
        const senderAddressInfo = new AddressInfo({
            userFriendlyAddress: request.validatorAddress.toUserFriendlyAddress(),
            label: request.senderLabel || null,
            imageUrl: request.validatorImageUrl || null,
            accountLabel: null,
        });
        senderAddressInfo.renderTo($sender);
        $sender.addEventListener('click', () => this._openDetails(senderAddressInfo));

        // TO: the user's wallet. The recipient of the third (remove-stake) transaction is the user's
        // own basic address — the parser validates this.
        const removeStakeTx = request.transactions[2];
        const $recipient = /** @type {HTMLElement} */ ($view.querySelector('.accounts .recipient'));
        const recipientAddressInfo = new AddressInfo({
            userFriendlyAddress: removeStakeTx.recipient.toUserFriendlyAddress(),
            label: request.recipientLabel || null,
            imageUrl: null,
            accountLabel: request.keyLabel || null,
        });
        recipientAddressInfo.renderTo($recipient);
        $recipient.addEventListener('click', () => this._openDetails(recipientAddressInfo));

        // Headline amount = value of the remove-stake tx (NIM returned to the user).
        const $amount = /** @type {HTMLElement} */ ($view.querySelector('.unstake-amount-value'));
        $amount.textContent = NumberFormatting.formatNumber(lunasToCoins(Number(removeStakeTx.value)));

        // Total fee across all 3 transactions; hidden when zero.
        let totalFee = 0n;
        for (const tx of request.transactions) {
            totalFee += tx.fee;
        }
        if (totalFee > 0n) {
            const $feeValue = /** @type {HTMLElement} */ ($view.querySelector('.unstake-fee-value'));
            $feeValue.textContent = NumberFormatting.formatNumber(lunasToCoins(Number(totalFee)));
            const $feeSection = /** @type {HTMLElement} */ ($view.querySelector('.unstake-fee-section'));
            $feeSection.classList.remove('display-none');
        }
    }

    /**
     * @param {HTMLElement} $el
     * @param {string} userFriendlyAddress
     * @param {string?} label
     * @param {URL?} imageUrl
     * @param {boolean} isCurrent - true for the "from" card (dashed), false for the "to" card.
     */
    _renderValidatorCard($el, userFriendlyAddress, label, imageUrl, isCurrent) {
        $el.textContent = '';
        $el.classList.add('validator-card');
        $el.classList.toggle('current', isCurrent);

        const $icon = document.createElement('div');
        $icon.classList.add('icon');
        if (imageUrl) {
            const $img = document.createElement('img');
            $img.src = imageUrl.href;
            $icon.appendChild($img);
            $img.addEventListener('error', () => {
                $img.remove();
                // eslint-disable-next-line no-new
                new Identicon(userFriendlyAddress, $icon);
            }, { once: true });
        } else {
            // eslint-disable-next-line no-new
            new Identicon(userFriendlyAddress, $icon);
        }
        $el.appendChild($icon);

        const $name = document.createElement('div');
        $name.classList.add('name');
        if (label) {
            $name.textContent = label;
        } else {
            $name.textContent = userFriendlyAddress;
            $name.classList.add('mono');
        }
        $el.appendChild($name);
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

    /** @param {Parsed<KeyguardRequest.SignTransactionRequest>} request */
    _setupTxListOverlay(request) {
        const $pageHeader = /** @type {HTMLElement} */ (this.$el.querySelector('.page-header'));

        const $infoIcon = document.createElement('button');
        $infoIcon.type = 'button';
        $infoIcon.className = 'info-icon';
        $infoIcon.setAttribute('aria-expanded', 'false');
        $infoIcon.setAttribute('aria-label', I18n.translatePhrase('sign-tx-info-icon-label'));
        $infoIcon.innerHTML = '<svg class="nq-icon"><use xlink:href="../../../node_modules/'
            + '@nimiq/style/nimiq-style.icons.svg#nq-info-circle-small"/></svg>';
        $pageHeader.appendChild($infoIcon);
        $pageHeader.classList.add('has-info-icon');

        I18n.observer.on(I18n.Events.LANGUAGE_CHANGED, () => {
            $infoIcon.setAttribute('aria-label', I18n.translatePhrase('sign-tx-info-icon-label'));
        });

        const $closeTxList = /** @type {HTMLButtonElement} */
            (this.$txListDetails.querySelector('#close-tx-list-details'));
        const $content = /** @type {HTMLElement} */
            (this.$txListDetails.querySelector('#tx-list-details-content'));

        $infoIcon.addEventListener('click', this._openTxList.bind(this, $infoIcon, $closeTxList, $content));
        $closeTxList.addEventListener('click', this._closeTxList.bind(this, $infoIcon));

        window.addEventListener('keydown', event => {
            if (event.key !== 'Escape') return;
            // Close in reverse layering order: address-details sits above tx-list when both are open.
            if (this.$el.classList.contains('account-details-open')) {
                this._closeDetails();
            } else if (this.$el.classList.contains('tx-list-details-open')) {
                this._closeTxList($infoIcon);
            }
        });
    }

    /**
     * @param {HTMLButtonElement} $infoIcon
     * @param {HTMLButtonElement} $closeTxList
     * @param {HTMLElement} $content
     */
    _openTxList($infoIcon, $closeTxList, $content) {
        // Defer building the list until first open — saves Identicon/AddressInfo work if the user
        // only confirms the simplified view.
        if (!$content.firstChild) {
            this._buildTxListInto($content, this._request);
        }
        this.$el.classList.add('tx-list-details-open');
        $infoIcon.setAttribute('aria-expanded', 'true');
        this.$txListDetails.setAttribute('aria-hidden', 'false');
        $closeTxList.focus();
    }

    /** @param {HTMLButtonElement} $infoIcon */
    _closeTxList($infoIcon) {
        this.$el.classList.remove('tx-list-details-open');
        $infoIcon.setAttribute('aria-expanded', 'false');
        this.$txListDetails.setAttribute('aria-hidden', 'true');
        $infoIcon.focus();
    }

    /**
     * Build count + entries + totals into a container. Uses class selectors only to avoid id
     * collision with the standalone `.multi-transaction` template, which coexists in the DOM.
     * @param {HTMLElement} $container
     * @param {Parsed<KeyguardRequest.SignTransactionRequest>} request
     */
    _buildTxListInto($container, request) {
        $container.textContent = '';

        let totalValue = 0n;
        let totalFee = 0n;
        for (const tx of request.transactions) {
            totalValue += tx.value;
            totalFee += tx.fee;
        }

        const $count = document.createElement('span');
        $count.className = 'tx-count nq-text';
        I18n.translateToHtmlContent($count, 'sign-tx-multi-count', {
            count: String(request.transactions.length),
        });
        $container.appendChild($count);

        const $list = document.createElement('div');
        $list.className = 'tx-list';
        for (const tx of request.transactions) {
            $list.appendChild(this._createTransactionListEntry(tx));
        }
        $container.appendChild($list);

        const $totals = document.createElement('div');
        $totals.className = 'tx-totals';

        const $totalValue = document.createElement('div');
        $totalValue.className = 'tx-total-value nq-light-blue';
        $totalValue.innerHTML = `${NumberFormatting.formatNumber(lunasToCoins(Number(totalValue)))}`
            + '<span class="nim-symbol"></span>';
        $totals.appendChild($totalValue);

        if (totalFee > 0n) {
            const $totalFees = document.createElement('div');
            $totalFees.className = 'tx-total-fees nq-text-s';
            $totalFees.innerHTML = `+ ${NumberFormatting.formatNumber(lunasToCoins(Number(totalFee)))}`
                + ' <span class="nim-symbol"></span> '
                + '<span data-i18n="sign-tx-multi-total-fees">total fees</span>';
            I18n.translateDom($totalFees);
            $totals.appendChild($totalFees);
        }

        $container.appendChild($totals);
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
