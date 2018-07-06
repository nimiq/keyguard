/**
 * Usage:
 * <script src="lib/address-utils.js"></script>
 * const isValidAddress = AddressUtils.isValidAddress('NQ12 3456 7890 ABCD EFGH IJKL MNOP QRST UVWX'); // false
 * const formattedAddress = Address.Utils.formatAddress(' NQ 1234567890A BCDEFGHIJKLMN  OPQRSTUVWX '); // 'NQ12 3456 7890 ABCD EFGH IJKL MNOP QRST UVWX'
 */
class AddressUtils {
    /**
     * IBAN-format Nimiq address
     * @param {string} str
     * @returns {string}
     */
    static formatAddress(str) {
        // Remove all whitespace -> group by 4 characters -> join with one space
        const ibanGroups = str.replace(/\s+/g, '').match(/.{4}/g);
        if (!ibanGroups) return ''; // Make TS happy (match() can potentially return NULL)
        return ibanGroups.join(' ').toUpperCase();
    }

    /**
     * Validate a Nimiq address
     * @param {string} address
     * @returns {boolean}
     */
    static isValidAddress(address) {
        if (!address) return false;
        try {
            this.isUserFriendlyAddress(address);
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Check if a string is a valid Nimiq address
     * @param {string} str
     * @throws Throws an error if not a valid Nimiq address
     * @returns {void}
     */
    static isUserFriendlyAddress(str) {
        str = str.replace(/\s+/g, '');

        if (str.substr(0, 2).toUpperCase() !== 'NQ') {
            throw new Error('Addresses start with NQ');
        }

        if (str.length !== 36) {
            throw new Error('Addresses are 36 chars (ignoring spaces)');
        }

        if (!this._alphabetCheck(str.toUpperCase())) {
            throw new Error('Address has invalid characters');
        }

        if (this._ibanCheck(str.substr(4) + str.substr(0, 4)) !== 1) {
            throw new Error('Address checksum invalid');
        }
    }

    /**
     * @param {string} str
     */
    static _alphabetCheck(str) {
        const filteredStr = str.split('').filter(c => AddressUtils.NIMIQ_ALPHABET.includes(c)).join('');

        return filteredStr === str;
    }

    /**
     * @param {string} str
     */
    static _ibanCheck(str) {
        const num = str.split('').map(c => {
            const code = c.toUpperCase().charCodeAt(0);
            return code >= 48 && code <= 57 ? c : (code - 55).toString();
        }).join('');

        let tmp = '';

        for (let i = 0; i < Math.ceil(num.length / 6); i++) {
            tmp = (parseInt(tmp + num.substr(i * 6, 6)) % 97).toString();
        }

        return parseInt(tmp);
    }

    static get NIMIQ_ALPHABET() {
        // From Nimiq.BufferUtils.BASE32_ALPHABET.NIMIQ
        return '0123456789ABCDEFGHJKLMNPQRSTUVXY';
    }
}
