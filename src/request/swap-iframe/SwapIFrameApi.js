/* global BitcoinRequestParserMixin */
/* global RequestParser */
/* global Nimiq */
/* global loadNimiq */
/* global BitcoinJS */
/* global BitcoinUtils */
/* global HtlcUtils */
/* global Errors */
/* global Constants */

class SwapIFrameApi extends BitcoinRequestParserMixin(RequestParser) { // eslint-disable-line no-unused-vars
    /**
     * @param {RpcState?} state
     * @param {KeyguardRequest.SignSwapTransactionsRequest} request
     * @returns {Promise<KeyguardRequest.SignSwapTransactionsResult>}
     */
    async signSwapTransactions(state, request) {
        const storageKey = Constants.SWAP_IFRAME_SESSION_STORAGE_KEY_PREFIX + request.swapId;

        const storedData = sessionStorage.getItem(storageKey);
        sessionStorage.removeItem(storageKey); // Delete storage

        if (!storedData) throw new Error('No swap stored in SessionStorage');

        /** @type {{keys: {nim: string, btc: string[], btc_refund?: string}, request: any}} */
        const { keys: privateKeys, request: storedRawRequest } = (JSON.parse(storedData));

        if (request.fund.type === 'NIM' || request.redeem.type === 'NIM') {
            if (!privateKeys.nim) throw new Error('No NIM key stored in SessionStorage');
            if (privateKeys.nim.length !== 64) throw new Error('Invalid NIM key stored in SessionStorage');
        }

        if (request.fund.type === 'BTC' || request.redeem.type === 'BTC') {
            if (!privateKeys.btc) throw new Error('No BTC key list stored in SessionStorage');
            if (!privateKeys.btc.length) throw new Error('No BTC keys stored in SessionStorage');
            if (privateKeys.btc.some(key => !key)) throw new Error('Empty BTC key stored in SessionStorage');
            if (privateKeys.btc.some(key => key.length !== 64)) {
                throw new Error('Invalid BTC key stored in SessionStorage');
            }
        }

        // Deserialize stored request
        if (storedRawRequest.fund.type === 'NIM') {
            storedRawRequest.fund.transaction = Nimiq.Transaction.fromPlain(storedRawRequest.fund.transaction);
        }
        if (storedRawRequest.fund.type === 'BTC') {
            // Plainify BTC input script buffers
            for (let i = 0; i < storedRawRequest.fund.inputs.length; i++) {
                storedRawRequest.fund.inputs[i].witnessUtxo.script = BitcoinJS.Buffer.from(
                    storedRawRequest.fund.inputs[i].witnessUtxo.script,
                    'hex',
                );
            }
        }
        if (storedRawRequest.redeem.type === 'NIM') {
            storedRawRequest.redeem.transaction = Nimiq.Transaction.fromPlain(storedRawRequest.redeem.transaction);
        }

        /** @type {Parsed<KeyguardRequest.SignSwapRequest>} */
        const storedRequest = storedRawRequest;

        /** @type {{
            type: 'NIM',
            htlcDetails: NimHtlcContents,
            htlcData: Uint8Array,
        } | {
            type: 'BTC',
            htlcDetails: BtcHtlcContents,
            htlcScript: Uint8Array,
            htlcAddress: string,
        } | {
            type: 'EUR',
            htlcDetails: EurHtlcContents,
            htlcId: string,
        } | undefined } */
        let fund;

        /** @type {{
            type: 'NIM',
            htlcDetails: NimHtlcContents,
            htlcData: Uint8Array,
            htlcAddress: string,
        } | {
            type: 'BTC',
            htlcDetails: BtcHtlcContents,
            htlcScript: Uint8Array,
            transactionHash: string,
            outputIndex: number,
            outputScript: Buffer,
        } | undefined } */
        let redeem;

        // Parse request
        if (storedRequest.fund.type !== request.fund.type || storedRequest.redeem.type !== request.redeem.type) {
            throw new Errors.InvalidRequestError('Different swap assets in iframe request than in top-level request');
        }

        if (request.fund.type === 'NIM' && storedRequest.fund.type === 'NIM') {
            const htlcDetails = HtlcUtils.decodeNimHtlcData(request.fund.htlcData);

            if (htlcDetails.refundAddress !== storedRequest.fund.transaction.sender.toUserFriendlyAddress()) {
                throw new Errors.InvalidRequestError('NIM HTLC refund address must be same as sender');
            }

            // Check that validityStartHeight is before HTLC timeout
            if (storedRequest.fund.transaction.validityStartHeight >= htlcDetails.timeoutBlockHeight) {
                throw new Errors.InvalidRequestError(
                    'Fund validityStartHeight must be lower than HTLC timeout block height',
                );
            }

            fund = {
                type: 'NIM',
                htlcDetails,
                htlcData: request.fund.htlcData,
            };
        }

        if (request.redeem.type === 'NIM' && storedRequest.redeem.type === 'NIM') {
            const htlcDetails = HtlcUtils.decodeNimHtlcData(request.redeem.htlcData);

            if (htlcDetails.redeemAddress !== storedRequest.redeem.transaction.recipient.toUserFriendlyAddress()) {
                throw new Errors.InvalidRequestError('NIM HTLC redeem address must be same as recipient');
            }

            // Check that validityStartHeight is before HTLC timeout
            if (storedRequest.redeem.transaction.validityStartHeight >= htlcDetails.timeoutBlockHeight) {
                throw new Errors.InvalidRequestError(
                    'Redeem validityStartHeight must be lower than HTLC timeout block height',
                );
            }

            redeem = {
                type: 'NIM',
                htlcDetails,
                htlcData: request.redeem.htlcData,
                htlcAddress: this.parseAddress(request.redeem.htlcAddress, 'redeem.htlcAddress')
                    .toUserFriendlyAddress(),
            };
        }

        if (request.fund.type === 'BTC' && storedRequest.fund.type === 'BTC') {
            const htlcDetails = HtlcUtils.decodeBtcHtlcScript(request.fund.htlcScript);

            if (htlcDetails.refundAddress !== storedRequest.fund.refundAddress) {
                throw new Errors.InvalidRequestError(
                    'BTC HTLC refund address must be same as given in top-level request',
                );
            }

            const htlcAddress = BitcoinJS.payments.p2wsh({
                // @ts-ignore Type 'Uint8Array' is not assignable to type 'Buffer'.
                witness: [BitcoinJS.Buffer.from(request.fund.htlcScript)],
                network: BitcoinUtils.Network,
            }).address;

            if (!htlcAddress) {
                throw new Errors.InvalidRequestError('Cannot derive HTLC address from BTC HTLC script');
            }

            fund = {
                type: 'BTC',
                htlcDetails,
                htlcScript: request.fund.htlcScript,
                htlcAddress,
            };
        }

        if (request.redeem.type === 'BTC' && storedRequest.redeem.type === 'BTC') {
            const htlcDetails = HtlcUtils.decodeBtcHtlcScript(request.redeem.htlcScript);

            if (htlcDetails.redeemAddress !== storedRequest.redeem.output.address) {
                throw new Errors.InvalidRequestError('BTC HTLC redeem address must be same as recipient');
            }

            const outputScript = BitcoinJS.payments.p2wsh({
                // @ts-ignore Type 'Uint8Array' is not assignable to type 'Buffer'.
                witness: [BitcoinJS.Buffer.from(request.redeem.htlcScript)],
                network: BitcoinUtils.Network,
            }).output;

            if (!outputScript) {
                throw new Errors.InvalidRequestError('Cannot derive HTLC output script from BTC HTLC script');
            }

            redeem = {
                type: 'BTC',
                htlcDetails,
                htlcScript: request.redeem.htlcScript,
                transactionHash: Nimiq.BufferUtils.toHex(Nimiq.BufferUtils.fromAny(request.redeem.transactionHash)),
                outputIndex: this.parsePositiveInteger(request.redeem.outputIndex),
                outputScript,
            };
        }

        if (request.fund.type === 'EUR' && storedRequest.fund.type === 'EUR') {
            fund = {
                type: 'EUR',
                htlcDetails: {
                    hash: Nimiq.BufferUtils.toHex(Nimiq.BufferUtils.fromAny(request.fund.hash)),
                    timeoutTimestamp: this.parsePositiveInteger(request.fund.timeout, false, 'fund.timeout'),
                },
                htlcId: /** @type {string} */ (this.parseLabel(request.fund.htlcId, false, 'fund.htlcId')),
            };
        }

        // if (request.redeem.type === 'EUR' && storedRequest.redeem.type === 'EUR') {
        //     redeem = {
        //         type: 'EUR',
        //     };
        // }

        if (!fund || !redeem) {
            throw new Errors.InvalidRequestError('No funding or redeeming data');
        }

        /** @type {Parsed<KeyguardRequest.SignSwapTransactionsRequest>} */
        const parsedRequest = {
            swapId: request.swapId,
            fund,
            redeem,
        };

        // Verify hash is the same across HTLCs
        if (parsedRequest.fund.htlcDetails.hash !== parsedRequest.redeem.htlcDetails.hash) {
            throw new Errors.InvalidRequestError('HTLC hashes do not match');
        }

        // TODO: Validate timeouts of the two contracts
        // Currently not possible because the NIM timeout is a block height, while the BTC timeout is a timestamp.
        // And since we cannot trust the local device time to be accurate, and we don't have a reference for NIM blocks
        // and their timestamps, we cannot compare the two.
        // When it becomes possible to compare (with Nimiq 2.0 Albatross), the redeem HTLC must have a later timeout
        // than the funding HTLC.

        /** @type {KeyguardRequest.SignSwapTransactionsResult} */
        const result = {};

        if (parsedRequest.fund.type === 'NIM' && storedRequest.fund.type === 'NIM') {
            await loadNimiq();

            const privateKey = new Nimiq.PrivateKey(Nimiq.BufferUtils.fromHex(privateKeys.nim));
            const publicKey = Nimiq.PublicKey.derive(privateKey);

            const transaction = Nimiq.Transaction.fromPlain({
                ...storedRequest.fund.transaction.toPlain(),
                data: parsedRequest.fund.htlcData,
                // Must be the exact object reference, which gets lost with toPlain()
                recipient: Nimiq.Address.CONTRACT_CREATION,
            });

            const signature = Nimiq.Signature.create(privateKey, publicKey, transaction.serializeContent());

            /** @type {KeyguardRequest.SignatureResult} */
            result.nim = {
                publicKey: publicKey.serialize(),
                signature: signature.serialize(),
            };

            if (transaction.senderType === Nimiq.Account.Type.BASIC) {
                const feePerUnit = transaction.fee / transaction.serializedSize;
                const fee = Math.ceil(feePerUnit * 167); // 167 = NIM HTLC refunding tx size

                // Create refund transaction
                const refundTransaction = new Nimiq.ExtendedTransaction(
                    transaction.recipient, Nimiq.Account.Type.HTLC,
                    transaction.sender, Nimiq.Account.Type.BASIC,
                    transaction.value - fee, fee,
                    parsedRequest.fund.htlcDetails.timeoutBlockHeight,
                    Nimiq.Transaction.Flag.NONE,
                    new Uint8Array(0),
                );

                const refundSignature = Nimiq.Signature.create(
                    privateKey,
                    publicKey,
                    refundTransaction.serializeContent(),
                );
                const refundSignatureProof = Nimiq.SignatureProof.singleSig(publicKey, refundSignature);

                const proof = new Nimiq.SerialBuffer(1 + Nimiq.SignatureProof.SINGLE_SIG_SIZE);
                // FIXME: Use constant when HTLC is part of CoreJS web-offline build
                proof.writeUint8(3 /* Nimiq.HashedTimeLockedContract.ProofType.TIMEOUT_RESOLVE */);
                refundSignatureProof.serialize(proof);
                refundTransaction.proof = proof;

                result.refundTx = Nimiq.BufferUtils.toHex(refundTransaction.serialize());
            }
        }

        if (parsedRequest.fund.type === 'BTC' && storedRequest.fund.type === 'BTC') {
            const inputs = storedRequest.fund.inputs;

            // Sort inputs by tx hash ASC, then index ASC
            inputs.sort((a, b) => {
                if (a.hash !== b.hash) return a.hash < b.hash ? -1 : 1;
                return a.index - b.index;
            });

            // Construct outputs
            const outputs = [{
                address: parsedRequest.fund.htlcAddress,
                value: storedRequest.fund.recipientOutput.value,
            }];

            // Add change output
            if (storedRequest.fund.changeOutput) {
                // The address is set in SignSwap after password entry.
                outputs.push(/** @type {{address: string, value: number}} */ (storedRequest.fund.changeOutput));
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
            // Set locktime
            if (storedRequest.fund.locktime) {
                psbt.locktime = storedRequest.fund.locktime;
            }

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

            if (privateKeys.btc_refund && privateKeys.btc_refund.length === 64) {
                const sumInputs = storedRequest.fund.inputs.reduce((sum, input) => sum + input.witnessUtxo.value, 0);
                const sumOutputs = storedRequest.fund.recipientOutput.value + (storedRequest.fund.changeOutput
                    ? storedRequest.fund.changeOutput.value
                    : 0);
                const feePerUnit = (sumInputs - sumOutputs) / tx.weight();
                const fee = Math.ceil(feePerUnit * 540); // 540 = BTC HTLC refunding tx weight units

                const htlcAddress = parsedRequest.fund.htlcAddress;
                const htlcScript = /** @type {Buffer} */ (BitcoinJS.payments.p2wsh({
                    // @ts-ignore Type 'import("...").Buffer' is not assignable to type 'Buffer'.
                    witness: [BitcoinJS.Buffer.from(parsedRequest.fund.htlcScript, 'hex')],
                    network: BitcoinUtils.Network,
                }).output);

                // Construct refund transaction
                const refundPsbt = new BitcoinJS.Psbt({ network: BitcoinUtils.Network });

                // Add HTLC UTXO as input
                refundPsbt.addInput({
                    hash: tx.getId(),
                    index: outputs.findIndex(output => output.address === htlcAddress),
                    witnessUtxo: {
                        script: htlcScript,
                        value: storedRequest.fund.recipientOutput.value,
                    },
                    // @ts-ignore Type of type 'import("...").Buffer' is not assignable to type 'Buffer'.
                    witnessScript: BitcoinJS.Buffer.from(parsedRequest.fund.htlcScript),
                });

                // Add refund output
                refundPsbt.addOutput({
                    address: storedRequest.fund.refundAddress,
                    value: storedRequest.fund.recipientOutput.value - fee,
                });

                // The timeoutTimestamp we parse from the BTC HTLC script is forwarded one hour
                // (because the timeout in the script itself is set back one hour, because the BTC
                // network only accepts locktimes that are at least one hour old). So we need to
                // remove this added hour before using it as the transaction's locktime.
                refundPsbt.locktime = parsedRequest.fund.htlcDetails.timeoutTimestamp - (60 * 60) + 1;
                // Signal to use locktime, but to not opt into replace-by-fee
                refundPsbt.setInputSequence(0, 0xfffffffe);

                // Sign
                const refundKeyPair = BitcoinJS.ECPair.fromPrivateKey(
                    // @ts-ignore Argument of type 'import("...").Buffer' is not assignable to parameter of
                    //            type 'Buffer'.
                    BitcoinJS.Buffer.from(privateKeys.btc_refund, 'hex'),
                );
                refundPsbt.signInput(0, refundKeyPair);

                // Verify that all inputs are signed
                if (!refundPsbt.validateSignaturesOfAllInputs()) {
                    throw new Error('Invalid or missing signature(s) for BTC transaction.');
                }

                // Finalize (with custom logic for the HTLC)
                refundPsbt.finalizeInput(0, (inputIndex, input /* , script, isSegwit, isP2SH, isP2WSH */) => {
                    if (!input.partialSig) {
                        throw new Errors.KeyguardError('UNEXPECTED: Input does not have a partial signature');
                    }

                    if (!input.witnessScript) {
                        throw new Errors.KeyguardError('UNEXPECTED: Input does not have a witnessScript');
                    }

                    const witnessBytes = BitcoinJS.script.fromASM([
                        input.partialSig[0].signature.toString('hex'),
                        input.partialSig[0].pubkey.toString('hex'),
                        'OP_0', // OP_0 (false) activates the refund branch in the HTLC script
                        input.witnessScript.toString('hex'),
                    ].join(' '));

                    const witnessStack = BitcoinJS.script.toStack(witnessBytes);

                    return {
                        finalScriptSig: undefined,
                        finalScriptWitness: HtlcUtils.witnessStackToScriptWitness(witnessStack),
                    };
                });

                result.refundTx = refundPsbt.extractTransaction().toHex();
            }
        }

        if (parsedRequest.fund.type === 'EUR' && storedRequest.fund.type === 'EUR') {
            // Nothing to do for funding EUR
            result.eur = '';
        }

        if (parsedRequest.redeem.type === 'NIM' && storedRequest.redeem.type === 'NIM') {
            await loadNimiq();

            const privateKey = new Nimiq.PrivateKey(Nimiq.BufferUtils.fromHex(privateKeys.nim));
            const publicKey = Nimiq.PublicKey.derive(privateKey);

            const transaction = Nimiq.Transaction.fromPlain({
                ...storedRequest.redeem.transaction.toPlain(),
                sender: parsedRequest.redeem.htlcAddress,
            });

            const signature = Nimiq.Signature.create(privateKey, publicKey, transaction.serializeContent());

            /** @type {KeyguardRequest.SignatureResult} */
            result.nim = {
                publicKey: publicKey.serialize(),
                signature: signature.serialize(),
            };
        }

        if (parsedRequest.redeem.type === 'BTC' && storedRequest.redeem.type === 'BTC') {
            const inputs = [{
                hash: parsedRequest.redeem.transactionHash,
                index: parsedRequest.redeem.outputIndex,
                witnessUtxo: {
                    script: parsedRequest.redeem.outputScript,
                    value: storedRequest.redeem.input.witnessUtxo.value,
                },
                witnessScript: BitcoinJS.Buffer.from(parsedRequest.redeem.htlcScript),
            }];

            // The address is set in SignSwap after password entry.
            const output = /** @type {{address: string, value: number}} */ (storedRequest.redeem.output);

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
            psbt.signInput(0, keyPair);

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

        // if (parsedRequest.redeem.type === 'EUR' && storedRequest.redeem.type === 'EUR') {
        //     // TODO: Create and sign a JWS of the settlement instructions
        //     const jws = ...
        //
        //     result.eur = jws;
        // }

        return result;
    }
}
