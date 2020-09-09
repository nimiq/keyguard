/* global Nimiq */
/* global Key */
/* global KeyStore */
/* global PasswordBox */
/* global Errors */
/* global Utf8Tools */
/* global TopLevelApi */
/* global NumberFormatting */
/* global BitcoinJS */
/* global BitcoinConstants */
/* global BitcoinUtils */
/* global BitcoinKey */
/* global HtlcUtils */
/* global Identicon */
/* global IqonHash */
/* global LoginFileConfig */
/* global TemplateTags */
/* global I18n */

/**
 * @callback SignSwap.resolve
 * @param {KeyguardRequest.SignSwapResult} result
 */

class SignSwap {
    /**
     * @param {Parsed<KeyguardRequest.SignSwapRequest>} request
     * @param {SignSwap.resolve} resolve
     * @param {reject} reject
     */
    constructor(request, resolve, reject) {
        this._request = request;
        /** @type {HTMLElement} */
        this.$el = (document.getElementById(SignSwap.Pages.CONFIRM_SWAP));

        const fundTx = request.fund;
        const redeemTx = request.redeem;

        /** @type {HTMLDivElement} */
        const $exchangeRate = (this.$el.querySelector('#exchange-rate'));
        /** @type {HTMLDivElement} */
        const $identicon = (this.$el.querySelector('.identicon'));
        /** @type {HTMLSpanElement} */
        const $nimLabel = (this.$el.querySelector('.nimiq-address .label'));
        /** @type {HTMLDivElement} */
        const $balanceBar = (this.$el.querySelector('.balance-bar'));
        /** @type {HTMLDivElement} */
        const $swapValues = (this.$el.querySelector('.swap-values'));
        /** @type {HTMLSpanElement} */
        const $swapNimValue = (this.$el.querySelector('#swap-nim-value'));
        /** @type {HTMLSpanElement} */
        const $newNimBalance = (this.$el.querySelector('#new-nim-balance'));
        /** @type {HTMLSpanElement} */
        const $swapBtcValue = (this.$el.querySelector('#swap-btc-value'));
        /** @type {HTMLSpanElement} */
        const $newBtcBalance = (this.$el.querySelector('#new-btc-balance'));
        /** @type {HTMLSpanElement} */
        const $swapNimValueFiat = (this.$el.querySelector('#swap-nim-value-fiat'));
        /** @type {HTMLSpanElement} */
        const $newNimBalanceFiat = (this.$el.querySelector('#new-nim-balance-fiat'));
        /** @type {HTMLSpanElement} */
        const $swapBtcValueFiat = (this.$el.querySelector('#swap-btc-value-fiat'));
        /** @type {HTMLSpanElement} */
        const $newBtcBalanceFiat = (this.$el.querySelector('#new-btc-balance-fiat'));

        const swapNimValue = fundTx.type === 'NIM' // eslint-disable-line no-nested-ternary
            ? fundTx.transaction.value + fundTx.transaction.fee
            : redeemTx.type === 'NIM'
                ? redeemTx.transaction.value
                : 0; // Should never happen, if parsing works correctly

        const swapBtcValue = fundTx.type === 'BTC' // eslint-disable-line no-nested-ternary
            ? fundTx.inputs.reduce((sum, input) => sum + input.witnessUtxo.value, 0)
                - (fundTx.changeOutput ? fundTx.changeOutput.value : 0)
            : redeemTx.type === 'BTC'
                ? redeemTx.output.value
                : 0; // Should never happen, if parsing works correctly

        $swapNimValue.textContent = `${fundTx.type === 'NIM' ? '-' : '+'}\u2009${NumberFormatting.formatNumber(
            Nimiq.Policy.lunasToCoins(swapNimValue),
        )}`;
        $swapNimValueFiat.textContent = NumberFormatting.formatCurrency(
            Nimiq.Policy.lunasToCoins(swapNimValue) * request.nimFiatRate,
            request.fiatCurrency,
        );

        $swapBtcValue.textContent = `${fundTx.type === 'BTC' ? '-' : '+'}\u2009${NumberFormatting.formatNumber(
            BitcoinUtils.satoshisToCoins(swapBtcValue),
            8,
        )}`;
        $swapBtcValueFiat.textContent = NumberFormatting.formatCurrency(
            BitcoinUtils.satoshisToCoins(swapBtcValue) * request.btcFiatRate,
            request.fiatCurrency,
        );

        $swapValues.classList.add(`${fundTx.type.toLowerCase()}-to-${redeemTx.type.toLowerCase()}`);

        // Exchange rate
        const nimExchangeValue = fundTx.type === 'NIM' // eslint-disable-line no-nested-ternary
            ? (fundTx.transaction.value - request.serviceNetworkFee) / 1e5
            : redeemTx.type === 'NIM'
                ? (redeemTx.transaction.value + redeemTx.transaction.fee) / 1e5
                : 0; // Should never happen, if parsing works correctly
        const btcExchangeValue = fundTx.type === 'BTC' // eslint-disable-line no-nested-ternary
            ? (fundTx.recipientOutput.value - request.serviceNetworkFee) / 1e8
            : redeemTx.type === 'BTC'
                ? redeemTx.input.witnessUtxo.value / 1e8
                : 0; // Should never happen, if parsing works correctly

        if (!nimExchangeValue || !btcExchangeValue) {
            throw new Errors.KeyguardError(
                `UNEXPECTED: Swap values are invalid - NIM: ${nimExchangeValue}, BTC: ${btcExchangeValue}`,
            );
        }

        const exchangeRate = Math.round(btcExchangeValue / nimExchangeValue * 1e8) / 1e8;
        $exchangeRate.textContent = `1 NIM = ${NumberFormatting.formatNumber(
            exchangeRate,
            8, 8,
        )} BTC`;

        const swapNimAddress = fundTx.type === 'NIM' // eslint-disable-line no-nested-ternary
            ? fundTx.transaction.sender.toUserFriendlyAddress()
            : redeemTx.type === 'NIM'
                ? redeemTx.transaction.recipient.toUserFriendlyAddress()
                : ''; // Should never happen, if parsing works correctly
        const nimAddressInfo = request.nimiqAddresses.find(address => address.address === swapNimAddress);
        if (!nimAddressInfo) {
            throw new Errors.KeyguardError('UNEXPECTED: Address info of swap NIM address not found');
        }

        // eslint-disable-next-line no-new
        new Identicon(nimAddressInfo.address, $identicon);
        $nimLabel.textContent = nimAddressInfo.label;

        const newNimBalance = nimAddressInfo.balance + (swapNimValue * (fundTx.type === 'NIM' ? -1 : 1));
        const newBtcBalance = request.bitcoinAccount.balance + (swapBtcValue * (fundTx.type === 'BTC' ? -1 : 1));

        $newNimBalance.textContent = NumberFormatting.formatNumber(Nimiq.Policy.lunasToCoins(newNimBalance));
        $newNimBalanceFiat.textContent = NumberFormatting.formatCurrency(
            Nimiq.Policy.lunasToCoins(newNimBalance) * request.nimFiatRate,
            request.fiatCurrency,
        );
        $newBtcBalance.textContent = NumberFormatting.formatNumber(BitcoinUtils.satoshisToCoins(newBtcBalance), 8);
        const newBtcBalanceFiat = BitcoinUtils.satoshisToCoins(newBtcBalance) * request.btcFiatRate;
        $newBtcBalanceFiat.textContent = NumberFormatting.formatCurrency(newBtcBalanceFiat, request.fiatCurrency);

        // Draw distribution graph

        const nimDistributionData = request.nimiqAddresses.map(addressInfo => {
            const active = swapNimAddress === addressInfo.address;
            const backgroundClass = LoginFileConfig[IqonHash.getBackgroundColorIndex(addressInfo.address)].className;
            const oldBalance = Nimiq.Policy.lunasToCoins(addressInfo.balance) * request.nimFiatRate;
            const newBalance = active
                ? Nimiq.Policy.lunasToCoins(newNimBalance) * request.nimFiatRate
                : oldBalance;

            return {
                oldBalance,
                newBalance,
                backgroundClass,
                active,
            };
        });

        const btcDistributionData = {
            oldBalance: BitcoinUtils.satoshisToCoins(request.bitcoinAccount.balance) * request.btcFiatRate,
            newBalance: newBtcBalanceFiat,
            backgroundClass: 'bitcoin',
            active: true,
        };

        const totalBalance = nimDistributionData.reduce((sum, data) => sum + data.newBalance, 0)
            + btcDistributionData.newBalance;

        /**
         * @param {{oldBalance: number, newBalance: number, backgroundClass: string, active: boolean}} data
         * @returns {HTMLDivElement}
         */
        function createBar(data) {
            const $bar = document.createElement('div');
            $bar.classList.add('bar', data.backgroundClass);
            $bar.classList.toggle('active', data.active);
            $bar.style.width = `${data.newBalance / totalBalance * 100}%`;
            if (data.active && data.newBalance > data.oldBalance) {
                const $change = document.createElement('div');
                $change.classList.add('change');
                $change.style.width = `${(data.newBalance - data.oldBalance) / data.newBalance * 100}%`;
                $bar.appendChild($change);
            }
            return $bar;
        }

        const $bars = document.createDocumentFragment();
        for (const data of nimDistributionData) {
            $bars.appendChild(createBar(data));
        }
        const $separator = document.createElement('div');
        $separator.classList.add('separator');
        $bars.appendChild($separator);
        $bars.appendChild(createBar(btcDistributionData));

        $balanceBar.appendChild($bars);

        /** @type {HTMLDivElement} */
        let $fundingColumn;
        if (fundTx.type === 'NIM') {
            $fundingColumn = /** @type {HTMLDivElement} */ (this.$el.querySelector('.swap-values .left-column'));
        } else {
            $fundingColumn = /** @type {HTMLDivElement} */ (this.$el.querySelector('.swap-values .right-column'));
        }
        $fundingColumn.appendChild(
            this._makeFeeTooltip(request, fundTx.type === 'NIM'
                ? Nimiq.Policy.coinsToLunas(nimExchangeValue)
                : BitcoinUtils.coinsToSatoshis(btcExchangeValue)),
        );

        // Set up password box.
        /** @type {HTMLFormElement} */
        const $passwordBox = (document.querySelector('#password-box'));
        this._passwordBox = new PasswordBox($passwordBox, {
            hideInput: !request.keyInfo.encrypted,
            buttonI18nTag: 'passwordbox-perform-swap',
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
     * @param {Parsed<KeyguardRequest.SignSwapRequest>} request
     * @param {number} exchangeAmount - In Luna or Satoshi, depending on which currency is funded
     * @returns {HTMLDivElement}
     */
    _makeFeeTooltip(request, exchangeAmount) {
        // eslint-disable-next-line object-curly-newline
        const { fund: fundTx, redeem: redeemTx, serviceNetworkFee, serviceExchangeFee } = request;

        const $tooltip = document.createElement('div');
        $tooltip.classList.add('tooltip', 'top');
        $tooltip.tabIndex = 0; // make the tooltip focusable

        /* eslint-disable indent */
        $tooltip.innerHTML = TemplateTags.hasVars(0)`
            <svg class="info-circle nq-icon">
                <use xlink:href="../../../node_modules/@nimiq/style/nimiq-style.icons.svg#nq-info-circle"/>
            </svg>
            <div class="tooltip-box">
                <span data-i18n="sign-swap-fee-tooltip-heading">This amount includes:</span>
                <div class="price-breakdown">
                    <label data-i18n="sign-swap-btc-fees">BTC network fees</label>
                    <div class="btc-fiat-fee"></div>
                </div>
                <p class="explainer" data-i18n="sign-swap-btc-fees-explainer">
                    Atomic swaps require two BTC transactions.
                </p>
                <div class="price-breakdown">
                    <label data-i18n="sign-swap-nim-fees">NIM network fees</label>
                    <div class="nim-fiat-fee"></div>
                </div>
                <div class="price-breakdown">
                    <label data-i18n="sign-swap-exchange-fee">Exchange fee</label>
                    <div class="exchange-fiat-fee"></div>
                </div>
                <p class="explainer">
                    <span class="exchange-percent-fee"></span>
                    <span data-i18n="sign-swap-of-exchange-value">of exchange value.</span>
                </p>
                <hr>
                <div class="price-breakdown">
                    <label data-i18n="sign-swap-total-fees">Total fees</label>
                    <div class="total-fees"></div>
                </div>
            </div>
        `;
        /* eslint-enable indent */

        I18n.translateDom($tooltip);

        // All variables are in FIAT!

        const myNimFee = Nimiq.Policy.lunasToCoins(fundTx.type === 'NIM' // eslint-disable-line no-nested-ternary
            ? fundTx.transaction.fee
            : redeemTx.type === 'NIM'
                ? redeemTx.transaction.fee
                : 0) * request.nimFiatRate;
        const myBtcFee = BitcoinUtils.satoshisToCoins(fundTx.type === 'BTC' // eslint-disable-line no-nested-ternary
            ? fundTx.inputs.reduce((sum, input) => sum + input.witnessUtxo.value, 0)
                - (fundTx.recipientOutput.value + (fundTx.changeOutput ? fundTx.changeOutput.value : 0))
            : redeemTx.type === 'BTC'
                ? redeemTx.input.witnessUtxo.value - redeemTx.output.value
                : 0) * request.btcFiatRate;

        const theirNetworkFee = fundTx.type === 'NIM'
            ? Nimiq.Policy.lunasToCoins(serviceNetworkFee) * request.nimFiatRate
            : BitcoinUtils.satoshisToCoins(serviceNetworkFee) * request.btcFiatRate;

        // Since we cannot know how the service network fee is combined, we simply split the service network fee
        // into NIM and BTC parts according to the ratio of our own fees (which are also suggested by the service,
        // following the same calculation).
        const theirNimFee = myNimFee / (myNimFee + myBtcFee) * theirNetworkFee;
        const theirBtcFee = myBtcFee / (myNimFee + myBtcFee) * theirNetworkFee;

        const theirExchangeFee = fundTx.type === 'NIM'
            ? Nimiq.Policy.lunasToCoins(serviceExchangeFee) * request.nimFiatRate
            : BitcoinUtils.satoshisToCoins(serviceExchangeFee) * request.btcFiatRate;

        const theirExchangeFeePercentage = NumberFormatting.formatNumber(
            request.serviceExchangeFee / (exchangeAmount - request.serviceExchangeFee) * 100,
            1,
        );

        /** @type {HTMLDivElement} */ ($tooltip.querySelector('.btc-fiat-fee'))
            .textContent = NumberFormatting.formatCurrency(myBtcFee + theirBtcFee, request.fiatCurrency);

        /** @type {HTMLDivElement} */ ($tooltip.querySelector('.nim-fiat-fee'))
            .textContent = NumberFormatting.formatCurrency(myNimFee + theirNimFee, request.fiatCurrency);

        /** @type {HTMLDivElement} */ ($tooltip.querySelector('.exchange-fiat-fee'))
            .textContent = NumberFormatting.formatCurrency(theirExchangeFee, request.fiatCurrency);

        /** @type {HTMLDivElement} */ ($tooltip.querySelector('.exchange-percent-fee'))
            .textContent = `${theirExchangeFeePercentage}%`;

        /** @type {HTMLDivElement} */ ($tooltip.querySelector('.total-fees'))
            .textContent = NumberFormatting.formatCurrency(
                myNimFee + myBtcFee + theirNetworkFee + theirExchangeFee,
                request.fiatCurrency,
            );

        return $tooltip;
    }

    /**
     * @param {Parsed<KeyguardRequest.SignSwapRequest>} request
     * @param {SignSwap.resolve} resolve
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

        /** @type {KeyguardRequest.SignSwapResult} */
        const result = {};

        if (request.fund.type === 'NIM') {
            const publicKey = key.derivePublicKey(request.fund.keyPath);

            // Validate that signing address is the refund address of the HTLC
            if (publicKey.toAddress().toUserFriendlyAddress() !== request.nimHtlc.refundAddress) {
                throw new Errors.InvalidRequestError('NIM HTLC funding must be signed by its refund address');
            }

            const signature = key.sign(request.fund.keyPath, request.fund.transaction.serializeContent());

            /** @type {KeyguardRequest.SignatureResult} */
            result.nim = {
                publicKey: publicKey.serialize(),
                signature: signature.serialize(),
            };
        }

        if (request.fund.type === 'BTC') {
            // Validate that we own the HTLC refund address
            const givenRefundAddress = btcKey.deriveAddress(request.fund.refundKeyPath);
            const scriptRefundAddress = BitcoinUtils.addressBytesToAddress(
                request.btcHtlc.refundAddressBytes,
                BitcoinUtils.parseBipFromDerivationPath(request.fund.refundKeyPath),
            );
            if (givenRefundAddress !== scriptRefundAddress) {
                throw new Errors.InvalidRequestError('BTC HTLC refund address does not match refundKeyPath');
            }

            const fundTx = request.fund;
            // For BIP49 (nested SegWit) inputs, a redeemScript needs to be added to inputs
            for (const input of fundTx.inputs) {
                if (BitcoinUtils.parseBipFromDerivationPath(input.keyPath) !== BitcoinConstants.BIP.BIP49) continue;

                // Add redeemScripts for BIP49 inputs
                const keyPair = btcKey.deriveKeyPair(input.keyPath);
                const output = BitcoinUtils.keyPairToNativeSegwit(keyPair).output;
                if (!output) {
                    throw new Errors.KeyguardError('UNEXPECTED: Failed to get native SegWit output for redeemScript');
                }
                input.redeemScript = output;
            }

            // Sort inputs by tx hash ASC, then index ASC
            fundTx.inputs.sort((a, b) => {
                if (a.hash !== b.hash) return a.hash < b.hash ? -1 : 1;
                return a.index - b.index;
            });

            // Construct outputs
            const outputs = [fundTx.recipientOutput];

            // Validate and add change output
            if (fundTx.changeOutput) {
                // Derive address
                const keyPair = btcKey.deriveKeyPair(fundTx.changeOutput.keyPath);
                /** @type {string | undefined} */
                let address;
                switch (BitcoinUtils.parseBipFromDerivationPath(fundTx.changeOutput.keyPath)) {
                    case BitcoinConstants.BIP.BIP49:
                        address = BitcoinUtils.keyPairToNestedSegwit(keyPair).address;
                        break;
                    case BitcoinConstants.BIP.BIP84:
                        address = BitcoinUtils.keyPairToNativeSegwit(keyPair).address;
                        break;
                    default:
                        throw new Errors.KeyguardError('UNEXPECTED: change output key path was not a supported BIP');
                }

                if (!address) {
                    throw new Errors.InvalidRequestError('UNEXPECTED: Could not derive address for change output');
                }

                if (fundTx.changeOutput.address && fundTx.changeOutput.address !== address) {
                    throw new Errors.InvalidRequestError(
                        'Given address is different from derived address for change output',
                    );
                }

                /** @type {KeyguardRequest.BitcoinTransactionOutput} */
                const output = {
                    address,
                    value: fundTx.changeOutput.value,
                };

                outputs.push(output);
            }

            // Sort outputs by value ASC, then address ASC
            outputs.sort((a, b) => (a.value - b.value) || (a.address < b.address ? -1 : 1));

            // Construct transaction
            const psbt = new BitcoinJS.Psbt({ network: BitcoinUtils.Network });

            // Add inputs
            // @ts-ignore Argument of type 'Uint8Array' is not assignable to parameter of type 'Buffer'.
            psbt.addInputs(fundTx.inputs);
            // Add outputs
            psbt.addOutputs(outputs);

            // Sign
            const paths = fundTx.inputs.map(input => input.keyPath);
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
            result.btc = {
                transactionHash: tx.getId(),
                raw: tx.toHex(),
            };
        }

        if (request.redeem.type === 'NIM') {
            const publicKey = key.derivePublicKey(request.redeem.keyPath);

            // Validate that this is the redeem address of the HTLC
            if (publicKey.toAddress().toUserFriendlyAddress() !== request.nimHtlc.redeemAddress) {
                throw new Errors.InvalidRequestError('NIM HTLC redeeming must be signed by its redeem address');
            }

            const signature = key.sign(request.redeem.keyPath, request.redeem.transaction.serializeContent());

            /** @type {KeyguardRequest.SignatureResult} */
            result.nim = {
                publicKey: publicKey.serialize(),
                signature: signature.serialize(),
            };
        }

        if (request.redeem.type === 'BTC') {
            const redeemTx = request.redeem;

            // Derive output address
            const outputKeyPair = btcKey.deriveKeyPair(redeemTx.output.keyPath);
            /** @type {string | undefined} */
            let address;
            switch (BitcoinUtils.parseBipFromDerivationPath(redeemTx.output.keyPath)) {
                case BitcoinConstants.BIP.BIP49:
                    address = BitcoinUtils.keyPairToNestedSegwit(outputKeyPair).address;
                    break;
                case BitcoinConstants.BIP.BIP84:
                    address = BitcoinUtils.keyPairToNativeSegwit(outputKeyPair).address;
                    break;
                default:
                    throw new Errors.KeyguardError('UNEXPECTED: redeem output key path was not a supported BIP');
            }

            if (!address) {
                throw new Errors.InvalidRequestError('UNEXPECTED: Could not derive address for redeem output');
            }

            if (redeemTx.output.address && redeemTx.output.address !== address) {
                throw new Errors.InvalidRequestError(
                    'Given address is different from derived address for redeem output',
                );
            }

            /** @type {KeyguardRequest.BitcoinTransactionOutput} */
            const output = {
                address,
                value: redeemTx.output.value,
            };

            // Construct transaction
            const psbt = new BitcoinJS.Psbt({ network: BitcoinUtils.Network });

            // Add inputs
            // @ts-ignore Argument of type 'Uint8Array' is not assignable to parameter of type 'Buffer'.
            psbt.addInput(redeemTx.input);
            // Add outputs
            psbt.addOutput(output);

            // Sign
            const inputKeyPair = btcKey.deriveKeyPair(redeemTx.input.keyPath);

            // Validate that this is the redeem address of the HTLC
            /** @type {string | undefined} */
            let givenRedeemAddress;
            switch (BitcoinUtils.parseBipFromDerivationPath(redeemTx.input.keyPath)) {
                case BitcoinConstants.BIP.BIP49:
                    givenRedeemAddress = BitcoinUtils.keyPairToNestedSegwit(inputKeyPair).address;
                    break;
                case BitcoinConstants.BIP.BIP84:
                    givenRedeemAddress = BitcoinUtils.keyPairToNativeSegwit(inputKeyPair).address;
                    break;
                default: break;
            }
            const scriptRedeemAddress = BitcoinUtils.addressBytesToAddress(
                request.btcHtlc.redeemAddressBytes,
                BitcoinUtils.parseBipFromDerivationPath(redeemTx.input.keyPath),
            );
            if (givenRedeemAddress !== scriptRedeemAddress) {
                throw new Errors.InvalidRequestError('BTC HTLC redeeming must be signed by its redeem address');
            }

            psbt.signInput(0, inputKeyPair);

            // Verify that all inputs are signed
            if (!psbt.validateSignaturesOfAllInputs()) {
                throw new Error('Invalid or missing signature(s) for BTC transaction.');
            }

            // Finalize (with custom logic for the HTLC)
            psbt.finalizeInput(0, (inputIndex, input /* , script, isSegwit, isP2SH, isP2WSH */) => {
                if (!input.partialSig) {
                    throw new Errors.KeyguardError('UNEXPECTED: Input does not have a partial signature');
                }

                if (!input.witnessScript) {
                    throw new Errors.KeyguardError('UNEXPECTED: Input does not have a witnessScript');
                }

                const witnessBytes = BitcoinJS.script.fromASM([
                    input.partialSig[0].signature.toString('hex'),
                    input.partialSig[0].pubkey.toString('hex'),
                    // Use zero-bytes as a dummy secret, required for signing
                    '0000000000000000000000000000000000000000000000000000000000000000',
                    'OP_1', // OP_1 (true) activates the redeem branch in the HTLC script
                    input.witnessScript.toString('hex'),
                ].join(' '));

                const witnessStack = BitcoinJS.script.toStack(witnessBytes);

                return {
                    finalScriptSig: undefined,
                    finalScriptWitness: HtlcUtils.witnessStackToScriptWitness(witnessStack),
                };
            });

            // Extract tx
            const tx = psbt.extractTransaction();

            /** @type {KeyguardRequest.SignedBitcoinTransaction} */
            result.btc = {
                transactionHash: tx.getId(),
                raw: tx.toHex(),
            };
        }

        resolve(result);
    }

    run() {
        // Go to start page
        window.location.hash = SignSwap.Pages.CONFIRM_SWAP;
    }
}

SignSwap.Pages = {
    CONFIRM_SWAP: 'confirm-swap',
};
