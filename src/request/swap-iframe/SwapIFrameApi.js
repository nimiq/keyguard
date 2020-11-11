/* global BitcoinRequestParserMixin */
/* global RequestParser */
/* global Nimiq */
/* global loadNimiq */
/* global BitcoinJS */
/* global BitcoinUtils */
/* global HtlcUtils */
/* global Errors */

class SwapIFrameApi extends BitcoinRequestParserMixin(RequestParser) {
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

        if (!privateKeys.nim) throw new Error('No NIM key stored in SessionStorage');
        if (privateKeys.nim.length !== 64) throw new Error('Invalid NIM key stored in SessionStorage');
        if (!privateKeys.btc) throw new Error('No BTC key list stored in SessionStorage');
        if (!privateKeys.btc.length) throw new Error('No BTC keys stored in SessionStorage');
        if (privateKeys.btc.some(key => !key)) throw new Error('Empty BTC key stored in SessionStorage');
        if (privateKeys.btc.some(key => key.length !== 64)) throw new Error('Invalid BTC key stored in SessionStorage');

        // Decode HTLC contents

        // // eslint-disable-next-line no-nested-ternary
        // parsedRequest.nimHtlc = HtlcUtils.decodeNimHtlcData(parsedRequest.fund.type === 'NIM'
        //     ? parsedRequest.fund.transaction.data
        //     : request.redeem.type === 'NIM' // Additional condition required for type safety
        //         ? request.redeem.htlcData
        //         : undefined);

        // // eslint-disable-next-line no-nested-ternary
        // parsedRequest.btcHtlc = HtlcUtils.decodeBtcHtlcScript(parsedRequest.redeem.type === 'BTC'
        //     ? parsedRequest.redeem.input.witnessScript
        //     : request.fund.type === 'BTC' // Additional condition required for type safety
        //         ? BitcoinJS.Buffer.from(Nimiq.BufferUtils.fromAny(request.fund.htlcScript))
        //         : undefined);

        // Verify HTLC contents

        // Verify hashRoot is the same across HTLCs
        // if (parsedRequest.btcHtlc.hash !== parsedRequest.nimHtlc.hash) {
        //     throw new Errors.InvalidRequestError('HTLC hashes do not match');
        // }

        // if (parsedRequest.fund.type === 'BTC' && request.fund.type === 'BTC') {
        //     // Verify BTC HTLC address is correct from HTLC script
        //     const givenAddress = parsedRequest.fund.recipientOutput.address;
        //     const scriptAddress = BitcoinJS.payments.p2wsh({
        //         // @ts-ignore Type 'Uint8Array' is not assignable to type 'Buffer'.
        //         witness: [BitcoinJS.Buffer.from(request.fund.htlcScript)],
        //         network: BitcoinUtils.Network,
        //     }).address;

        //     if (givenAddress !== scriptAddress) {
        //         throw new Errors.InvalidRequestError('BTC output address does not match HTLC script');
        //     }
        // }

        // if (parsedRequest.fund.type === 'NIM') {
        //     // Check that validityStartHeight is before HTLC timeout
        //     if (parsedRequest.fund.transaction.validityStartHeight >= parsedRequest.nimHtlc.timeoutBlockHeight) {
        //         throw new Errors.InvalidRequestError(
        //             'Fund validityStartHeight must be lower than HTLC timeout block height',
        //         );
        //     }
        // }

        // if (parsedRequest.redeem.type === 'NIM') {
        //     // Check that validityStartHeight is before HTLC timeout
        //     if (parsedRequest.redeem.transaction.validityStartHeight >= parsedRequest.nimHtlc.timeoutBlockHeight) {
        //         throw new Errors.InvalidRequestError(
        //             'Redeem validityStartHeight must be lower than HTLC timeout block height',
        //         );
        //     }
        // }

        // For BTC redeem transactions, the BitcoinJS lib validates that the output script of the input matches
        // the witnessScript.

        // TODO: Validate timeouts of the two contracts
        // (Currently not possible because the NIM timeout is a block height, while the BTC timeout is a timestamp.
        // And since we cannot trust the local device time to be accurate, and we don't have a reference for NIM blocks
        // and their timestamps, we cannot compare the two.)
        // When it becomes possible to compare (with Nimiq 2.0 Albatross), the redeem HTLC must have a higher timeout
        // than the funding HTLC.

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
            const inputs = this.parseInputs(request.fund.inputs.map(input => ({
                ...input,
                // Dummy keyPath so the parsing doesn't fail.
                // The keyPath is not used in the iframe, as the key at the path was already derived
                // (and stored) in the top-level sign-swap request.
                keyPath: 'm/84\'/0',
            })));

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
            const inputs = this.parseInputs(request.redeem.inputs.map(input => ({
                ...input,
                // Dummy keyPath so the parsing doesn't fail.
                // The keyPath is not used in the iframe, as the key at the path was already derived
                // (and stored) in the top-level sign-swap request.
                keyPath: 'm/84\'/0',
            })));

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

        return result;
    }
}

SwapIFrameApi.SESSION_STORAGE_KEY_PREFIX = 'swap_id_';
