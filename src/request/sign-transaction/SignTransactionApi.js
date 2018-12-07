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
        const parsedRequest = await RequestParser.parse(
            request,
            'SignTransactionRequest',
            SignTransactionApi._parselayout.bind(this),
        );
        console.log(parsedRequest);

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
     * @returns {string}
     * @private
     */
    static _parselayout(layout) {
        if (layout && !SignTransactionApi.Layouts[layout]) {
            throw new Errors.InvalidRequestError('Invalid selected layout');
        }
        return layout;
    }
}

/** @type {{[layout: string]: any, standard: typeof LayoutStandard, checkout: typeof LayoutCheckout}} */
SignTransactionApi.Layouts = {
    standard: LayoutStandard,
    checkout: LayoutCheckout,
    // 'cashlink': LayoutCashlink,
};
