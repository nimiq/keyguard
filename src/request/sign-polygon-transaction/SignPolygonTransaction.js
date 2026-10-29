/* global Key */
/* global KeyStore */
/* global PasswordBox */
/* global Errors */
/* global Utf8Tools */
/* global TopLevelApi */
/* global PolygonAddressInfo */
/* global NumberFormatting */
/* global PolygonUtils */
/* global CONFIG */
/* global PolygonKey */
/* global PolygonGasless */
/* global PolygonGaslessHtlc */
/* global NimiqGaslessCore */
/* global SignPolygonTransactionApi */

/**
 * @callback SignPolygonTransaction.resolve
 * @param {KeyguardRequest.SignedPolygonTransaction} result
 */

class SignPolygonTransaction {
    /**
     * @param {Parsed<KeyguardRequest.SignPolygonGaslessTransferRequest>
     *     | Parsed<KeyguardRequest.SignPolygonHtlcSettlementRequest>} request
     * @param {SignPolygonTransaction.resolve} resolve
     * @param {reject} reject
     */
    constructor(request, resolve, reject) {
        this.$el = /** @type {HTMLElement} */ (
            document.getElementById(SignPolygonTransaction.Pages.CONFIRM_TRANSACTION));

        if ('intent' in request) {
            this._renderGaslessTransfer(request);
        } else {
            this._renderHtlcSettlement(request);
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
     * @param {Parsed<KeyguardRequest.SignPolygonHtlcSettlementRequest>} request
     * @private
     */
    _renderHtlcSettlement(request) {
        const settlement = request.request;
        const stablecoin = PolygonGasless.stablecoin(request.token);

        const $stablecoinSymbols = /** @type {NodeListOf<HTMLSpanElement>} */ (
            this.$el.querySelectorAll('.stablecoin-symbol')
        );
        $stablecoinSymbols.forEach($symbol => {
            $symbol.classList.add(`${stablecoin}-symbol`);
        });

        const $sender = /** @type {HTMLLinkElement} */ (this.$el.querySelector('.accounts .sender'));
        new PolygonAddressInfo(PolygonGaslessHtlc.contract(), request.senderLabel, 'unknown').renderTo($sender);

        const $recipient = /** @type {HTMLLinkElement} */ (this.$el.querySelector('.accounts .recipient'));
        new PolygonAddressInfo(settlement.target, request.keyLabel, stablecoin).renderTo($recipient);

        const $value = /** @type {HTMLDivElement} */ (this.$el.querySelector('#value'));
        const $fee = /** @type {HTMLDivElement} */ (this.$el.querySelector('#fee'));

        $value.textContent = NumberFormatting.formatNumber(
            PolygonUtils.unitsToCoins(Number(request.amount)),
            6,
            2, // Always display at least 2 decimals, as is common for USD
        );
        const feeUnits = Number(settlement.fee);
        if (feeUnits > 0) {
            // Relay fees are multiples of 0.01, so two decimals show them exactly
            $fee.textContent = NumberFormatting.formatNumber(PolygonUtils.unitsToCoins(feeUnits), 2, 2);
            const $feeSection = /** @type {HTMLDivElement} */ (this.$el.querySelector('.fee-section'));
            $feeSection.classList.remove('display-none');
        }
    }

    /**
     * @param {Parsed<KeyguardRequest.SignPolygonGaslessTransferRequest>} request
     * @private
     */
    _renderGaslessTransfer(request) {
        const transfer = request.intent.request;
        const stablecoin = PolygonGasless.stablecoin(transfer.token);

        const $stablecoinSymbols = /** @type {NodeListOf<HTMLSpanElement>} */ (
            this.$el.querySelectorAll('.stablecoin-symbol')
        );
        $stablecoinSymbols.forEach($symbol => {
            $symbol.classList.add(`${stablecoin}-symbol`);
        });

        const $sender = /** @type {HTMLLinkElement} */ (this.$el.querySelector('.accounts .sender'));
        new PolygonAddressInfo(transfer.from, request.keyLabel, stablecoin).renderTo($sender);

        const $recipient = /** @type {HTMLLinkElement} */ (this.$el.querySelector('.accounts .recipient'));
        new PolygonAddressInfo(transfer.to, request.recipientLabel, 'none').renderTo($recipient);

        const $value = /** @type {HTMLDivElement} */ (this.$el.querySelector('#value'));
        const $fee = /** @type {HTMLDivElement} */ (this.$el.querySelector('#fee'));

        $value.textContent = NumberFormatting.formatNumber(
            PolygonUtils.unitsToCoins(Number(transfer.amount)),
            6,
            2, // Always display at least 2 decimals, as is common for USD
        );
        const feeUnits = Number(transfer.fee);
        if (feeUnits > 0) {
            // Relay fees are multiples of 0.01, so two decimals show them exactly
            $fee.textContent = NumberFormatting.formatNumber(PolygonUtils.unitsToCoins(feeUnits), 2, 2);
            const $feeSection = /** @type {HTMLDivElement} */ (this.$el.querySelector('.fee-section'));
            $feeSection.classList.remove('display-none');
        }

        if (request.corrects) {
            // This version replaces the earlier signed version of the same payment. Only one of them can execute.
            const $correctionNotice = /** @type {HTMLDivElement} */ (this.$el.querySelector('.correction-notice'));
            $correctionNotice.classList.remove('display-none');
        }
    }

    /**
     * @param {Parsed<KeyguardRequest.SignPolygonGaslessTransferRequest>
     *     | Parsed<KeyguardRequest.SignPolygonHtlcSettlementRequest>} request
     * @param {SignPolygonTransaction.resolve} resolve
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

        const polygonKey = new PolygonKey(key);

        if ('intent' in request) {
            await this._signGaslessTransfer(request, polygonKey, resolve, reject);
            return;
        }

        await this._signHtlcSettlement(request, polygonKey, resolve, reject);
    }

    /**
     * @param {Parsed<KeyguardRequest.SignPolygonHtlcSettlementRequest>} request
     * @param {PolygonKey} polygonKey
     * @param {SignPolygonTransaction.resolve} resolve
     * @param {reject} reject
     * @returns {Promise<void>}
     * @private
     */
    async _signHtlcSettlement(request, polygonKey, resolve, reject) {
        if (polygonKey.deriveAddress(request.keyPath) !== request.request.from) {
            reject(new Errors.InvalidRequestError('request.from does not match the address derived from keyPath'));
            return;
        }

        let signed;
        try {
            signed = await PolygonGaslessHtlc.signSettlement(
                (domain, types, message) => polygonKey.signTypedData(request.keyPath, domain, types, message),
                request.operation,
                {
                    ...request.request,
                    deadline: (PolygonGasless.now() + PolygonGaslessHtlc.MAX_DEADLINE_SECONDS).toString(),
                },
            );
        } catch (error) {
            reject(error instanceof Errors.KeyguardError
                ? error
                : new Errors.KeyguardError(error instanceof Error ? error.message : String(error)));
            return;
        }
        resolve(signed);
    }

    /**
     * @param {Parsed<KeyguardRequest.SignPolygonGaslessTransferRequest>} request
     * @param {PolygonKey} polygonKey
     * @param {SignPolygonTransaction.resolve} resolve
     * @param {reject} reject
     * @returns {Promise<void>}
     * @private
     */
    async _signGaslessTransfer(request, polygonKey, resolve, reject) {
        const shown = request.intent.request;

        if (polygonKey.deriveAddress(request.keyPath) !== shown.from) {
            reject(new Errors.InvalidRequestError('request.from does not match the address derived from keyPath'));
            return;
        }

        let signed;
        try {
            // Rebuild the intent with a fresh deadline, as the user might have taken a while to confirm. It keeps the
            // intent nonce and everything that was shown to the user.
            const intent = SignPolygonTransactionApi.createIntent(
                {
                    token: shown.token,
                    from: shown.from,
                    to: shown.to,
                    amount: shown.amount,
                    fee: shown.fee,
                    relay: shown.relay,
                    nonce: shown.nonce,
                },
                request.tokenNonce,
                request.corrects,
            );
            const pins = PolygonGasless.pins();
            const options = { maxAcceptableFee: CONFIG.POLYGON_GASLESS_MAX_ACCEPTABLE_FEE };

            // The permit first, as the intent signs it
            const tokenAuth = NimiqGaslessCore.tokenAuthSigningPayload(pins, intent, PolygonGasless.now(), options);
            if (!tokenAuth) throw new Errors.KeyguardError('Missing token authorization');
            const tokenSignature = await polygonKey.signTypedData(
                request.keyPath,
                tokenAuth.domain,
                /** @type {Record<string, ethers.TypedDataField[]>} */ (/** @type {unknown} */ (tokenAuth.types)),
                tokenAuth.message,
            );
            // Validates the signature format and normalizes v to 27/28, as the intent signs it as it is
            const authorization = NimiqGaslessCore.toTokenAuthorization('permit', tokenSignature);

            // Then the intent over the permit
            const transfer = NimiqGaslessCore.transferSigningPayload(
                pins,
                intent,
                authorization,
                PolygonGasless.now(),
                options,
            );
            const signature = await polygonKey.signTypedData(
                request.keyPath,
                transfer.domain,
                /** @type {Record<string, ethers.TypedDataField[]>} */ (/** @type {unknown} */ (transfer.types)),
                transfer.message,
            );

            signed = NimiqGaslessCore.buildSubmitTransferBody({
                request: intent.request,
                signature,
                authorization,
            });
        } catch (error) {
            reject(error instanceof Errors.KeyguardError
                ? error
                : new Errors.KeyguardError(error instanceof Error ? error.message : String(error)));
            return;
        }

        /** @type {KeyguardRequest.SignedPolygonGaslessTransfer} */
        const result = {
            request: signed.request,
            signature: signed.signature,
            authorization: {
                mode: 'permit',
                v: signed.authorization.v,
                r: signed.authorization.r,
                s: signed.authorization.s,
            },
        };
        resolve(result);
    }

    run() {
        // Go to start page
        window.location.hash = SignPolygonTransaction.Pages.CONFIRM_TRANSACTION;
    }
}

SignPolygonTransaction.Pages = {
    CONFIRM_TRANSACTION: 'confirm-transaction',
};
