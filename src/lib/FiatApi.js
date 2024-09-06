// Adapted and reduced version of FiatApi.ts from @nimiq/utils
// This file should also be updated whenever FiatApi.ts in @nimiq/utils is updated.
class FiatApi {
    // eslint-disable-next-line valid-jsdoc
    /**
     * @param {Array<FiatApi.SupportedCryptoCurrency>} cryptoCurrencies
     * @param {Array<FiatApi.SupportedFiatCurrency>} vsCurrencies
     * @returns {Promise<Partial<Record<
     *     FiatApi.SupportedCryptoCurrency,
     *     Partial<Record<FiatApi.SupportedFiatCurrency, number>>,
     * >>>}
     */
    static async getExchangeRates(cryptoCurrencies, vsCurrencies) {
        switch (FiatApi.Provider) { // eslint-disable-line default-case
            case FiatApi.SupportedProvider.CoinGecko: {
                const coinIds = cryptoCurrencies.map(currency => FiatApi.COINGECKO_COIN_IDS[currency]);
                const response = await fetch(
                    `${FiatApi.API_URL}/simple/price?ids=${coinIds.join(',')}&vs_currencies=${vsCurrencies.join(',')}`,
                );
                if (!response.ok) throw new Error(`Failed to fetch exchange rates: ${response.status}`);
                const apiResult = await response.json();
                // Map coingecko coin ids back to SupportedCryptoCurrency enum and sanitize retrieved data.
                return cryptoCurrencies.reduce((result, cryptoCurrency) => {
                    const record = apiResult[FiatApi.COINGECKO_COIN_IDS[cryptoCurrency]];
                    const sanitizedRecord = Object.keys(record).reduce((sanitized, fiatCurrency) => ({
                        ...sanitized,
                        ...(Object.values(FiatApi.SupportedFiatCurrency).includes(/** @type {any} */ (fiatCurrency))
                            ? { [fiatCurrency]: parseFloat(record[fiatCurrency]) }
                            : null
                        ),
                    }), {});
                    return {
                        ...result,
                        [cryptoCurrency]: sanitizedRecord,
                    };
                }, {});
            }
        }
        // Not as default case to let ts warn us on missing providers in switch statement above.
        throw new Error(`FiatApi.Provider ${FiatApi.Provider} not supported yet.`);
    }
}

/**
 * @enum { 'CoinGecko' }
 * Supported API providers.
 */
FiatApi.SupportedProvider = Object.freeze({
    CoinGecko: /** @type {'CoinGecko'} */ ('CoinGecko'),
});

/**
 * @typedef {'CoinGecko'} FiatApi.Provider
 * @type {FiatApi.Provider}
 * The effective provider used by the FiatApi. As this is not meant to be changeable at runtime, a constant value and
 * type are assigned which trigger the correct assignments of enum values and types below.
 */
FiatApi.Provider = FiatApi.SupportedProvider.CoinGecko;

/**
 * @enum { 'nim' | 'btc' }
 * Crypto currencies supported by the coingecko api that are currently of interest to us.
 */
FiatApi.SupportedCryptoCurrencyCoinGecko = Object.freeze({
    NIM: /** @type {'nim'} */ ('nim'),
    BTC: /** @type {'btc'} */ ('btc'),
});

/**
 * @enum {'aed' | 'ars' | 'aud' | 'bdt' | 'bhd' | 'bmd' | 'brl' | 'cad' | 'chf' | 'clp' | 'cny' | 'czk' | 'dkk' | 'eur'
 *     | 'gbp' | 'gel' | 'hkd' | 'huf' | 'idr' | 'ils' | 'inr' | 'jpy' | 'krw' | 'kwd' | 'lkr' | 'mmk' | 'mxn' | 'myr'
 *     | 'ngn' | 'nok' | 'nzd' | 'php' | 'pkr' | 'pln' | 'rub' | 'sar' | 'sek' | 'sgd' | 'thb' | 'try' | 'twd' | 'uah'
 *     | 'usd' | 'vnd' | 'zar'}
 * Fiat currencies supported by the coingecko api, see https://api.coingecko.com/api/v3/simple/supported_vs_currencies.
 * More vs_currencies are supported, but those also include crypto currencies and ounces of gold amongst others which
 * are not fiat currencies. See FiatApi in @nimiq/utils for how this list was assembled.
 */
