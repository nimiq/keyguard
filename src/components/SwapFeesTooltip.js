/* global I18n */
/* global TemplateTags */
/* global NumberFormatting */
/* global CryptoUtils */

class SwapFeesTooltip { // eslint-disable-line no-unused-vars
    /**
     * @param {Parsed<KeyguardRequest.SignSwapRequest>} request
     * @param {number} exchangeFromAmount - In Luna or Satoshi, depending on which currency is funded
     * @param {number} exchangeToAmount - In Luna or Satoshi, depending on which currency is funded
     * @param {string} exchangeRateString - The exchange rate between the two currencies
     */
    constructor(request, exchangeFromAmount, exchangeToAmount, exchangeRateString) {
        const {
            fund: fundTx,
            redeem: redeemTx,
            fundingFiatRate,
            redeemingFiatRate,
            fundFees,
            redeemFees,
            serviceSwapFee,
            fiatCurrency,
        } = request;

        this.$el = SwapFeesTooltip._createElement();

        /** @private */
        this.$tooltip = /** @type {SVGCircleElement} */ (this.$el.querySelector('.tooltip-box'));
        /** @private */
        this.$fees = /** @type {SVGCircleElement} */ (this.$el.querySelector('.fees'));

        let totalFiatFees = 0;

        // Show Bitcoin fees first
        if (fundTx.type === 'BTC' || redeemTx.type === 'BTC') {
            const myFee = fundTx.type === 'BTC'
                ? fundTx.inputs.reduce((sum, input) => sum + input.witnessUtxo.value, 0)
                    - fundTx.recipientOutput.value
                    - (fundTx.changeOutput ? fundTx.changeOutput.value : 0)
                : redeemTx.type === 'BTC'
                    ? redeemTx.input.witnessUtxo.value - redeemTx.output.value
                    : 0;

            const theirFee = fundTx.type === 'BTC' ? fundFees.redeeming : redeemFees.funding;

            const fiatRate = fundTx.type === 'BTC' ? fundingFiatRate : redeemingFiatRate;
            const fiatFee = CryptoUtils.unitsToCoins('BTC', myFee + theirFee) * fiatRate;

            const rows = this._createBitcoinLine(fiatFee, fiatCurrency);
            this.$tooltip.appendChild(rows[0]);
            this.$tooltip.appendChild(rows[1]);

            totalFiatFees += fiatFee;
        }

        // Show USDC fees next
        if (fundTx.type === 'USDC_MATIC' || redeemTx.type === 'USDC_MATIC') {
            const myFee = fundTx.type === 'USDC_MATIC'
                ? fundTx.description.args.fee.toNumber()
                : redeemTx.type === 'USDC_MATIC'
                    ? redeemTx.description.args.fee.toNumber()
                    : 0;

            const theirFee = fundTx.type === 'USDC_MATIC' ? fundFees.redeeming : redeemFees.funding;

            const fiatRate = fundTx.type === 'USDC_MATIC' ? fundingFiatRate : redeemingFiatRate;
            const fiatFee = CryptoUtils.unitsToCoins('USDC_MATIC', myFee + theirFee) * fiatRate;

            const rows = this._createUsdcLine(fiatFee, fiatCurrency);
            this.$tooltip.appendChild(rows[0]);

            totalFiatFees += fiatFee;
        }

        // Show USDT fees next
        if (fundTx.type === 'USDT_MATIC' || redeemTx.type === 'USDT_MATIC') {
            const myFee = fundTx.type === 'USDT_MATIC'
                ? fundTx.description.args.fee.toNumber()
                : redeemTx.type === 'USDT_MATIC'
                    ? redeemTx.description.args.fee.toNumber()
                    : 0;

            const theirFee = fundTx.type === 'USDT_MATIC' ? fundFees.redeeming : redeemFees.funding;

            const fiatRate = fundTx.type === 'USDT_MATIC' ? fundingFiatRate : redeemingFiatRate;
            const fiatFee = CryptoUtils.unitsToCoins('USDT_MATIC', myFee + theirFee) * fiatRate;

            const rows = this._createUsdtLine(fiatFee, fiatCurrency);
            this.$tooltip.appendChild(rows[0]);

            totalFiatFees += fiatFee;
        }

        // Show OASIS fees next
        if (fundTx.type === 'EUR' || redeemTx.type === 'EUR') {
            const myFee = fundTx.type === 'EUR'
                ? fundTx.fee
                : redeemTx.type === 'EUR'
                    ? redeemTx.fee
                    : 0;

            const theirFee = fundTx.type === 'EUR' ? fundFees.processing : redeemFees.processing;

            const fiatRate = fundTx.type === 'EUR' ? fundingFiatRate : redeemingFiatRate;
            const fiatFee = CryptoUtils.unitsToCoins('EUR', myFee + theirFee) * fiatRate;

            const rows = this._createOasisLine(
                fiatFee,
                fiatCurrency,
                (myFee + theirFee) / (fundTx.type === 'EUR' ? exchangeFromAmount : exchangeToAmount),
            );
            this.$tooltip.appendChild(rows[0]);
            this.$tooltip.appendChild(rows[1]);

            totalFiatFees += fiatFee;
        }

        // Show SEPA Instant fees
        if (redeemTx.type === 'EUR' && redeemFees.funding > 0) {
            const theirFee = redeemFees.funding;

            const fiatRate = redeemingFiatRate;
            const fiatFee = CryptoUtils.unitsToCoins('EUR', theirFee) * fiatRate;

            const rows = this._createBankNetworkLine(fiatFee, fiatCurrency, 'SEPA Instant');
            this.$tooltip.appendChild(rows[0]);
            // this.$tooltip.appendChild(rows[1]);

            totalFiatFees += fiatFee;
        }

        // Show Nimiq fees last
        if (fundTx.type === 'NIM' || redeemTx.type === 'NIM') {
            const myFee = fundTx.type === 'NIM'
                ? fundTx.transaction.fee
                : redeemTx.type === 'NIM'
                    ? redeemTx.transaction.fee
                    : BigInt(0);

            const theirFee = fundTx.type === 'NIM' ? fundFees.redeeming : redeemFees.funding;

            const fiatRate = fundTx.type === 'NIM' ? fundingFiatRate : redeemingFiatRate;
            const fiatFee = CryptoUtils.unitsToCoins('NIM', Number(myFee) + theirFee) * fiatRate;

            const rows = this._createNimiqLine(fiatFee, fiatCurrency);
            this.$tooltip.appendChild(rows[0]);

            totalFiatFees += fiatFee;
        }

        // Show Swap fees
        if (serviceSwapFee) {
            const fiatFee = CryptoUtils.unitsToCoins(fundTx.type, serviceSwapFee) * fundingFiatRate;

            const rows = this._createServiceFeeLine(
                fiatFee,
                fiatCurrency,
                serviceSwapFee / (exchangeFromAmount - serviceSwapFee),
            );
            this.$tooltip.appendChild(rows[0]);
            this.$tooltip.appendChild(rows[1]);

            totalFiatFees += fiatFee;
        }

        // Add separator line
        this.$tooltip.appendChild(document.createElement('hr'));

        // Add total line
        this.$tooltip.appendChild(this._createTotalLine(totalFiatFees, fiatCurrency)[0]);

        // Add exchange rate
        this.$tooltip.appendChild(this._createExchangeRateLine(exchangeRateString)[0]);

        // Write total into the pill box
        this.$fees.textContent = NumberFormatting.formatCurrency(totalFiatFees, fiatCurrency);
    }

