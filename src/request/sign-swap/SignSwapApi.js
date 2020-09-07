/* global Nimiq */
/* global TopLevelApi */
/* global SignSwap */
/* global Errors */
/* global NodeBuffer */
/* global BitcoinJS */
/* global BitcoinUtils */

/** @extends {TopLevelApi<KeyguardRequest.SignSwapRequest>} */
class SignSwapApi extends TopLevelApi { // eslint-disable-line no-unused-vars
    /**
     * @param {KeyguardRequest.SignSwapRequest} request
     * @returns {Promise<Parsed<KeyguardRequest.SignSwapRequest>>}
     */
    async parseRequest(request) {
        if (!request) {
            throw new Errors.InvalidRequestError('request is required');
        }

        /** @type {Parsed<KeyguardRequest.SignSwapRequest>} */
        const parsedRequest = {};
        parsedRequest.appName = this.parseAppName(request.appName);
        parsedRequest.keyInfo = await this.parseKeyId(request.keyId);
        if (parsedRequest.keyInfo.type !== Nimiq.Secret.Type.ENTROPY) {
            throw new Errors.InvalidRequestError('Bitcoin is only supported with modern accounts.');
        }
        parsedRequest.keyLabel = this.parseLabel(request.keyLabel);

        if (request.fund.type === request.redeem.type) {
            throw new Errors.InvalidRequestError('Swap must be between two different currencies');
        }

        if (request.fund.type === 'NIM') {
            parsedRequest.fund = {
                type: 'NIM',
                keyPath: this.parsePath(request.fund.keyPath, 'keyPath'),
                transaction: this.parseTransaction({
                    ...request.fund,
                    flags: Nimiq.Transaction.Flag.CONTRACT_CREATION,
                    recipient: 'CONTRACT_CREATION',
                    recipientType: Nimiq.Account.Type.HTLC,
                }),
            };
        } else if (request.fund.type === 'BTC') {
            parsedRequest.fund = {
                type: 'BTC',
                inputs: this.parseInputs(request.fund.inputs),
                recipientOutput: /** @type {KeyguardRequest.BitcoinTransactionOutput} */ (
                    this.parseOutput(request.fund.recipientOutput, false, 'fund.recipientOutput')),
                changeOutput: this.parseChangeOutput(request.fund.changeOutput, true, 'fund.changeOutput'),
                // htlcScript: request.fund.htlcScript,
            };
        } else {
            throw new Errors.InvalidRequestError('Invalid funding type');
        }

        if (request.redeem.type === 'NIM') {
            parsedRequest.redeem = {
                type: 'NIM',
                keyPath: this.parsePath(request.redeem.keyPath, 'keyPath'),
                transaction: this.parseTransaction(request.redeem),
                // htlcData: request.redeem.htlcData,
            };
        } else if (request.redeem.type === 'BTC') {
            parsedRequest.redeem = {
                type: 'BTC',
                input: this.parseInputs([request.redeem.inputs[0]])[0],
                output: /** @type {KeyguardRequest.BitcoinTransactionChangeOutput} */ (
                    this.parseChangeOutput(request.redeem.changeOutput, false, 'redeem.changeOutput')),
            };
        } else {
            throw new Errors.InvalidRequestError('Invalid redeeming type');
        }

        // // eslint-disable-next-line no-nested-ternary
        // const btcHtlcData = this.parseBtcHtlcScript(parsedRequest.redeem.type === 'BTC'
        //     ? parsedRequest.redeem.input.witnessScript
        //     : parsedRequest.fund.type === 'BTC'
        //         ? parsedRequest.fund.htlcScript
        //         : undefined);

        // // eslint-disable-next-line no-nested-ternary
        // const nimHtlcData = this.parseNimHtlcData(parsedRequest.fund.type === 'NIM'
        //     ? parsedRequest.fund.transaction.data
        //     : parsedRequest.redeem.type === 'NIM'
        //         ? parsedRequest.redeem.htlcData
        //         : undefined);

        // // TODO: Verify HTLC contents
        // // - Verify refund address of fund HTLC is ours
        // // - Verify redeem address of redeem HTLC is ours
        // // - Verify hashRoot is the same across HTLCs
        // if (btcHtlcData.hash !== nimHtlcData.hash) throw new Errors.InvalidRequestError('HTLC hashes do not match');

        // TODO: Parse display data

        return parsedRequest;
    }

