/* global Nimiq */
/* global TopLevelApi */
/* global SignSwap */
/* global Errors */
/* global NodeBuffer */
/* global BitcoinJS */
/* global BitcoinUtils */
/* global HtlcUtils */

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
                refundKeyPath: this.parseBitcoinPath(request.fund.refundKeyPath, 'fund.refundKeyPath'),
            };
        } else {
            throw new Errors.InvalidRequestError('Invalid funding type');
        }

        if (request.redeem.type === 'NIM') {
            parsedRequest.redeem = {
                type: 'NIM',
                keyPath: this.parsePath(request.redeem.keyPath, 'keyPath'),
                transaction: this.parseTransaction(request.redeem),
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

        // Decode HTLC contents

        // eslint-disable-next-line no-nested-ternary
        parsedRequest.nimHtlc = HtlcUtils.decodeNimHtlcData(parsedRequest.fund.type === 'NIM'
            ? parsedRequest.fund.transaction.data
            : request.redeem.type === 'NIM' // Additional condition required for type safety
                ? request.redeem.htlcData
                : undefined);

        // eslint-disable-next-line no-nested-ternary
        parsedRequest.btcHtlc = HtlcUtils.decodeBtcHtlcScript(parsedRequest.redeem.type === 'BTC'
            ? parsedRequest.redeem.input.witnessScript
            : request.fund.type === 'BTC' // Additional condition required for type safety
                ? NodeBuffer.Buffer.from(Nimiq.BufferUtils.fromAny(request.fund.htlcScript))
                : undefined);

        // Verify HTLC contents

        // Verify hashRoot is the same across HTLCs
        if (parsedRequest.btcHtlc.hash !== parsedRequest.nimHtlc.hash) {
            throw new Errors.InvalidRequestError('HTLC hashes do not match');
        }

        if (parsedRequest.fund.type === 'BTC' && request.fund.type === 'BTC') {
            // Verify BTC HTLC address is correct from HTLC script
            const givenAddress = parsedRequest.fund.recipientOutput.address;
            const scriptAddress = BitcoinJS.payments.p2wsh({
                // @ts-ignore Type 'Uint8Array' is not assignable to type 'Buffer'.
                witness: [NodeBuffer.Buffer.from(request.fund.htlcScript)],
                network: BitcoinUtils.Network,
            }).address;

            if (givenAddress !== scriptAddress) {
                throw new Errors.InvalidRequestError('BTC output address does not match HTLC script');
            }
        }

        // For BTC redeem transactions, the BitcoinJS lib validates that the output script of the input matches
        // the witnessScript.

        // Funding HTLC refund address and redeeming HTLC redeem address are validated in SignSwap.js,
        // after the password was entered, before signing.

        // TODO: Validate timeouts of the two contracts
        // (Currently not possible because the NIM timeout is a block height, while the BTC timeout is a timestamp.
        // And since we cannot trust the local device time to be accurate, and we don't have a reference for NIM blocks
        // and their timestamps, we cannot compare the two.)
        // When it becomes possible to compare (with Nimiq 2.0 Albatross), the redeem HTLC must have a higher timeout
        // than the funding HTLC.

        // Parse display data
        parsedRequest.fiatCurrency = /** @type {string} */ (this.parseFiatCurrency(request.fiatCurrency, false));
        parsedRequest.nimFiatRate = /** @type {number} */ (
            this.parseNonNegativeFiniteNumber(request.nimFiatRate, false, 'nimFiatRate'));
        parsedRequest.btcFiatRate = /** @type {number} */ (
            this.parseNonNegativeFiniteNumber(request.btcFiatRate, false, 'btcFiatRate'));
        parsedRequest.serviceNetworkFee = /** @type {number} */ (
            this.parsePositiveInteger(request.serviceNetworkFee, true, 'serviceNetworkFee'));
        parsedRequest.serviceExchangeFee = /** @type {number} */ (
            this.parsePositiveInteger(request.serviceExchangeFee, true, 'serviceExchangeFee'));

        parsedRequest.nimiqAddresses = request.nimiqAddresses.map((address, index) => ({
            address: Nimiq.Address.fromAny(address.address).toUserFriendlyAddress(),
            label: /** @type {string} */ (this.parseLabel(address.label, false)),
            balance: this.parsePositiveInteger(address.balance, true, `nimiqAddresses[${index}].balance`),
        }));
        parsedRequest.bitcoinAccount = {
            balance: this.parsePositiveInteger(request.bitcoinAccount.balance, true, 'bitcoinAccount.balance'),
        };

        const nimAddress = parsedRequest.fund.type === 'NIM' // eslint-disable-line no-nested-ternary
            ? parsedRequest.fund.transaction.sender.toUserFriendlyAddress()
            : parsedRequest.redeem.type === 'NIM'
                ? parsedRequest.redeem.transaction.recipient.toUserFriendlyAddress()
                : ''; // Should never happen, if parsing works correctly
        if (!parsedRequest.nimiqAddresses.some(addressInfo => addressInfo.address === nimAddress)) {
            throw new Errors.InvalidRequestError(
                'The address details of the NIM address doing the swap must be provided',
            );
        }

        return parsedRequest;
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
                index: this.parsePositiveInteger(input.outputIndex, true, `input[${index}].outputIndex`),
                witnessUtxo: {
                    script,
                    value: this.parsePositiveInteger(input.value, false, `input[${index}].value`),
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
            value: this.parsePositiveInteger(
                /** @type {{value: unknown}} */ (output).value,
                false,
                `${parameterName}.value`,
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
            value: this.parsePositiveInteger(
                /** @type {{value: unknown}} */ (output).value,
                false,
                `${parameterName}.value`,
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
