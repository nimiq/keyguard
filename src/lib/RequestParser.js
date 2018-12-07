/* global Nimiq */
/* global KeyStore */
/* global Key */
/* global Errors */

class RequestParser { // eslint-disable-line no-unused-vars
    /**
     * @param {any} request - Unparsed request object.
     * @param {string} requestType - The type of the inoput request against which must be verified.
     * @param {Function} parseLayout - function to invoke in case a request requires different layouts
     * @returns {Promise<any>}
     */
    static async parse(request, requestType, parseLayout = /** @param {any} x */x => x) {
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

        // DeriveAddressRequest must not be requested for a legacy key.
        // It needs to have baseKeyPath tp be a valid path and
        // indicesToDerive to be an array of Strings of the form 1'|2'|3'|...
        if (requestType === 'DeriveAddressRequest') {
            if (parsedRequest.keyInfo.type === Key.Type.LEGACY) {
                throw new Errors.InvalidRequestError('Cannot derive addresses for single-account wallets');
            }
            parsedRequest.baseKeyPath = RequestParser._parsePath(request.baseKeyPath, 'baseKeyPath');
            parsedRequest.indicesToDerive = RequestParser._parseIndicesArray(request.indicesToDerive);
            return parsedRequest;
        }

        // SignMessageRequest and SignTransactionRequest both needs to have a valid keyPath
        if (requestType === 'SignTransactionRequest' || requestType === 'SignMessageRequest') {
            parsedRequest.keyPath = RequestParser._parsePath(request.keyPath, 'keyPath');
            if (requestType === 'SignTransactionRequest') {
                parsedRequest.senderLabel = RequestParser._parseLabel(request.senderLabel);
                parsedRequest.recipientLabel = RequestParser._parseLabel(request.recipientLabel);
                parsedRequest.transaction = RequestParser._parseTransaction(request);
                parsedRequest.layout = parseLayout(request.layout);
                if (parsedRequest.layout === 'checkout') {
                    parsedRequest.shopOrigin = request.shopOrigin; // TODO verify
                } else {
                    parsedRequest.shopOrigin = undefined;
                }
                return parsedRequest;
            }
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

    /**
     *
     * @param {any} indicesArray
     * @returns {string[]}
     * @private
     */
    static _parseIndicesArray(indicesArray) {
        if (!indicesArray || indicesArray.constructor !== Array) {
            throw new Errors.InvalidRequestError('indicesToDerive is required');
        }
        indicesArray.forEach((/** @type {any} */index) => { // eslint-disable-line arrow-parens
            if (typeof index !== 'string') {
                throw new Errors.InvalidRequestError('Each index of indicesToDerive must be a string.');
            }
            if (!index.endsWith("'")) {
                throw new Errors.InvalidRequestError('Each index of IndicesToDerive must end with a \'.');
            }
            if (`${(parseInt(index.substr(0, index.length - 1), 10))}'` !== index) {
                throw new Errors.InvalidRequestError('Each index of indicesToDerive must start with a number.');
            }
        });
        return indicesArray;
    }

    /**
     * @param {KeyguardRequest.SignTransactionRequest} request
     * @returns {Nimiq.ExtendedTransaction}
     * @private
     */
    static _parseTransaction(request) {
        const accountTypes = new Set([Nimiq.Account.Type.BASIC, Nimiq.Account.Type.VESTING, Nimiq.Account.Type.HTLC]);

        const sender = new Nimiq.Address(request.sender); // TODO verify
        const recipient = new Nimiq.Address(request.recipient); // TODO verify
        if (sender.equals(recipient)) {
            throw new Errors.InvalidRequestError('Sender and recipient must not match');
        }

        const senderType = request.senderType || Nimiq.Account.Type.BASIC;
        if (!accountTypes.has(senderType)) {
            throw new Errors.InvalidRequestError('Invalid sender type');
        }
        const recipientType = request.recipientType || Nimiq.Account.Type.BASIC;
        if (!accountTypes.has(recipientType)) {
            throw new Errors.InvalidRequestError('Invalid sender type');
        }

        const flags = request.flags || Nimiq.Transaction.Flag.NONE; // TODO verify
        const data = request.data || new Uint8Array(0); // TODO verify

        const networkId = request.networkId || Nimiq.GenesisConfig.NETWORK_ID;
        if (networkId !== Nimiq.GenesisConfig.NETWORK_ID) {
            throw new Errors.InvalidRequestError('Transaction is not valid in the specified network.');
        }
        return new Nimiq.ExtendedTransaction(
            sender,
            senderType,
            recipient,
            recipientType,
            request.value,
            request.fee,
            request.validityStartHeight,
            flags,
            data,
            new Uint8Array(0), // proof
            networkId,
        );
    }
}
