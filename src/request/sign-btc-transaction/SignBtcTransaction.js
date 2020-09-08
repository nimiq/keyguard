/* global Key */
/* global KeyStore */
/* global SignBtcTransactionApi */
/* global PasswordBox */
/* global Errors */
/* global Utf8Tools */
/* global TopLevelApi */
/* global PaymentInfoLineBitcoin */
/* global NumberFormatting */
/* global BitcoinJS */
/* global BitcoinConstants */
/* global BitcoinUtils */
/* global BitcoinKey */
/* global IqonHash */
/* global LoginFileConfig */
/* global I18n */

/**
 * @callback SignBtcTransaction.resolve
 * @param {KeyguardRequest.SignedBitcoinTransaction} result
 */

class SignBtcTransaction {
    /**
     * @param {Parsed<KeyguardRequest.SignBtcTransactionRequest>} request
     * @param {SignBtcTransaction.resolve} resolve
     * @param {reject} reject
     */
    constructor(request, resolve, reject) {
        this._request = request;
        /** @type {HTMLElement} */
        this.$el = (document.getElementById(SignBtcTransaction.Pages.CONFIRM_TRANSACTION));
        this.$el.classList.add(request.layout);

        const recipientOutput = request.recipientOutput;
        const changeOutput = request.changeOutput;

        const fee = request.inputs.reduce((sum, input) => sum + input.witnessUtxo.value, 0)
            - recipientOutput.value
            - (changeOutput ? changeOutput.value : 0);

        /** @type {HTMLLinkElement} */
        const $recipientAvatar = (this.$el.querySelector('#avatar'));
        /** @type {HTMLLinkElement} */
        const $recipientLabel = (this.$el.querySelector('#label'));
        /** @type {HTMLLinkElement} */
        const $recipientAddress = (this.$el.querySelector('#address'));

        const recipientAddress = recipientOutput.address;
        /* eslint-disable no-nested-ternary */
        const recipientLabel = 'shopOrigin' in request && !!request.shopOrigin
            ? request.shopOrigin.split('://')[1]
            : request.recipientOutput.label || null;
        /* eslint-enable no-nested-ternary */
        const recipientImage = 'shopLogoUrl' in request && !!request.shopLogoUrl
            ? request.shopLogoUrl
            : null;

        if (recipientLabel) {
            if (recipientImage) {
                const img = new Image();
                img.src = recipientImage.href;
                $recipientAvatar.appendChild(img);
            } else {
                $recipientAvatar.textContent = recipientLabel.substring(0, 1);
                const color = IqonHash.getBackgroundColorIndex(recipientLabel);
                $recipientAvatar.classList.add(LoginFileConfig[color].className, 'initial');
            }
        } else {
            $recipientAvatar.classList.add('unlabelled');
            $recipientLabel.classList.add('unlabelled');
        }
        $recipientLabel.textContent = recipientLabel || I18n.translatePhrase('bitcoin-recipient-unlabelled');

        $recipientAddress.textContent = recipientAddress;

        /** @type {HTMLElement} */
        const $paymentInfoLine = (this.$el.querySelector('.payment-info-line'));
        if (request.layout === SignBtcTransactionApi.Layouts.CHECKOUT) {
            // eslint-disable-next-line no-new
            new PaymentInfoLineBitcoin(Object.assign({}, request, {
                recipient: recipientAddress,
                label: recipientLabel || recipientAddress,
                imageUrl: request.shopLogoUrl,
                satoshiAmount: recipientOutput.value,
                networkFee: fee,
            }), $paymentInfoLine);
        } else {
            $paymentInfoLine.remove();
        }

        /** @type {HTMLDivElement} */
        const $value = (this.$el.querySelector('#value'));
        /** @type {HTMLDivElement} */
        const $fee = (this.$el.querySelector('#fee'));

        // Set value and fee.
        $value.textContent = NumberFormatting.formatNumber(BitcoinUtils.satoshisToCoins(recipientOutput.value), 8);
        if ($fee && fee > 0) {
            $fee.textContent = NumberFormatting.formatNumber(BitcoinUtils.satoshisToCoins(fee), 8);
            /** @type {HTMLDivElement} */
            const $feeSection = (this.$el.querySelector('.fee-section'));
            $feeSection.classList.remove('display-none');
        }

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

        if ('expires' in request && request.expires) {
            setTimeout(() => reject(new Errors.RequestExpired()), request.expires - Date.now());
        }
    }

