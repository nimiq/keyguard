/* global ethers */
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
         * @param {unknown} request
         * @returns {KeyguardRequest.OpenGsnForwardRequest}
         */
        parseOpenGsnForwardRequestRoot(request) {
            if (typeof request !== 'object' || request === null) {
                throw new Errors.InvalidRequestError('request must be an object');
            }
            /** @type {KeyguardRequest.OpenGsnForwardRequest} */
            const forwardRequest = (request);

            this.parsePolygonAddress(forwardRequest.from, 'request.from');
            this.parsePolygonAddress(forwardRequest.to, 'request.to');

            if (forwardRequest.value !== '0') {
                throw new Errors.InvalidRequestError('Request `value` must be zero');
            }

            this.parseNonNegativeIntegerString(forwardRequest.gas, 'request.gas');
            this.parseNonNegativeIntegerString(forwardRequest.nonce, 'request.nonce');
            this.parseNonNegativeIntegerString(forwardRequest.validUntil, 'request.validUntil');

            this.parseHexString(forwardRequest.data, 'request.data');

            return forwardRequest;
        }

        /**
         * @param {unknown} relayData
         * @returns {KeyguardRequest.OpenGsnRelayData}
         */
        parseOpenGsnRelayData(relayData) {
            if (typeof relayData !== 'object' || relayData === null) {
                throw new Errors.InvalidRequestError('relayData must be an object');
            }
            /** @type {KeyguardRequest.OpenGsnRelayData} */
            const parsedRelayData = (relayData);

            this.parsePolygonAddress(parsedRelayData.forwarder, 'relayData.forwarder');
            this.parsePolygonAddress(parsedRelayData.paymaster, 'relayData.paymaster');
            this.parsePolygonAddress(parsedRelayData.relayWorker, 'relayData.relayWorker');

            this.parseNonNegativeIntegerString(parsedRelayData.baseRelayFee, 'relayData.baseRelayFee');
            this.parseNonNegativeIntegerString(parsedRelayData.clientId, 'relayData.clientId');
            this.parseNonNegativeIntegerString(parsedRelayData.gasPrice, 'relayData.gasPrice');
            this.parseNonNegativeIntegerString(parsedRelayData.pctRelayFee, 'relayData.pctRelayFee');

            if (parsedRelayData.paymasterData !== '0x') {
                throw new Errors.InvalidRequestError('Invalid relayData.paymasterData, must be empty ("0x")');
            }

            return parsedRelayData;
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
         * @returns {string}
         */
        parseHexString(value, name) {
            if (typeof value !== 'string' || !ethers.utils.isHexString(value)) {
                throw new Errors.InvalidRequestError(`${name} must be a hex string`);
            }
            return value;
        }
    }

    return Clazz;
}
