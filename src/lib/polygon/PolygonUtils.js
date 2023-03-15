/* global PolygonConstants */

class PolygonUtils { // eslint-disable-line no-unused-vars
    /**
     * @param {number} coins USDC coins in decimal
     * @returns {number} Number of Cents
     */
    static coinsToCents(coins) {
        return Math.round(coins * PolygonConstants.CENTS_PER_COINS);
    }

    /**
     * @param {number} cents Number of Cents.
     * @returns {number} USDC coins in decimal.
     */
    static centsToCoins(cents) {
        return cents / PolygonConstants.CENTS_PER_COINS;
    }

    /**
     * @param {string} path
     * @returns {boolean}
     */
    static isValidPath(path) {
        if (!/^m(\/[0-9]+'?)*$/.test(path)) return false;

        let stillHardened = true;

        // Overflow check.
        const segments = path.split('/');
        for (let i = 1; i < segments.length; i++) {
            if (parseInt(segments[i], 10) >= 0x80000000) return false;

            const isHardened = segments[i][segments[i].length - 1] === '\'';
            if (isHardened && !stillHardened) return false;
            stillHardened = isHardened;
        }

        return true;
    }
}