    /**
     * @param {Parsed<KeyguardRequest.SignBtcTransactionRequest>} request
     * @param {SignBtcTransaction.resolve} resolve
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

        const btcKey = new BitcoinKey(key);

        // For BIP49 (nested SegWit) inputs, a redeemScript needs to be added to inputs
        for (const input of request.inputs) {
            if (BitcoinUtils.parseBipFromDerivationPath(input.keyPath) !== BitcoinConstants.BIP.BIP49) continue;

            // Add redeemScripts for BIP49 inputs
            const keyPair = btcKey.deriveKeyPair(input.keyPath);
            const output = BitcoinUtils.keyPairToNativeSegwit(keyPair).output;
            if (!output) {
                TopLevelApi.setLoading(false);
                alert('UNEXPECTED: Failed to get native SegWit output for redeemScript');
                return;
            }
            input.redeemScript = output;
        }

        // Sort inputs by tx hash ASC, then index ASC
        request.inputs.sort((a, b) => {
            if (a.hash !== b.hash) return a.hash < b.hash ? -1 : 1;
            return a.index - b.index;
        });

        // Construct outputs
        const outputs = [request.recipientOutput];

        // Validate and add change output
        if (request.changeOutput) {
            // Derive address
            const keyPair = btcKey.deriveKeyPair(request.changeOutput.keyPath);
            /** @type {string | undefined} */
            let address;
            switch (BitcoinUtils.parseBipFromDerivationPath(request.changeOutput.keyPath)) {
                case BitcoinConstants.BIP.BIP49: address = BitcoinUtils.keyPairToNestedSegwit(keyPair).address; break;
                case BitcoinConstants.BIP.BIP84: address = BitcoinUtils.keyPairToNativeSegwit(keyPair).address; break;
                default: throw new Errors.KeyguardError('UNEXPECTED: change output key path was not a supported BIP');
            }

            if (!address) {
                throw new Errors.InvalidRequestError('Could not derive address for change output');
            }

            if (request.changeOutput.address && request.changeOutput.address !== address) {
                throw new Errors.InvalidRequestError(
                    'Given address is different from derived address for change output',
                );
            }

            /** @type {KeyguardRequest.BitcoinTransactionOutput} */
            const output = {
                address,
                value: request.changeOutput.value,
            };

            outputs.push(output);
        }

        // Sort outputs by value ASC, then address ASC
        outputs.sort((a, b) => (a.value - b.value) || (a.address < b.address ? -1 : 1));


        // Construct transaction
        const psbt = new BitcoinJS.Psbt({ network: BitcoinUtils.Network });

        // Add inputs
        // @ts-ignore Argument of type 'Uint8Array' is not assignable to parameter of type 'Buffer'.
        psbt.addInputs(request.inputs);
        // Add outputs
        psbt.addOutputs(outputs);

        // Sign
        const paths = request.inputs.map(input => input.keyPath);
        btcKey.sign(paths, psbt);

        // Verify that all inputs are signed
        if (!psbt.validateSignaturesOfAllInputs()) {
            throw new Error('Invalid or missing signature(s) for BTC transaction.');
        }

        // Finalize
        psbt.finalizeAllInputs();

        // Extract tx
        const tx = psbt.extractTransaction();

        /** @type {KeyguardRequest.SignedBitcoinTransaction} */
        const result = {
            transactionHash: tx.getId(),
            raw: tx.toHex(),
        };
        resolve(result);
    }

    run() {
        // Go to start page
        window.location.hash = SignBtcTransaction.Pages.CONFIRM_TRANSACTION;
    }
}

SignBtcTransaction.Pages = {
    CONFIRM_TRANSACTION: 'confirm-transaction',
};
