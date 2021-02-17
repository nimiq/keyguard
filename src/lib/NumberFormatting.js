/* global I18n */

class NumberFormatting { // eslint-disable-line no-unused-vars
    /**
     * @param {number} value
     * @param {number} [maxDecimals]
     * @param {number} [minDecimals]
     * @returns {string}
     */
    static formatNumber(value, maxDecimals = 5, minDecimals = 0) {
        const roundingFactor = 10 ** maxDecimals;
        value = Math.round(value * roundingFactor) / roundingFactor;

        const result = parseFloat(value.toFixed(minDecimals)) === value
            ? value.toFixed(minDecimals)
            : value.toString();

        if (Math.abs(value) < 10000) return result;

        // Add thin spaces (U+202F) every 3 digits. Stop at the decimal separator if there is one.
        const regexp = result.includes('.') ? /(\d)(?=(\d{3})+\.)/g : /(\d)(?=(\d{3})+$)/g;
        return result.replace(regexp, '$1\u202F');
    }

    /**
     * @param {number} value
     * @param {string} currency
     * @param {number} [maxRelativeDeviation = .1]
     * @param {string} [locale = I18n.language]
     * @returns {string}
     */
    static formatCurrency(value, currency, maxRelativeDeviation = 0.1, locale = I18n.language) {
        const formattingOptions = {
            style: 'currency',
            currency,
            currencyDisplay: 'symbol',
            useGrouping: false,
            // undefined to start with decimal count typical for this currency, e.g. 2 for eur
            minimumFractionDigits: /** @type number | undefined */ (undefined),
        };
        let formatted;
        let integers;
        let relativeDeviation;

        do {
            // formatted = value.toLocaleString([localeWithLatinNumbers, 'en-US'], formattingOptions)
            formatted = value.toLocaleString([
                `${this._currencyToLocale(currency)}-u-nu-latn`,
                `${locale}-u-nu-latn`,
                'en-US',
            ], formattingOptions)
                // Enforce a dot as decimal separator for consistency and parseFloat. Using capturing groups instead of
                // lookahead/lookbehind to avoid browser support limitations.
                .replace(/(\d)\D(\d)/, '$1.$2');
            const partsMatch = formatted.match(/(-)?\D*(\d+)(\.(\d+))?/);
            if (!partsMatch) return formatted; // should never happen
            const [/* full match */, sign, /* integers */, decimalsIncludingSeparator, decimals] = partsMatch;
            integers = partsMatch[2];
            const formattedNumber = `${sign || ''}${integers}${decimalsIncludingSeparator || ''}`;
            relativeDeviation = Math.abs((value - Number.parseFloat(formattedNumber)) / value);

            formattingOptions.minimumFractionDigits = decimals ? decimals.length + 1 : 1;
        } while (relativeDeviation > maxRelativeDeviation
            && formattingOptions.minimumFractionDigits <= 20 // maximum allowed value for minimumFractionDigits
        );

        // apply integer grouping
        if (integers.length <= 4) return formatted;
        return formatted.replace(integers, NumberFormatting.formatNumber(parseInt(integers, 10)));
    }

    /**
     * @param {string} currency
     * @returns {string}
     */
    static _currencyToLocale(currency) {
        currency = currency.toLowerCase();
        switch (currency) {
            case 'eur':
            case 'chf':
                return 'de';
            case 'gbp':
            case 'usd':
                return 'en';
            case 'cny':
                return 'zh';
            default:
                return currency.substr(0, 2);
        }
    }
}
