/**
 * Adapted from https://github.com/arhs/iban.js
 *
 * Copyright (c) 2013-2020 ARHS Developments SA
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

/* global Errors */

class IbanSpec {
    /**
     * Create a new IbanSpec for a valid IBAN number.
     *
     * @param {string} countryCode the code of the country
     * @param {number} length the length of the IBAN
     * @param {string} structure the structure of the underlying BBAN (for validation and formatting)
     */
    constructor(countryCode, length, structure) {
        this.countryCode = countryCode;
        this.length = length;
        this.structure = structure;
    }

    /**
     * Check if the passed iban is valid according to this specification.
     *
     * @param {String} iban the iban to validate
     * @returns {boolean} true if valid, false otherwise
     */
    isValid(iban) {
        return this.length === iban.length
            && this.countryCode === iban.slice(0, 2)
            && this._regex().test(iban.slice(4))
            && this._iso7064Mod97_10(this._iso13616Prepare(iban)) === 1;
    }

    /**
     * Lazy-loaded regex (parse the structure and construct the regular
     * expression the first time we need it for validation)
     *
     * @returns {RegExp}
     * @private
     */
    _regex() {
        if (this._cachedRegex) return this._cachedRegex;
        this._cachedRegex = this._parseStructure(this.structure);
        return this._cachedRegex;
    }

    /**
     * Parse the BBAN structure used to configure each IBAN IbanSpec and returns a matching regular expression.
     * A structure is composed of blocks of 3 characters (one letter and 2 digits). Each block represents
     * a logical group in the typical representation of the BBAN. For each group, the letter indicates which characters
     * are allowed in this group and the following 2-digits number tells the length of the group.
     *
     * @param {string} structure the structure to parse
     * @returns {RegExp}
     * @private
     */
    _parseStructure(structure) {
        const blocks = structure.match(/(.{3})/g);
        if (!blocks) throw new Errors.KeyguardError('Invalid IBAN specification');

        // split in blocks of 3 chars
        const regex = blocks.map(block => {
            // parse each structure block (1-char + 2-digits)
            let format;
            const pattern = block.slice(0, 1);
            const repeats = parseInt(block.slice(1), 10);

            switch (pattern) {
                case 'A': format = '0-9A-Za-z'; break;
                case 'B': format = '0-9A-Z'; break;
                case 'C': format = 'A-Za-z'; break;
                case 'F': format = '0-9'; break;
                case 'L': format = 'a-z'; break;
                case 'U': format = 'A-Z'; break;
                case 'W': format = '0-9a-z'; break;
                default: throw new Errors.KeyguardError('Invalid IBAN specification pattern');
            }

            return `([${format}]{${repeats}})`;
        });

        return new RegExp(`^${regex.join('')}$`);
    }

    /**
     * Prepare an IBAN for mod 97 computation by moving the first 4 chars to the end and transforming the letters to
     * numbers (A = 10, B = 11, ..., Z = 35), as specified in ISO13616.
     *
     * @param {string} iban the IBAN
     * @returns {string} the prepared IBAN
     * @private
     */
    _iso13616Prepare(iban) {
        iban = iban.toUpperCase();
        iban = iban.substr(4) + iban.substr(0, 4);

        const A = 'A'.charCodeAt(0);
        const Z = 'Z'.charCodeAt(0);

        return iban.split('').map(n => {
            const code = n.charCodeAt(0);
            if (code >= A && code <= Z) {
                // A = 10, B = 11, ... Z = 35
                return code - A + 10;
            }
            return n;
        }).join('');
    }

    /**
     * Calculates the MOD 97 10 of the passed IBAN as specified in ISO7064.
     *
     * @param {string} iban
     * @returns {number}
     * @private
     */
    _iso7064Mod97_10(iban) { // eslint-disable-line camelcase
        let remainder = iban;
        let block;

        while (remainder.length > 2) {
            block = remainder.slice(0, 9);
            remainder = (parseInt(block, 10) % 97) + remainder.slice(block.length);
        }

        return parseInt(remainder, 10) % 97;
    }
}

class Iban {
    /**
     * Check if an IBAN is valid.
     *
     * @param {unknown} str the IBAN to validate.
     * @returns {boolean} true if the passed IBAN is valid, false otherwise
     */
    static isValid(str) {
        if (typeof str !== 'string') return false;
        const iban = this.electronicFormat(str);
        const countryStructure = IbanSpec.Countries[iban.slice(0, 2)];
        return !!countryStructure && countryStructure.isValid(iban);
    }

