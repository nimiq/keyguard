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
        if ('transactions' in request) {
            if (!Array.isArray(request.transactions)) {
                throw new Errors.InvalidRequestError('transactions must be an array');
            }
            if (request.transactions.length === 0) {
                throw new Errors.InvalidRequestError('transactions array must not be empty');
            }
            // Multi-transaction mode - only allowed for standard, switch-validator and unstaking layouts
            if (parsedRequest.layout !== SignTransactionApi.Layouts.STANDARD
                && parsedRequest.layout !== SignTransactionApi.Layouts.SWITCH_VALIDATOR
                && parsedRequest.layout !== SignTransactionApi.Layouts.UNSTAKING) {
                throw new Errors.InvalidRequestError(
                    'Multiple transactions are only supported with standard, switch-validator or unstaking layout',
                );
            }

            // Parse each entry individually — mixed formats (TransactionInfo | Uint8Array) are allowed.
            // `senderLabel` is excluded because it's not displayed in the multi-tx view; for the
            // single-item-array case, `senderLabel` is still read from the raw request below.
            parsedRequest.transactions = request.transactions.map(
                /** @param {Omit<KeyguardRequest.TransactionInfo, 'senderLabel'> | Uint8Array} entry */
                entry => {
                    if (entry instanceof Uint8Array) {
                        // Serialized transaction
                        let tx;
                        try {
                            tx = Nimiq.Transaction.deserialize(entry);
                        } catch (error) {
                            throw new Errors.InvalidRequestError(
                                error instanceof Error ? error : String(error),
                            );
                        }

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

                    return this.parseTransaction(entry);
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
        } else if (request.layout === SignTransactionApi.Layouts.SWITCH_VALIDATOR
            && parsedRequest.layout === SignTransactionApi.Layouts.SWITCH_VALIDATOR) {
            if (parsedRequest.transactions.length !== 2) {
                throw new Errors.InvalidRequestError(
                    'switch-validator layout requires exactly two transactions',
                );
            }
            const firstType = SignTransactionApi._stakingDataType(parsedRequest.transactions[0]);
            const secondData = SignTransactionApi._stakingData(parsedRequest.transactions[1]);
            if (firstType !== 'set-active-stake' || secondData?.type !== 'update-staker') {
                throw new Errors.InvalidRequestError(
                    'switch-validator transactions must be set-active-stake followed by update-staker',
                );
            }
            if (!parsedRequest.transactions[0].sender.equals(parsedRequest.transactions[1].sender)) {
                throw new Errors.InvalidRequestError(
                    'switch-validator transactions must share the same staker',
                );
            }
            if (!secondData.newDelegation) {
                throw new Errors.InvalidRequestError(
                    'switch-validator update-staker must include a newDelegation',
                );
            }

            parsedRequest.senderLabel = this.parseLabel(request.senderLabel);
            parsedRequest.recipientLabel = this.parseLabel(request.recipientLabel);
            parsedRequest.validatorAddress = this.parseAddress(
                request.validatorAddress, 'validatorAddress', false,
            );
            parsedRequest.fromValidatorAddress = this.parseAddress(
                request.fromValidatorAddress, 'fromValidatorAddress', false,
            );

            // Assert the update-staker actually re-delegates to the address the user consented to.
            const txDelegation = this.parseAddress(secondData.newDelegation, 'newDelegation', false);
            if (!txDelegation.equals(parsedRequest.validatorAddress)) {
                throw new Errors.InvalidRequestError(
                    'switch-validator validatorAddress does not match update-staker newDelegation',
                );
            }
            if (request.validatorImageUrl) {
                parsedRequest.validatorImageUrl = this._parseUrl(request.validatorImageUrl, 'validatorImageUrl');
            }
            if (request.fromValidatorImageUrl) {
                parsedRequest.fromValidatorImageUrl = this._parseUrl(
                    request.fromValidatorImageUrl, 'fromValidatorImageUrl',
                );
            }
        } else if (request.layout === SignTransactionApi.Layouts.UNSTAKING
            && parsedRequest.layout === SignTransactionApi.Layouts.UNSTAKING) {
            if (parsedRequest.transactions.length !== 3) {
                throw new Errors.InvalidRequestError(
                    'unstaking layout requires exactly three transactions',
                );
            }
            const tx0 = parsedRequest.transactions[0];
            const tx1 = parsedRequest.transactions[1];
            const tx2 = parsedRequest.transactions[2];
            const t0 = SignTransactionApi._stakingDataType(tx0);
            const t1 = SignTransactionApi._stakingDataType(tx1);
            // The third transaction is `remove-stake`, which is OUTGOING-staking. Inspect the
            // parsed sender data to distinguish it from `delete-validator` (both share the same
            // sender/recipient account types).
            const t2 = SignTransactionApi._stakingSenderDataType(tx2);
            if (t0 !== 'set-active-stake' || t1 !== 'retire-stake' || t2 !== 'remove-stake') {
                throw new Errors.InvalidRequestError(
                    'unstaking transactions must be set-active-stake, retire-stake, remove-stake (in order)',
                );
            }

            // Bind all three transactions to the same staker. Without this, a caller could route
            // the unbonded NIM to an attacker by setting `tx2.recipient` to an arbitrary address
            // while `senderLabel`/`recipientLabel` keep the UI looking benign.
            if (!tx0.sender.equals(tx1.sender) || !tx2.recipient.equals(tx0.sender)) {
                throw new Errors.InvalidRequestError(
                    'unstaking transactions must be bound to the same staker',
                );
            }

            parsedRequest.senderLabel = this.parseLabel(request.senderLabel);
            parsedRequest.recipientLabel = this.parseLabel(request.recipientLabel);
            parsedRequest.validatorAddress = this.parseAddress(
                request.validatorAddress, 'validatorAddress', false,
            );
            if (request.validatorImageUrl) {
                parsedRequest.validatorImageUrl = this._parseUrl(request.validatorImageUrl, 'validatorImageUrl');
            }
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
     * Returns the parsed staking data for an incoming staking transaction, or `undefined` if
     * the transaction isn't an incoming staking transaction with parseable data.
     *
     * @param {Nimiq.Transaction} tx
     * @returns {Nimiq.PlainTransactionRecipientData | undefined}
     */
    static _stakingData(tx) {
        if (tx.recipientType !== Nimiq.AccountType.Staking) return undefined;
        try {
            return Nimiq.StakingContract.dataToPlain(tx.data);
        } catch (e) {
            return undefined;
        }
    }

    /**
     * @param {Nimiq.Transaction} tx
     * @returns {string | undefined}
     */
    static _stakingDataType(tx) {
        const data = SignTransactionApi._stakingData(tx);
        return data ? data.type : undefined;
    }

    /**
     * Returns the parsed sender-data type for an outgoing staking transaction (e.g.
     * `remove-stake`, `delete-validator`), or `undefined` if the transaction isn't an
     * outgoing staking transaction with parseable sender data.
     *
     * @param {Nimiq.Transaction} tx
     * @returns {string | undefined}
     */
    static _stakingSenderDataType(tx) {
        if (tx.senderType !== Nimiq.AccountType.Staking) return undefined;
        try {
            const senderData = tx.toPlain().senderData;
            return senderData ? senderData.type : undefined;
        } catch (e) {
            return undefined;
        }
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
    SWITCH_VALIDATOR: /** @type {'switch-validator'} */ ('switch-validator'),
    UNSTAKING: /** @type {'unstaking'} */ ('unstaking'),
});
