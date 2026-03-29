/* global Nimiq */
/* global I18n */
/* global TopLevelApi */
/* global SignTransaction */
/* global Errors */

/** @extends {TopLevelApi<KeyguardRequest.SignTransactionRequest>} */
class SignTransactionApi extends TopLevelApi {
    /**
     * @param {KeyguardRequest.SignTransactionRequest} request
     * @returns {Promise<Parsed<KeyguardRequest.SignTransactionRequest>>}
     */
    async parseRequest(request) {
        if (!request) {
            throw new Errors.InvalidRequestError('request is required');
        }

        /** @type {Parsed<KeyguardRequest.SignTransactionRequest>} */
        const parsedRequest = {};
        parsedRequest.appName = this.parseAppName(request.appName);
        parsedRequest.keyInfo = await this.parseKeyId(request.keyId);
        parsedRequest.keyLabel = this.parseLabel(request.keyLabel);
        parsedRequest.keyPath = this.parsePath(request.keyPath, 'keyPath');
        parsedRequest.layout = this.parseLayout(request.layout);

        // Parse transactions - either from array or from single-tx fields
        if ('transactions' in request && Array.isArray(request.transactions)) {
            // Multi-transaction mode - only allowed for standard layout
            if (parsedRequest.layout !== SignTransactionApi.Layouts.STANDARD) {
                throw new Errors.InvalidRequestError(
                    'Multiple transactions are only supported with standard layout',
                );
            }
            if (request.transactions.length === 0) {
                throw new Errors.InvalidRequestError('transactions array must not be empty');
            }

            const firstTx = request.transactions[0];

            // Check if transactions are serialized (Uint8Array[]) or data objects (TransactionData[])
            // TransactionData objects have specific fields like 'recipient', 'value', 'fee'
            // Serialized transactions are Uint8Array or plain objects with numeric keys
            const isTransactionDataFormat = firstTx && typeof firstTx === 'object'
                && ('recipient' in firstTx || 'value' in firstTx || 'fee' in firstTx);

            if (!isTransactionDataFormat) {
                // Serialized transaction path (like signStaking)
                parsedRequest.transactions = request.transactions.map(
                    /** @param {Uint8Array} serializedTx */
                    serializedTx => {
                        // Validate that all transactions are in the same serialized format (not TransactionData)
                        if (!serializedTx || typeof serializedTx !== 'object') {
                            throw new Errors.InvalidRequestError('All transactions must be Uint8Array');
                        }
                        if ('recipient' in serializedTx || 'value' in serializedTx || 'fee' in serializedTx) {
                            throw new Errors.InvalidRequestError('Mixed transaction formats not allowed');
                        }
                        // Ensure we have a proper Uint8Array (postMessage can convert it to plain object)
                        const txBytes = serializedTx instanceof Uint8Array
                            ? serializedTx
                            : new Uint8Array(Object.values(serializedTx));

                        // Deserialize using Nimiq's fromAny method
                        const tx = Nimiq.Transaction.fromAny(Nimiq.BufferUtils.toHex(txBytes));

                        // Validate transaction constraints (same as parseTransaction)
                        if (tx.sender.equals(tx.recipient)
                            && tx.senderType !== Nimiq.AccountType.Staking
                            && tx.recipientType !== Nimiq.AccountType.Staking) {
                            throw new Errors.InvalidRequestError('Sender and recipient must not match');
                        }

                        return tx;
                    },
                );

                // Store plain representations for UI display
                parsedRequest.plain = parsedRequest.transactions.map(tx => tx.toPlain());

                // For single-item arrays, extract senderLabel for backward compatibility
                if (request.transactions.length === 1) {
                    parsedRequest.senderLabel = this.parseLabel(request.senderLabel);
                }
            } else {
                // EXISTING: TransactionData object path
                parsedRequest.transactions = request.transactions.map(
                    /** @param {KeyguardRequest.TransactionData} tx */
                    tx => this.parseTransaction(tx),
                );

                // For single-item transactions array, extract senderLabel for single-tx view compatibility
                if (request.transactions.length === 1) {
                    parsedRequest.senderLabel = this.parseLabel(request.transactions[0].senderLabel);
                }
            }
        } else {
            // Single transaction mode (backward compatible)
            parsedRequest.senderLabel = this.parseLabel(request.senderLabel);
            parsedRequest.transactions = [this.parseTransaction(request)];
        }

        // Parse layout-specific fields
        if ((!request.layout || request.layout === SignTransactionApi.Layouts.STANDARD)
            && parsedRequest.layout === SignTransactionApi.Layouts.STANDARD) {
            parsedRequest.recipientLabel = this.parseLabel(request.recipientLabel);
        } else if (request.layout === SignTransactionApi.Layouts.CHECKOUT
            && parsedRequest.layout === SignTransactionApi.Layouts.CHECKOUT) {
            parsedRequest.shopOrigin = this.parseShopOrigin(request.shopOrigin);
            parsedRequest.shopLogoUrl = this.parseLogoUrl(request.shopLogoUrl, true, 'shopLogoUrl');
            if (parsedRequest.shopLogoUrl && parsedRequest.shopLogoUrl.origin !== parsedRequest.shopOrigin) {
                throw new Errors.InvalidRequestError('origin of shopLogoUrl must be same as shopOrigin');
            }

            parsedRequest.fiatAmount = this.parseNonNegativeFiniteNumber(request.fiatAmount);
            parsedRequest.fiatCurrency = this.parseFiatCurrency(request.fiatCurrency);
            if ((parsedRequest.fiatAmount === undefined) !== (parsedRequest.fiatCurrency === undefined)) {
                throw new Errors.InvalidRequestError('fiatAmount and fiatCurrency must be both defined or undefined.');
            }

            parsedRequest.vendorMarkup = this.parseVendorMarkup(request.vendorMarkup);

            parsedRequest.time = this.parseNonNegativeFiniteNumber(request.time);
            parsedRequest.expires = this.parseNonNegativeFiniteNumber(request.expires);
            if (parsedRequest.expires !== undefined) {
                if (parsedRequest.time === undefined) {
                    throw new Errors.InvalidRequestError('If `expires` is given, `time` must be given too.');
                } else if (parsedRequest.time >= parsedRequest.expires) {
                    throw new Errors.InvalidRequestError('`expires` must be greater than `time`');
                }
            }
        } else if (request.layout === SignTransactionApi.Layouts.CASHLINK
            && parsedRequest.layout === SignTransactionApi.Layouts.CASHLINK
            && request.cashlinkMessage) {
            parsedRequest.cashlinkMessage = /** @type {string} */(this.parseMessage(request.cashlinkMessage));
        }

        // Parse staking-specific fields (like SignStaking does)
        if (request.validatorAddress) {
            parsedRequest.validatorAddress = this.parseAddress(request.validatorAddress, 'validatorAddress', false);
        }

        if (request.validatorImageUrl) {
            parsedRequest.validatorImageUrl = this._parseUrl(request.validatorImageUrl, 'validatorImageUrl');
        }

        if (request.amount) {
            parsedRequest.amount = this.parseNonNegativeFiniteNumber(request.amount, true, 'amount');
        }

        // Note: Staking transactions are now supported in multi-transaction signing
        // The dedicated sign-staking endpoint is still available for backward compatibility

        return parsedRequest;
    }

