/* global I18n */
/* global TopLevelApi */
/* global SignStaking */
/* global Errors */

/** @extends {TopLevelApi<KeyguardRequest.SignStakingRequest>} */
class SignStakingApi extends TopLevelApi {
    /**
     * @param {KeyguardRequest.SignStakingRequest} request
     * @returns {Promise<Parsed<KeyguardRequest.SignStakingRequest>>}
     */
    async parseRequest(request) {
        if (!request) {
            throw new Errors.InvalidRequestError('request is required');
        }

        /** @type {Parsed<KeyguardRequest.SignStakingRequest>} */
        const parsedRequest = {};
        parsedRequest.appName = this.parseAppName(request.appName);
        parsedRequest.keyInfo = await this.parseKeyId(request.keyId);
        parsedRequest.keyLabel = this.parseLabel(request.keyLabel);
        parsedRequest.keyPath = this.parsePath(request.keyPath, 'keyPath');
        parsedRequest.senderLabel = this.parseLabel(request.senderLabel);
        parsedRequest.transaction = this.parseTransaction(request);
        parsedRequest.layout = this.parseLayout(request.layout);
        if ((!request.layout || request.layout === SignStakingApi.Layouts.STANDARD)
            && parsedRequest.layout === SignStakingApi.Layouts.STANDARD) {
            parsedRequest.recipientLabel = this.parseLabel(request.recipientLabel);
        } else if (request.layout === SignStakingApi.Layouts.CHECKOUT
            && parsedRequest.layout === SignStakingApi.Layouts.CHECKOUT) {
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
        } else if (request.layout === SignStakingApi.Layouts.CASHLINK
            && parsedRequest.layout === SignStakingApi.Layouts.CASHLINK
            && request.cashlinkMessage) {
            parsedRequest.cashlinkMessage = /** @type {string} */(this.parseMessage(request.cashlinkMessage));
        }

        return parsedRequest;
    }

    /**
     * Checks that the given layout is valid
     * @param {unknown} layout
     * @returns {KeyguardRequest.SignStakingRequestLayout}
     */
    parseLayout(layout) {
        if (!layout) {
            return SignStakingApi.Layouts.STANDARD;
        }
        // @ts-ignore (Property 'values' does not exist on type 'ObjectConstructor'.)
        if (Object.values(SignStakingApi.Layouts).indexOf(layout) === -1) {
            throw new Errors.InvalidRequestError('Invalid selected layout');
        }
        return /** @type KeyguardRequest.SignStakingRequestLayout */ (layout);
    }

    get Handler() {
        return SignStaking;
    }

    /**
     * @param {Parsed<KeyguardRequest.SignStakingRequest>} parsedRequest
     */
    async onBeforeRun(parsedRequest) {
        if (parsedRequest.layout === SignStakingApi.Layouts.CHECKOUT) {
            this.enableGlobalCloseButton(I18n.translatePhrase('sign-tx-cancel-payment'));
        }
    }
}

/**
 * @enum {KeyguardRequest.SignStakingRequestLayout}
 * @readonly
 */
SignStakingApi.Layouts = {
    STANDARD: /** @type {'standard'} */ ('standard'),
    CHECKOUT: /** @type {'checkout'} */ ('checkout'),
    CASHLINK: /** @type {'cashlink'} */ ('cashlink'),
};