    /**
     * @private
     * @returns {HTMLElement}
     */
    static _createElement() {
        const $el = document.createElement('div');
        $el.classList.add('tooltip', 'fee-breakdown', 'bottom');
        $el.tabIndex = 0; // make the tooltip focusable

        $el.innerHTML = TemplateTags.hasVars(0)`
            <div class="pill">
                <span class="fees"></span>&nbsp;<span data-i18n="sign-swap-fees">fees</span>
            </div>
            <div class="tooltip-box"></div>
        `;
        I18n.translateDom($el);

        return $el;
    }

    /**
     * @param {number} fiatFee
     * @param {string} fiatCurrency
     * @returns {[HTMLDivElement, HTMLParagraphElement]}
     */
    _createBitcoinLine(fiatFee, fiatCurrency) {
        const $div = document.createElement('div');
        $div.classList.add('price-breakdown');

        $div.innerHTML = TemplateTags.hasVars(1)`
            <label data-i18n="sign-swap-btc-fees">BTC network fee</label>
            <div>${NumberFormatting.formatCurrency(fiatFee, fiatCurrency)}</div>
        `;
        I18n.translateDom($div);

        const $p = document.createElement('p');
        $p.classList.add('explainer');
        $p.textContent = I18n.translatePhrase('sign-swap-btc-fees-explainer');

        return [$div, $p];
    }

    /**
     * @param {number} fiatFee
     * @param {string} fiatCurrency
     * @param {number} percentage
     * @returns {[HTMLDivElement, HTMLParagraphElement]}
     */
    _createOasisLine(fiatFee, fiatCurrency, percentage) {
        const $div = document.createElement('div');
        $div.classList.add('price-breakdown');

        $div.innerHTML = TemplateTags.hasVars(1)`
            <label data-i18n="sign-swap-oasis-fees">OASIS service fee</label>
            <div>${NumberFormatting.formatCurrency(fiatFee, fiatCurrency)}</div>
        `;
        I18n.translateDom($div);

        const $p = document.createElement('p');
        $p.classList.add('explainer');
        $p.textContent = `${NumberFormatting.formatNumber(percentage * 100, 1)}%`
            + ` ${I18n.translatePhrase('sign-swap-oasis-fees-explainer')}`;

        return [$div, $p];
    }

