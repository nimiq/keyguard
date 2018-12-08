/* global Nimiq */
/* global KeyStore */
/* global Errors */
/* global Utf8Tools */

class RequestParser { // eslint-disable-line no-unused-vars
    /**
     * @param {any} appName
     * @returns {string}
     */
    parseAppName(appName) {
        if (!appName || typeof appName !== 'string') {
            throw new Errors.InvalidRequestError('appName is required');
        }
        return appName;
    }

    /**
     * @param {any} path
     * @param {string} name
     * @returns {string}
     */
    parsePath(path, name) {
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
     */
    parsePathsArray(paths, name) {
        if (!paths || paths.constructor !== Array) {
            throw new Errors.InvalidRequestError(`${name} is required`);
        }
        /** @type {string[]} */
        const requestedKeyPaths = [];
        paths.forEach((/** @type {any} */path) => { // eslint-disable-line arrow-parens
            if (typeof path !== 'string') {
                throw new Errors.InvalidRequestError(`${name}: path must be of type string`);
            }
            requestedKeyPaths.push(this.parsePath(path, name));
        });
        return requestedKeyPaths;
    }

    /**
     * null or string with less than 63 bytes
     * @param {any} label
     * @returns {string | undefined}
     */
    parseLabel(label) {
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
     */
    async parseKeyId(keyId) {
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
     */
    parseIndicesArray(indicesArray) {
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
     */
    parseTransaction(request) {
        const accountTypes = new Set([Nimiq.Account.Type.BASIC, Nimiq.Account.Type.VESTING, Nimiq.Account.Type.HTLC]);
        let sender;
        let recipient;
        try {
            sender = new Nimiq.Address(request.sender);
        } catch (error) {
            throw new Errors.InvalidRequestError(`sender must be a valid Nimiq Address (${error.message})`);
        }
        try {
            recipient = new Nimiq.Address(request.recipient);
        } catch (error) {
            throw new Errors.InvalidRequestError(`recipient must be a valid Nimiq Address (${error.message})`);
        }

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

    /**
     * @param {any} message
     * @returns {Uint8Array}
     */
    parseMessage(message) {
        if (message instanceof Uint8Array) return message;
        if (typeof message === 'string') return Utf8Tools.stringToUtf8ByteArray(message);
        throw new Errors.InvalidRequestError('Type of message must be a String or Uint8Array');
    }

    /**
     * @param {any} url
     * @returns {string}
     */
    parseShopOrigin(url) {
        if (!url || typeof url !== 'string') {
            throw new Errors.InvalidRequestError('url must be of type string');
        }
        /** @type {URL?} */
        let parsedUrl;
        try {
            parsedUrl = new URL(url);
        } catch (error) {
            throw new Errors.InvalidRequestError(`Invalid url: ${error.message}`);
        }
        return parsedUrl.origin;
    }
}
