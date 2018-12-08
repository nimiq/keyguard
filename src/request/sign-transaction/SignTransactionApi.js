/* global RequestParser */
/* global I18n */
/* global TopLevelApi */
/* global LayoutStandard */
/* global LayoutCheckout */
/* global Errors */

class SignTransactionApi extends TopLevelApi {
    /**
     * @param {KeyguardRequest.SignTransactionRequest} request
     */
    async onRequest(request) {
        const parsedRequest = await this.parseRequest(request);
        const $layoutContainer = document.getElementById('layout-container');

        const handler = new SignTransactionApi.Layouts[parsedRequest.layout](
            $layoutContainer,
            parsedRequest,
            this.resolve.bind(this),
            this.reject.bind(this),
        );

        /** @type {HTMLElement} */
        const $appName = (document.querySelector('#app-name'));
        /** @type {HTMLSpanElement} */
        const $cancelLinkText = ($appName.parentNode);
        if (request.layout === 'checkout') {
            $cancelLinkText.textContent = I18n.translatePhrase('sign-tx-cancel-payment');
        } else {
            $appName.textContent = request.appName;
        }
        /** @type {HTMLButtonElement} */
        const $cancelLink = ($cancelLinkText.parentNode);
        $cancelLink.classList.remove('display-none');
        $cancelLink.addEventListener('click', () => this.reject(new Errors.RequestCanceled()));

        handler.run();
    }

    /**
     * Checks that the given layout is valid
     * @param {any} layout
     * @returns {any}
     */
    parseLayout(layout) {
        if (layout && !SignTransactionApi.Layouts[layout]) {
            throw new Errors.InvalidRequestError('Invalid selected layout');
        }
        return layout;
    }

    /**
     *
     * @param {KeyguardRequest.SignTransactionRequest} request
     * @returns {Promise<KeyguardRequest.ParsedSignTransactionRequest>}
     */
    async parseRequest(request) {
        if(!request) {
            throw new Errors.InvalidRequestError('request is required')
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
        if (parsedRequest.layout === 'checkout') {
            parsedRequest.shopOrigin = this.parseShopOrigin(request.shopOrigin);
        } else {
            parsedRequest.shopOrigin = undefined;
        }

        return parsedRequest;
    }
}

/** @type {{[layout: string]: any, standard: typeof LayoutStandard, checkout: typeof LayoutCheckout}} */
SignTransactionApi.Layouts = {
    standard: LayoutStandard,
    checkout: LayoutCheckout,
    // 'cashlink': LayoutCashlink,
};
