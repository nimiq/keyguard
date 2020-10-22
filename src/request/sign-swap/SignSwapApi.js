/* global Nimiq */
/* global TopLevelApi */
/* global SignSwap */
/* global Errors */
/* global BitcoinUtils */

/** @extends {TopLevelApi<KeyguardRequest.SignSwapRequest>} */
class SignSwapApi extends TopLevelApi {
    /**
     * @param {KeyguardRequest.SignSwapRequest} request
     * @returns {Promise<Parsed<KeyguardRequest.SignSwapRequest>>}
     */
    async parseRequest(request) {
        if (!request) {
            throw new Errors.InvalidRequestError('request is required');
        }

        /** @type {Parsed<KeyguardRequest.SignSwapRequest>} */
        const parsedRequest = {};
        parsedRequest.appName = this.parseAppName(request.appName);
        parsedRequest.keyInfo = await this.parseKeyId(request.keyId);
        if (parsedRequest.keyInfo.type !== Nimiq.Secret.Type.ENTROPY) {
            throw new Errors.InvalidRequestError('Bitcoin is only supported with modern accounts.');
        }
        parsedRequest.keyLabel = this.parseLabel(request.keyLabel, true, 'keyLabel');

        parsedRequest.swapId = /** @type {string} */ (this.parseLabel(request.swapId, false, 'swapId'));

        if (request.fund.type === request.redeem.type) {
            throw new Errors.InvalidRequestError('Swap must be between two different currencies');
        }

        if (request.fund.type === 'NIM') {
            parsedRequest.fund = {
                type: 'NIM',
                keyPath: this.parsePath(request.fund.keyPath, 'fund.keyPath'),
                transaction: this.parseTransaction({
                    validityStartHeight: 0, // Dummy
                    data: new Uint8Array(78), // Dummy
                    ...request.fund,
                    flags: Nimiq.Transaction.Flag.CONTRACT_CREATION,
                    recipient: 'CONTRACT_CREATION',
                    recipientType: Nimiq.Account.Type.HTLC,
                }),
                /** @type {string} */
                senderLabel: (this.parseLabel(request.fund.senderLabel, false, 'fund.senderLabel')),
            };
        } else if (request.fund.type === 'BTC') {
            parsedRequest.fund = {
                type: 'BTC',
                keyPaths: this.parseBitcoinPathsArray(request.fund.keyPaths, 'fund.keyPaths'),
                value: this.parsePositiveInteger(request.fund.value, false, 'fund.value'),
                // Bitcoin transactions cannot have zero fees
                fee: this.parsePositiveInteger(request.fund.fee, false, 'fund.fee'),
            };
        } else {
            throw new Errors.InvalidRequestError('Invalid funding type');
        }

        if (request.redeem.type === 'NIM') {
            parsedRequest.redeem = {
                type: 'NIM',
                keyPath: this.parsePath(request.redeem.keyPath, 'keyPath'),
                transaction: this.parseTransaction({
                    sender: 'NQ07 0000 0000 0000 0000 0000 0000 0000 0000', // Dummy
                    validityStartHeight: 0, // Dummy
                    ...request.redeem,
                }),
                recipientLabel: /** @type {string} */ (
                    this.parseLabel(request.redeem.recipientLabel, false, 'recipientLabel')),
            };
        } else if (request.redeem.type === 'BTC') {
            parsedRequest.redeem = {
                type: 'BTC',
                keyPaths: this.parseBitcoinPathsArray(request.redeem.keyPaths, 'redeem.keyPaths'),
                value: this.parsePositiveInteger(request.redeem.value, false, 'redeem.value'),
                // Bitcoin transactions cannot have zero fees
                fee: this.parsePositiveInteger(request.redeem.fee, false, 'redeem.fee'),
            };
        } else {
            throw new Errors.InvalidRequestError('Invalid redeeming type');
        }

        // Decode HTLC contents

        // // eslint-disable-next-line no-nested-ternary
        // parsedRequest.nimHtlc = HtlcUtils.decodeNimHtlcData(parsedRequest.fund.type === 'NIM'
        //     ? parsedRequest.fund.transaction.data
        //     : request.redeem.type === 'NIM' // Additional condition required for type safety
        //         ? request.redeem.htlcData
        //         : undefined);

        // // eslint-disable-next-line no-nested-ternary
        // parsedRequest.btcHtlc = HtlcUtils.decodeBtcHtlcScript(parsedRequest.redeem.type === 'BTC'
        //     ? parsedRequest.redeem.input.witnessScript
        //     : request.fund.type === 'BTC' // Additional condition required for type safety
        //         ? BitcoinJS.Buffer.from(Nimiq.BufferUtils.fromAny(request.fund.htlcScript))
        //         : undefined);

        // Verify HTLC contents

        // Verify hashRoot is the same across HTLCs
        // if (parsedRequest.btcHtlc.hash !== parsedRequest.nimHtlc.hash) {
        //     throw new Errors.InvalidRequestError('HTLC hashes do not match');
        // }

        // if (parsedRequest.fund.type === 'BTC' && request.fund.type === 'BTC') {
        //     // Verify BTC HTLC address is correct from HTLC script
        //     const givenAddress = parsedRequest.fund.recipientOutput.address;
        //     const scriptAddress = BitcoinJS.payments.p2wsh({
        //         // @ts-ignore Type 'Uint8Array' is not assignable to type 'Buffer'.
        //         witness: [BitcoinJS.Buffer.from(request.fund.htlcScript)],
        //         network: BitcoinUtils.Network,
        //     }).address;

        //     if (givenAddress !== scriptAddress) {
        //         throw new Errors.InvalidRequestError('BTC output address does not match HTLC script');
        //     }
        // }

        // if (parsedRequest.fund.type === 'NIM') {
        //     // Check that validityStartHeight is before HTLC timeout
        //     if (parsedRequest.fund.transaction.validityStartHeight >= parsedRequest.nimHtlc.timeoutBlockHeight) {
        //         throw new Errors.InvalidRequestError(
        //             'Fund validityStartHeight must be lower than HTLC timeout block height',
        //         );
        //     }
        // }

        // if (parsedRequest.redeem.type === 'NIM') {
        //     // Check that validityStartHeight is before HTLC timeout
        //     if (parsedRequest.redeem.transaction.validityStartHeight >= parsedRequest.nimHtlc.timeoutBlockHeight) {
        //         throw new Errors.InvalidRequestError(
        //             'Redeem validityStartHeight must be lower than HTLC timeout block height',
        //         );
        //     }
        // }

        // For BTC redeem transactions, the BitcoinJS lib validates that the output script of the input matches
        // the witnessScript.

        // Funding HTLC refund address and redeeming HTLC redeem address are validated in SignSwap.js,
        // after the password was entered, before signing.

        // TODO: Validate timeouts of the two contracts
        // (Currently not possible because the NIM timeout is a block height, while the BTC timeout is a timestamp.
        // And since we cannot trust the local device time to be accurate, and we don't have a reference for NIM blocks
        // and their timestamps, we cannot compare the two.)
        // When it becomes possible to compare (with Nimiq 2.0 Albatross), the redeem HTLC must have a higher timeout
        // than the funding HTLC.

        // Parse display data
        parsedRequest.fiatCurrency = /** @type {string} */ (this.parseFiatCurrency(request.fiatCurrency, false));
        parsedRequest.nimFiatRate = /** @type {number} */ (
            this.parseNonNegativeFiniteNumber(request.nimFiatRate, false, 'nimFiatRate'));
        parsedRequest.btcFiatRate = /** @type {number} */ (
            this.parseNonNegativeFiniteNumber(request.btcFiatRate, false, 'btcFiatRate'));
        parsedRequest.serviceNetworkFee = /** @type {number} */ (
            this.parsePositiveInteger(request.serviceNetworkFee, true, 'serviceNetworkFee'));
        parsedRequest.serviceExchangeFee = /** @type {number} */ (
            this.parsePositiveInteger(request.serviceExchangeFee, true, 'serviceExchangeFee'));

        parsedRequest.nimiqAddresses = request.nimiqAddresses.map((address, index) => ({
            address: this.parseAddress(address.address, `nimiqAddresses[${index}].address`).toUserFriendlyAddress(),
            balance: this.parsePositiveInteger(address.balance, true, `nimiqAddresses[${index}].balance`),
        }));
        parsedRequest.bitcoinAccount = {
            balance: this.parsePositiveInteger(request.bitcoinAccount.balance, true, 'bitcoinAccount.balance'),
        };

        const nimAddress = parsedRequest.fund.type === 'NIM' // eslint-disable-line no-nested-ternary
            ? parsedRequest.fund.transaction.sender.toUserFriendlyAddress()
            : parsedRequest.redeem.type === 'NIM'
                ? parsedRequest.redeem.transaction.recipient.toUserFriendlyAddress()
                : ''; // Should never happen, if parsing works correctly
        if (!parsedRequest.nimiqAddresses.some(addressInfo => addressInfo.address === nimAddress)) {
            throw new Errors.InvalidRequestError(
                'The address details of the NIM address doing the swap must be provided',
            );
        }

        return parsedRequest;
    }