FiatApi.SupportedFiatCurrencyCoinGecko = Object.freeze({
    AED: /** @type {'aed'} */ ('aed'), // Arab Emirates Dirham
    ARS: /** @type {'ars'} */ ('ars'), // Argentine Peso
    AUD: /** @type {'aud'} */ ('aud'), // Australian Dollar
    BDT: /** @type {'bdt'} */ ('bdt'), // Bangladeshi Taka
    BHD: /** @type {'bhd'} */ ('bhd'), // Bahraini Dinar
    BMD: /** @type {'bmd'} */ ('bmd'), // Bermudan Dollar
    BRL: /** @type {'brl'} */ ('brl'), // Brazilian Real
    CAD: /** @type {'cad'} */ ('cad'), // Canadian Dollar
    CHF: /** @type {'chf'} */ ('chf'), // Swiss Franc
    CLP: /** @type {'clp'} */ ('clp'), // Chilean Peso
    CNY: /** @type {'cny'} */ ('cny'), // Chinese Yuan
    CZK: /** @type {'czk'} */ ('czk'), // Czech Koruna
    DKK: /** @type {'dkk'} */ ('dkk'), // Danish Krone
    EUR: /** @type {'eur'} */ ('eur'), // Euro
    GBP: /** @type {'gbp'} */ ('gbp'), // British Pound
    GEL: /** @type {'gel'} */ ('gel'), // Georgian Lari
    HKD: /** @type {'hkd'} */ ('hkd'), // Hong Kong Dollar
    HUF: /** @type {'huf'} */ ('huf'), // Hungarian Forint
    IDR: /** @type {'idr'} */ ('idr'), // Indonesian Rupiah
    ILS: /** @type {'ils'} */ ('ils'), // Israeli New Shekel
    INR: /** @type {'inr'} */ ('inr'), // Indian Rupee
    JPY: /** @type {'jpy'} */ ('jpy'), // Japanese Yen
    KRW: /** @type {'krw'} */ ('krw'), // South Korean Won
    KWD: /** @type {'kwd'} */ ('kwd'), // Kuwaiti Dinar
    LKR: /** @type {'lkr'} */ ('lkr'), // Sri Lankan Rupee
    MMK: /** @type {'mmk'} */ ('mmk'), // Burmese Kyat
    MXN: /** @type {'mxn'} */ ('mxn'), // Mexican Peso
    MYR: /** @type {'myr'} */ ('myr'), // Malaysian Ringgit
    NGN: /** @type {'ngn'} */ ('ngn'), // Nigerian Naira
    NOK: /** @type {'nok'} */ ('nok'), // Norwegian Krone
    NZD: /** @type {'nzd'} */ ('nzd'), // New Zealand Dollar
    PHP: /** @type {'php'} */ ('php'), // Philippine Peso
    PKR: /** @type {'pkr'} */ ('pkr'), // Pakistani Rupee
    PLN: /** @type {'pln'} */ ('pln'), // Poland Złoty
    RUB: /** @type {'rub'} */ ('rub'), // Russian Ruble
    SAR: /** @type {'sar'} */ ('sar'), // Saudi Riyal
    SEK: /** @type {'sek'} */ ('sek'), // Swedish Krona
    SGD: /** @type {'sgd'} */ ('sgd'), // Singapore Dollar
    THB: /** @type {'thb'} */ ('thb'), // Thai Baht
    TRY: /** @type {'try'} */ ('try'), // Turkish Lira
    TWD: /** @type {'twd'} */ ('twd'), // New Taiwan Dollar
    UAH: /** @type {'uah'} */ ('uah'), // Ukrainian Hryvnia
    USD: /** @type {'usd'} */ ('usd'), // United States Dollar
    // VEF: /** @type {'vef'} */ ('vef'), // Retired Venezuelan Bolívar Fuerte replaced by VES. Rates are off.
    VND: /** @type {'vnd'} */ ('vnd'), // Vietnamese Đồng
    ZAR: /** @type {'zar'} */ ('zar'), // South African Rand
});

switch (FiatApi.Provider) { // eslint-disable-line default-case, -- no default to let ts warn us on missing providers
    case FiatApi.SupportedProvider.CoinGecko: {
        FiatApi.SupportedCryptoCurrency = FiatApi.SupportedCryptoCurrencyCoinGecko;
        FiatApi.SupportedFiatCurrency = FiatApi.SupportedFiatCurrencyCoinGecko;

        /**
         * Coingecko api url. Note that the origin must be whitelisted in the csp.
         */
        FiatApi.API_URL = 'https://api.coingecko.com/api/v3';

        /**
         * Crypto currency tickers mapped to coingecko coin ids.
         */
        FiatApi.COINGECKO_COIN_IDS = Object.freeze({
            [FiatApi.SupportedCryptoCurrency.NIM]: 'nimiq-2',
            [FiatApi.SupportedCryptoCurrency.BTC]: 'bitcoin',
        });

        break;
    }
}

/**
 * @typedef {FiatApi.Provider extends 'CoinGecko'
 *     ? FiatApi.SupportedCryptoCurrencyCoinGecko
 *     : never
 * } FiatApi.SupportedCryptoCurrency
 * @typedef {FiatApi.Provider extends 'CoinGecko'
 *     ? FiatApi.SupportedFiatCurrencyCoinGecko
 *     : never
 * } FiatApi.SupportedFiatCurrency
 */
