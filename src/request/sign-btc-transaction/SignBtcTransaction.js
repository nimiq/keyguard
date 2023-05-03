/* global Key */
/* global KeyStore */
/* global SignBtcTransactionApi */
/* global PasswordBox */
/* global Errors */
/* global TemplateTags */
/* global Utf8Tools */
/* global TopLevelApi */
/* global PaymentInfoLine */
/* global NumberFormatting */
/* global BitcoinJS */
/* global BitcoinConstants */
/* global BitcoinUtils */
/* global BitcoinKey */
/* global HtlcUtils */
/* global IqonHash */
/* global LoginFileConfig */
/* global I18n */

/**
 * @callback SignBtcTransaction.resolve
 * @param {KeyguardRequest.SignedBitcoinTransaction} result
 */

class SignBtcTransaction {
    /**
     * @param {Required<Parsed<KeyguardRequest.SignBtcTransactionRequest>>} request
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
            new PaymentInfoLine(Object.assign({}, request, {
                recipient: recipientAddress,
                label: recipientLabel || recipientAddress,
                imageUrl: request.shopLogoUrl,
                amount: recipientOutput.value,
                currency: /** @type {'btc'} */ ('btc'),
                unitsToCoins: BitcoinUtils.satoshisToCoins,
                networkFee: fee,
            }), $paymentInfoLine);
        } else {
            $paymentInfoLine.remove();
        }

        /** @type {HTMLDivElement} */
        const $value = (this.$el.querySelector('#value'));
        const amountBTC = BitcoinUtils.satoshisToCoins(recipientOutput.value);
        $value.textContent = NumberFormatting.formatNumber(amountBTC, 8);

        const feeBTC = NumberFormatting.formatNumber(BitcoinUtils.satoshisToCoins(fee), 8);

        // Right now, we have two types of layouts. See #445
        if (request.layout === SignBtcTransactionApi.Layouts.CHECKOUT) {
            /** @type {HTMLDivElement} */
            const $fee = (this.$el.querySelector('#fee'));

            if ($fee && fee > 0) {
                $fee.textContent = feeBTC;
                /** @type {HTMLDivElement} */
                const $feeSection = (this.$el.querySelector('.fee-section'));
                $feeSection.classList.remove('display-none');
            }
        } else if (request.layout === SignBtcTransactionApi.Layouts.STANDARD) {
            /** @type {HTMLSpanElement|null} */
            const $fiat = (this.$el.querySelector('#fiat'));
            if (!$fiat) return;

            const {
                fiatCurrency: currency, fiatRate, delay, feePerByte,
            } = request;

            const amountFiat = fiatRate * amountBTC;
            $fiat.textContent = `~${NumberFormatting.formatCurrency(amountFiat, currency)}`;


            /** @type {HTMLDivElement|null} */
            const $fiatSection = (this.$el.querySelector('.fiat-section'));
            if (!$fiatSection) return;
            $fiatSection.classList.remove('display-none');

            /** @type {HTMLDivElement|null} */
            const $estimationSection = (this.$el.querySelector('.estimation-section'));
            if (!$estimationSection) return;
            $estimationSection.classList.remove('display-none');

            let estimatedDuration = '';
            let speed = 50;
            if (delay === 1) { estimatedDuration = I18n.translatePhrase('sign-btc-tx-15m'); speed = 100; }
            if (delay === 12) { estimatedDuration = I18n.translatePhrase('sign-btc-tx-2-4h'); speed = 50; }
            if (delay === 36) { estimatedDuration = I18n.translatePhrase('sign-btc-tx-6h-plus'); speed = 0; }

            const rotation = (Math.min(100, Math.max(0, speed)) / 100 - 1) * 180;
            this.$el.querySelectorAll('#speed-gauge-icon g > path').forEach($path => {
                // @ts-ignore
                $path.style.transform = `rotate(${rotation}deg)`;
            });

            if (!request.changeOutput || !request.changeOutput.value) return;
            const fiatAmount = NumberFormatting.formatCurrency(BitcoinUtils.satoshisToCoins(fee) * fiatRate, currency);

            /** @type {HTMLDivElement|null} */
            const $values = ($estimationSection.querySelector('#values'));
            if (!$values) return;
            $values.innerText = `${estimatedDuration} / ${fiatAmount}`;

            /** @type {HTMLDivElement|null} */
            const $tooltip = document.querySelector('#txInfo');
            if (!$tooltip) return;
            $tooltip.classList.add('tooltip', 'top');
            $tooltip.tabIndex = 0; // make the tooltip focusable

            /* eslint-disable indent */
            $tooltip.innerHTML = TemplateTags.hasVars(2)`
                <svg class="info-icon nq-icon">
                    <use xlink:href="../../../node_modules/@nimiq/style/nimiq-style.icons.svg#nq-info-circle-small"/>
                </svg>
                <div class="tooltip-box">
                    <div class="network-fee">
                        <span>
                            <label data-i18n="sign-btc-tx-network-fee">
                                Network fee
                            </label>
                            : ${feePerByte} 
                            <label data-i18n="sign-btc-tx-sat-byte">
                                sat/byte
                            </label>
                        </span>
                        <span class="network-fee__btc">
                            ${feeBTC} 
                            <span class="btc-symbol"></span>
                        </span>
                    </div>
                    <p data-i18n="sign-btc-tx-fee-description">
                        Increase the speed of your transaction by paying a higher network fee.
                        The fees go directly to the miners.
                    <p>
                    <p data-i18n="sign-btc-tx-fee-values-estimations">
                        Duration and fees are estimates.
                    </p>
                </div>
            `;
            /* eslint-enable indent */

            I18n.translateDom($tooltip);
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

        try {
            // For BIP49 (nested SegWit) inputs, a redeemScript needs to be added to inputs
            for (const input of request.inputs) {
                if (BitcoinUtils.parseBipFromDerivationPath(input.keyPath) !== BitcoinConstants.BIP.BIP49) continue;

                // Add redeemScripts for BIP49 inputs
                const keyPair = btcKey.deriveKeyPair(input.keyPath);
                const output = BitcoinUtils.keyPairToNativeSegwit(keyPair).output;
                if (!output) {
                    throw new Error('UNEXPECTED: Failed to get native SegWit output for redeemScript');
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
            // Set locktime
            if (request.locktime) {
                psbt.locktime = request.locktime;
            }

            if (request.inputs.length === 1 && request.inputs[0].type === 'htlc-refund') {
                const htlcDetails = HtlcUtils.decodeBtcHtlcScript(request.inputs[0].witnessScript);

                // The timeoutTimestamp we parse from the BTC HTLC script is forwarded one hour
                // (because the timeout in the script itself is set back one hour, because the BTC
                // network only accepts locktimes that are at least one hour old). So we need to
                // remove this added hour before using it as the transaction's locktime.
                const htlcRefundLocktime = htlcDetails.timeoutTimestamp - (60 * 60) + 1;
                const htlcRefundInputSequence = 0xfffffffe; // Signal to use locktime but do not opt into replace-by-fee
                if (request.locktime && request.locktime !== htlcRefundLocktime) {
                    throw new Errors.InvalidRequestError(`Requested locktime ${request.locktime} differs from default `
                        + ` HTLC refund locktime ${htlcRefundLocktime}`);
                }
                if (request.inputs[0].sequence && request.inputs[0].sequence !== htlcRefundInputSequence) {
                    throw new Errors.InvalidRequestError(`Requested input sequence ${request.inputs[0].sequence} `
                        + ` differs from default HTLC refund input sequence ${htlcRefundInputSequence}`);
                }
                psbt.locktime = htlcRefundLocktime;
                psbt.setInputSequence(0, htlcRefundInputSequence);
            }

            // Sign
            const paths = request.inputs.map(input => input.keyPath);
            btcKey.sign(paths, psbt);

            // Verify that all inputs are signed
            if (!psbt.validateSignaturesOfAllInputs()) {
                throw new Error('Invalid or missing signature(s) for BTC transaction.');
            }

            // Finalize
            let i = 0;
            for (const parsedInput of request.inputs) {
                switch (parsedInput.type) {
                    case 'standard':
                        psbt.finalizeInput(i);
                        break;
                    case 'htlc-redeem':
                    case 'htlc-refund':
                        // eslint-disable-next-line no-loop-func
                        psbt.finalizeInput(i, (inputIndex, input /* , script, isSegwit, isP2SH, isP2WSH */) => {
                            if (!input.partialSig) {
                                throw new Errors.KeyguardError('UNEXPECTED: Input does not have a partial signature');
                            }

                            if (!input.witnessScript) {
                                throw new Errors.KeyguardError('UNEXPECTED: Input does not have a witnessScript');
                            }

                            const witnessBytes = BitcoinJS.script.fromASM([
                                input.partialSig[0].signature.toString('hex'),
                                input.partialSig[0].pubkey.toString('hex'),
                                ...(parsedInput.type === 'htlc-redeem' ? [
                                    // Use zero-bytes as a dummy secret, required for signing
                                    '0000000000000000000000000000000000000000000000000000000000000000',
                                    'OP_1', // OP_1 (true) activates the redeem branch in the HTLC script
                                ] : []),
                                ...(parsedInput.type === 'htlc-refund' ? [
                                    'OP_0', // OP_0 (false) activates the refund branch in the HTLC script
                                ] : []),
                                input.witnessScript.toString('hex'),
                            ].join(' '));

                            const witnessStack = BitcoinJS.script.toStack(witnessBytes);

                            return {
                                finalScriptSig: undefined,
                                finalScriptWitness: HtlcUtils.witnessStackToScriptWitness(witnessStack),
                            };
                        });
                        break;
                    default:
                        throw new Errors.KeyguardError('Unsupported input type');
                }

                i += 1;
            }

            // Extract tx
            const tx = psbt.extractTransaction();

            /** @type {KeyguardRequest.SignedBitcoinTransaction} */
            const result = {
                transactionHash: tx.getId(),
                raw: tx.toHex(),
            };
            resolve(result);
        } catch (error) {
            TopLevelApi.setLoading(false);
            console.error(error);
            alert(`ERROR: ${error.message}`);
        }
    }

    run() {
        // Go to start page
        window.location.hash = SignBtcTransaction.Pages.CONFIRM_TRANSACTION;
    }
}

SignBtcTransaction.Pages = {
    CONFIRM_TRANSACTION: 'confirm-transaction',
};
