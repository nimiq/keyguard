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
         * @param {KeyguardRequest.ForwardRequest} request
         * @returns {KeyguardRequest.ForwardRequest}
         */
        parseOpenGsnForwardRequestRoot(request) {
            if (typeof request !== 'object' || request === null) {
                throw new Errors.InvalidRequestError('request must be an object');
            }

            this.parsePolygonAddress(request.from, 'request.from');
            this.parsePolygonAddress(request.to, 'request.to');

            if (request.value !== '0') {
                throw new Errors.InvalidRequestError('Request `value` must be zero');
            }

            const digitsOnlyRegex = /^[0-9]+$/;

            if (!digitsOnlyRegex.test(request.gas)) {
                throw new Errors.InvalidRequestError('Invalid request.gas');
            }

            if (!digitsOnlyRegex.test(request.nonce)) {
                throw new Errors.InvalidRequestError('Invalid request.nonce');
            }

            if (!digitsOnlyRegex.test(request.validUntil)) {
                throw new Errors.InvalidRequestError('Invalid request.validUntil');
            }

            return request;
        }

        /**
         *
         * @param {KeyguardRequest.RelayData} relayData
         * @returns {KeyguardRequest.RelayData}
         */
        parseOpenGsnRelayData(relayData) {
            if (typeof relayData !== 'object' || relayData === null) {
                throw new Errors.InvalidRequestError('relayData must be an object');
            }

            this.parsePolygonAddress(relayData.forwarder, 'relayData.forwarder');
            this.parsePolygonAddress(relayData.paymaster, 'relayData.paymaster');
            this.parsePolygonAddress(relayData.relayWorker, 'relayData.relayWorker');

            const digitsOnlyRegex = /^[0-9]+$/;

            if (!digitsOnlyRegex.test(relayData.baseRelayFee)) {
                throw new Errors.InvalidRequestError('Invalid relayData.baseRelayFee');
            }

            if (!digitsOnlyRegex.test(relayData.clientId)) {
                throw new Errors.InvalidRequestError('Invalid relayData.clientId');
            }

            if (!digitsOnlyRegex.test(relayData.gasPrice)) {
                throw new Errors.InvalidRequestError('Invalid relayData.gasPrice');
            }

            if (!digitsOnlyRegex.test(relayData.pctRelayFee)) {
                throw new Errors.InvalidRequestError('Invalid relayData.pctRelayFee');
            }

            if (relayData.paymasterData !== '0x') {
                throw new Errors.InvalidRequestError('Invalid relayData.paymasterData, must be empty ("0x")');
            }

            return relayData;
        }
    }

    return Clazz;
}
