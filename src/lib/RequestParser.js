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
            throw new Errors.InvalidRequestError('appName must be a string');
        }
        return appName.substring(0, 24);
    }

    /**
     * @param {any} path
     * @param {string} name -  name of the property, used in error case only
     * @returns {string}
     */
    parsePath(path, name) {
        if (!path || typeof path !== 'string') {
            throw new Errors.InvalidRequestError(`${name} must be a string`);
        }
        if (!Nimiq.ExtendedPrivateKey.isValidPath(path)) {
            throw new Errors.InvalidRequestError(`${name}: Invalid path`);
        }
        return path;
    }

    /**
     * @param {any} paths
     * @param {string} name - name of the property, used in error case only
     * @returns {string[]}
     */
    parsePathsArray(paths, name) {
        if (!paths || !Array.isArray(paths)) {
            throw new Errors.InvalidRequestError(`${name} must be an array`);
        }
        if (paths.length === 0) {
            throw new Errors.InvalidRequestError(`${name} must not be empty`);
        }
        const requestedKeyPaths = paths.map(
            /**
             * @param {any} path
             * @param {number} index
             * @returns {string}
             */
            (path, index) => this.parsePath(path, `${name}[${index}]`),
        );
        return requestedKeyPaths;
    }

    /**
     * @param {any} label
     * @returns {string | undefined}
     */
    parseLabel(label) {
        if (!label) {
            return undefined;
        }
        if (typeof label !== 'string') {
            throw new Errors.InvalidRequestError('Label must be a string');
        }
        if (label.length === 0) {
            return undefined;
        }
        return label;
    }

    /**
     * @param {any} keyId
     * @returns {Promise<KeyInfo>}
     */
    async parseKeyId(keyId) {
        if (!keyId || typeof keyId !== 'string') {
            throw new Errors.InvalidRequestError('keyId must be a string');
        }
        const keyInfo = await KeyStore.instance.getInfo(keyId);
        if (!keyInfo) {
            throw new Errors.KeyNotFoundError();
        }
        return keyInfo;
    }

    /**
     * @param {any} indicesArray
     * @returns {string[]}
     */
    parseIndicesArray(indicesArray) {
        if (!indicesArray || !Array.isArray(indicesArray)) {
            throw new Errors.InvalidRequestError('indicesToDerive must be an array');
        }
        if (indicesArray.length === 0) {
            throw new Errors.InvalidRequestError('indicesToDerive must not be empty');
        }
        indicesArray.forEach(/** @param {any} index */index => {
            if (typeof index !== 'string') {
                throw new Errors.InvalidRequestError('indicesToDerive must consist of strings');
            }
            if (!Nimiq.ExtendedPrivateKey.isValidPath(`m/${index}`)) {
                throw new Errors.InvalidRequestError(
                    'indicesToDerive strings must start with a number and end with a \'',
                );
            }
        });
        return indicesArray;
    }

    /**
     * @param {any} object
     * @returns {Nimiq.ExtendedTransaction}
     */
    parseTransaction(object) {
        const accountTypes = new Set([Nimiq.Account.Type.BASIC, Nimiq.Account.Type.VESTING, Nimiq.Account.Type.HTLC]);
        if (!object || typeof object !== 'object' || object === null) {
            throw new Errors.InvalidRequestError('Request must be an object');
        }

        const sender = this.parseAddress(object.sender, 'sender');
        const senderType = object.senderType || Nimiq.Account.Type.BASIC;
        if (!accountTypes.has(senderType)) {
            throw new Errors.InvalidRequestError('Invalid sender type');
        }

        const recipient = this.parseAddress(object.recipient, 'recipient');
        const recipientType = object.recipientType || Nimiq.Account.Type.BASIC;
        if (!accountTypes.has(recipientType)) {
            throw new Errors.InvalidRequestError('Invalid sender type');
        }

        if (sender.equals(recipient)) {
            throw new Errors.InvalidRequestError('Sender and recipient must not match');
        }

        const flags = object.flags || Nimiq.Transaction.Flag.NONE;
        const data = object.data || new Uint8Array(0);
        return new Nimiq.ExtendedTransaction(
            sender,
            senderType,
            recipient,
            recipientType,
            object.value,
            object.fee,
            object.validityStartHeight,
            flags,
            data,
        );
    }

    /**
     * @param {any} address
     * @param {string} name
     * @returns {Nimiq.Address}
     */
    parseAddress(address, name) {
        try {
            const nqAddress = new Nimiq.Address(address);
            return nqAddress;
        } catch (error) {
            throw new Errors.InvalidRequestError(`${name} must be a valid Nimiq Address (${error.message})`);
        }
    }

    /**
     * @param {any} message
     * @returns {Uint8Array}
     */
    parseMessage(message) {
        if (typeof message === 'string') message = Utf8Tools.stringToUtf8ByteArray(message);
        if (!(message instanceof Uint8Array)) {
            throw new Errors.InvalidRequestError('message must be a String or Uint8Array');
        }
        if (message.length < 255) return message;
        throw new Errors.InvalidRequestError('message must not exceed 255 bytes');
    }

    /**
     * @param {any} url
     * @returns {string}
     */
    parseShopOrigin(url) {
        if (!url || typeof url !== 'string') {
            throw new Errors.InvalidRequestError('shopOrigin must be of type string');
        }
        try {
            const parsedUrl = new URL(url);
            return parsedUrl.origin;
        } catch (error) {
            throw new Errors.InvalidRequestError(`Invalid url: ${error.message}`);
        }
    }

    /**
     * @param {any} url
     * @returns {URL}
     */
    parseShopLogoUrl(url) {
        if (!url || typeof url !== 'string') {
            throw new Errors.InvalidRequestError('shopOrigin must be of type string');
        }
        try {
            const parsedUrl = new URL(url);
            return parsedUrl;
        } catch (error) {
            throw new Errors.InvalidRequestError(`Invalid url: ${error.message}`);
        }
    }

    /**
     *
     * @param {any} value
     * @returns {number | undefined}
     */
    parseNumber(value) {
        if (!value) return undefined;
        if (typeof value !== 'number') return undefined;
        return value;
    }
}
