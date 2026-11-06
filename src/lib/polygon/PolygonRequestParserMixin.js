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
    }

    return Clazz;
}
