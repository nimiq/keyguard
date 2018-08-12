/* global BaseLayout */
/* global I18n */

class LayoutCheckout extends BaseLayout { // eslint-disable-line no-unused-vars
    /**
     * @param {?HTMLElement} $el
     * @param {ParsedSignTransactionRequest} request
     * @param {Function} resolve
     * @param {Function} reject
     */
    constructor($el, request, resolve, reject) {
        request.recipientLabel = LayoutCheckout._originToDomain(request.shopOrigin || '---');

        // `this` can only be accessed after `super` has been called,
        // but `super` requires the HTML to already exist.
        const container = LayoutCheckout._createElement($el);
        super(request, resolve, reject);
        this.$el = container;
    }

    /**
     * @param {?HTMLElement} [$el]
     * @returns {HTMLElement}
     */
    static _createElement($el) {
        $el = $el || document.createElement('div');
        $el.classList.add('layout-checkout');

        $el.innerHTML = `
            <div class="page-body transaction">
                <h1>
                    <span data-i18n="sign-tx-youre-sending">You're sending</span>
                    <strong id="value"></strong>
                    <strong class="nim-symbol"></strong>
                    <span data-i18n="sign-tx-to">to</span>
                </h1>

                <div class="account shop-account">
                    <div class="identicon-cover"></div>
                    <div class="identicon" id="recipient-identicon"></div>
                    <div class="account-text">
                        <div class="label display-none" id="recipient-label"></div>
                        <div class="address" id="recipient-address"></div>
                    </div>
                </div>

                <div class="center data-section display-none">
                    <div class="data" id="data"></div>
                </div>

                <div class="sender-section">
                    <h2 data-i18n="sign-tx-pay-with">Pay with</h2>
                    <div class="account">
                        <div class="identicon" id="sender-identicon"></div>
                        <div class="account-text">
                            <div class="label display-none" id="sender-label"></div>
                            <div class="address" id="sender-address"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        I18n.translateDom($el);
        return $el;
    }

    /**
     * @param {string} origin
     * @returns {string}
     */
    static _originToDomain(origin) {
        return origin.split('://')[1] || '---';
    }
}
