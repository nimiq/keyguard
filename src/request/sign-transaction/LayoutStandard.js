/* global BaseLayout */
/* global I18n */

class LayoutStandard extends BaseLayout { // eslint-disable-line no-unused-vars
    /**
     * @param {?HTMLElement} $el
     * @param {ParsedSignTransactionRequest} request
     * @param {Function} resolve
     * @param {Function} reject
     */
    constructor($el, request, resolve, reject) {
        // `this` can only be accessed after `super` has been called,
        // but `super` requires the HTML to already exist.
        const container = LayoutStandard._createElement($el);
        super(request, resolve, reject);
        this.$el = container;
    }

    /**
     * @param {?HTMLElement} [$el]
     * @returns {HTMLElement}
     */
    static _createElement($el) {
        $el = $el || document.createElement('div');
        $el.classList.add('layout-standard');

        $el.innerHTML = `
            <div class="page-header">
                <a tabindex="0" class="page-header-back-button icon-back-arrow"></a>
                <h1 data-i18n="sign-tx-heading">New Transaction</h1>
            </div>

            <div class="page-body transaction">
                <div class="center accounts">
                    <div class="account">
                        <div class="identicon" id="sender-identicon"></div>
                        <div class="label display-none" id="sender-label"></div>
                        <div class="address" id="sender-address"></div>
                    </div>

                    <i class="arrow icon-forward-chevron"></i>

                    <div class="account">
                        <div class="identicon" id="recipient-identicon"></div>
                        <div class="label display-none" id="recipient-label"></div>
                        <div class="address" id="recipient-address"></div>
                    </div>
                </div>

                <div class="center total">
                    <div class="value">
                        <span id="value"></span><span class="nim-symbol"></span>
                    </div>
                </div>

                <div class="center fee-section display-none">
                    <span data-i18n="sign-tx-includes">includes</span>
                    <span id="fee"></span>
                    <span class="nim-symbol"></span>
                    <span data-i18n="sign-tx-fee">fee</span>
                </div>

                <div class="center data-section display-none">
                    <div class="data" id="data"></div>
                </div>
            </div>
        `;

        I18n.translateDom($el);
        return $el;
    }
}