    /**
     * Checks that the given layout is valid
     * @param {unknown} layout
     * @returns {KeyguardRequest.SignTransactionRequestLayout}
     */
    parseLayout(layout) {
        if (!layout) {
            return SignTransactionApi.Layouts.STANDARD;
        }
        if (!Object.values(SignTransactionApi.Layouts).includes(/** @type {any} */ (layout))) {
            throw new Errors.InvalidRequestError('Invalid selected layout');
        }
        return /** @type KeyguardRequest.SignTransactionRequestLayout */ (layout);
    }

    get Handler() {
        return SignTransaction;
    }

    /**
     * @param {Parsed<KeyguardRequest.SignTransactionRequest>} parsedRequest
     */
    async onBeforeRun(parsedRequest) {
        if (parsedRequest.layout === SignTransactionApi.Layouts.CHECKOUT) {
            this.enableGlobalCloseButton(I18n.translatePhrase('sign-tx-cancel-payment'));
        }
    }
}

/**
 * @enum {KeyguardRequest.SignTransactionRequestLayout}
 */
SignTransactionApi.Layouts = Object.freeze({
    STANDARD: /** @type {'standard'} */ ('standard'),
    CHECKOUT: /** @type {'checkout'} */ ('checkout'),
    CASHLINK: /** @type {'cashlink'} */ ('cashlink'),
});
