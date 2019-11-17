class NumberFormatting { // eslint-disable-line no-unused-vars
    /**
     * @param {number} value
     * @param {number} [maxDecimals]
     * @param {number} [minDecimals]
     * @returns {string}
     */
    static formatNumber(value, maxDecimals = 5, minDecimals = Math.min(0, maxDecimals)) {
        const roundingFactor = 10 ** maxDecimals;
        value = Math.round(value * roundingFactor) / roundingFactor;

        const result = parseFloat(value.toFixed(minDecimals)) === value
            ? value.toFixed(minDecimals)
            : value.toString();

        if (Math.abs(value) < 10000) return result;

        // Add thin spaces (U+202F) every 3 digits. Stop at the decimal separator if there is one.
        const regexp = minDecimals > 0 ? /(\d)(?=(\d{3})+\.)/g : /(\d)(?=(\d{3})+$)/g;
        return result.replace(regexp, '$1\u202F');
    }

    /**
     * @param {number} value
     * @param {string} currency
     * @param {string} [locale = navigator.language]
     * @returns {string}
     */
    static formatCurrency(value, currency, locale = navigator.language) {
        const localeWithLatinNumbers = `${locale}-u-nu-latn`;
        const formatted = value.toLocaleString([localeWithLatinNumbers, 'en-US'], {
            style: 'currency',
            currency,
            currencyDisplay: 'symbol',
            useGrouping: false,
        });
        const integerMatch = formatted.match(/\d+/); // first match is the integer part
        if (!integerMatch) return formatted; // should never happen
        const integerPart = integerMatch[0];
        return formatted
            .replace(/(\d)\D(\d)/, '$1.$2') // enforce a dot as decimal separator for
            // consistency. Using capturing groups instead of lookahead/lookbehind to avoid browser support limitations.
            .replace(integerPart, NumberFormatting.formatNumber(parseInt(integerPart, 10)));
    }
}
