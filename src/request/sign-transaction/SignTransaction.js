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
/* global TemplateTags */

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

        const viewClass = isMultiTransaction ? 'multi' : request.layout;
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
            this._setupTransactionListOverlay();
        }

        const $closeDetails = /** @type {HTMLButtonElement} */ (this.$accountDetails.querySelector('#close-details'));
        $closeDetails.addEventListener('click', this._closeDetails.bind(this));

        window.addEventListener('keydown', this._onEscapeKeydown.bind(this));

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

        const senderInfo = {
            userFriendlyAddress: transaction.sender.toUserFriendlyAddress(),
            label: request.senderLabel || null,
            accountLabel: request.keyLabel || null,
        };
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
        const recipientInfo = {
            userFriendlyAddress: recipientAddress,
            label: recipientLabel,
            imageUrl: recipientImage,
        };

        const paymentInfoLine = request.layout === SignTransactionApi.Layouts.CHECKOUT
            ? {
                ...request,
                recipient: recipientAddress,
                label: recipientLabel || recipientAddress,
                imageUrl: request.shopLogoUrl,
                amount: Number(transaction.value),
                currency: /** @type {'nim'} */ ('nim'),
                unitsToCoins: lunasToCoins,
                networkFee: Number(transaction.fee),
            }
            : null;

        /** @type {() => string} */
        let data;
        if (request.layout === SignTransactionApi.Layouts.CASHLINK
            && Nimiq.BufferUtils.equals(transaction.data, Constants.CASHLINK_FUNDING_DATA)) {
            data = () => request.cashlinkMessage || '';
        } else {
            data = () => TransactionDataFormatting.formatTransactionData(transaction);
        }

        this._renderSimpleTransactionView(request.layout, paymentInfoLine, /* subtitle */ null, senderInfo,
            recipientInfo, transaction.value, transaction.fee, data);
    }

    /** @param {Parsed<KeyguardRequest.SignTransactionRequest>} request */
    _renderMultiTransactionView(request) {
        const $multiTx = /** @type {HTMLElement} */ (this.$el.querySelector('.multi-transaction-view'));

        // Remove payment info line (not used in multi-tx mode)
        const $paymentInfoLine = /** @type {HTMLElement} */ (this.$el.querySelector('.payment-info-line'));
        $paymentInfoLine.remove();

        this._renderTransactionListTo($multiTx, request);
    }

    /** @param {Parsed<KeyguardRequest.SignTransactionRequestSwitchValidator>} request */
    _renderSwitchValidatorView(request) {
        const $view = /** @type {HTMLElement} */ (this.$el.querySelector('.simple-transaction-view'));
        $view.classList.add('switch-validator-view');

        const subtitleTemplate = document.createElement('template');
        subtitleTemplate.innerHTML = `
            <p class="switch-subtitle-description" data-i18n="sign-tx-switch-deferred-description">
                Your NIM will be unstaked from your current validator and staked with the new one.
            </p>
            <p class="switch-subtitle-duration" data-i18n="sign-tx-switch-deferred-duration">
                This can take up to 24h.
            </p>
        `;
        I18n.translateDom(subtitleTemplate.content);
        const subtitles = Array.from(subtitleTemplate.content.childNodes);

        const senderInfo = {
            userFriendlyAddress: request.fromValidatorAddress.toUserFriendlyAddress(),
            label: request.senderLabel || null,
            imageUrl: request.fromValidatorImageUrl || null,
        };
        const recipientInfo = {
            userFriendlyAddress: request.validatorAddress.toUserFriendlyAddress(),
            label: request.recipientLabel || null,
            imageUrl: request.validatorImageUrl || null,
        };

        const value = null; // the transactions of the switch-validator flow are signaling transactions with no value.
        const totalFee = request.transactions.reduce((sum, { fee }) => sum + fee, BigInt(0));

        this._renderSimpleTransactionView(request.layout, /* paymentInfoLine */ null, subtitles, senderInfo,
            recipientInfo, value, totalFee, /* data */ null);
    }

    /** @param {Parsed<KeyguardRequest.SignTransactionRequestUnstaking>} request */
    _renderUnstakingView(request) {
        const $view = /** @type {HTMLElement} */ (this.$el.querySelector('.simple-transaction-view'));
        $view.classList.add('unstaking-view');

        // From the validator the user is leaving.
        const senderInfo = {
            userFriendlyAddress: request.validatorAddress.toUserFriendlyAddress(),
            label: request.senderLabel || null,
            imageUrl: request.validatorImageUrl || null,
        };
        // To the user's wallet. The parser binds removeStakeTx.recipient to the fee-paying sender of setActiveStakeTx,
        // see SignTransactionApi.parseRequest.
        const removeStakeTx = request.transactions[2];
        const recipientInfo = {
            userFriendlyAddress: removeStakeTx.recipient.toUserFriendlyAddress(),
            label: request.recipientLabel || null,
            accountLabel: request.keyLabel || null,
        };

        const value = removeStakeTx.value; // Headline amount = value of the remove-stake tx (NIM returned to the user).
        const totalFee = request.transactions.reduce((sum, { fee }) => sum + fee, BigInt(0));

        // eslint-disable-next-line require-jsdoc-except/require-jsdoc
        const data = () => I18n.translatePhrase('sign-tx-unstake-deferred-duration');

        this._renderSimpleTransactionView(request.layout, /* paymentInfoLine */ null, /* subtitles */ null, senderInfo,
            recipientInfo, value, totalFee, data);
    }

    // eslint-disable-next-line valid-jsdoc
    /**
     * @private
     * @param {KeyguardRequest.SignTransactionRequestLayout} layout
     * @param {ConstructorParameters<typeof PaymentInfoLine>[0] | null} paymentInfoLine
     * @param {string | Node | Array<string | Node> | null} subtitle
     * @param {ConstructorParameters<typeof AddressInfo>[0]} senderInfo
     * @param {ConstructorParameters<typeof AddressInfo>[0]} recipientInfo
     * @param {bigint | null} value
     * @param {bigint | null} fee
     * @param {(() => string) | null} data - can be updated on language change for i18n.
     */
    _renderSimpleTransactionView(layout, paymentInfoLine, subtitle, senderInfo, recipientInfo, value, fee, data) {
        const $paymentInfoLine = /** @type {HTMLElement} */ (this.$el.querySelector('.payment-info-line'));
        const $subtitle = /** @type {HTMLElement} */ (this.$el.querySelector('.simple-transaction-view .subtitle'));
        const $sender = /** @type {HTMLElement} */ (this.$el.querySelector('.simple-transaction-view .sender'));
        const $recipient = /** @type {HTMLElement} */ (this.$el.querySelector('.simple-transaction-view .recipient'));
        const $value = /** @type {HTMLElement} */ (this.$el.querySelector('.simple-transaction-view #value'));
        const $fee = /** @type {HTMLElement} */ (this.$el.querySelector('.simple-transaction-view #fee'));
        const $data = /** @type {HTMLElement} */ (this.$el.querySelector('.simple-transaction-view #data'));

        if (paymentInfoLine) {
            // eslint-disable-next-line no-new
            new PaymentInfoLine(paymentInfoLine, $paymentInfoLine);
        } else {
            $paymentInfoLine.remove();
        }

        if (subtitle) {
            $subtitle.replaceChildren(...(Array.isArray(subtitle) ? subtitle : [subtitle]));
        } else {
            $subtitle.remove();
        }

        if (layout !== SignTransactionApi.Layouts.SWITCH_VALIDATOR) {
            const senderAddressInfo = new AddressInfo(senderInfo);
            senderAddressInfo.renderTo($sender);
            $sender.addEventListener('click', () => this._openDetails(senderAddressInfo));

            const recipientAddressInfo = new AddressInfo(recipientInfo, layout === SignTransactionApi.Layouts.CASHLINK);
            recipientAddressInfo.renderTo($recipient);
            if (layout !== SignTransactionApi.Layouts.CASHLINK) {
                $recipient.addEventListener('click', () => this._openDetails(recipientAddressInfo));
            }
        } else {
            this._renderValidatorCard($sender, senderInfo);
            this._renderValidatorCard($recipient, recipientInfo);
        }

        // Set value and fee.
        if (value !== null) {
            $value.textContent = NumberFormatting.formatNumber(lunasToCoins(Number(value)));
        } else {
            const $valueSection = /** @type {HTMLElement} */ ($value.parentElement);
            $valueSection.remove();
        }
        if (fee !== null && fee > 0) {
            $fee.textContent = NumberFormatting.formatNumber(lunasToCoins(Number(fee)));
        } else {
            const $feeSection = /** @type {HTMLElement} */ ($fee.parentElement);
            $feeSection.remove();
        }

        // Set data
        const updateData = () => { // eslint-disable-line require-jsdoc-except/require-jsdoc
            const currentData = data ? data() : '';
            $data.textContent = currentData;
            $data.classList.toggle('display-none', !currentData);
        };
        updateData();
        I18n.observer.on(I18n.Events.LANGUAGE_CHANGED, updateData);
    }

    // eslint-disable-next-line valid-jsdoc
    /**
     * @param {HTMLElement} $el
     * @param {Pick<ConstructorParameters<typeof AddressInfo>[0], 'userFriendlyAddress' | 'label' | 'imageUrl'>} params
     */
    _renderValidatorCard($el, { userFriendlyAddress, label, imageUrl }) {
        $el.textContent = '';
        $el.classList.add('validator-card');

        const $icon = document.createElement('div');
        $icon.classList.add('icon');
        if (imageUrl) {
            const $img = document.createElement('img');
            $img.addEventListener('error', () => {
                $img.remove();
                // eslint-disable-next-line no-new
                new Identicon(userFriendlyAddress, $icon);
            }, { once: true });
            $img.src = imageUrl.href;
            $icon.appendChild($img);
        } else {
            // eslint-disable-next-line no-new
            new Identicon(userFriendlyAddress, $icon);
        }
        $el.appendChild($icon);

        const $text = document.createElement('div');
        $text.classList.add('text');
        $el.appendChild($text);

        const $name = document.createElement('div');
        $name.classList.add('name');
        $text.appendChild($name);

        if (label) {
            $name.textContent = label;
            const $address = document.createElement('div');
            $address.classList.add('validator-address', 'address');
            $address.textContent = userFriendlyAddress;
            $text.appendChild($address);
        } else {
            $name.textContent = userFriendlyAddress;
            $name.classList.add('mono');
        }
    }

    /**
     * @param {AddressInfo} which
     */
    _openDetails(which) {
        this._blurFocusedElement();
        which.renderTo(
            /** @type {HTMLElement} */(this.$accountDetails.querySelector('#details')),
            true,
        );
        this.$el.classList.add('account-details-open');
    }

    _closeDetails() {
        this._blurFocusedElement();
        this.$el.classList.remove('account-details-open');
    }

    _setupTransactionListOverlay() {
        const $pageHeader = /** @type {HTMLElement} */ (this.$el.querySelector('.page-header'));

        const $infoIcon = document.createElement('button');
        $infoIcon.type = 'button';
        $infoIcon.className = 'info-icon';
        $infoIcon.setAttribute('aria-expanded', 'false');
        const infoIconLabel = I18n.translatePhrase('sign-tx-info-icon-label');
        $infoIcon.setAttribute('aria-label', infoIconLabel);
        $infoIcon.title = infoIconLabel;
        // Keep the icon string on one line so the build's icon-bundling scanner detects it.
        // eslint-disable-next-line max-len
        $infoIcon.innerHTML = '<svg class="nq-icon"><use xlink:href="../../../node_modules/@nimiq/style/nimiq-style.icons.svg#nq-info-circle-small"/></svg>';
        $pageHeader.appendChild($infoIcon);
        $pageHeader.classList.add('has-info-icon');

        I18n.observer.on(I18n.Events.LANGUAGE_CHANGED, () => {
            const label = I18n.translatePhrase('sign-tx-info-icon-label');
            $infoIcon.setAttribute('aria-label', label);
            $infoIcon.title = label;
        });

        this.$infoIcon = $infoIcon;
        this.$txListContent = /** @type {HTMLElement} */ (
            this.$txListDetails.querySelector('#tx-list-details-content')
        );
        const $closeTxList = /** @type {HTMLButtonElement} */ (
            this.$txListDetails.querySelector('#close-tx-list-details')
        );

        $infoIcon.addEventListener('click', this._openTransactionList.bind(this));
        $closeTxList.addEventListener('click', this._closeTransactionList.bind(this));
    }

    _openTransactionList() {
        const { $infoIcon, $txListContent } = this;
        if (!$infoIcon || !$txListContent) return;
        this._blurFocusedElement();
        // Defer building the list until first open — saves Identicon/AddressInfo work if the user
        // only confirms the simplified view.
        if (!$txListContent.firstChild) {
            this._renderTransactionListTo($txListContent, this._request);
        }
        this.$el.classList.add('tx-list-details-open');
        $infoIcon.setAttribute('aria-expanded', 'true');
        this.$txListDetails.setAttribute('aria-hidden', 'false');
    }

    _closeTransactionList() {
        const { $infoIcon } = this;
        if (!$infoIcon) return;
        this._blurFocusedElement();
        this.$el.classList.remove('tx-list-details-open');
        $infoIcon.setAttribute('aria-expanded', 'false');
        this.$txListDetails.setAttribute('aria-hidden', 'true');
    }

    /**
     * Build count + entries + totals into a container, using class-based nodes. Shared by the
     * multi-transaction main view and the tx-list overlay.
     * @param {HTMLElement} $container
     * @param {Parsed<KeyguardRequest.SignTransactionRequest>} request
     */
    _renderTransactionListTo($container, request) {
        $container.textContent = '';

        const totalValue = request.transactions.reduce((sum, { value }) => sum + value, BigInt(0));
        const totalFee = request.transactions.reduce((sum, { fee }) => sum + fee, BigInt(0));

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
        I18n.translateDom($list);

        const $totals = document.createElement('div');
        $totals.className = 'tx-totals';

        const $totalValue = document.createElement('div');
        $totalValue.className = 'tx-total-value nq-light-blue';
        // eslint-disable-next-line max-len
        $totalValue.innerHTML = `${NumberFormatting.formatNumber(lunasToCoins(Number(totalValue)))}<span class="nim-symbol"></span>`;
        $totals.appendChild($totalValue);

        if (totalFee > BigInt(0)) {
            const $totalFees = document.createElement('div');
            $totalFees.className = 'tx-total-fees nq-text-s';
            // eslint-disable-next-line max-len
            $totalFees.innerHTML = TemplateTags.hasVars(1)`+ ${NumberFormatting.formatNumber(lunasToCoins(Number(totalFee)))} <span class="nim-symbol"></span> <span data-i18n="sign-tx-multi-total-fees">total fees</span>`;
            I18n.translateDom($totalFees);
            $totals.appendChild($totalFees);
        }

        $container.appendChild($totals);
    }

    /**
     * @param {Nimiq.Transaction} tx
     * @returns {HTMLElement}
     */
    _createTransactionListEntry(tx) {
        const $entry = document.createElement('div');
        $entry.className = 'transaction-list-entry';

        const $main = document.createElement('div');
        $main.className = 'tx-main';

        $main.appendChild(this._createTransactionListEntryAddress(tx.sender.toUserFriendlyAddress()));

        const $arrow = document.createElement('div');
        $arrow.className = 'tx-arrow';
        // Keep the icon string on one line so the build's icon-bundling scanner detects it.
        // eslint-disable-next-line max-len
        $arrow.innerHTML = '<svg class="nq-icon"><use xlink:href="../../../node_modules/@nimiq/style/nimiq-style.icons.svg#nq-arrow-right"/></svg>';
        $main.appendChild($arrow);

        $main.appendChild(this._createTransactionListEntryAddress(tx.recipient.toUserFriendlyAddress()));

        $main.appendChild(this._createTransactionListEntryAmounts(tx));
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
     * Builds a single sender- or recipient-side address cell (identicon + address, click-to-detail).
     * @param {string} userFriendlyAddress
     * @returns {HTMLElement}
     */
    _createTransactionListEntryAddress(userFriendlyAddress) {
        const $cell = document.createElement('div');
        $cell.className = 'tx-address-cell';

        $cell.appendChild(new Identicon(userFriendlyAddress).getElement());

        const $address = document.createElement('div');
        $address.className = 'tx-address address';
        $address.textContent = userFriendlyAddress;
        $cell.appendChild($address);

        const addressInfo = new AddressInfo({ userFriendlyAddress });
        $cell.addEventListener('click', () => this._openDetails(addressInfo));

        return $cell;
    }

    /**
     * @param {Nimiq.Transaction} tx
     * @returns {HTMLElement}
     */
    _createTransactionListEntryAmounts(tx) {
        const $amounts = document.createElement('div');
        $amounts.className = 'tx-amounts';

        const $value = document.createElement('div');
        $value.className = 'tx-value';
        // eslint-disable-next-line max-len
        $value.innerHTML = `${NumberFormatting.formatNumber(lunasToCoins(Number(tx.value)))}<span class="nim-symbol"></span>`;
        $amounts.appendChild($value);

        if (tx.fee > 0) {
            const $fee = document.createElement('div');
            $fee.className = 'tx-fee';
            // eslint-disable-next-line max-len
            $fee.innerHTML = TemplateTags.hasVars(1)`+ ${NumberFormatting.formatNumber(lunasToCoins(Number(tx.fee)))} <span class="nim-symbol"></span> <span data-i18n="sign-tx-fee">fee</span>`;
            $amounts.appendChild($fee);
        }

        return $amounts;
    }

    _blurFocusedElement() {
        const focusedElement = document.activeElement;
        if (focusedElement instanceof HTMLElement) {
            focusedElement.blur();
        } else {
            window.blur();
        }
    }

    /** @param {KeyboardEvent} event */
    _onEscapeKeydown(event) {
        if (event.key !== 'Escape') return;
        // Close in reverse layering order: address-details sits above tx-list when both are open.
        if (this.$el.classList.contains('account-details-open')) {
            this._closeDetails();
        } else if (this.$el.classList.contains('tx-list-details-open')) {
            this._closeTransactionList();
        }
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
        const signer = publicKey.toAddress();

        // Check whether the transactions are actually sent from the signer's address, which we can only do for basic
        // senders, and only after unlocking the key. This is particularly relevant for the simplified transaction
        // layouts, which do not show the sender address but rely on it matching the signer, and which tie the unstaking
        // payout address to it, see SignTransactionApi.parseRequest.
        for (const transaction of request.transactions) {
            if (transaction.senderType === Nimiq.AccountType.Basic && !transaction.sender.equals(signer)) {
                reject(new Errors.InvalidRequestError('Signer does not match basic transaction sender'));
                return;
            }
        }

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
                transaction.sign(keyPair, /* inner key pair for staking signature proof */ keyPair);

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
