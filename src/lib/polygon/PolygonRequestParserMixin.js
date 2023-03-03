/* global Errors */
/* global PolygonUtils */

/**
 * @template {{}} T
 * @typedef {new (...args: any[]) => T} PolygonRequestParserMixinConstructor;
 */

// eslint-disable-next-line valid-jsdoc
/**
 * A mixin to add Polygon-related request parsers to a RequestParser class.
 *
 * @template {PolygonRequestParserMixinConstructor<RequestParser>} TBase
 * @param {TBase} clazz
 */
function PolygonRequestParserMixin(clazz) { // eslint-disable-line no-unused-vars
    class Clazz extends clazz {
        /**
         * @param {string} path
         * @param {string} name
         * @returns {string}
         */
        parsePolygonPath(path, name) {
            if (!PolygonUtils.isValidPath(path)) {
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
            if (typeof address !== 'string' || address.substring(0, 2) !== '0x' || address.substring(2).length !== 40) {
                throw new Errors.InvalidRequestError(`${name} must be a valid Polygon address`);
            }
            return address;
        }

        /**
         *
         * @param {KeyguardRequest.PolygonTransactionInfo} request
         * @returns {KeyguardRequest.RelayData}
         */
        parseOpenGsnRelayData(request) {
            // TODO: Parse it
            return request.relayData;
        }
    }

    return Clazz;
}