    /**
     * @param {any} paths
     * @param {string} name - name of the property, used in error case only
     * @returns {string[]}
     */
    parseBitcoinPathsArray(paths, name) {
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
            (path, index) => this.parseBitcoinPath(path, `${name}[${index}]`),
        );
        return requestedKeyPaths;
    }

    /**
     * @param {unknown} path
     * @param {string} name - name of the property, used in error case only
     * @returns {string}
     */
    parseBitcoinPath(path, name) {
        if (!path || typeof path !== 'string') {
            throw new Errors.InvalidRequestError(`${name} must be a string`);
        }
        if (!this.isValidBitcoinPath(path)) {
            throw new Errors.InvalidRequestError(`${name}: Invalid path`);
        }
        try {
            BitcoinUtils.parseBipFromDerivationPath(path);
        } catch (error) {
            throw new Errors.InvalidRequestError(`${name}: Invalid BIP, only BIP49 and BIP84 are supported`);
        }
        return path;
    }

    /**
     * @param {string} path
     * @returns {boolean}
     */
    isValidBitcoinPath(path) {
        if (path.match(/^m(\/[0-9]+'?)*$/) === null) return false;

        // Overflow check.
        const segments = path.split('/');
        for (let i = 1; i < segments.length; i++) {
            if (!Nimiq.NumberUtils.isUint32(parseInt(segments[i], 10))) return false;
        }

        return true;
    }

    get Handler() {
        return SignSwap;
    }
}

SignSwapApi.SESSION_STORAGE_KEY_PREFIX = 'swap_id_';
