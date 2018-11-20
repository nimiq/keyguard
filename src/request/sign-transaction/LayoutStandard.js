/* global BaseLayout */
/* global I18n */

class LayoutStandard extends BaseLayout { // eslint-disable-line no-unused-vars
    /**
     * @param {?HTMLElement} $el
     * @param {KeyguardRequest.ParsedSignTransactionRequest} request
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
            <div class="page-header nq-card-header">
                <h1 data-i18n="sign-tx-heading" class="nq-h1">New Transaction</h1>
            </div>

            <div class="page-body transaction">
                <div class="nq-card-body">
                    <div class="center accounts">
                        <div class="account">
                            <div class="identicon" id="sender-identicon"></div>
                            <div class="label" id="sender-label"></div>
                            <div class="address" id="sender-address"></div>
                        </div>

                        <i class="arrow nq-icon chevron-right"></i>

                        <div class="account">
                            <div class="identicon" id="recipient-identicon"></div>
                            <div class="label" id="recipient-label"></div>
                            <div class="address" id="recipient-address"></div>
                        </div>
                    </div>
                </div>

                <div class="nq-card-footer">
                    <div class="total">
                        <span id="value"></span><span class="nim-symbol"></span>
                    </div>

                    <div class="fee-section nq-text-s display-none">
                        <span data-i18n="sign-tx-includes">includes</span>
                        <span id="fee"></span>
                        <span class="nim-symbol"></span>
                        <span data-i18n="sign-tx-fee">fee</span>
                    </div>

                    <div class="data-section nq-text display-none" id="data"></div>
                </div>
            </div>
        `;

        I18n.translateDom($el);
        return $el;
    }
}
