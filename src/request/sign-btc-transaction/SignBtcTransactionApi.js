/* global Nimiq */
/* global I18n */
/* global TopLevelApi */
/* global SignBtcTransaction */
/* global Errors */
/* global BitcoinJS */
/* global BitcoinUtils */

/** @extends {TopLevelApi<KeyguardRequest.SignBtcTransactionRequest>} */
class SignBtcTransactionApi extends TopLevelApi {
    /**
     * @param {KeyguardRequest.SignBtcTransactionRequest} request
     * @returns {Promise<Parsed<KeyguardRequest.SignBtcTransactionRequest>>}
     */
    async parseRequest(request) {
        if (!request) {
            throw new Errors.InvalidRequestError('request is required');
        }

        /** @type {Parsed<KeyguardRequest.SignBtcTransactionRequest>} */
        const parsedRequest = {};
        parsedRequest.appName = this.parseAppName(request.appName);
        parsedRequest.keyInfo = await this.parseKeyId(request.keyId);
        parsedRequest.keyLabel = this.parseLabel(request.keyLabel);
        parsedRequest.senderLabel = this.parseLabel(request.senderLabel);
        parsedRequest.inputs = this.parseInputs(request.inputs);
        parsedRequest.recipientOutput = /** @type {KeyguardRequest.BitcoinTransactionOutput} */ (
            this.parseOutput(request.recipientOutput, false, 'recipientOutput'));
        parsedRequest.changeOutput = this.parseOutput(request.changeOutput, true, 'changeOutput');
        parsedRequest.layout = this.parseLayout(request.layout);
        if ((!request.layout || request.layout === SignBtcTransactionApi.Layouts.STANDARD)
            && parsedRequest.layout === SignBtcTransactionApi.Layouts.STANDARD) {
            parsedRequest.recipientLabel = this.parseLabel(request.recipientLabel);
        } else if (request.layout === SignBtcTransactionApi.Layouts.CHECKOUT
            && parsedRequest.layout === SignBtcTransactionApi.Layouts.CHECKOUT) {
            parsedRequest.shopOrigin = this.parseShopOrigin(request.shopOrigin);
            parsedRequest.shopLogoUrl = this.parseShopLogoUrl(request.shopLogoUrl);
            if (parsedRequest.shopLogoUrl && parsedRequest.shopLogoUrl.origin !== parsedRequest.shopOrigin) {
                throw new Errors.InvalidRequestError('origin of shopLogoUrl must be same as shopOrigin');
            }

            parsedRequest.fiatAmount = this.parseNonNegativeFiniteNumber(request.fiatAmount);
            parsedRequest.fiatCurrency = this.parseFiatCurrency(request.fiatCurrency);
            if ((parsedRequest.fiatAmount === undefined) !== (parsedRequest.fiatCurrency === undefined)) {
                throw new Errors.InvalidRequestError('fiatAmount and fiatCurrency must be both defined or undefined.');
            }

            parsedRequest.vendorMarkup = this.parseVendorMarkup(request.vendorMarkup);

            parsedRequest.time = this.parseNonNegativeFiniteNumber(request.time);
            parsedRequest.expires = this.parseNonNegativeFiniteNumber(request.expires);
            if (parsedRequest.expires !== undefined) {
                if (parsedRequest.time === undefined) {
                    throw new Errors.InvalidRequestError('If `expires` is given, `time` must be given too.');
                } else if (parsedRequest.time >= parsedRequest.expires) {
                    throw new Errors.InvalidRequestError('`expires` must be greater than `time`');
                }
            }
        }

        return parsedRequest;
    }

    /**
     * Checks that the given layout is valid
     * @param {unknown} layout
     * @returns {KeyguardRequest.SignBtcTransactionRequestLayout}
     */
    parseLayout(layout) {
        if (!layout) {
            return SignBtcTransactionApi.Layouts.STANDARD;
        }
        // @ts-ignore (Property 'values' does not exist on type 'ObjectConstructor'.)
        if (Object.values(SignBtcTransactionApi.Layouts).indexOf(layout) === -1) {
            throw new Errors.InvalidRequestError('Invalid selected layout');
        }
        return /** @type KeyguardRequest.SignTransactionRequestLayout */ (layout);
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
     * @param {any} inputs
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
            const script = new Uint8Array(Nimiq.BufferUtils.fromAny(input.outputScript));
            return {
                hash: Nimiq.BufferUtils.toHex(Nimiq.BufferUtils.fromAny(input.txHash)),
                index:
                    /** @type {number} */
                    (this.parseNonNegativeFiniteNumber(input.outputIndex, false, `input[${index}].outputIndex`)),
                witnessUtxo: {
                    script,
                    value:
                        /** @type {number} */
                        (this.parseNonNegativeFiniteNumber(input.value, false, `input[${index}].value`)),
                },
                keyPath: this.parseBitcoinPath(input.keyPath, `input[${index}].keypath`),
                // Address added only for display
                // @ts-ignore Argument of type 'Uint8Array' is not assignable to parameter of type 'Buffer'.
                address: BitcoinJS.address.fromOutputScript(script, BitcoinUtils.Network),
            };
        });
    }

    /**
     * @param {any} path
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
     * @param {any} output
     * @param {boolean} allowUndefined
     * @param {string} parameterName
     * @returns {KeyguardRequest.BitcoinTransactionOutput | undefined}
     */
    parseOutput(output, allowUndefined, parameterName) {
        if (output === undefined && allowUndefined) {
            return undefined;
        }

        return {
            address: this.parseBitcoinAddress(output.address, `${parameterName}.address`),
            value:
                /** @type {number} */
                (this.parseNonNegativeFiniteNumber(output.value, false, `${parameterName}.value`)),
        };
    }

    /**
     * @param {any} address
     * @param {string} parameterName
     * @returns {string}
     */
    parseBitcoinAddress(address, parameterName) {
        if (!BitcoinUtils.validateAddress(address)) {
            throw new Errors.InvalidRequestError(`${parameterName} is not a valid Bitcoin address`);
        }
        return address;
    }

    /**
     * Parses that a value is a valid vendor markup.
     * @param {unknown} value
     * @returns {number | undefined}
     */
    parseVendorMarkup(value) {
        if (value === undefined) {
            return undefined;
        }
        if (typeof value !== 'number' || value <= -1 || !Number.isFinite(value)) {
            throw new Errors.InvalidRequestError('Vendor markup must be a finite number > -1.');
        }
        return value;
    }

    get Handler() {
        return SignBtcTransaction;
    }

    /**
     * @param {Parsed<KeyguardRequest.SignBtcTransactionRequest>} parsedRequest
     */
    async onBeforeRun(parsedRequest) {
        if (parsedRequest.layout === SignBtcTransactionApi.Layouts.CHECKOUT) {
            this.setGlobalCloseButtonText(I18n.translatePhrase('sign-tx-cancel-payment'));
        }
    }
}

/**
 * @enum {KeyguardRequest.SignBtcTransactionRequestLayout}
 * @readonly
 */
SignBtcTransactionApi.Layouts = {
    STANDARD: /** @type {'standard'} */ ('standard'),
    CHECKOUT: /** @type {'checkout'} */ ('checkout'),
};
