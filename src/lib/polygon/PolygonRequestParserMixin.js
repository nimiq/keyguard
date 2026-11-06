/* global ethers */
/* global Errors */
/* global PolygonUtils */

/**
 * @template {{}} T
 * @typedef {new (...args: any[]) => T} PolygonRequestParserMixinConstructor;
 */

/**
 * A mixin to add Polygon-related request parsers to a RequestParser class.
 *
 * @template {PolygonRequestParserMixinConstructor<RequestParser>} TBase
 * @param {TBase} clazz
 */
function PolygonRequestParserMixin(clazz) { // eslint-disable-line no-unused-vars
    class Clazz extends clazz {
        /**
         * @param {unknown} path
         * @param {string} name
         * @returns {string}
         */
        parsePolygonPath(path, name) {
            if (typeof path !== 'string' || !PolygonUtils.isValidPath(path)) {
                throw new Errors.InvalidRequestError(`${name}: Invalid path`);
            }

            return path;
        }

        /**
         * @param {unknown} address
         * @param {string} name
         * @returns {string}
         */
        parsePolygonAddress(address, name) {
            if (typeof address !== 'string' || !ethers.utils.isAddress(address)) {
                throw new Errors.InvalidRequestError(`${name} must be a valid Polygon address`);
            }
            return address;
        }

        /**
         * Stricter than parsePolygonAddress: only the 0x-prefixed form, and returns the address with its checksum.
         *
         * @param {unknown} address
         * @param {string} name
         * @returns {string}
         */
        parseChecksummedPolygonAddress(address, name) {
            if (typeof address !== 'string' || !/^0x[0-9a-fA-F]{40}$/.test(address)) {
                throw new Errors.InvalidRequestError(`${name} must be a valid Polygon address`);
            }
            return ethers.utils.getAddress(this.parsePolygonAddress(address, name));
        }

        /**
         * @param {unknown} value
         * @param {string} name - name of the property, used in error case only
         * @returns {string}
         */
        parseNonNegativeIntegerString(value, name) {
            if (typeof value !== 'string' || !/^\d+$/.test(value)) {
                throw new Errors.InvalidRequestError(`${name} must be a non-negative integer string`);
            }
            return value;
        }

        /**
         * @param {unknown} value
         * @param {string} name - name of the property, used in error case only
         * @returns {string} - In canonical form, without leading zeros
         */
        parseUint256String(value, name) {
            const parsed = ethers.BigNumber.from(this.parseNonNegativeIntegerString(value, name));
            if (parsed.gt(ethers.constants.MaxUint256)) {
                throw new Errors.InvalidRequestError(`${name} must fit into 256 bits`);
            }
            return parsed.toString();
        }

        /**
         * For amounts and fees, which get displayed and added up as numbers.
         *
         * @param {unknown} value
         * @param {string} name - name of the property, used in error case only
         * @returns {string} - In canonical form, without leading zeros
         */
        parseSafeIntegerString(value, name) {
            const parsed = BigInt(this.parseNonNegativeIntegerString(value, name));
            if (parsed > BigInt(Number.MAX_SAFE_INTEGER)) {
                throw new Errors.InvalidRequestError(`${name} must be a safe integer`);
            }
            return parsed.toString();
        }

        /**
         * @param {unknown} tokenNonce
         * @param {string} name - name of the property, used in error case only
         * @returns {number}
         */
        parseTokenNonce(tokenNonce, name) {
            const parsed = this.parsePositiveInteger(tokenNonce, true, name);
            if (!Number.isSafeInteger(parsed)) {
                throw new Errors.InvalidRequestError(`${name} must be a safe integer`);
            }
            return parsed;
        }

        /**
         * @param {unknown} value
         * @param {string} name - name of the property, used in error case only
         * @returns {string}
         */
        parseBytes32(value, name) {
            if (typeof value !== 'string' || !/^0x[0-9a-fA-F]{64}$/.test(value)) {
                throw new Errors.InvalidRequestError(`${name} must be 32 bytes as 0x-prefixed hex`);
            }
            return value.toLowerCase();
        }
    }

    return Clazz;
}
