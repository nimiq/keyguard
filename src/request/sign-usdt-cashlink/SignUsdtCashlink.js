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
/* global I18n */

/**
 * @callback SignUsdtCashlink.resolve
 * @param {KeyguardRequest.SignedPolygonTransaction} result
 */

class SignUsdtCashlink {
    /**
     * @param {Parsed<KeyguardRequest.SignUsdtCashlinkRequest>} request
     * @param {SignUsdtCashlink.resolve} resolve
     * @param {reject} reject
     */
    constructor(request, resolve, reject) {
        this._request = request;
        this.$el = /** @type {HTMLElement} */ (
            document.getElementById(SignUsdtCashlink.Pages.CONFIRM_TRANSACTION));

        const relayRequest = request.request;

        // For USDT cashlink, we always use USDT
        const stablecoin = 'usdt';

        const $sender = /** @type {HTMLLinkElement} */ (this.$el.querySelector('.accounts .sender'));
        new PolygonAddressInfo(relayRequest.from, request.keyLabel, stablecoin).renderTo($sender);

        const $recipient = /** @type {HTMLLinkElement} */ (this.$el.querySelector('.accounts .recipient'));
        // For cashlink, show the cashlink icon and hide the address
        new PolygonAddressInfo(relayRequest.to, undefined, 'cashlink').renderTo($recipient);

        const $value = /** @type {HTMLDivElement} */ (this.$el.querySelector('#value'));
        const $fee = /** @type {HTMLDivElement} */ (this.$el.querySelector('#fee'));
        const $data = /** @type {HTMLDivElement} */ (this.$el.querySelector('#data'));

        // Set value and fee.
        $value.textContent = NumberFormatting.formatNumber(
            PolygonUtils.unitsToCoins(request.description.args.amount.toNumber()),
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
        if (request.cashlinkMessage) {
            $data.textContent = request.cashlinkMessage;
            const $dataSection = /** @type {HTMLDivElement} */ (this.$el.querySelector('.data-section'));
            $dataSection.classList.remove('display-none');
        }

        // Set up password box.
        const $passwordBox = /** @type {HTMLFormElement} */ (document.querySelector('#password-box'));
        this._passwordBox = new PasswordBox($passwordBox, {
            hideInput: !request.keyInfo.encrypted,
            buttonI18nTag: 'passwordbox-create-cashlink',
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
     * @param {Parsed<KeyguardRequest.SignUsdtCashlinkRequest>} request
     * @param {SignUsdtCashlink.resolve} resolve
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

        // For USDT cashlink, we expect transferWithApproval function
        if (request.description.name === 'transferWithApproval') {
            const { sigR, sigS, sigV } = await polygonKey.signUsdtApproval(
                request.keyPath,
                new ethers.Contract(
                    CONFIG.BRIDGED_USDT_CONTRACT_ADDRESS,
                    PolygonContractABIs.BRIDGED_USDT_CONTRACT_ABI,
                ),
                request.request.to,
                request.description.args.approval,
                // Has been validated to be defined when function called is `transferWithApproval`
                /** @type {{ tokenNonce: number }} */ (request.approval).tokenNonce,
                request.request.from,
            );

            const transferContract = new ethers.Contract(
                request.request.to,
                PolygonContractABIs.BRIDGED_USDT_TRANSFER_CONTRACT_ABI,
            );

            request.request.data = transferContract.interface.encodeFunctionData(request.description.name, [
                /* address token */ request.description.args.token,
                /* uint256 amount */ request.description.args.amount,
                /* address target */ request.description.args.target,
                /* uint256 fee */ request.description.args.fee,
                /* uint256 approval */ request.description.args.approval,
                /* bytes32 sigR */ sigR,
                /* bytes32 sigS */ sigS,
                /* uint8 sigV */ sigV,
            ]);
        } else {
            throw new Errors.KeyguardError('USDT cashlink only supports transferWithApproval function');
        }

        // Sign the transaction using OpenGSN
        const typedData = new OpenGSN.TypedRequestData(
            CONFIG.POLYGON_CHAIN_ID,
            request.request.to,
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
        window.location.hash = SignUsdtCashlink.Pages.CONFIRM_TRANSACTION;
    }
}

SignUsdtCashlink.Pages = {
    CONFIRM_TRANSACTION: 'confirm-transaction',
};