    /**
     *
     * @param {string} iban
     * @returns {string}
     */
    static electronicFormat(iban) {
        return iban.replace(Iban.NON_ALPHANUM, '').toUpperCase();
    }

    /**
     *
     * @param {string} iban
     * @param {string} separator
     * @returns {string}
     */
    static printFormat(iban, separator) {
        if (typeof separator === 'undefined') {
            separator = ' ';
        }
        return this.electronicFormat(iban).replace(Iban.EVERY_FOUR_CHARS, `$1${separator}`);
    }
}

Iban.NON_ALPHANUM = /[^a-zA-Z0-9]/g;
Iban.EVERY_FOUR_CHARS = /(.{4})(?!$)/g;

/** @type {{[countryCode: string]: IbanSpec}} */
IbanSpec.Countries = {
    AD: new IbanSpec('AD', 24, 'F04F04A12'),
    AE: new IbanSpec('AE', 23, 'F03F16'),
    AL: new IbanSpec('AL', 28, 'F08A16'),
    AT: new IbanSpec('AT', 20, 'F05F11'),
    AZ: new IbanSpec('AZ', 28, 'U04A20'),
    BA: new IbanSpec('BA', 20, 'F03F03F08F02'),
    BE: new IbanSpec('BE', 16, 'F03F07F02'),
    BG: new IbanSpec('BG', 22, 'U04F04F02A08'),
    BH: new IbanSpec('BH', 22, 'U04A14'),
    BR: new IbanSpec('BR', 29, 'F08F05F10U01A01'),
    BY: new IbanSpec('BY', 28, 'A04F04A16'),
    CH: new IbanSpec('CH', 21, 'F05A12'),
    CR: new IbanSpec('CR', 22, 'F04F14'),
    CY: new IbanSpec('CY', 28, 'F03F05A16'),
    CZ: new IbanSpec('CZ', 24, 'F04F06F10'),
    DE: new IbanSpec('DE', 22, 'F08F10'),
    DK: new IbanSpec('DK', 18, 'F04F09F01'),
    DO: new IbanSpec('DO', 28, 'U04F20'),
    EE: new IbanSpec('EE', 20, 'F02F02F11F01'),
    EG: new IbanSpec('EG', 29, 'F04F04F17'),
    ES: new IbanSpec('ES', 24, 'F04F04F01F01F10'),
    FI: new IbanSpec('FI', 18, 'F06F07F01'),
    FO: new IbanSpec('FO', 18, 'F04F09F01'),
    FR: new IbanSpec('FR', 27, 'F05F05A11F02'),
    GB: new IbanSpec('GB', 22, 'U04F06F08'),
    GE: new IbanSpec('GE', 22, 'U02F16'),
    GI: new IbanSpec('GI', 23, 'U04A15'),
    GL: new IbanSpec('GL', 18, 'F04F09F01'),
    GR: new IbanSpec('GR', 27, 'F03F04A16'),
    GT: new IbanSpec('GT', 28, 'A04A20'),
    HR: new IbanSpec('HR', 21, 'F07F10'),
    HU: new IbanSpec('HU', 28, 'F03F04F01F15F01'),
    IE: new IbanSpec('IE', 22, 'U04F06F08'),
    IL: new IbanSpec('IL', 23, 'F03F03F13'),
    IS: new IbanSpec('IS', 26, 'F04F02F06F10'),
    IT: new IbanSpec('IT', 27, 'U01F05F05A12'),
    IQ: new IbanSpec('IQ', 23, 'U04F03A12'),
    JO: new IbanSpec('JO', 30, 'A04F22'),
    KW: new IbanSpec('KW', 30, 'U04A22'),
    KZ: new IbanSpec('KZ', 20, 'F03A13'),
    LB: new IbanSpec('LB', 28, 'F04A20'),
    LC: new IbanSpec('LC', 32, 'U04F24'),
    LI: new IbanSpec('LI', 21, 'F05A12'),
    LT: new IbanSpec('LT', 20, 'F05F11'),
    LU: new IbanSpec('LU', 20, 'F03A13'),
    LV: new IbanSpec('LV', 21, 'U04A13'),
    MC: new IbanSpec('MC', 27, 'F05F05A11F02'),
    MD: new IbanSpec('MD', 24, 'U02A18'),
    ME: new IbanSpec('ME', 22, 'F03F13F02'),
    MK: new IbanSpec('MK', 19, 'F03A10F02'),
    MR: new IbanSpec('MR', 27, 'F05F05F11F02'),
    MT: new IbanSpec('MT', 31, 'U04F05A18'),
    MU: new IbanSpec('MU', 30, 'U04F02F02F12F03U03'),
    NL: new IbanSpec('NL', 18, 'U04F10'),
    NO: new IbanSpec('NO', 15, 'F04F06F01'),
    PK: new IbanSpec('PK', 24, 'U04A16'),
    PL: new IbanSpec('PL', 28, 'F08F16'),
    PS: new IbanSpec('PS', 29, 'U04A21'),
    PT: new IbanSpec('PT', 25, 'F04F04F11F02'),
    QA: new IbanSpec('QA', 29, 'U04A21'),
    RO: new IbanSpec('RO', 24, 'U04A16'),
    RS: new IbanSpec('RS', 22, 'F03F13F02'),
    SA: new IbanSpec('SA', 24, 'F02A18'),
    SC: new IbanSpec('SC', 31, 'U04F04F16U03'),
    SE: new IbanSpec('SE', 24, 'F03F16F01'),
    SI: new IbanSpec('SI', 19, 'F05F08F02'),
    SK: new IbanSpec('SK', 24, 'F04F06F10'),
    SM: new IbanSpec('SM', 27, 'U01F05F05A12'),
    ST: new IbanSpec('ST', 25, 'F08F11F02'),
    SV: new IbanSpec('SV', 28, 'U04F20'),
    TL: new IbanSpec('TL', 23, 'F03F14F02'),
    TN: new IbanSpec('TN', 24, 'F02F03F13F02'),
    TR: new IbanSpec('TR', 26, 'F05F01A16'),
    UA: new IbanSpec('UA', 29, 'F25'),
    VA: new IbanSpec('VA', 22, 'F18'),
    VG: new IbanSpec('VG', 24, 'U04F16'),
    XK: new IbanSpec('XK', 20, 'F04F10F02'),

    // The following countries are not included in the official IBAN registry but use the IBAN specification

    // Angola
    AO: new IbanSpec('AO', 25, 'F21'),
    // Burkina
    BF: new IbanSpec('BF', 27, 'F23'),
    // Burundi
    BI: new IbanSpec('BI', 16, 'F12'),
    // Benin
    BJ: new IbanSpec('BJ', 28, 'F24'),
    // Ivory
    CI: new IbanSpec('CI', 28, 'U02F22'),
    // Cameron
    CM: new IbanSpec('CM', 27, 'F23'),
    // Cape Verde
    CV: new IbanSpec('CV', 25, 'F21'),
    // Algeria
    DZ: new IbanSpec('DZ', 24, 'F20'),
    // Iran
    IR: new IbanSpec('IR', 26, 'F22'),
    // Madagascar
    MG: new IbanSpec('MG', 27, 'F23'),
    // Mali
    ML: new IbanSpec('ML', 28, 'U01F23'),
    // Mozambique
    MZ: new IbanSpec('MZ', 25, 'F21'),
    // Senegal
    SN: new IbanSpec('SN', 28, 'U01F23'),

    // The following are regional and administrative French Republic subdivision IBAN specification
    // (same structure as FR, only country code vary)
    GF: new IbanSpec('GF', 27, 'F05F05A11F02'),
    GP: new IbanSpec('GP', 27, 'F05F05A11F02'),
    MQ: new IbanSpec('MQ', 27, 'F05F05A11F02'),
    RE: new IbanSpec('RE', 27, 'F05F05A11F02'),
    PF: new IbanSpec('PF', 27, 'F05F05A11F02'),
    TF: new IbanSpec('TF', 27, 'F05F05A11F02'),
    YT: new IbanSpec('YT', 27, 'F05F05A11F02'),
    NC: new IbanSpec('NC', 27, 'F05F05A11F02'),
    BL: new IbanSpec('BL', 27, 'F05F05A11F02'),
    MF: new IbanSpec('MF', 27, 'F05F05A11F02'),
    PM: new IbanSpec('PM', 27, 'F05F05A11F02'),
    WF: new IbanSpec('WF', 27, 'F05F05A11F02'),
};
