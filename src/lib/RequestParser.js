/* global Nimiq */
/* global KeyStore */
/* global Errors */

class RequestParser { // eslint-disable-line no-unused-vars
    /**
     *
     * @param {any} request
     * @param {string} requestType
     * @returns {Promise<any>}
     */
    static async parse(request, requestType) {
        // make sure request is not undefined
        if (!request) {
            throw new Errors.InvalidRequestError('Empty request');
        }
        const parsedRequest = {};

        // every request needs to have an appName: string
        parsedRequest.appName = RequestParser._parseAppName(request.appName);

        // Create-/ImportRequest additionally needs to have a valid defaultKeyPath
        if (requestType === 'CreateRequest' || requestType === 'ImportRequest') {
            parsedRequest.defaultKeyPath = RequestParser._parsePath(request.defaultKeyPath, 'defaultKeyPath');
            if (requestType === 'ImportRequest') {
                // ImportRequest also needs to have an array of valid keys as requestedKeyPaths
                parsedRequest.requestedKeyPaths = RequestParser._parsePathsArray(
                    request.requestedKeyPaths,
                    'requestedKeyPaths',
                );
                return parsedRequest;
            }
            return parsedRequest;
        }
        // all other requests are at least SimpleRequests, so they need to have a valid keyId and a keyLabel
        parsedRequest.keyLabel = RequestParser._parseLabel(request.keyLabel);
        parsedRequest.keyInfo = await RequestParser._parseKeyId(request.keyId);
        if (requestType === 'SimpleRequest') {
            return parsedRequest;
        }
        return parsedRequest;
    }

    /**
     * @param {any} appName
     * @returns {string}
     * @private
     */
    static _parseAppName(appName) {
        if (!appName || typeof appName !== 'string') {
            throw new Errors.InvalidRequestError('appName is required');
        }
        return appName;
    }

    /**
     * @param {any} path
     * @param {string} name
     * @returns {string}
     * @private
     */
    static _parsePath(path, name) {
        if (!path) {
            throw new Errors.InvalidRequestError(`${name} is required`);
        }
        try {
            if (!path || !Nimiq.ExtendedPrivateKey.isValidPath(path)) {
                throw new Error(); // will be caught
            }
        } catch (error) {
            throw new Errors.InvalidRequestError(`${name}: Invalid path`);
        }
        return path;
    }

    /**
     * @param {any} paths
     * @param {string} name
     * @returns {string[]}
     * @private
     */
    static _parsePathsArray(paths, name) {
        if (!paths || paths.constructor !== Array) {
            throw new Errors.InvalidRequestError(`${name} is required`);
        }
        /** @type {string[]} */
        const requestedKeyPaths = [];
        paths.forEach((/** @type {any} */path) => { // eslint-disable-line arrow-parens
            if (typeof path !== 'string') {
                throw new Errors.InvalidRequestError(`${name}: path must be of type string`);
            }
            requestedKeyPaths.push(RequestParser._parsePath(path, name));
        });
        return requestedKeyPaths;
    }

    /**
     * null or string with less than 63 bytes
     * @param {any} label
     * @returns {string?}
     * @private
     */
    static _parseLabel(label) {
        if (!label) {
            return '';
        }
        if (typeof label !== 'string') {
            throw new Errors.InvalidRequestError('Label must be of type string');
        }
        return label;
    }

    /**
     * @param {any} keyId
     * @returns {Promise<KeyInfo>}
     * @private
     */
    static async _parseKeyId(keyId) {
        if (!keyId) {
            throw new Errors.InvalidRequestError('keyId is required');
        }
        const keyInfo = await KeyStore.instance.getInfo(keyId);
        if (!keyInfo) {
            throw new Errors.KeyNotFoundError();
        }
        return keyInfo;
    }
}
