/* global ethers */
/* global Key */
/* global KeyStore */
/* global SignPolygonTransactionApi */
/* global PasswordBox */
/* global Errors */
/* global Utf8Tools */
/* global TopLevelApi */
/* global PolygonAddressInfo */
/* global NumberFormatting */
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
        this._request = request;
        /** @type {HTMLElement} */
        this.$el = (document.getElementById(SignPolygonTransaction.Pages.CONFIRM_TRANSACTION));

        const transaction = request.transaction;

        /** @type {HTMLLinkElement} */
        const $sender = (this.$el.querySelector('.accounts .sender'));
        new PolygonAddressInfo(transaction.from, request.keyLabel, 'usdc').render($sender);

        /** @type {ethers.Contract} */
        this._openGsn = new ethers.Contract(
            CONFIG.NIMIQ_USDC_CONTRACT_ADDRESS,
            SignPolygonTransactionApi.NIMIQ_USDC_CONTRACT_ABI,
        );

        /** @type {ethers.utils.TransactionDescription} */
        this._description = this._openGsn.interface.parseTransaction({
            data: request.transaction.data,
            value: request.transaction.value,
        });

        /** @type {HTMLLinkElement} */
        const $recipient = (this.$el.querySelector('.accounts .recipient'));
        const recipientAddress = /** @type {string} */ (this._description.args.target);
        new PolygonAddressInfo(
            recipientAddress,
            request.recipientLabel,
        ).render($recipient);

        /** @type {HTMLDivElement} */
        const $value = (this.$el.querySelector('#value'));
        /** @type {HTMLDivElement} */
        const $fee = (this.$el.querySelector('#fee'));
        // /** @type {HTMLDivElement} */
        // const $data = (this.$el.querySelector('#data'));

        // Set value and fee.
        $value.textContent = NumberFormatting.formatNumber(
            /** @type {ethers.BigNumber} */(this._description.args.amount).toNumber() / 1e6,
            6,
            2, // Always display at least 2 decimals, as is common for USD
        );
        const feeUnits = /** @type {ethers.BigNumber} */(this._description.args.fee).toNumber();
        if (feeUnits > 0) {
            // For the fee, we do not display more than two decimals, as it would not add any value for the user
            $fee.textContent = NumberFormatting.formatNumber(feeUnits / 1e6, 2, 2);
            /** @type {HTMLDivElement} */
            const $feeSection = (this.$el.querySelector('.fee-section'));
            $feeSection.classList.remove('display-none');
        }

        // if ($data && transaction.data) {
        //     // Set transaction extra data.
        //     $data.textContent = transaction.data;
        //     /** @type {HTMLDivElement} */
        //     const $dataSection = (this.$el.querySelector('.data-section'));
        //     $dataSection.classList.remove('display-none');
        // }

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

        const polygonKey = new PolygonKey(key);

        if (this._description.name === 'executeWithApproval') {
            // Sign approval
            const usdc = new ethers.Contract(
                CONFIG.USDC_CONTRACT_ADDRESS,
                SignPolygonTransactionApi.USDC_CONTRACT_ABI,
            );

            const functionSignature = usdc.interface.encodeFunctionData(
                'approve',
                [CONFIG.NIMIQ_USDC_CONTRACT_ADDRESS, this._description.args.approval],
            );

            // TODO: Make the domain parameters configurable in the request?
            const domain = {
                name: 'USD Coin (PoS)', // This is currently the same for testnet and mainnet
                version: '1', // This is currently the same for testnet and mainnet
                verifyingContract: CONFIG.USDC_CONTRACT_ADDRESS,
                salt: ethers.utils.hexZeroPad(ethers.utils.hexlify(CONFIG.POLYGON_CHAIN_ID), 32),
            };

            const types = {
                MetaTransaction: [
                    { name: 'nonce', type: 'uint256' },
                    { name: 'from', type: 'address' },
                    { name: 'functionSignature', type: 'bytes' },
                ],
            };

            const message = {
                // Has been validated to be defined when function called is `executeWithApproval`
                nonce: request.tokenApprovalNonce,
                from: request.transaction.from,
                functionSignature,
            };

            const signature = await polygonKey.signTypedData(
                request.keyPath,
                domain,
                types,
                message,
            );

            const signerAddress = ethers.utils.verifyTypedData(domain, types, message, signature);
            if (signerAddress !== request.transaction.from) {
                reject(new Errors.CoreError('Failed to sign approval'));
                return;
            }

            const r = signature.slice(0, 66); // 0x prefix plus 32 bytes = 66 characters
            const s = `0x${signature.slice(66, 130)}`; // 32 bytes = 64 characters
            let v = parseInt(signature.slice(130, 132), 16); // last byte = 2 characters
            if (![27, 28].includes(v)) v += 27;

            request.transaction.data = this._openGsn.interface.encodeFunctionData('executeWithApproval', [
                /* address token */ this._description.args.token,
                /* address userAddress */ this._description.args.userAddress,
                /* uint256 amount */ this._description.args.amount,
                /* address target */ this._description.args.target,
                /* uint256 fee */ this._description.args.fee,
                /* uint256 chainTokenFee */ this._description.args.chainTokenFee,
                /* uint256 approval */ this._description.args.approval,
                /* bytes32 sigR */ r,
                /* bytes32 sigS */ s,
                /* uint8 sigV */ v,
            ]);
        }

        // const raw = await polygonKey.sign(request.keyPath, request.transaction);
        const typedData = new OpenGSN.TypedRequestData(CONFIG.POLYGON_CHAIN_ID, CONFIG.NIMIQ_USDC_CONTRACT_ADDRESS, {
            request: {
                from: request.transaction.from,
                to: request.transaction.to,
                data: request.transaction.data,
                value: request.transaction.value.toString(),
                nonce: ethers.utils.hexlify(request.transaction.nonce),
                gas: request.transaction.gasLimit.toString(),
                validUntil: '9999999999',
            },
            relayData: {
                gasPrice: request.transaction.maxFeePerGas.toString(),
                pctRelayFee: '0', // TODO
                baseRelayFee: '0', // TODO
                relayWorker: CONFIG.NIMIQ_USDC_CONTRACT_ADDRESS,
                paymaster: CONFIG.NIMIQ_USDC_CONTRACT_ADDRESS,
                forwarder: CONFIG.NIMIQ_USDC_CONTRACT_ADDRESS,
                paymasterData: '0x',
                clientId: '0',
            },
        });

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
