/* global Nimiq */
/* global AddressInfo */
/* global TemplateTags */
/* global NumberFormatting */

class PaymentInfoLine extends Nimiq.Observable {
    /**
     * @param {object}                                 paymentInfo
     * @param {string}                                 paymentInfo.recipient
     * @param {string|undefined}                       [paymentInfo.label]
     * @param {URL|undefined}                          [paymentInfo.imageUrl]
     * @param {number}                                 paymentInfo.lunaAmount
     * @param {number|undefined}                       [paymentInfo.fiatAmount]
     * @param {KeyguardRequest.CurrencyInfo|undefined} [paymentInfo.fiatCurrency]
     * @param {number|undefined}                       [paymentInfo.time]
     * @param {number|undefined}                       [paymentInfo.expires]
     * @param {HTMLElement}                            [$el]
     */
    constructor(paymentInfo, $el) {
        super();
        this.$el = PaymentInfoLine._createElement($el);

        /** @type HTMLElement */
        const $nimAmount = (this.$el.querySelector('.nim-amount'));
        const nimAmount = NumberFormatting.formatNumber(Nimiq.Policy.lunasToCoins(paymentInfo.lunaAmount));
        $nimAmount.textContent = `${nimAmount} NIM`;

        /** @type HTMLElement */
        const $fiatAmount = (this.$el.querySelector('.fiat-amount'));
        if (paymentInfo.fiatAmount !== undefined && paymentInfo.fiatCurrency !== undefined) {
            const fiatAmount = NumberFormatting.formatNumber(paymentInfo.fiatAmount, paymentInfo.fiatCurrency.digits);
            $fiatAmount.textContent = `${fiatAmount} ${paymentInfo.fiatCurrency.code}`;
        } else {
            $fiatAmount.remove();
        }

        const recipientInfo = new AddressInfo({
            userFriendlyAddress: paymentInfo.recipient,
            label: paymentInfo.label || null,
            imageUrl: paymentInfo.imageUrl || null,
            accountLabel: null,
        });
        recipientInfo.renderTo(/** @type HTMLElement */ (this.$el.querySelector('.recipient-info')));

        /** @type HTMLElement */
        const $recipient = (this.$el.querySelector('.recipient'));
        $recipient.addEventListener('click', event => {
            event.preventDefault(); // to avoid CSP warnings about the javascript:void(0) href
            this.fire(PaymentInfoLine.Events.RECIPIENT_CLICKED);
        });
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
            <div class="amount">
                <div class="nim-amount"></div>
                <div class="fiat-amount"></div>
            </div>
            <div class="arrow-runway">
                <svg class="nq-icon">
                    <use xlink:href="../../../node_modules/@nimiq/style/nimiq-style.icons.svg#nq-arrow-right-small"/>
                </svg>
            </div>
            <a href="javascript:void(0)" class="recipient">
                <div class="recipient-info"></div>
                <div class="info-circle-container">
                    <svg class="nq-icon">
                        <use xlink:href="../../../node_modules/@nimiq/style/nimiq-style.icons.svg#nq-info-circle"/>
                    </svg>
                </div>
            </a>
        `;

        return $el;
    }
}

PaymentInfoLine.Events = {
    RECIPIENT_CLICKED: 'recipient-clicked',
};
