/* global ethers */
/* global Key */
/* global KeyStore */
/* global PolygonContractABIs */
/* global PasswordBox */
/* global Errors */
/* global Utf8Tools */
/* global TopLevelApi */
/* global PolygonAddressInfo */
/* global NumberFormatting */
/* global PolygonUtils */
/* global CONFIG */
/* global PolygonKey */
/* global OpenGSN */
/* global PolygonGasless */
/* global NimiqGaslessCore */
/* global SignPolygonTransactionApi */

/**
 * @callback SignPolygonTransaction.resolve
 * @param {KeyguardRequest.SignedPolygonTransaction | KeyguardRequest.SignedPolygonGaslessTransfer} result
 */

class SignPolygonTransaction {
    /**
     * @param {Parsed<KeyguardRequest.SignPolygonTransactionRequest>
     *     | Parsed<KeyguardRequest.SignPolygonGaslessTransferRequest>} request
     * @param {SignPolygonTransaction.resolve} resolve
     * @param {reject} reject
     */
    constructor(request, resolve, reject) {
        this.$el = /** @type {HTMLElement} */ (
            document.getElementById(SignPolygonTransaction.Pages.CONFIRM_TRANSACTION));

        if ('intent' in request) {
            this._renderGaslessTransfer(request);
        } else {
            this._renderOpenGsnTransaction(request);
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
     * @private
     */
    _renderOpenGsnTransaction(request) {
        const relayRequest = request.request;

        /** @type {'usdc' | 'usdt' | undefined} */
        let stablecoin;
        if ([
            CONFIG.NATIVE_USDC_HTLC_CONTRACT_ADDRESS,
            CONFIG.USDC_SWAP_CONTRACT_ADDRESS,
        ].includes(relayRequest.to)) {
            stablecoin = 'usdc';
        }

        if (relayRequest.to === CONFIG.BRIDGED_USDT_HTLC_CONTRACT_ADDRESS) {
            // The HTLC contract for bridged USDT is the same as for bridged USDC (legacy).
            if (request.token === CONFIG.BRIDGED_USDT_CONTRACT_ADDRESS) {
                stablecoin = 'usdt';
            } else if (request.token === CONFIG.BRIDGED_USDC_CONTRACT_ADDRESS) {
                stablecoin = 'usdc';
            }
        }

        if (!stablecoin) {
            throw new Errors.KeyguardError('Could not determine the stablecoin for the transaction');
        }

        const $stablecoinSymbols = /** @type {NodeListOf<HTMLSpanElement>} */ (
            this.$el.querySelectorAll('.stablecoin-symbol')
        );
        $stablecoinSymbols.forEach($symbol => {
            $symbol.classList.add(`${stablecoin}-symbol`);
        });

        const $sender = /** @type {HTMLLinkElement} */ (this.$el.querySelector('.accounts .sender'));
        if (['redeem', 'redeemWithSecretInData', 'refund'].includes(request.description.name)) {
            new PolygonAddressInfo(relayRequest.to, request.senderLabel, 'unknown').renderTo($sender);
        } else if (request.description.name === 'swap' || request.description.name === 'swapWithApproval') {
            new PolygonAddressInfo(relayRequest.from, 'USDC.e', 'usdc_dark').renderTo($sender);
        } else {
            new PolygonAddressInfo(relayRequest.from, request.keyLabel, stablecoin).renderTo($sender);
        }

        const $recipient = /** @type {HTMLLinkElement} */ (this.$el.querySelector('.accounts .recipient'));
        if (['redeem', 'redeemWithSecretInData', 'refund'].includes(request.description.name)) {
            const recipientAddress = /** @type {string} */ (request.description.args.target);
            new PolygonAddressInfo(recipientAddress, request.keyLabel, stablecoin).renderTo($recipient);
        } else if (request.description.name === 'swap' || request.description.name === 'swapWithApproval') {
            new PolygonAddressInfo(relayRequest.from, 'USDC', 'usdc').renderTo($recipient);
        } else {
            const recipientAddress = /** @type {string} */ (request.description.args.target);
            new PolygonAddressInfo(recipientAddress, request.recipientLabel, 'none').renderTo($recipient);
        }

        const $value = /** @type {HTMLDivElement} */ (this.$el.querySelector('#value'));
        const $fee = /** @type {HTMLDivElement} */ (this.$el.querySelector('#fee'));

        // Set value and fee.
        $value.textContent = NumberFormatting.formatNumber(
            PolygonUtils.unitsToCoins(['redeem', 'redeemWithSecretInData', 'refund'].includes(request.description.name)
                ? /** @type {number} */ (request.amount)
                : request.description.args.amount.toNumber()),
            6,
            2, // Always display at least 2 decimals, as is common for USD
        );
        const feeUnits = request.description.args.fee.toNumber();
        if (feeUnits > 0) {
            // For the fee, we do not display more than two decimals, as it would not add any value for the user
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
     * @param {Parsed<KeyguardRequest.SignPolygonTransactionRequest>
     *     | Parsed<KeyguardRequest.SignPolygonGaslessTransferRequest>} request
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

        // Has been validated to be an approved contract address
        const transferContract = request.request.to;

        if (request.description.name === 'swapWithApproval') {
            const { sigR, sigS, sigV } = await polygonKey.signUsdcApproval(
                request.keyPath,
                new ethers.Contract(
                    CONFIG.BRIDGED_USDC_CONTRACT_ADDRESS,
                    PolygonContractABIs.BRIDGED_USDC_CONTRACT_ABI,
                ),
                transferContract,
                request.description.args.approval,
                // Has been validated to be defined when function called is `swapWithApproval`
                /** @type {{ tokenNonce: number }} */ (request.approval).tokenNonce,
                request.request.from,
            );

            const swapContract = new ethers.Contract(
                transferContract,
                PolygonContractABIs.SWAP_CONTRACT_ABI,
            );

            request.request.data = swapContract.interface.encodeFunctionData(request.description.name, [
                /* address token */ request.description.args.token,
                /* uint256 amount */ request.description.args.amount,
                /* address pool */ request.description.args.pool,
                /* uint256 targetAmount */ request.description.args.targetAmount,
                /* uint256 fee */ request.description.args.fee,
                /* uint256 approval */ request.description.args.approval,
                /* bytes32 sigR */ sigR,
                /* bytes32 sigS */ sigS,
                /* uint8 sigV */ sigV,
            ]);
        }

        if (['redeem', 'redeemWithSecretInData', 'refund'].includes(request.description.name)) {
            const derivedAddress = polygonKey.deriveAddress(request.keyPath);
            if (request.description.args.target !== derivedAddress) {
                reject(new Errors.InvalidRequestError('Target address argument does not match derived address'));
                return;
            }
        }

        const typedData = new OpenGSN.TypedRequestData(
            CONFIG.POLYGON_CHAIN_ID,
            transferContract,
            {
                request: request.request,
                relayData: request.relayData,
            },
        );

        const { EIP712Domain, ...cleanedTypes } = typedData.types;

        const signature = await polygonKey.signTypedData(
            request.keyPath,
            typedData.domain,
            /** @type {Record<string, ethers.ethers.TypedDataField[]>} */ (/** @type {unknown} */ (cleanedTypes)),
            typedData.message,
        );

        /** @type {KeyguardRequest.SignedPolygonTransaction} */
        const result = {
            message: typedData.message,
            signature,
        };
        resolve(result);
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
                },
                request.tokenNonce,
                request.corrects,
                shown.nonce,
            );
            const { transfer, tokenAuth } = NimiqGaslessCore.transferSigningPayloads(
                PolygonGasless.pins(),
                intent,
                PolygonGasless.now(),
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

        /** @type {KeyguardRequest.SignedPolygonGaslessTransfer} */
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
