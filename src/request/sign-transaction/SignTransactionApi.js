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

            // Parse each entry individually — mixed formats (TransactionInfo | Uint8Array) are allowed.
            // `senderLabel` is excluded because it's not displayed in the multi-tx view; for the
            // single-item-array case, `senderLabel` is still read from the raw request below.
            parsedRequest.transactions = request.transactions.map(
                /** @param {Omit<KeyguardRequest.TransactionInfo, 'senderLabel'> | Uint8Array} entry */
                entry => {
                    if (entry instanceof Uint8Array) {
                        // Serialized transaction
                        const tx = Nimiq.Transaction.fromAny(Nimiq.BufferUtils.toHex(entry));

                        if (tx.sender.equals(tx.recipient)) {
                            throw new Errors.InvalidRequestError('Sender and recipient must not match');
                        }

                        // Reject incoming staking transactions that carry a user-provided
                        // staker / validator signature proof: transaction.sign() would
                        // overwrite it with a proof from the keyPath's keypair. See
                        // Transaction.sign() docs: "both signatures are made with the same
                        // keypair". If support for different staker/validator keys is added
                        // later, this rejection can be relaxed to defer to manual signing.
                        if (SignTransactionApi._hasStakerOrValidatorProof(tx)) {
                            throw new Errors.InvalidRequestError(
                                'Staking transactions with a user-provided signature proof are not supported',
                            );
                        }

                        return tx;
                    }

                    if (entry && typeof entry === 'object'
                        && ('recipient' in entry || 'value' in entry || 'fee' in entry)) {
                        // TransactionInfo object
                        return this.parseTransaction(entry);
                    }

                    throw new Errors.InvalidRequestError(
                        'Invalid transaction entry. Expected TransactionInfo object or Uint8Array.',
                    );
                },
            );

            // Reject requests where aggregated values would exceed Number.MAX_SAFE_INTEGER,
            // as the conversion to Number for display would lose precision.
            if (parsedRequest.transactions.length > 1) {
                let totalValue = 0n;
                let totalFee = 0n;
                for (const tx of parsedRequest.transactions) {
                    totalValue += tx.value;
                    totalFee += tx.fee;
                }
                if (totalValue > BigInt(Number.MAX_SAFE_INTEGER)
                    || totalFee > BigInt(Number.MAX_SAFE_INTEGER)) {
                    throw new Errors.InvalidRequestError(
                        'Total value or fee across transactions exceeds safe integer limit',
                    );
                }
            }

            // For single-item arrays, extract senderLabel for single-tx view
            if (request.transactions.length === 1) {
                const firstEntry = request.transactions[0];
                if (firstEntry && typeof firstEntry === 'object' && 'senderLabel' in firstEntry) {
                    parsedRequest.senderLabel = this.parseLabel(firstEntry.senderLabel);
                }
            }
        } else {
            // Single transaction mode (backward compatible)
            if ('senderLabel' in request) {
                parsedRequest.senderLabel = this.parseLabel(request.senderLabel);
            }
            parsedRequest.transactions = [this.parseTransaction(request)];
        }

        // Parse layout-specific fields
        if ((!request.layout || request.layout === SignTransactionApi.Layouts.STANDARD)
            && parsedRequest.layout === SignTransactionApi.Layouts.STANDARD) {
            if ('recipientLabel' in request) {
                parsedRequest.recipientLabel = this.parseLabel(request.recipientLabel);
            }
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

    /**
     * Detects whether an incoming staking transaction carries a filled-in staker / validator
     * SignatureProof at the end of its recipient data. TransactionBuilder produces these
     * transactions with a zero-filled placeholder proof that `transaction.sign()` later fills
     * in using the outer keypair. If the trailing bytes already contain a non-zero proof, we
     * treat it as user-provided.
     *
     * Operations without an embedded proof (outgoing staking, `add-stake`) return false.
     *
     * @param {Nimiq.Transaction} tx
     * @returns {boolean}
     */
    static _hasStakerOrValidatorProof(tx) {
        if (tx.recipientType !== Nimiq.AccountType.Staking) return false;
        if (tx.data.length < Nimiq.SignatureProof.SINGLE_SIG_SIZE) return false;

        let dataType;
        try {
            dataType = Nimiq.StakingContract.dataToPlain(tx.data).type;
        } catch (e) {
            // If the data cannot be parsed as staking data, let the tx reach signing where
            // the core's own validation will surface the error.
            return false;
        }
        // `add-stake` is the only incoming staking operation without an embedded proof.
        if (dataType === 'add-stake') return false;

        const proofStart = tx.data.length - Nimiq.SignatureProof.SINGLE_SIG_SIZE;
        for (let i = proofStart; i < tx.data.length; i++) {
            if (tx.data[i] !== 0) return true;
        }
        return false;
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
