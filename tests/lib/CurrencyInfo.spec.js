/* global describe, it, expect */
/* global CurrencyInfo */
/* global FiatApi */

describe('CurrencyInfo', () => {
    it('can be automatically created', () => {
        const c1 = new CurrencyInfo('eur');
        const c2 = new CurrencyInfo('eur', 'de');
        const nameRegex = /euro/i; // generated name depends on test environment, but should include some form of euro

        expect(c1.code).toBe('EUR');
        expect(c1.decimals).toBe(2);
        expect(c1.name).toMatch(nameRegex);
        expect(c1.symbol).toBe('€');
        expect(c1.locale).toBeDefined();

        expect(c2.code).toBe('EUR');
        expect(c2.decimals).toBe(2);
        expect(c2.name).toMatch(nameRegex);
        expect(c2.symbol).toBe('€');
        expect(c2.locale).toBeDefined();
    });

    it('can cache auto-generated CurrencyInfos', () => {
        const c1 = new CurrencyInfo('jpy');
        const c2 = new CurrencyInfo('jpy');
        expect(c1).toBe(c2);
    });

    it('reports decimals of currencies with deprecated sub-units as 0', () => {
        expect(new CurrencyInfo('jpy').decimals).toBe(0); // by browsers reported as 0
        expect(new CurrencyInfo('crc').decimals).toBe(0); // manually set to 0
    });

    it('has custom currency symbols', () => {
        for (const code of new Set([
            ...Object.keys(FiatApi.SupportedFiatCurrency),
            // @ts-ignore: EXTRA_SYMBOLS is private
            ...Object.keys(CurrencyInfo.EXTRA_SYMBOLS),
        ].sort())) {
            const info = new CurrencyInfo(code);
            expect(info.symbol).toBeDefined();
            expect(info.symbol).not.toEqual(info.code);
            // console.log(code, info.symbol); // eslint-disable-line no-console
        }
    });

    it('can generate names for different locales', () => {
        const possibleLanguages = [];
        for (let char1 = 'a'.charCodeAt(0); char1 <= 'z'.charCodeAt(0); ++char1) {
            for (let char2 = 'a'.charCodeAt(0); char2 <= 'z'.charCodeAt(0); ++char2) {
                possibleLanguages.push(`${String.fromCharCode(char1)}${String.fromCharCode(char2)}`);
            }
        }

        const supportedLanguages = Intl.NumberFormat.supportedLocalesOf(possibleLanguages);
        if (supportedLanguages.length <= 1) return; // nothing to compare

        const generatedNames = new Set(supportedLanguages.map((lang) => new CurrencyInfo('eur', lang).name));
        expect(generatedNames.size).toBeGreaterThan(1);
    });

    it('uses fallback locales', () => {
        expect(new CurrencyInfo('usd', 'xy').locale).not.toMatch(/xy/i);
    });

    it('supports right-to-left locales', () => {
        // test some rtl languages
        const rtlLanguages = ['ar', 'fa'];
        const supportedRtlLanguages = Intl.NumberFormat.supportedLocalesOf(rtlLanguages);
        if (!supportedRtlLanguages.length) return;

        // Simplified and adapted from https://stackoverflow.com/a/14824756.
        // Note that this rtl detection is incomplete but good enough for our needs.
        const rightToLeftDetectionRegex = /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/;
        expect(rtlLanguages.some((lang) => rightToLeftDetectionRegex.test(new CurrencyInfo('aed', lang).name)))
            .toBeTruthy();
        expect(rtlLanguages.some((lang) => rightToLeftDetectionRegex.test(new CurrencyInfo('aed', lang).symbol)))
            .toBeTruthy();
    });
});
