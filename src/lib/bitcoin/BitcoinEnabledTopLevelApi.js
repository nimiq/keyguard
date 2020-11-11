/* global TopLevelApi */
/* global Nimiq */
/* global Errors */
/* global BitcoinJS */
/* global BitcoinUtils */

/**
 * A common parent class for Bitcoin-enabled pop-up requests.
 *
 * @abstract
 * @template {KeyguardRequest.RedirectRequest} T
 * @extends {TopLevelApi<T>}
 */
class BitcoinEnabledTopLevelApi extends TopLevelApi { // eslint-disable-line no-unused-vars
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
}