    /**
     * @param {number} fiatFee
     * @param {string} fiatCurrency
     * @param {'SEPA Instant'} network
     * @returns {[HTMLDivElement]}
     */
    _createBankNetworkLine(fiatFee, fiatCurrency, network) {
        const $div = document.createElement('div');
        $div.classList.add('price-breakdown');

        $div.innerHTML = TemplateTags.hasVars(2)`
            <label>${network} <span data-i18n="sign-swap-bank-fees">fee</span></label>
            <div>${NumberFormatting.formatCurrency(fiatFee, fiatCurrency)}</div>
        `;
        I18n.translateDom($div);

        // const $p = document.createElement('p');
        // $p.classList.add('explainer');
        // $p.textContent = `${NumberFormatting.formatNumber(percentage * 100, 1)}%`
        //     + ` ${I18n.translatePhrase('sign-swap-bank-fees-explainer')}`;

        return [$div/* , $p */];
    }

    /**
     * @param {number} fiatFee
     * @param {string} fiatCurrency
     * @returns {[HTMLDivElement]}
     */
    _createNimiqLine(fiatFee, fiatCurrency) {
        const $div = document.createElement('div');
        $div.classList.add('price-breakdown');

        $div.innerHTML = TemplateTags.hasVars(1)`
            <label data-i18n="sign-swap-nim-fees">NIM network fee</label>
            <div>${NumberFormatting.formatCurrency(fiatFee, fiatCurrency)}</div>
        `;
        I18n.translateDom($div);

        return [$div];
    }

    /**
     * @param {number} fiatFee
     * @param {string} fiatCurrency
     * @returns {[HTMLDivElement]}
     */
    _createUsdcLine(fiatFee, fiatCurrency) {
        const $div = document.createElement('div');
        $div.classList.add('price-breakdown');

        $div.innerHTML = TemplateTags.hasVars(1)`
            <label data-i18n="sign-swap-usdc-fees">USDC network fee</label>
            <div>${NumberFormatting.formatCurrency(fiatFee, fiatCurrency)}</div>
        `;
        I18n.translateDom($div);

        return [$div];
    }

    /**
     * @param {number} fiatFee
     * @param {string} fiatCurrency
     * @returns {[HTMLDivElement]}
     */
    _createUsdtLine(fiatFee, fiatCurrency) {
        const $div = document.createElement('div');
        $div.classList.add('price-breakdown');

        $div.innerHTML = TemplateTags.hasVars(1)`
            <label data-i18n="sign-swap-usdt-fees">USDT network fee</label>
            <div>${NumberFormatting.formatCurrency(fiatFee, fiatCurrency)}</div>
        `;
        I18n.translateDom($div);

        return [$div];
    }

    /**
     * @param {number} fiatFee
     * @param {string} fiatCurrency
     * @param {number} percentage
     * @returns {[HTMLDivElement, HTMLParagraphElement]}
     */
    _createServiceFeeLine(fiatFee, fiatCurrency, percentage) {
        const $div = document.createElement('div');
        $div.classList.add('price-breakdown');

        $div.innerHTML = TemplateTags.hasVars(1)`
            <label data-i18n="sign-swap-exchange-fee">Swap fee</label>
            <div>${NumberFormatting.formatCurrency(fiatFee, fiatCurrency)}</div>
        `;
        I18n.translateDom($div);

        const $p = document.createElement('p');
        $p.classList.add('explainer');
        $p.textContent = `${NumberFormatting.formatNumber(percentage * 100, 2)}%`
            + ` ${I18n.translatePhrase('sign-swap-of-exchange-value')}`;

        return [$div, $p];
    }

    /**
     * @param {number} totalFiatFees
     * @param {string} fiatCurrency
     * @returns {[HTMLDivElement]}
     */
    _createTotalLine(totalFiatFees, fiatCurrency) {
        const $div = document.createElement('div');
        $div.classList.add('price-breakdown');

        $div.innerHTML = TemplateTags.hasVars(1)`
            <label data-i18n="sign-swap-total-fees">Total fees</label>
            <div class="total-fees">${NumberFormatting.formatCurrency(totalFiatFees, fiatCurrency)}</div>
        `;
        I18n.translateDom($div);

        return [$div];
    }

    /**
     * @param {string} exchangeRateString
     * @returns {[HTMLDivElement]}
     */
    _createExchangeRateLine(exchangeRateString) {
        const $div = document.createElement('div');
        $div.classList.add('full-width');

        $div.innerHTML = TemplateTags.hasVars(1)`
        <div class="exchange-rate">${exchangeRateString}</div>
        <p class="explainer" data-i18n="sign-swap-exchange-rate">Exchange rate</p>
        `;
        I18n.translateDom($div);

        return [$div];
    }
}
