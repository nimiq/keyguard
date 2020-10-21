/* global RequestParser */
/* global Nimiq */
/* global loadNimiq */
/* global BitcoinJS */
/* global BitcoinUtils */
/* global HtlcUtils */
/* global Errors */

class SwapIFrameApi extends RequestParser {
    /**
     * @param {RpcState?} state
     * @param {KeyguardRequest.SignSwapTransactionsRequest} request
     * @returns {Promise<KeyguardRequest.SignSwapTransactionsResult>}
     */
    async signSwapTransactions(state, request) {
        const storageKey = SwapIFrameApi.SESSION_STORAGE_KEY_PREFIX + request.swapId;

        const storedPrivateKeys = sessionStorage.getItem(storageKey);
        sessionStorage.removeItem(storageKey); // Delete storage

        if (!storedPrivateKeys) throw new Error('No keys stored in SessionStorage');

        /** @type {{nim: string, btc: string[]}} */
        const privateKeys = JSON.parse(storedPrivateKeys);

        /** @type {KeyguardRequest.SignSwapTransactionsResult} */
        const result = {};

        if (request.fund.type === 'NIM') {
            await loadNimiq();

            const privateKey = new Nimiq.PrivateKey(Nimiq.BufferUtils.fromHex(privateKeys.nim));
            const publicKey = Nimiq.PublicKey.derive(privateKey);

            const transaction = this.parseTransaction({
                ...request.fund,
                flags: Nimiq.Transaction.Flag.CONTRACT_CREATION,
                recipient: 'CONTRACT_CREATION',
                recipientType: Nimiq.Account.Type.HTLC,
            });

            const signature = Nimiq.Signature.create(privateKey, publicKey, transaction.serializeContent());

            /** @type {KeyguardRequest.SignatureResult} */
            result.nim = {
                publicKey: publicKey.serialize(),
                signature: signature.serialize(),
            };
        }

        if (request.fund.type === 'BTC') {
            const inputs = this.parseInputs(request.fund.inputs);

            // Sort inputs by tx hash ASC, then index ASC
            inputs.sort((a, b) => {
                if (a.hash !== b.hash) return a.hash < b.hash ? -1 : 1;
                return a.index - b.index;
            });

            // Construct outputs
            const outputs = [
                /** @type {KeyguardRequest.BitcoinTransactionOutput} */
                (this.parseOutput(request.fund.recipientOutput, false, 'fund.recipientOutput')),
            ];

            // Validate and add change output
            if (request.fund.changeOutput) {
                outputs.push(
                    /** @type {KeyguardRequest.BitcoinTransactionOutput} */
                    (this.parseOutput(request.fund.changeOutput, false, 'fund.changeOutput')),
                );
            }

            // Sort outputs by value ASC, then address ASC
            outputs.sort((a, b) => (a.value - b.value) || (a.address < b.address ? -1 : 1));

            // Construct transaction
            const psbt = new BitcoinJS.Psbt({ network: BitcoinUtils.Network });

            // Add inputs
            // @ts-ignore Argument of type 'Uint8Array' is not assignable to parameter of type 'Buffer'.
            psbt.addInputs(inputs);
            // Add outputs
            psbt.addOutputs(outputs);

            // Sign
            const keyPairs = privateKeys.btc.map(privateKey => BitcoinJS.ECPair.fromPrivateKey(
                // @ts-ignore Argument of type 'import("...").Buffer' is not assignable to parameter of type 'Buffer'.
                BitcoinJS.Buffer.from(privateKey, 'hex'),
            ));
            for (const keyPair of keyPairs) {
                psbt.signAllInputs(keyPair);
            }

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
            await loadNimiq();

            const privateKey = new Nimiq.PrivateKey(Nimiq.BufferUtils.fromHex(privateKeys.nim));
            const publicKey = Nimiq.PublicKey.derive(privateKey);

            const transaction = this.parseTransaction(request.redeem);

            const signature = Nimiq.Signature.create(privateKey, publicKey, transaction.serializeContent());

            /** @type {KeyguardRequest.SignatureResult} */
            result.nim = {
                publicKey: publicKey.serialize(),
                signature: signature.serialize(),
            };
        }

        if (request.redeem.type === 'BTC') {
            const inputs = this.parseInputs(request.redeem.inputs);

            /** @type {KeyguardRequest.BitcoinTransactionOutput} */
            const output = (this.parseOutput(request.redeem.changeOutput, false, 'redeem.changeOutput'));

            // Construct transaction
            const psbt = new BitcoinJS.Psbt({ network: BitcoinUtils.Network });

            // Add inputs
            // @ts-ignore Argument of type 'Uint8Array' is not assignable to parameter of type 'Buffer'.
            psbt.addInputs(inputs);
            // Add outputs
            psbt.addOutput(output);

            // Sign
            const keyPair = BitcoinJS.ECPair.fromPrivateKey(
                // @ts-ignore Argument of type 'import("...").Buffer' is not assignable to parameter of type 'Buffer'.
                BitcoinJS.Buffer.from(privateKeys.btc[0], 'hex'),
            );
            psbt.signAllInputs(keyPair);

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

        return result;
    }

    /**
     * @param {unknown} inputs
     * @returns {ParsedBitcoinTransactionInput[]}
     */
    parseInputs(inputs) {
        if (!inputs || !Array.isArray(inputs)) {
            throw new Errors.InvalidRequestError('inputs must be an array');
        }
        if (inputs.length === 0) {
            throw new Errors.InvalidRequestError('inputs must not be empty');
        }

        // Construct inputs
        return inputs.map((input, index) => {
            const script = BitcoinJS.Buffer.from(Nimiq.BufferUtils.fromAny(input.outputScript));

            /** @type {ParsedBitcoinTransactionInput} */
            const parsed = {
                hash: Nimiq.BufferUtils.toHex(Nimiq.BufferUtils.fromAny(input.transactionHash)),
                index: this.parsePositiveInteger(input.outputIndex, true, `input[${index}].outputIndex`),
                witnessUtxo: {
                    script,
                    value: this.parsePositiveInteger(input.value, false, `input[${index}].value`),
                },

                // Part of the type, but unused in code
                keyPath: '',
                address: '',
            };
            if (input.witnessScript) {
                parsed.witnessScript = BitcoinJS.Buffer.from(Nimiq.BufferUtils.fromAny(input.witnessScript));
            }
            return parsed;
        });
    }

    /**
     * @param {unknown} output
     * @param {boolean} allowUndefined
     * @param {string} parameterName
     * @returns {KeyguardRequest.BitcoinTransactionOutput | undefined}
     */
    parseOutput(output, allowUndefined, parameterName) {
        if (output === undefined && allowUndefined) {
            return undefined;
        }

        if (!output || typeof output !== 'object') {
            throw new Error(`${parameterName} is not a valid output`);
        }

        /** @type {KeyguardRequest.BitcoinTransactionOutput} */
        const parsed = {
            address: this.parseBitcoinAddress(
                /** @type {{address: unknown}} */ (output).address,
                `${parameterName}.address`,
            ),
            value: this.parsePositiveInteger(
                /** @type {{value: unknown}} */ (output).value,
                false,
                `${parameterName}.value`,
            ),
        };
        return parsed;
    }

    /**
     * @param {unknown} path
     * @param {string} name - name of the property, used in error case only
     * @returns {string}
     */
    parseBitcoinPath(path, name) {
        if (!path || typeof path !== 'string') {
            throw new Errors.InvalidRequestError(`${name} must be a string`);
        }
        if (!this.isValidBitcoinPath(path)) {
            throw new Errors.InvalidRequestError(`${name}: Invalid path`);
        }
        try {
            BitcoinUtils.parseBipFromDerivationPath(path);
        } catch (error) {
            throw new Errors.InvalidRequestError(`${name}: Invalid BIP, only BIP49 and BIP84 are supported`);
        }
        return path;
    }

    /**
     * @param {string} path
     * @returns {boolean}
     */
    isValidBitcoinPath(path) {
        if (path.match(/^m(\/[0-9]+'?)*$/) === null) return false;

        // Overflow check.
        const segments = path.split('/');
        for (let i = 1; i < segments.length; i++) {
            if (!Nimiq.NumberUtils.isUint32(parseInt(segments[i], 10))) return false;
        }

        return true;
    }

    /**
     * @param {unknown} address
     * @param {string} parameterName
     * @returns {string}
     */
    parseBitcoinAddress(address, parameterName) {
        if (!BitcoinUtils.validateAddress(address)) {
            throw new Errors.InvalidRequestError(`${parameterName} is not a valid Bitcoin address`);
        }
        return /** @type {string} */ (address);
    }
}

SwapIFrameApi.SESSION_STORAGE_KEY_PREFIX = 'swap_id_';
