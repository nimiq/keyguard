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
// /* global IqonHash */
// /* global LoginFileConfig */

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
        // /** @type {HTMLDivElement} */
        // const $currentNimBalance = (this.$el.querySelector('#current-nim-balance'));
        /** @type {HTMLDivElement} */
        const $swapNimValue = (this.$el.querySelector('#swap-nim-value'));
        // /** @type {HTMLDivElement} */
        // const $newNimBalance = (this.$el.querySelector('#new-nim-balance'));
        // /** @type {HTMLDivElement} */
        // const $currentBtcBalance = (this.$el.querySelector('#current-btc-balance'));
        /** @type {HTMLDivElement} */
        const $swapBtcValue = (this.$el.querySelector('#swap-btc-value'));
        // /** @type {HTMLDivElement} */
        // const $newBtcBalance = (this.$el.querySelector('#new-btc-balance'));

        if (fundTx.type === 'NIM') {
            $swapNimValue.textContent = `-${NumberFormatting.formatNumber(
                Nimiq.Policy.lunasToCoins(fundTx.transaction.value),
            )}`;
            $swapNimValue.classList.add('nq-red');
        } else {
            const spendSats = fundTx.inputs.reduce((sum, input) => sum + input.witnessUtxo.value, 0);
            $swapBtcValue.textContent = `-${NumberFormatting.formatNumber(
                BitcoinUtils.satoshisToCoins(spendSats),
                8,
            )}`;
            $swapBtcValue.classList.add('nq-red');
        }

        if (redeemTx.type === 'NIM') {
            $swapNimValue.textContent = `+${NumberFormatting.formatNumber(
                Nimiq.Policy.lunasToCoins(redeemTx.transaction.value / 1e5),
            )}`;
            $swapNimValue.classList.add('nq-green');
        } else {
            $swapBtcValue.textContent = `+${NumberFormatting.formatNumber(
                BitcoinUtils.satoshisToCoins(redeemTx.output.value),
                8,
            )}`;
            $swapBtcValue.classList.add('nq-green');
        }

        // Exchange rate
        const nimSwapValue = fundTx.type === 'NIM' // eslint-disable-line no-nested-ternary
            ? (fundTx.transaction.value/* - serviceNetworkFee */) / 1e5
            : redeemTx.type === 'NIM'
                ? (redeemTx.transaction.value + redeemTx.transaction.fee) / 1e5
                : 0; // Should never happen, if parsing works correctly
        const btcSwapValue = fundTx.type === 'BTC' // eslint-disable-line no-nested-ternary
            ? (fundTx.inputs.reduce((sum, input) => sum + input.witnessUtxo.value, 0)/* - serviceNetworkFee */) / 1e8
            : redeemTx.type === 'BTC'
                ? redeemTx.input.witnessUtxo.value / 1e8
                : 0; // Should never happen, if parsing works correctly

        if (!nimSwapValue || !btcSwapValue) {
            throw new Errors.KeyguardError(
                `UNEXPECTED: Swap values are invalid - NIM: ${nimSwapValue}, BTC: ${btcSwapValue}`,
            );
        }

        const exchangeRate = Math.round(btcSwapValue / nimSwapValue * 1e8) / 1e8;
        $exchangeRate.textContent = `1 NIM = ${exchangeRate} BTC`;

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
            const refundAddress = new Nimiq.Address(
                new Nimiq.SerialBuffer(request.fund.transaction.data).read(Nimiq.Address.SERIALIZED_SIZE));
            const signerAddress = publicKey.toAddress();

            if (!signerAddress.equals(refundAddress)) {
                throw new Errors.InvalidRequestError('NIM HTLC must be signed by its refund address');
            }

            const signature = key.sign(request.fund.keyPath, request.fund.transaction.serializeContent());

            /** @type {KeyguardRequest.SignatureResult} */
            result.nim = {
                publicKey: publicKey.serialize(),
                signature: signature.serialize(),
            };
        }

        if (request.fund.type === 'BTC') {
            const fundTx = request.fund;
            // For BIP49 (nested SegWit) inputs, a redeemScript needs to be added to inputs
            for (const input of fundTx.inputs) {
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
                    throw new Errors.InvalidRequestError('Could not derive address for change output');
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

            try {
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
                    throw new Error('Invalid or missing signature(s).');
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
            } catch (error) {
                TopLevelApi.setLoading(false);
                console.error(error);
                alert(`ERROR: ${error.message}`);
                return;
            }
        }

        if (request.redeem.type === 'NIM') {
            const publicKey = key.derivePublicKey(request.redeem.keyPath);
            const signature = key.sign(request.redeem.keyPath, request.redeem.transaction.serializeContent());

            /** @type {KeyguardRequest.SignatureResult} */
            result.nim = {
                publicKey: publicKey.serialize(),
                signature: signature.serialize(),
            };
        }

        if (request.redeem.type === 'BTC') {
            const redeemTx = request.redeem;

            // Validate output address

            // Derive address
            const keyPair = btcKey.deriveKeyPair(redeemTx.output.keyPath);
            /** @type {string | undefined} */
            let address;
            switch (BitcoinUtils.parseBipFromDerivationPath(redeemTx.output.keyPath)) {
                case BitcoinConstants.BIP.BIP49:
                    address = BitcoinUtils.keyPairToNestedSegwit(keyPair).address;
                    break;
                case BitcoinConstants.BIP.BIP84:
                    address = BitcoinUtils.keyPairToNativeSegwit(keyPair).address;
                    break;
                default:
                    throw new Errors.KeyguardError('UNEXPECTED: redeem output key path was not a supported BIP');
            }

            if (!address) {
                throw new Errors.InvalidRequestError('Could not derive address for redeem output');
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

            try {
                // Construct transaction
                const psbt = new BitcoinJS.Psbt({ network: BitcoinUtils.Network });

                // Add inputs
                // @ts-ignore Argument of type 'Uint8Array' is not assignable to parameter of type 'Buffer'.
                psbt.addInput(redeemTx.input);
                // Add outputs
                psbt.addOutput(output);

                // Sign
                const keyPair = btcKey.deriveKeyPair(redeemTx.input.keyPath);
                psbt.signInput(0, keyPair);

                // Verify that all inputs are signed
                if (!psbt.validateSignaturesOfAllInputs()) {
                    throw new Error('Invalid or missing signature(s).');
                }

                // Finalize
                psbt.finalizeInput(0, (inputIndex, input, script, isSegwit, isP2SH, isP2WSH) => {
                    if (!input.partialSig) {
                        throw new Errors.KeyguardError('UNEXPECTED: Input does not have a partial signature');
                    }

                    if (!input.witnessScript) {
                        throw new Errors.KeyguardError('UNEXPECTED: Input does not have a witnessScript');
                    }

                    const witness = BitcoinJS.script.fromASM([
                        input.partialSig[0].signature.toString('hex'),
                        input.partialSig[0].pubkey.toString('hex'),
                        // Use zero-bytes as a dummy secret for signing
                        '0000000000000000000000000000000000000000000000000000000000000000',
                        'OP_1',
                        input.witnessScript.toString('hex'),
                    ].join(' '));

                    const stack = BitcoinJS.script.toStack(witness);

                    /**
                     * @param {Buffer[]} witness
                     * @returns {Buffer}
                     */
                    function witnessStackToScriptWitness(witness) {
                        /** @type {number[]} */
                        let buffer = [];

                        /**
                         * @param {Buffer} slice
                         */
                        function writeSlice(slice){
                            buffer = buffer.concat([...slice.subarray()]);
                        }

                        /**
                         * Specification: https://en.bitcoin.it/wiki/Protocol_documentation#Variable_length_integer
                         *
                         * @param {number} i
                         */
                        function writeVarInt(i) {
                            if (i < 0xFD) {
                                buffer.push(i);
                            } else if (i <= 0xFFFF) {
                                buffer.push(0xFD);
                                const number = new Nimiq.SerialBuffer(2);
                                number.writeUint16(i);
                                buffer = buffer.concat([...number.reverse()]);
                            } else if (i <= 0xFFFFFFFF) {
                                buffer.push(0xFE);
                                const number = new Nimiq.SerialBuffer(4);
                                number.writeUint32(i);
                                buffer = buffer.concat([...number.reverse()]);
                            } else {
                                buffer.push(0xFF);
                                const number = new Nimiq.SerialBuffer(8);
                                number.writeUint64(i);
                                buffer = buffer.concat([...number.reverse()]);
                            }
                        }

                        /**
                         * @param {Buffer} slice
                         */
                        function writeVarSlice(slice) {
                          writeVarInt(slice.length);
                          writeSlice(slice);
                        }

                        /**
                         * @param {Buffer[]} vector
                         */
                        function writeVector(vector) {
                          writeVarInt(vector.length);
                          vector.forEach(writeVarSlice);
                        }

                        writeVector(witness);

                        // @ts-ignore Type 'Buffer' is not assignable to type 'Buffer'.
                        return NodeBuffer.Buffer.from(buffer);
                      }
                    return {
                        finalScriptSig: undefined,
                        finalScriptWitness: witnessStackToScriptWitness(stack),
                    };
                });

                // Extract tx
                const tx = psbt.extractTransaction();

                /** @type {KeyguardRequest.SignedBitcoinTransaction} */
                result.btc = {
                    transactionHash: tx.getId(),
                    raw: tx.toHex(),
                };
            } catch (error) {
                TopLevelApi.setLoading(false);
                console.error(error);
                alert(`ERROR: ${error.message}`);
                return;
            }
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