    /**
     * Parses that a currency info is valid.
     * @param {unknown} fiatCurrency
     * @returns {string | undefined}
     */
    parseFiatCurrency(fiatCurrency) {
        if (fiatCurrency === undefined) {
            return undefined;
        }

        // parse currency code
        if (typeof fiatCurrency !== 'string'
            || !/^[a-z]{3}$/i.test(fiatCurrency)) {
            throw new Errors.InvalidRequestError(`Invalid currency code ${fiatCurrency}`);
        }
        return fiatCurrency.toUpperCase();
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
            const script = NodeBuffer.Buffer.from(Nimiq.BufferUtils.fromAny(input.outputScript));

            /** @type {ParsedBitcoinTransactionInput} */
            const parsed = {
                hash: Nimiq.BufferUtils.toHex(Nimiq.BufferUtils.fromAny(input.transactionHash)),
                index:
                    /** @type {number} */
                    (this.parseNonNegativeFiniteNumber(input.outputIndex, false, `input[${index}].outputIndex`)),
                witnessUtxo: {
                    script,
                    value: Math.round(
                        /** @type {number} */
                        (this.parseNonNegativeFiniteNumber(input.value, false, `input[${index}].value`)),
                    ),
                },
                keyPath: this.parseBitcoinPath(input.keyPath, `input[${index}].keypath`),
                // Address added only for display
                // @ts-ignore Argument of type 'Uint8Array' is not assignable to parameter of type 'Buffer'.
                address: BitcoinJS.address.fromOutputScript(script, BitcoinUtils.Network),
            };
            if (input.witnessScript) {
                parsed.witnessScript = NodeBuffer.Buffer.from(Nimiq.BufferUtils.fromAny(input.witnessScript));
            }
            return parsed;
        });
    }

    /**
     * @param {unknown} script
     * @returns {{
     *  hash: string,
     *  redeemAddressBytes: string,
     *  timeout: number,
     *  refundAddressBytes: string,
     * }}
     */
    parseBtcHtlcScript(script) {
        const error = new Errors.InvalidRequestError('Invalid BTC HTLC script');

        if (!script || !(script instanceof Uint8Array) || !script.length) throw error;
        const chunks = BitcoinJS.script.decompile(/** @type {Buffer} */ (script));
        if (!chunks) throw error;
        const asm = BitcoinJS.script.toASM(chunks).split(' ');

        /* eslint-disable no-plusplus */
        let i = 0;

        // Start redeem branch
        if (asm[i] !== 'OP_IF') throw error;

        // Check secret size
        if (asm[++i] !== 'OP_SIZE' || asm[++i] !== (32).toString(16) || asm[++i] !== 'OP_EQUALVERIFY') throw error;

        // Check hash
        if (asm[++i] !== 'OP_SHA256' || asm[i + 2] !== 'OP_EQUALVERIFY') throw error;
        const hash = Nimiq.BufferUtils.toHex(Nimiq.BufferUtils.fromHex(asm[++i]).reverse());
        ++i;

        // Check redeem address
        if (asm[++i] !== 'OP_DUP' || asm[++i] !== 'OP_HASH160') throw error;
        const redeemAddressBytes = Nimiq.BufferUtils.toHex(Nimiq.BufferUtils.fromHex(asm[++i]).reverse());

        // End redeem branch, start refund branch
        if (asm[++i] !== 'OP_ELSE') {
            if (asm[i] !== 'OP_EQUALVERIFY' || asm[++i] !== 'OP_CHECKSIG' || asm[++i] !== 'OP_ELSE') throw error;
        }

        // Check timeout
        // @ts-ignore Argument of type 'Buffer' is not assignable to parameter of type 'Buffer'
        const timeout = BitcoinJS.script.number.decode(NodeBuffer.Buffer.from(asm[++i], 'hex'));
        if (asm[++i] !== 'OP_CHECKLOCKTIMEVERIFY' || asm[++i] !== 'OP_DROP') throw error;

        // Check refund address
        if (asm[++i] !== 'OP_DUP' || asm[++i] !== 'OP_HASH160') throw error;
        const refundAddressBytes = Nimiq.BufferUtils.toHex(Nimiq.BufferUtils.fromHex(asm[++i]).reverse());

        // End refund branch
        if (asm[++i] !== 'OP_ENDIF') {
            if (asm[i] !== 'OP_EQUALVERIFY' || asm[++i] !== 'OP_CHECKSIG' || asm[++i] !== 'OP_ENDIF') throw error;
        } else {
            // End contract
            // eslint-disable-next-line no-lonely-if
            if (asm[++i] !== 'OP_EQUALVERIFY' || asm[++i] !== 'OP_CHECKSIG') throw error;
        }

        if (asm.length !== ++i) throw error;
        /* eslint-enable no-plusplus */

        return {
            hash,
            redeemAddressBytes,
            timeout,
            refundAddressBytes,
        };
    }

    /**
     * @param {unknown} data
     * @returns {{
     *  refundAddress: string,
     *  redeemAddress: string,
     *  hash: string,
     *  timeout: number,
     * }}
     */
    parseNimHtlcData(data) {
        const error = new Errors.InvalidRequestError('Invalid NIM HTLC data');

        if (!data || !(data instanceof Uint8Array) || data.length !== 78) throw error;

        const plain = Nimiq.HashedTimeLockedContract.dataToPlain(data);

        if (!('sender' in plain) || !('recipient' in plain) || !('hashRoot' in plain) || !('timeout' in plain)) {
            throw error;
        }

        if (plain.hashAlgorithm !== 'sha256') throw error;
        if (plain.hashCount !== 1) throw error;

        return {
            refundAddress: plain.sender,
            redeemAddress: plain.recipient,
            hash: plain.hashRoot,
            timeout: plain.timeout,
        };
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
            label: this.parseLabel(/** @type {{label: unknown}} */ (output).label),
            value: Math.round(
                /** @type {number} */ (this.parseNonNegativeFiniteNumber(
                    /** @type {{value: unknown}} */ (output).value,
                    false,
                    `${parameterName}.value`,
                )),
            ),
        };
        return parsed;
    }

    /**
     * @param {unknown} output
     * @param {boolean} allowUndefined
     * @param {string} parameterName
     * @returns {KeyguardRequest.BitcoinTransactionChangeOutput | undefined}
     */
    parseChangeOutput(output, allowUndefined, parameterName) {
        if (output === undefined && allowUndefined) {
            return undefined;
        }

        if (!output || typeof output !== 'object') {
            throw new Error(`${parameterName} is not a valid output`);
        }

        /** @type {KeyguardRequest.BitcoinTransactionChangeOutput} */
        const parsed = {
            keyPath: this.parseBitcoinPath(
                /** @type {{keyPath: unknown}} */ (output).keyPath, `${parameterName}.keyPath`,
            ),
            address: /** @type {{address: unknown}} */ (output).address !== undefined
                ? this.parseBitcoinAddress(
                    /** @type {{address: unknown}} */ (output).address,
                    `${parameterName}.address`,
                )
                : undefined,
            value: Math.round(
                /** @type {number} */
                (this.parseNonNegativeFiniteNumber(
                    /** @type {{value: unknown}} */ (output).value,
                    false,
                    `${parameterName}.value`,
                )),
            ),
        };
        return parsed;
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

    get Handler() {
        return SignSwap;
    }
}
