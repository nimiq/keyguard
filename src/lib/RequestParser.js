/* global Nimiq */
/* global KeyStore */
/* global AccountStore */
/* global Errors */
/* global Utf8Tools */
/* global CONFIG */

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
     * @param {string} name - name of the property, used in error case only
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
     * @param {boolean} [allowEmpty = true]
     * @param {string} [parameterName = 'Label']
     * @returns {string | undefined}
     */
    parseLabel(label, allowEmpty = true, parameterName = 'Label') {
        if (!label) {
            if (!allowEmpty) throw new Errors.InvalidRequestError(`${parameterName} must not be empty`);
            return undefined;
        }
        if (typeof label !== 'string') {
            throw new Errors.InvalidRequestError(`${parameterName} must be a string`);
        }
        if (Utf8Tools.stringToUtf8ByteArray(label).byteLength > 63) {
            throw new Errors.InvalidRequestError(`${parameterName} must not exceed 63 bytes`);
        }
        // eslint-disable-next-line no-control-regex
        if (/[\x00-\x1F\x7F]/.test(label)) {
            throw new Errors.InvalidRequestError('Label cannot contain control characters');
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

        const keyInfo = this.isLegacyKeyId(keyId)
            ? await AccountStore.instance.getInfo(keyId)
            : await KeyStore.instance.getInfo(keyId);

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
     * @returns {Nimiq.Transaction}
     */
    parseTransaction(object) {
        if (!object || typeof object !== 'object') {
            throw new Errors.InvalidRequestError('Transaction info must be an object');
        }

        const accountTypes = new Set([
            Nimiq.AccountType.Basic,
            Nimiq.AccountType.Vesting,
            Nimiq.AccountType.HTLC,
            Nimiq.AccountType.Staking,
        ]);

        const sender = this.parseAddress(object.sender, 'sender', false);
        const senderType = object.senderType || Nimiq.AccountType.Basic;
        if (!accountTypes.has(senderType)) {
            throw new Errors.InvalidRequestError('Invalid sender type');
        }

        const senderData = typeof object.senderData === 'string'
            ? Utf8Tools.stringToUtf8ByteArray(object.senderData)
            : object.senderData || new Uint8Array(0);

        const recipient = this.parseAddress(object.recipient, 'recipient', true);
        const recipientType = object.recipientType || Nimiq.AccountType.Basic;
        if (!accountTypes.has(recipientType)) {
            throw new Errors.InvalidRequestError('Invalid recipient type');
        }

        const recipientData = typeof object.recipientData === 'string'
            ? Utf8Tools.stringToUtf8ByteArray(object.recipientData)
            : object.recipientData || new Uint8Array(0);

        const flags = object.flags || Nimiq.TransactionFlag.None;

        if (
            flags === Nimiq.TransactionFlag.None
            && recipientType !== Nimiq.AccountType.Staking
            && recipientData.byteLength > 64
        ) {
            throw new Errors.InvalidRequestError('Data must not exceed 64 bytes');
        }
        if (flags === Nimiq.TransactionFlag.ContractCreation
                && recipientData.byteLength !== 82 // HTLC
                && recipientData.byteLength !== 28 // Vesting
                && recipientData.byteLength !== 44 // Vesting
                && recipientData.byteLength !== 52) { // Vesting
            throw new Errors.InvalidRequestError(
                'Contract creation data must be 82 bytes for HTLC and 28, 44, or 52 bytes for vesting contracts',
            );
        }
        if (
            flags === Nimiq.TransactionFlag.ContractCreation
            && recipient !== 'CONTRACT_CREATION'
        ) {
            throw new Errors.InvalidRequestError(
                'Transaction recipient must be "CONTRACT_CREATION" when creating contracts',
            );
        }

        try {
            let tx = new Nimiq.Transaction(
                sender,
                senderType,
                senderData,
                recipient === 'CONTRACT_CREATION' ? new Nimiq.Address(new Uint8Array(20)) : recipient,
                recipientType,
                recipientData,
                BigInt(object.value),
                BigInt(object.fee),
                flags,
                object.validityStartHeight,
                CONFIG.NIMIQ_NETWORK_ID,
            );
            if (recipient === 'CONTRACT_CREATION') {
                // Calculate the contract address of the HTLC that gets created and recreate the transaction
                // with that address as the recipient:
                const contractAddress = new Nimiq.Address(Nimiq.BufferUtils.fromHex(tx.hash()));
                tx = new Nimiq.Transaction(
                    tx.sender, tx.senderType, tx.senderData,
                    contractAddress, tx.recipientType, tx.data,
                    tx.value, tx.fee,
                    tx.flags, tx.validityStartHeight, tx.networkId,
                );
            }

            // Allow sender=recipient for staking transactions (e.g., retire stake)
            if (tx.sender.equals(tx.recipient)
                && tx.senderType !== Nimiq.AccountType.Staking
                && tx.recipientType !== Nimiq.AccountType.Staking) {
                throw new Error('Sender and recipient must not match');
            }

            return tx;
        } catch (error) {
            throw new Errors.InvalidRequestError(error instanceof Error ? error : String(error));
        }
    }

    /**
     * @template {boolean} T
     * @param {any} address
     * @param {string} name
     * @param {T} allowContractCreation
     * @returns {Nimiq.Address | (T extends true ?  'CONTRACT_CREATION' : never)}
     */
    parseAddress(address, name, allowContractCreation) {
        if (allowContractCreation && address === 'CONTRACT_CREATION') {
            // @ts-expect-error Type '"CONTRACT_CREATION"' is not assignable to type
            //                  'Address | (T extends true ? "CONTRACT_CREATION" : never)'
            return 'CONTRACT_CREATION';
        }

        try {
            if (typeof address === 'string') {
                return Nimiq.Address.fromString(address);
            }
            return new Nimiq.Address(address);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Errors.InvalidRequestError(`${name} must be a valid Nimiq address (${errorMessage})`);
        }
    }

    /**
     * When passed in as a string, the message is parsed as a string and checked for
     * control characters. When passed in as an Uint8Array, the message is handled as
     * binary data and only ever displayed as HEX.
     *
     * @param {any} message
     * @param {boolean} [forceString]
     * @returns {string | Uint8Array}
     */
    parseMessage(message, forceString = false) {
        if (typeof message === 'string') {
            const messageBytes = Utf8Tools.stringToUtf8ByteArray(message);
            if (!Utf8Tools.isValidUtf8(messageBytes)) {
                throw new Errors.InvalidRequestError('message cannot include control characters');
            }
        } else if (forceString) {
            throw new Errors.InvalidRequestError('message must be a string');
        } else if (!(message instanceof Uint8Array)) {
            throw new Errors.InvalidRequestError('message must be a string or Uint8Array');
        }
        return message;
    }

    /**
     * @param {unknown} url
     * @returns {string}
     */
    parseShopOrigin(url) {
        if (!url || typeof url !== 'string') {
            throw new Errors.InvalidRequestError('shopOrigin must be of type string');
        }
        try {
            const parsedUrl = this._parseUrl(url, 'shopOrigin');
            return parsedUrl.origin;
        } catch (error) {
            throw new Errors.InvalidRequestError(error instanceof Error ? error : String(error));
        }
    }

    /**
     * @param {any} url
     * @param {boolean} allowEmpty
     * @param {string} name
     * @returns {URL | undefined}
     */
    parseLogoUrl(url, allowEmpty, name) {
        if (!url && allowEmpty) return undefined;
        if (typeof url !== 'string') {
            throw new Errors.InvalidRequestError(`${name} must be of type string`);
        }
        try {
            return this._parseUrl(url, name);
        } catch (error) {
            throw new Errors.InvalidRequestError(error instanceof Error ? error : String(error));
        }
    }

    /**
     * @param {unknown} value
     * @returns {boolean}
     */
    parseBoolean(value) {
        return !!value;
    }

    /**
     * Checks that a given value is a non-negative finite number.
     * @param {any} value
     * @param {boolean} [allowUndefined=true]
     * @param {string} [parameterName='Value']
     * @returns {number | undefined}
     */
    parseNonNegativeFiniteNumber(value, allowUndefined = true, parameterName = 'Value') {
        if (value === undefined && allowUndefined) {
            return undefined;
        }
        if (typeof value !== 'number' || value < 0 || !Number.isFinite(value)) {
            throw new Errors.InvalidRequestError(`${parameterName} must be a non-negative finite number.`);
        }
        return value;
    }

    /**
     * @param {unknown} int
     * @param {boolean} [allowZero=true]
     * @param {string} [parameterName='Value']
     * @returns {number}
     */
    parsePositiveInteger(int, allowZero = true, parameterName = 'Value') {
        const value = /** @type {number} */ (this.parseNonNegativeFiniteNumber(int, false, parameterName));
        if (value === 0 && !allowZero) {
            throw new Errors.InvalidRequestError(`${parameterName} must not be 0`);
        }
        if (Math.round(value) !== value) {
            throw new Errors.InvalidRequestError(`${parameterName} must be a whole number (integer)`);
        }
        return value;
    }

    /**
     * Parses that a currency info is valid.
     * @param {unknown} fiatCurrency
     * @param {boolean} [allowUndefined=true]
     * @returns {string | undefined}
     */
    parseFiatCurrency(fiatCurrency, allowUndefined = true) {
        if (fiatCurrency === undefined && allowUndefined) {
            return undefined;
        }

        // parse currency code
        if (typeof fiatCurrency !== 'string'
            || !/^[a-z]{3}$/i.test(fiatCurrency)) {
            throw new Errors.InvalidRequestError(`Invalid currency code ${fiatCurrency}`);
        }
        return fiatCurrency.toUpperCase();
    }

    /**
     * Parses that a value is a valid vendor markup.
     * @param {unknown} value
     * @returns {number | undefined}
     */
    parseVendorMarkup(value) {
        if (value === undefined) {
            return undefined;
        }
        if (typeof value !== 'number' || value <= -1 || !Number.isFinite(value)) {
            throw new Errors.InvalidRequestError('Vendor markup must be a finite number > -1.');
        }
        return value;
    }

    /**
     * @param {string} id
     * @returns {boolean}
     */
    isLegacyKeyId(id) {
        return id.substr(0, 2) === 'NQ' && id.length === 44;
    }

    /**
     * @param {string} url
     * @param {string} parameterName
     * @returns {URL}
     */
    _parseUrl(url, parameterName) {
        const parsedUrl = new URL(url);
        const whitelistedProtocols = ['https:', 'http:', 'chrome-extension:', 'moz-extension:', 'data:'];
        if (!whitelistedProtocols.includes(parsedUrl.protocol)) {
            const protocolString = whitelistedProtocols.join(', ');
            throw new Errors.InvalidRequestError(`${parameterName} protocol must be one of: ${protocolString}`);
        }
        return parsedUrl;
    }
}
