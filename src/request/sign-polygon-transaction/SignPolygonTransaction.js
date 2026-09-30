/* global Key */
/* global KeyStore */
/* global PasswordBox */
/* global Errors */
/* global Utf8Tools */
/* global TopLevelApi */
/* global PolygonAddressInfo */
/* global NumberFormatting */
/* global PolygonUtils */
/* global PolygonKey */
/* global PolygonGasless */
/* global NimiqGaslessCore */
/* global SignPolygonTransactionApi */
/* global CONFIG */

/**
 * @callback SignPolygonTransaction.resolve
 * @param {KeyguardRequest.SignedPolygonTransaction} result
 */

class SignPolygonTransaction {
    /**
     * @param {Parsed<KeyguardRequest.SignPolygonTransactionRequest>} request
     * @param {SignPolygonTransaction.resolve} resolve
     * @param {reject} reject
     */
    constructor(request, resolve, reject) {
        this.$el = /** @type {HTMLElement} */ (
            document.getElementById(SignPolygonTransaction.Pages.CONFIRM_TRANSACTION));

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

        // Set value and fee.
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
     * @param {Parsed<KeyguardRequest.SignPolygonTransactionRequest>} request
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
                },
                request.tokenNonce,
                request.corrects,
                shown.nonce,
            );
            const now = PolygonGasless.now();
            const { transfer, tokenAuth } = NimiqGaslessCore.transferSigningPayloads(
                PolygonGasless.pins(),
                intent,
                now,
                { maxAcceptableFee: CONFIG.POLYGON_GASLESS_MAX_ACCEPTABLE_FEE },
            );
            if (!tokenAuth) throw new Errors.KeyguardError('Missing token authorization');

            const signature = await polygonKey.signTypedData(
                request.keyPath,
                transfer.domain,
                /** @type {Record<string, ethers.TypedDataField[]>} */ (/** @type {unknown} */ (transfer.types)),
                transfer.message,
            );
            const tokenSignature = await polygonKey.signTypedData(
                request.keyPath,
                tokenAuth.domain,
                /** @type {Record<string, ethers.TypedDataField[]>} */ (/** @type {unknown} */ (tokenAuth.types)),
                tokenAuth.message,
            );

            // Validates the signature format and normalizes v to 27/28.
            signed = NimiqGaslessCore.buildSubmitTransferBody({
                request: intent.request,
                signature,
                authorization: NimiqGaslessCore.toTokenAuthorization('permit', tokenSignature),
            });
        } catch (error) {
            reject(error instanceof Errors.KeyguardError
                ? error
                : new Errors.KeyguardError(error instanceof Error ? error.message : String(error)));
            return;
        }

        /** @type {KeyguardRequest.SignedPolygonTransaction} */
        const result = {
            request: signed.request,
            signature: signed.signature,
            authorization: {
                mode: 'permit',
                v: /** @type {number} */ (signed.authorization.v),
                r: /** @type {string} */ (signed.authorization.r),
                s: /** @type {string} */ (signed.authorization.s),
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
