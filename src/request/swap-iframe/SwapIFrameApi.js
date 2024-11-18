/* global BitcoinRequestParserMixin */
/* global RequestParser */
/* global Nimiq */
/* global loadNimiq */
/* global BitcoinJS */
/* global BitcoinUtils */
/* global HtlcUtils */
/* global Errors */
/* global Constants */
/* global Key */
/* global OasisSettlementInstructionUtils */
/* global NonPartitionedSessionStorage */
/* global Utf8Tools */
/* global ethers */
/* global CONFIG */
/* global PolygonContractABIs */
/* global OpenGSN */

class SwapIFrameApi extends BitcoinRequestParserMixin(RequestParser) { // eslint-disable-line no-unused-vars
    /**
     * @param {RpcState?} state
     * @param {KeyguardRequest.SignSwapTransactionsRequest} request
     * @returns {Promise<KeyguardRequest.SignSwapTransactionsResult>}
     */
    async signSwapTransactions(state, request) {
        const storageKey = Constants.SWAP_IFRAME_SESSION_STORAGE_KEY_PREFIX + request.swapId;

        const storedData = await NonPartitionedSessionStorage.get(
            storageKey,
            request.tmpCookieEncryptionKey,
        );
        NonPartitionedSessionStorage.delete(storageKey);

        if (!storedData) throw new Error('No swap stored in SessionStorage');
        if ('newEncryptionKey' in storedData) {
            // Top-level sessionStorage shouldn't ever have to be migrated over to CookieStorage in iframes, see
            // NonPartitionedSessionStorage.get, therefore we don't handle this case here.
            throw new Error('Unexpected: top-level sessionStorage got migrated in iframe.');
        }

        const storedDataJson = Utf8Tools.utf8ByteArrayToString(storedData);
        /** @type {{keys: {
         *     nim: string,
         *     btc: string[],
         *     usdc: string,
         *     usdt: string,
         *     eur: string,
         *     btc_refund?: string,
         * }, request: any}} */
        const { keys: privateKeys, request: storedRawRequest } = (JSON.parse(storedDataJson));

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

        if (request.fund.type === 'USDC_MATIC' || request.redeem.type === 'USDC_MATIC') {
            if (!privateKeys.usdc) throw new Error('No USDC key stored in SessionStorage');
            if (privateKeys.usdc.length !== 66) throw new Error('Invalid USDC key stored in SessionStorage');
        }

        if (request.fund.type === 'USDT_MATIC' || request.redeem.type === 'USDT_MATIC') {
            if (!privateKeys.usdt) throw new Error('No USDT key stored in SessionStorage');
            if (privateKeys.usdt.length !== 66) throw new Error('Invalid USDT key stored in SessionStorage');
        }

        if (request.redeem.type === 'EUR') {
            if (!privateKeys.eur) throw new Error('No EUR key stored in SessionStorage');
            if (privateKeys.eur.length !== 64) throw new Error('Invalid EUR key stored in SessionStorage');
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
        if (storedRawRequest.fund.type === 'USDC_MATIC') {
            const usdcHtlcContract = new ethers.Contract(
                CONFIG.NATIVE_USDC_HTLC_CONTRACT_ADDRESS,
                PolygonContractABIs.NATIVE_USDC_HTLC_CONTRACT_ABI,
            );

            storedRawRequest.fund.description = usdcHtlcContract.interface.parseTransaction({
                data: storedRawRequest.fund.request.data,
                value: storedRawRequest.fund.request.value,
            });
        }
        if (storedRawRequest.fund.type === 'USDT_MATIC') {
            const usdtHtlcContract = new ethers.Contract(
                CONFIG.BRIDGED_USDT_HTLC_CONTRACT_ADDRESS,
                PolygonContractABIs.BRIDGED_USDT_HTLC_CONTRACT_ABI,
            );

            storedRawRequest.fund.description = usdtHtlcContract.interface.parseTransaction({
                data: storedRawRequest.fund.request.data,
                value: storedRawRequest.fund.request.value,
            });
        }

        if (storedRawRequest.redeem.type === 'NIM') {
            storedRawRequest.redeem.transaction = Nimiq.Transaction.fromPlain(storedRawRequest.redeem.transaction);
        }
        if (storedRawRequest.redeem.type === 'USDC_MATIC') {
            const usdcHtlcContract = new ethers.Contract(
                CONFIG.NATIVE_USDC_HTLC_CONTRACT_ADDRESS,
                PolygonContractABIs.NATIVE_USDC_HTLC_CONTRACT_ABI,
            );

            storedRawRequest.redeem.description = usdcHtlcContract.interface.parseTransaction({
                data: storedRawRequest.redeem.request.data,
                value: storedRawRequest.redeem.request.value,
            });
        }
        if (storedRawRequest.redeem.type === 'USDT_MATIC') {
            const usdtHtlcContract = new ethers.Contract(
                CONFIG.BRIDGED_USDT_HTLC_CONTRACT_ADDRESS,
                PolygonContractABIs.BRIDGED_USDT_HTLC_CONTRACT_ABI,
            );

            storedRawRequest.redeem.description = usdtHtlcContract.interface.parseTransaction({
                data: storedRawRequest.redeem.request.data,
                value: storedRawRequest.redeem.request.value,
            });
        }

        /** @type {Parsed<KeyguardRequest.SignSwapRequest>} */
        const storedRequest = storedRawRequest;

        /** @type {Parsed<KeyguardRequest.SignSwapTransactionsRequest>["fund"] | undefined} */
        let fund;

        /** @type {Parsed<KeyguardRequest.SignSwapTransactionsRequest>["redeem"] | undefined} */
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

            redeem = {
                type: 'NIM',
                htlcDetails,
                htlcData: request.redeem.htlcData,
                htlcAddress: this.parseAddress(request.redeem.htlcAddress, 'redeem.htlcAddress', false)
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
                // @ts-expect-error Type 'Uint8Array' is not assignable to type 'Buffer'.
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
                // @ts-expect-error Type 'Uint8Array' is not assignable to type 'Buffer'.
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

        if (request.fund.type === 'USDC_MATIC' && storedRequest.fund.type === 'USDC_MATIC') {
            const usdcHtlcContract = new ethers.Contract(
                CONFIG.NATIVE_USDC_HTLC_CONTRACT_ADDRESS,
                PolygonContractABIs.NATIVE_USDC_HTLC_CONTRACT_ABI,
            );


            const description = /** @type {PolygonOpenDescription | PolygonOpenWithPermitDescription} */ (
                usdcHtlcContract.interface.parseTransaction({
                    data: request.fund.htlcData,
                    value: 0,
                })
            );

            // The htlcData given by Fastspot and forwarded here is always for the open() function, not for
            // openWithPermit(). The permit, if requested, is added below, from the stored request where
            // the user gave their authorization.
            if (description.name !== 'open') {
                throw new Errors.InvalidRequestError('Invalid method in HTLC data');
            }

            // Verify already known parts of the data
            if (description.args.token !== CONFIG.NATIVE_USDC_CONTRACT_ADDRESS) {
                throw new Errors.InvalidRequestError('Invalid USDC token contract in HTLC data');
            }

            if (!description.args.amount.eq(storedRequest.fund.description.args.amount)) {
                throw new Errors.InvalidRequestError('Invalid amount in HTLC data');
            }

            if (description.args.refundAddress !== storedRequest.fund.request.from) {
                throw new Errors.InvalidRequestError('USDC HTLC refund address must be same as sender');
            }

            fund = {
                type: 'USDC_MATIC',
                description,
            };
        }

        if (request.redeem.type === 'USDC_MATIC' && storedRequest.redeem.type === 'USDC_MATIC') {
            redeem = {
                type: 'USDC_MATIC',
                htlcId: `0x${Nimiq.BufferUtils.toHex(Nimiq.BufferUtils.fromAny(
                    request.redeem.htlcId.replace(/^0x/i, ''),
                ))}`,
                htlcDetails: {
                    hash: Nimiq.BufferUtils.toHex(Nimiq.BufferUtils.fromAny(request.redeem.hash)),
                    timeoutTimestamp: this.parsePositiveInteger(request.redeem.timeout, false, 'redeem.timeout'),
                },
            };
        }

        if (request.fund.type === 'USDT_MATIC' && storedRequest.fund.type === 'USDT_MATIC') {
            const usdtHtlcContract = new ethers.Contract(
                CONFIG.BRIDGED_USDT_HTLC_CONTRACT_ADDRESS,
                PolygonContractABIs.BRIDGED_USDT_HTLC_CONTRACT_ABI,
            );

            const description = /** @type {PolygonOpenDescription | PolygonOpenWithApprovalDescription} */ (
                usdtHtlcContract.interface.parseTransaction({
                    data: request.fund.htlcData,
                    value: 0,
                })
            );

            // The htlcData given by Fastspot and forwarded here is always for the open() function, not for
            // openWithPermit(). The permit, if requested, is added below, from the stored request where
            // the user gave their authorization.
            if (description.name !== 'open') {
                throw new Errors.InvalidRequestError('Invalid method in HTLC data');
            }

            // Verify already known parts of the data
            if (description.args.token !== CONFIG.BRIDGED_USDT_CONTRACT_ADDRESS) {
                throw new Errors.InvalidRequestError('Invalid USDT token contract in HTLC data');
            }

            if (!description.args.amount.eq(storedRequest.fund.description.args.amount)) {
                throw new Errors.InvalidRequestError('Invalid amount in HTLC data');
            }

            if (description.args.refundAddress !== storedRequest.fund.request.from) {
                throw new Errors.InvalidRequestError('USDT HTLC refund address must be same as sender');
            }

            fund = {
                type: 'USDT_MATIC',
                description,
            };
        }

        if (request.redeem.type === 'USDT_MATIC' && storedRequest.redeem.type === 'USDT_MATIC') {
            redeem = {
                type: 'USDT_MATIC',
                htlcId: `0x${Nimiq.BufferUtils.toHex(Nimiq.BufferUtils.fromAny(
                    request.redeem.htlcId.replace(/^0x/i, ''),
                ))}`,
                htlcDetails: {
                    hash: Nimiq.BufferUtils.toHex(Nimiq.BufferUtils.fromAny(request.redeem.hash)),
                    timeoutTimestamp: this.parsePositiveInteger(request.redeem.timeout, false, 'redeem.timeout'),
                },
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

        if (request.redeem.type === 'EUR' && storedRequest.redeem.type === 'EUR') {
            redeem = {
                type: 'EUR',
                htlcDetails: {
                    hash: Nimiq.BufferUtils.toHex(Nimiq.BufferUtils.fromAny(request.redeem.hash)),
                    timeoutTimestamp: this.parsePositiveInteger(request.redeem.timeout, false, 'redeem.timeout'),
                },
                htlcId: /** @type {string} */ (this.parseLabel(request.redeem.htlcId, false, 'redeem.htlcId')),
            };
        }

        if (!fund || !redeem) {
            throw new Errors.InvalidRequestError('No funding or redeeming data');
        }

        // Verify hash is the same across HTLCs
        const fundingHash = 'htlcDetails' in fund
            ? fund.htlcDetails.hash
            : fund.description.args.hash.substring(2);
        const redeemingHash = redeem.htlcDetails.hash;
        if (fundingHash !== redeemingHash) {
            throw new Errors.InvalidRequestError('HTLC hashes do not match');
        }

        // Validate timeouts of the two contracts
        // The redeem HTLC must have a later timeout than the funding HTLC.
        const fundingTimeout = 'htlcDetails' in fund
            ? fund.htlcDetails.timeoutTimestamp
            : fund.description.args.timeout.toNumber();
        const redeemingTimeout = redeem.htlcDetails.timeoutTimestamp;
        const diff = redeemingTimeout - fundingTimeout;

        // Validate that the difference is at least 15 minutes
        if (diff < 15 * 60) {
            throw new Errors.InvalidRequestError(
                'HTLC redeem timeout must be 15 min or more after the funding timeout',
            );
        }

        /** @type {Parsed<KeyguardRequest.SignSwapTransactionsRequest>} */
        const parsedRequest = {
            swapId: request.swapId,
            fund,
            redeem,
        };

        /** @type {KeyguardRequest.SignSwapTransactionsResult} */
        const result = {};

        if (parsedRequest.fund.type === 'NIM' && storedRequest.fund.type === 'NIM') {
            await loadNimiq();

            const privateKey = new Nimiq.PrivateKey(Nimiq.BufferUtils.fromHex(privateKeys.nim));
            const publicKey = Nimiq.PublicKey.derive(privateKey);

            let transaction = Nimiq.Transaction.fromPlain({
                ...storedRequest.fund.transaction.toPlain(),
                data: {
                    type: 'raw',
                    raw: Nimiq.BufferUtils.toHex(parsedRequest.fund.htlcData),
                },
                // This NULL-address as the recipient gets replaced below
                recipient: new Nimiq.Address(new Uint8Array(20)).toUserFriendlyAddress(),
            });
            // Calculate the contract address of the HTLC that gets created and recreate the transaction
            // with that address as the recipient:
            const contractAddress = new Nimiq.Address(Nimiq.BufferUtils.fromHex(transaction.hash()));
            transaction = new Nimiq.Transaction(
                transaction.sender, transaction.senderType, transaction.senderData,
                contractAddress, transaction.recipientType, transaction.data,
                transaction.value, transaction.fee,
                transaction.flags, transaction.validityStartHeight, transaction.networkId,
            );

            const signature = Nimiq.Signature.create(privateKey, publicKey, transaction.serializeContent());

            /** @type {KeyguardRequest.SignatureResult} */
            result.nim = {
                publicKey: publicKey.serialize(),
                signature: signature.serialize(),
            };

            if (transaction.senderType === Nimiq.AccountType.Basic) {
                const feePerUnit = Number(transaction.fee) / transaction.serializedSize;
                const fee = BigInt(Math.ceil(feePerUnit * 167)); // 167 = NIM HTLC refunding tx size

                // Create refund transaction
                const refundTransaction = new Nimiq.Transaction(
                    transaction.recipient, Nimiq.AccountType.HTLC, new Uint8Array(0),
                    transaction.sender, Nimiq.AccountType.Basic, new Uint8Array(0),
                    transaction.value - fee, fee,
                    0 /* Nimiq.Transaction.Flag.NONE */,
                    parsedRequest.fund.htlcDetails.timeoutTimestamp,
                    CONFIG.NIMIQ_NETWORK_ID,
                );

                const refundSignature = Nimiq.Signature.create(
                    privateKey,
                    publicKey,
                    refundTransaction.serializeContent(),
                );
                const refundSignatureProof = Nimiq.SignatureProof.singleSig(publicKey, refundSignature);

                const proof = new Nimiq.SerialBuffer(1 + Nimiq.SignatureProof.SINGLE_SIG_SIZE);
                proof.writeUint8(3 /* Nimiq.HashedTimeLockedContract.ProofType.TIMEOUT_RESOLVE */);
                proof.write(refundSignatureProof.serialize());
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
                if (!storedRequest.fund.changeOutput.address) {
                    throw new Errors.KeyguardError('Missing address in funding change output');
                }

                outputs.push(/** @type {{address: string, value: number}} */ (storedRequest.fund.changeOutput));
            }

            // Sort outputs by value ASC, then address ASC
            outputs.sort((a, b) => (a.value - b.value) || (a.address < b.address ? -1 : 1));

            // Construct transaction
            const psbt = new BitcoinJS.Psbt({ network: BitcoinUtils.Network });

            // Add inputs
            // @ts-expect-error Argument of type 'Uint8Array' is not assignable to parameter of type 'Buffer'.
            psbt.addInputs(inputs);
            // Add outputs
            psbt.addOutputs(outputs);
            // Set locktime
            if (storedRequest.fund.locktime) {
                psbt.locktime = storedRequest.fund.locktime;
            }

            // Sign
            const keyPairs = privateKeys.btc.map(privateKey => BitcoinJS.ECPair.fromPrivateKey(
                // @ts-expect-error Argument of type 'import("...").Buffer' is not assignable to type 'Buffer'.
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
                    // @ts-expect-error Type 'import("...").Buffer' is not assignable to type 'Buffer'.
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
                    // @ts-expect-error Type of type 'import("...").Buffer' is not assignable to type 'Buffer'.
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
                    // @ts-expect-error Argument of type 'import("...").Buffer' is not assignable to parameter of
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

        if (parsedRequest.fund.type === 'USDC_MATIC' && storedRequest.fund.type === 'USDC_MATIC') {
            const usdcHtlcContract = new ethers.Contract(
                CONFIG.NATIVE_USDC_HTLC_CONTRACT_ADDRESS,
                PolygonContractABIs.NATIVE_USDC_HTLC_CONTRACT_ABI,
            );

            // Place contract details into existing function call data
            storedRequest.fund.request.data = usdcHtlcContract.interface.encodeFunctionData(
                storedRequest.fund.description.name,
                [
                    /* bytes32 id */ parsedRequest.fund.description.args.id,
                    /* address token */ parsedRequest.fund.description.args.token,
                    /* uint256 amount */ parsedRequest.fund.description.args.amount,
                    /* address refundAddress */ parsedRequest.fund.description.args.refundAddress,
                    /* address recipientAddress */ parsedRequest.fund.description.args.recipientAddress,
                    /* bytes32 hash */ parsedRequest.fund.description.args.hash,
                    /* uint256 timeout */ parsedRequest.fund.description.args.timeout,

                    /* uint256 fee */ storedRequest.fund.description.args.fee,
                    ...(storedRequest.fund.description.name === 'openWithPermit' ? [
                        /* uint256 value */ storedRequest.fund.description.args.value,
                        /* bytes32 sigR */ storedRequest.fund.description.args.sigR,
                        /* bytes32 sigS */ storedRequest.fund.description.args.sigS,
                        /* uint8 sigV */ storedRequest.fund.description.args.sigV,
                    ] : []),
                ],
            );

            const typedData = new OpenGSN.TypedRequestData(
                CONFIG.POLYGON_CHAIN_ID,
                CONFIG.NATIVE_USDC_HTLC_CONTRACT_ADDRESS,
                {
                    request: storedRequest.fund.request,
                    relayData: storedRequest.fund.relayData,
                },
            );

            const { EIP712Domain, ...cleanedTypes } = typedData.types;

            const wallet = new ethers.Wallet(privateKeys.usdc);

            const signature = await wallet._signTypedData(
                typedData.domain,
                /** @type {Record<string, ethers.ethers.TypedDataField[]>} */ (/** @type {unknown} */ (cleanedTypes)),
                typedData.message,
            );

            result.usdc = {
                message: typedData.message,
                signature,
            };
        }

        if (parsedRequest.fund.type === 'USDT_MATIC' && storedRequest.fund.type === 'USDT_MATIC') {
            const usdtHtlcContract = new ethers.Contract(
                CONFIG.BRIDGED_USDT_HTLC_CONTRACT_ADDRESS,
                PolygonContractABIs.BRIDGED_USDT_HTLC_CONTRACT_ABI,
            );

            // Place contract details into existing function call data
            storedRequest.fund.request.data = usdtHtlcContract.interface.encodeFunctionData(
                storedRequest.fund.description.name,
                [
                    /* bytes32 id */ parsedRequest.fund.description.args.id,
                    /* address token */ parsedRequest.fund.description.args.token,
                    /* uint256 amount */ parsedRequest.fund.description.args.amount,
                    /* address refundAddress */ parsedRequest.fund.description.args.refundAddress,
                    /* address recipientAddress */ parsedRequest.fund.description.args.recipientAddress,
                    /* bytes32 hash */ parsedRequest.fund.description.args.hash,
                    /* uint256 timeout */ parsedRequest.fund.description.args.timeout,

                    /* uint256 fee */ storedRequest.fund.description.args.fee,
                    ...(storedRequest.fund.description.name === 'openWithApproval' ? [
                        /* uint256 approval */ storedRequest.fund.description.args.approval,
                        /* bytes32 sigR */ storedRequest.fund.description.args.sigR,
                        /* bytes32 sigS */ storedRequest.fund.description.args.sigS,
                        /* uint8 sigV */ storedRequest.fund.description.args.sigV,
                    ] : []),
                ],
            );

            const typedData = new OpenGSN.TypedRequestData(
                CONFIG.POLYGON_CHAIN_ID,
                CONFIG.BRIDGED_USDT_HTLC_CONTRACT_ADDRESS,
                {
                    request: storedRequest.fund.request,
                    relayData: storedRequest.fund.relayData,
                },
            );

            const { EIP712Domain, ...cleanedTypes } = typedData.types;

            const wallet = new ethers.Wallet(privateKeys.usdt);

            const signature = await wallet._signTypedData(
                typedData.domain,
                /** @type {Record<string, ethers.ethers.TypedDataField[]>} */ (/** @type {unknown} */ (cleanedTypes)),
                typedData.message,
            );

            result.usdt = {
                message: typedData.message,
                signature,
            };
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
            if (!storedRequest.redeem.output.address) {
                throw new Errors.KeyguardError('Missing address in redeem output');
            }
            const output = /** @type {{address: string, value: number}} */ (storedRequest.redeem.output);

            // Construct transaction
            const psbt = new BitcoinJS.Psbt({ network: BitcoinUtils.Network });

            // Add inputs
            // @ts-expect-error Argument of type 'Uint8Array' is not assignable to parameter of type 'Buffer'.
            psbt.addInputs(inputs);
            // Add outputs
            psbt.addOutput(output);

            // Sign
            const keyPair = BitcoinJS.ECPair.fromPrivateKey(
                // @ts-expect-error Argument of type 'import("...").Buffer' is not assignable to type 'Buffer'.
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

        if (parsedRequest.redeem.type === 'USDC_MATIC' && storedRequest.redeem.type === 'USDC_MATIC') {
            const usdcHtlcContract = new ethers.Contract(
                CONFIG.NATIVE_USDC_HTLC_CONTRACT_ADDRESS,
                PolygonContractABIs.NATIVE_USDC_HTLC_CONTRACT_ABI,
            );

            // Place contract details into existing function call data
            storedRequest.redeem.request.data = usdcHtlcContract.interface.encodeFunctionData(
                storedRequest.redeem.description.name,
                [
                    /* bytes32 id */ parsedRequest.redeem.htlcId,
                    /* address target */ storedRequest.redeem.description.args.target,
                    ...(storedRequest.redeem.description.name === 'redeem' ? [
                        /* bytes32 secret */ storedRequest.redeem.description.args.secret,
                    ] : []),
                    /* uint256 fee */ storedRequest.redeem.description.args.fee,
                ],
            );

            const typedData = new OpenGSN.TypedRequestData(
                CONFIG.POLYGON_CHAIN_ID,
                CONFIG.NATIVE_USDC_HTLC_CONTRACT_ADDRESS,
                {
                    request: storedRequest.redeem.request,
                    relayData: storedRequest.redeem.relayData,
                },
            );

            const { EIP712Domain, ...cleanedTypes } = typedData.types;

            const wallet = new ethers.Wallet(privateKeys.usdc);

            const signature = await wallet._signTypedData(
                typedData.domain,
                /** @type {Record<string, ethers.ethers.TypedDataField[]>} */ (/** @type {unknown} */ (cleanedTypes)),
                typedData.message,
            );

            result.usdc = {
                message: typedData.message,
                signature,
            };
        }

        if (parsedRequest.redeem.type === 'USDT_MATIC' && storedRequest.redeem.type === 'USDT_MATIC') {
            const usdtHtlcContract = new ethers.Contract(
                CONFIG.BRIDGED_USDT_HTLC_CONTRACT_ADDRESS,
                PolygonContractABIs.BRIDGED_USDT_HTLC_CONTRACT_ABI,
            );

            // Place contract details into existing function call data
            storedRequest.redeem.request.data = usdtHtlcContract.interface.encodeFunctionData(
                storedRequest.redeem.description.name,
                [
                    /* bytes32 id */ parsedRequest.redeem.htlcId,
                    /* address target */ storedRequest.redeem.description.args.target,
                    ...(storedRequest.redeem.description.name === 'redeem' ? [
                        /* bytes32 secret */ storedRequest.redeem.description.args.secret,
                    ] : []),
                    /* uint256 fee */ storedRequest.redeem.description.args.fee,
                ],
            );

            const typedData = new OpenGSN.TypedRequestData(
                CONFIG.POLYGON_CHAIN_ID,
                CONFIG.BRIDGED_USDT_HTLC_CONTRACT_ADDRESS,
                {
                    request: storedRequest.redeem.request,
                    relayData: storedRequest.redeem.relayData,
                },
            );

            const { EIP712Domain, ...cleanedTypes } = typedData.types;

            const wallet = new ethers.Wallet(privateKeys.usdt);

            const signature = await wallet._signTypedData(
                typedData.domain,
                /** @type {Record<string, ethers.ethers.TypedDataField[]>} */ (/** @type {unknown} */ (cleanedTypes)),
                typedData.message,
            );

            result.usdt = {
                message: typedData.message,
                signature,
            };
        }

        if (parsedRequest.redeem.type === 'EUR' && storedRequest.redeem.type === 'EUR') {
            await loadNimiq();

            // Create and sign a JWS of the settlement instructions
            const privateKey = new Nimiq.PrivateKey(Nimiq.BufferUtils.fromHex(privateKeys.eur));
            const key = new Key(privateKey);

            /** @type {KeyguardRequest.SettlementInstruction} */
            const settlement = {
                ...storedRequest.redeem.settlement,
                contractId: parsedRequest.redeem.htlcId,
            };

            if (settlement.type === 'sepa') {
                // Remove spaces from IBAN
                settlement.recipient.iban = settlement.recipient.iban.replace(/\s/g, '');
            }

            result.eur = OasisSettlementInstructionUtils.signSettlementInstruction(key, 'm', settlement);
        }

        return result;
    }
}
