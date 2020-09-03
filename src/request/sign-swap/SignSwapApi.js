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
                recipientOutput: /** @type {KeyguardRequest.BitcoinTransactionOutput} */ (
                    this.parseOutput(request.redeem.recipientOutput, false, 'redeem.recipientOutput')),
            };
        } else {
            throw new Errors.InvalidRequestError('Invalid redeeming type');
        }

        // TODO: Verify HTLC contents
        // - Verify refund address of fund HTLC is ours
        // - Verify redeem address of redeem HTLC is ours
        // - Verify hashRoot is the same across HTLCs

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
            const witnessScript = input.witnessScript
                ? NodeBuffer.Buffer.from(Nimiq.BufferUtils.fromAny(input.witnessScript))
                : undefined;

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
                witnessScript,
                keyPath: this.parseBitcoinPath(input.keyPath, `input[${index}].keypath`),
                // Address added only for display
                // @ts-ignore Argument of type 'Uint8Array' is not assignable to parameter of type 'Buffer'.
                address: BitcoinJS.address.fromOutputScript(script, BitcoinUtils.Network),
            };
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
