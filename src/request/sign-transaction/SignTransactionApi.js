/* global I18n */
/* global TopLevelApi */
/* global SignTransaction */
/* global Errors */

/** @extends {TopLevelApi<KeyguardRequest.SignTransactionRequest>} */
class SignTransactionApi extends TopLevelApi {
    /**
     * @param {KeyguardRequest.SignTransactionRequest} request
     * @returns {Promise<Parsed<KeyguardRequest.SignTransactionRequest>>}
     */
    async parseRequest(request) {
        if (!request) {
            throw new Errors.InvalidRequestError('request is required');
        }

        const parsedRequest = {};
        parsedRequest.appName = this.parseAppName(request.appName);
        parsedRequest.keyInfo = await this.parseKeyId(request.keyId);
        parsedRequest.keyLabel = this.parseLabel(request.keyLabel);
        parsedRequest.keyPath = this.parsePath(request.keyPath, 'keyPath');
        parsedRequest.senderLabel = this.parseLabel(request.senderLabel);
        parsedRequest.recipientLabel = this.parseLabel(request.recipientLabel);
        parsedRequest.transaction = this.parseTransaction(request);
        parsedRequest.layout = this.parseLayout(request.layout);
        if (parsedRequest.layout === SignTransactionApi.Layouts.CHECKOUT) {
            parsedRequest.shopOrigin = this.parseShopOrigin(request.shopOrigin);
            parsedRequest.shopLogoUrl = this.parseShopLogoUrl(request.shopLogoUrl);
            if (parsedRequest.shopLogoUrl && parsedRequest.shopLogoUrl.origin !== parsedRequest.shopOrigin) {
                throw new Errors.InvalidRequestError('origin of shopLogoUrl must be same as referrer');
            }

            parsedRequest.fiatAmount = this.parseNonNegativeFiniteNumber(request.fiatAmount);
            parsedRequest.fiatCurrency = this.parseFiatCurrency(request.fiatCurrency);
            if ((parsedRequest.fiatAmount === undefined) !== (parsedRequest.fiatCurrency === undefined)) {
                throw new Errors.InvalidRequestError('fiatAmount and fiatCurrency must be both defined or undefined.');
            }

            parsedRequest.time = this.parseNonNegativeFiniteNumber(request.time);
            parsedRequest.expires = this.parseNonNegativeFiniteNumber(request.expires);
            if (parsedRequest.expires !== undefined) {
                if (parsedRequest.time === undefined) {
                    throw new Errors.InvalidRequestError('If `expires` is defined `time` must be defined too.');
                } else if (parsedRequest.time >= parsedRequest.expires) {
                    throw new Errors.InvalidRequestError('`expires` must be greater than `time`');
                }
            }
        } else {
            parsedRequest.shopOrigin = undefined;
        }

        return parsedRequest;
    }

    /**
     * Checks that the given layout is valid
     * @param {any} layout
     * @returns {KeyguardRequest.SignTransactionRequestLayout}
     */
    parseLayout(layout) {
        if (!layout) {
            return SignTransactionApi.Layouts.STANDARD;
        }
        // @ts-ignore (Property 'values' does not exist on type 'ObjectConstructor'.)
        if (Object.values(SignTransactionApi.Layouts).indexOf(layout) === -1) {
            throw new Errors.InvalidRequestError('Invalid selected layout');
        }
        return layout;
    }

    /**
     * Parses that a currency info is valid.
     * @param {any} fiatCurrency
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

    get Handler() {
        return SignTransaction;
    }

    /**
     * @param {Parsed<KeyguardRequest.SignTransactionRequest>} parsedRequest
     */
    async onBeforeRun(parsedRequest) {
        if (parsedRequest.layout === SignTransactionApi.Layouts.CHECKOUT) {
            this.setGlobalCloseButtonText(I18n.translatePhrase('sign-tx-cancel-payment'));
        }
    }
}

/** @enum {KeyguardRequest.SignTransactionRequestLayout} */
SignTransactionApi.Layouts = {
    STANDARD: /** @type {'standard'} */ ('standard'),
    CHECKOUT: /** @type {'checkout'} */ ('checkout'),
    CASHLINK: /** @type {'cashlink'} */ ('cashlink'),
};
