/* global Nimiq */
/* global AddressInfo */
/* global Timer */
/* global TemplateTags */
/* global NumberFormatting */

/** @typedef {{
 *      recipient: string,
 *      label?: string,
 *      imageUrl?: URL,
 *      lunaAmount: number,
 *      networkFee: number,
 *      fiatAmount?: number,
 *      fiatCurrency?: string,
 *      vendorMarkup?: number,
 *      time?: number,
 *      expires?: number
 *  }} PaymentInfo */

class PaymentInfoLine { // eslint-disable-line no-unused-vars
    /**
     * @param {PaymentInfo} paymentInfo
     * @param {HTMLElement} [$el]
     */
    constructor(paymentInfo, $el) {
        this.$el = PaymentInfoLine._createElement($el);

        /** @type HTMLElement */
        const $nimAmount = (this.$el.querySelector('.nim-amount'));
        const nimAmount = NumberFormatting.formatNumber(Nimiq.Policy.lunasToCoins(paymentInfo.lunaAmount));
        $nimAmount.textContent = `${nimAmount} NIM`;

        this._createPriceTooltip(paymentInfo, /** @type HTMLElement */ (this.$el.querySelector('.amounts')));

        const recipientInfo = new AddressInfo({
            userFriendlyAddress: paymentInfo.recipient,
            label: paymentInfo.label || null,
            imageUrl: paymentInfo.imageUrl || null,
            accountLabel: null,
        });
        recipientInfo.renderTo(/** @type HTMLElement */ (this.$el.querySelector('.recipient')));

        /** @type HTMLElement */
        const $timer = (this.$el.querySelector('.timer'));
        if (paymentInfo.time && paymentInfo.expires) {
            new Timer(paymentInfo.time, paymentInfo.expires, $timer); // eslint-disable-line no-new
        } else {
            $timer.remove();
        }
    }

    /**
     * @private
     * @param {HTMLElement} [$el]
     * @returns {HTMLElement}
     */
    static _createElement($el) {
        $el = $el || document.createElement('div');
        $el.classList.add('payment-info-line');

        $el.innerHTML = TemplateTags.noVars`
            <div class="amounts">
                <div class="nim-amount"></div>
            </div>
            <div class="arrow-runway">
                <svg class="nq-icon">
                    <use xlink:href="../../../node_modules/@nimiq/style/nimiq-style.icons.svg#nq-arrow-right-small"/>
                </svg>
            </div>
            <div class="recipient"></div>
            <div class="timer"></div>
        `;

        return $el;
    }

    /**
     * @private
     * @param {PaymentInfo} paymentInfo
     * @param {HTMLElement} $container
     */
    _createPriceTooltip(paymentInfo, $container) {
        if (!paymentInfo.fiatAmount || !paymentInfo.fiatCurrency) return;

        const formattedFiatAmount = NumberFormatting.formatCurrency(paymentInfo.fiatAmount, paymentInfo.fiatCurrency);

        let vendorMarkupInfo = '';
        if (paymentInfo.vendorMarkup !== undefined) {
            // Specifically listing all possible i18n translations to enable the translationValidator to find and verify
            // them with its regular expression.
            const vendorMarkupLabel = paymentInfo.vendorMarkup >= 0
                ? '<label data-i18n="payment-info-line-vendor-markup">Vendor crypto markup</label>'
                : '<label data-i18n="payment-info-line-vendor-discount">Vendor crypto discount</label>';
            // Convert to percent and round to two decimals. Always ceil to avoid displaying a lower fee than charged or
            // larger discount than applied. Subtract small epsilon to avoid that numbers get rounded up as a result of
            // floating point imprecision after multiplication. Otherwise formatting for example .07 results in 7.01%.
            const vendorMarkupPercent = Math.ceil(paymentInfo.vendorMarkup * 100 * 100 - 1e-10) / 100;
            const vendorMarkupValue = `<div>${paymentInfo.vendorMarkup >= 0 ? '+' : ''}${vendorMarkupPercent}%</div>`;
            vendorMarkupInfo = vendorMarkupLabel + vendorMarkupValue;
        }

        // Fiat/crypto rate. Higher fiat/crypto rate means user is paying less crypto for the requested fiat amount
        // and is therefore better for the user. Note: precision loss should be acceptable here.
        const effectiveRate = paymentInfo.fiatAmount / Nimiq.Policy.lunasToCoins(paymentInfo.lunaAmount);
        const formattedEffectiveRate = `
            ${NumberFormatting.formatCurrency(effectiveRate, paymentInfo.fiatCurrency, 0.0001)} / NIM`;

        const formattedTotal = `
            ${NumberFormatting.formatNumber(Nimiq.Policy.lunasToCoins(paymentInfo.lunaAmount))} NIM`;

        let networkFeeInfo = '';
        // Note that in the Keyguard the fee is never undefined.
        if (paymentInfo.networkFee !== 0) {
            networkFeeInfo = TemplateTags.hasVars(1)`<div class="network-fee-info info">
                + ${NumberFormatting.formatNumber(Nimiq.Policy.lunasToCoins(paymentInfo.networkFee))} NIM
                <span data-i18n="payment-info-line-network-fee">network fee</span>
            </div>`;
        }

        const $tooltip = document.createElement('div');
        $tooltip.classList.add('price-tooltip', 'tooltip');
        $tooltip.tabIndex = 0; // make the tooltip focusable

        $tooltip.innerHTML = TemplateTags.hasVars(6)`
            <span class="fiat-amount">${formattedFiatAmount}</span>
            <div class="tooltip-box">
                <div class="price-breakdown">
                    <label data-i18n="payment-info-line-order-amount">Order amount</label>
                    <div>${formattedFiatAmount}</div>
                    ${vendorMarkupInfo}
                    <label data-i18n="payment-info-line-effective-rate">
                        Effective rate
                    </label>
                    <div>${formattedEffectiveRate}</div>
                </div>
                <div class="free-service-info info" data-i18n="payment-info-line-free-service">
                    Nimiq provides this service free of charge.
                </div>
                <hr>
                <div class="price-breakdown">
                    <label data-i18n="payment-info-line-total">Total</label>
                    <div class="total">${formattedTotal}</div>
                </div>
                ${networkFeeInfo}
            </div>
        `;

        $container.appendChild($tooltip);
    }
}
