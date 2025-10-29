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
        this.$el.classList.add(request.layout || 'standard');

        const relayRequest = request.request;

        /** @type {'usdc' | 'usdt' | undefined} */
        let stablecoin;
        if ([
            CONFIG.NATIVE_USDC_TRANSFER_CONTRACT_ADDRESS,
            CONFIG.NATIVE_USDC_HTLC_CONTRACT_ADDRESS,
            CONFIG.USDC_SWAP_CONTRACT_ADDRESS,
        ].includes(relayRequest.to)) {
            stablecoin = 'usdc';
        } else if ([
            CONFIG.BRIDGED_USDT_TRANSFER_CONTRACT_ADDRESS,
            CONFIG.BRIDGED_USDT_CASHLINK_CONTRACT_ADDRESS,
        ].includes(relayRequest.to)) {
            stablecoin = 'usdt';
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
        } else if (request.layout === 'usdt-cashlink') {
            const recipientAddress = /** @type {string} */ (request.description.args.target);
            new PolygonAddressInfo(recipientAddress, undefined, 'cashlink').renderTo($recipient);
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

        // Display cashlink message if provided
        if (request.layout === 'usdt-cashlink' && request.cashlinkMessage) {
            const $data = /** @type {HTMLDivElement} */ (this.$el.querySelector('#data'));
            $data.textContent = request.cashlinkMessage;
            const $dataSection = /** @type {HTMLDivElement} */ (this.$el.querySelector('.data-section'));
            $dataSection.classList.remove('display-none');
        }

        // Set up password box.
        const $passwordBox = /** @type {HTMLFormElement} */ (document.querySelector('#password-box'));
        this._passwordBox = new PasswordBox($passwordBox, {
            hideInput: !request.keyInfo.encrypted,
            buttonI18nTag: request.layout === 'usdt-cashlink'
                ? 'passwordbox-create-cashlink'
                : 'passwordbox-confirm-tx',
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

        // Has been validated to be an approved transfer contract address
        const transferContract = request.request.to;

        if (request.description.name === 'transferWithPermit') {
            const { sigR, sigS, sigV } = await polygonKey.signUsdcPermit(
                request.keyPath,
                transferContract,
                // `value` is the permit approval amount - the transaction value is called `amount`
                request.description.args.value,
                // Has been validated to be defined when function called is `transferWithPermit`
                /** @type {{ tokenNonce: number }} */ (request.permit).tokenNonce,
                request.request.from,
            );

            const nativeUsdcTransfer = new ethers.Contract(
                transferContract,
                PolygonContractABIs.NATIVE_USDC_TRANSFER_CONTRACT_ABI,
            );

            request.request.data = nativeUsdcTransfer.interface.encodeFunctionData(request.description.name, [
                /* address token */ request.description.args.token,
                /* uint256 amount */ request.description.args.amount,
                /* address target */ request.description.args.target,
                /* uint256 fee */ request.description.args.fee,
                // `value` is the permit approval amount - the transaction value is called `amount` (above)
                /* uint256 value */ request.description.args.value,
                /* bytes32 sigR */ sigR,
                /* bytes32 sigS */ sigS,
                /* uint8 sigV */ sigV,
            ]);
        }

        if (request.description.name === 'transferWithApproval') {
            const { sigR, sigS, sigV } = await polygonKey.signUsdtApproval(
                request.keyPath,
                new ethers.Contract(
                    CONFIG.BRIDGED_USDT_CONTRACT_ADDRESS,
                    PolygonContractABIs.BRIDGED_USDT_CONTRACT_ABI,
                ),
                transferContract,
                request.description.args.approval,
                // Has been validated to be defined when function called is `swapWithApproval`
                /** @type {{ tokenNonce: number }} */ (request.approval).tokenNonce,
                request.request.from,
            );

            const swapContract = new ethers.Contract(
                transferContract,
                PolygonContractABIs.BRIDGED_USDT_TRANSFER_CONTRACT_ABI,
            );

            request.request.data = swapContract.interface.encodeFunctionData(request.description.name, [
                /* address token */ request.description.args.token,
                /* uint256 amount */ request.description.args.amount,
                /* address target */ request.description.args.target,
                /* uint256 fee */ request.description.args.fee,
                /* uint256 approval */ request.description.args.approval,
                /* bytes32 sigR */ sigR,
                /* bytes32 sigS */ sigS,
                /* uint8 sigV */ sigV,
            ]);
        }

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

    run() {
        // Go to start page
        window.location.hash = SignPolygonTransaction.Pages.CONFIRM_TRANSACTION;
    }
}

SignPolygonTransaction.Pages = {
    CONFIRM_TRANSACTION: 'confirm-transaction',
};
