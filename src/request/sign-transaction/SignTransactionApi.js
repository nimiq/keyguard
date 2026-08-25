/* global Nimiq */
/* global I18n */
/* global TopLevelApi */
/* global SignTransaction */
/* global Errors */
/* global CONFIG */

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

            parsedRequest.transactions = request.transactions.map(
                /** @param {Omit<KeyguardRequest.TransactionInfo, 'senderLabel'> | Uint8Array} entry */
                entry => {
                    let tx;
                    if (entry instanceof Uint8Array) {
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
                        if (tx.networkId !== CONFIG.NIMIQ_NETWORK_ID) {
                            throw new Errors.InvalidRequestError('Wrong transaction network');
                        }
                    } else {
                        tx = this.parseTransaction(entry);
                    }

                    return tx;
                },
            );

            // Reject requests where aggregated values would exceed Number.MAX_SAFE_INTEGER,
            // as the conversion to Number for display would lose precision.
            const totalValue = parsedRequest.transactions.reduce((sum, { value }) => sum + value, BigInt(0));
            const totalFee = parsedRequest.transactions.reduce((sum, { fee }) => sum + fee, BigInt(0));
            if (totalValue > Number.MAX_SAFE_INTEGER || totalFee > Number.MAX_SAFE_INTEGER) {
                throw new Errors.InvalidRequestError(
                    'Total value or fee across transactions exceeds safe integer limit',
                );
            }
        } else {
            // Single transaction mode (backward compatible)
            parsedRequest.transactions = [this.parseTransaction(request)];
        }

        let previousValidityStartHeight = -1;
        for (const transaction of parsedRequest.transactions) {
            if (transaction.validityStartHeight < previousValidityStartHeight) {
                throw new Errors.InvalidRequestError('Transactions must be valid in order');
            }
            previousValidityStartHeight = transaction.validityStartHeight;

            // Validate the recipient data of incoming staking transactions, and reject those that carry a
            // user-provided staker / validator signature proof. transaction.sign() would overwrite it with a proof
            // from the keyPath's keypair, silently discarding the user's input. If multi-key staker support is added
            // later, this rejection can be relaxed, if appropriate display of the staker is added to the UI.
            if (SignTransactionApi._hasStakerOrValidatorProof(transaction)) {
                throw new Errors.InvalidRequestError(
                    'Staking transactions with a user-provided signature proof are not supported',
                );
            }
        }

        // Parse layout-specific fields
        if ((!request.layout || request.layout === SignTransactionApi.Layouts.STANDARD)
            && parsedRequest.layout === SignTransactionApi.Layouts.STANDARD) {
            if ('senderLabel' in request && parsedRequest.transactions.length === 1) {
                parsedRequest.senderLabel = this.parseLabel(request.senderLabel);
            }
            if ('recipientLabel' in request && parsedRequest.transactions.length === 1) {
                parsedRequest.recipientLabel = this.parseLabel(request.recipientLabel);
            }
        } else if (request.layout === SignTransactionApi.Layouts.CHECKOUT
            && parsedRequest.layout === SignTransactionApi.Layouts.CHECKOUT) {
            parsedRequest.senderLabel = this.parseLabel(request.senderLabel);
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
            && parsedRequest.layout === SignTransactionApi.Layouts.CASHLINK) {
            parsedRequest.senderLabel = this.parseLabel(request.senderLabel);
            if (request.cashlinkMessage) {
                parsedRequest.cashlinkMessage = /** @type {string} */(this.parseMessage(request.cashlinkMessage));
            }
        } else if (request.layout === SignTransactionApi.Layouts.SWITCH_VALIDATOR
            && parsedRequest.layout === SignTransactionApi.Layouts.SWITCH_VALIDATOR) {
            if (parsedRequest.transactions.length !== 2) {
                throw new Errors.InvalidRequestError(
                    'switch-validator layout requires exactly two transactions',
                );
            }

            const [setActiveStakeTx, updateStakerTx] = parsedRequest.transactions;

            // Check transactions to be of the expected format and disallow transactions that don't match the standard
            // case the simplified SWITCH_VALIDATOR layout represents. For example, the simplified layout relies on the
            // staker being the user and presents the transactions as operation on the user's own stake, displaying the
            // fee-paying sender as the staker. That the sender is in fact the user's own address can only be checked
            // once the key is unlocked and is therefore checked in SignTransaction._onConfirm.

            // For set-active-stake and update-staker transactions, we don't have to check the following, which are
            // checked by the Nimiq protocol (statically or on commit) or earlier parsing steps above, or are displayed:
            // - senderData (must be empty for transaction from basic account; enforced by protocol)
            // - recipient (must be staking contract for incoming staking transaction; enforced by protocol on commit)
            // - value (must be zero for signaling transactions; enforced by protocol)
            // - total fees (must not exceed MAX_SAFE_INTEGER; checked above and displayed)
            // - validityStartHeight (must be in order and within the typical bounds; checked above and below)
            // - network id (must match CONFIG.NIMIQ_NETWORK_ID; checked above)
            // - flags (must be signaling for these transaction types; enforced by protocol)
            // What must still be checked here: sender, senderType, recipientType, recipientData

            if (!setActiveStakeTx.sender.equals(updateStakerTx.sender)) {
                // Enforce both transactions to have the same fee-payer. Note that the fee-payer is not necessarily
                // the same as the staker, because the staker is identified by the staking proof, which can differ
                // from the tx sender. However, we currently disallow custom staking proofs via the
                // _hasStakerOrValidatorProof check above, such that both staking proofs are generated during signing
                // from the keyPath's keypair. By this, the same staker is used for both transactions, and it also
                // matches the transaction senders, as we enforce the senders to be of basic type below and the signer
                // check in SignTransaction._onConfirm enforces basic senders to be that same keypair's address.
                // If we'd allow user-provided staking proofs in the future, we'd need to add a check that the
                // transaction stakers match and are the same as the transaction senders for the simplified
                // switch-validator flow.
                throw new Errors.InvalidRequestError(
                    'switch-validator transactions must share the same fee-paying sender and staker',
                );
            }

            if (setActiveStakeTx.senderType !== Nimiq.AccountType.Basic
                || updateStakerTx.senderType !== Nimiq.AccountType.Basic) {
                // Enforce basic senders because the switch-validator UI does not show the sender being a contract,
                // and because SignTransaction._onConfirm can only check the sender to be the user's own address for
                // basic senders, which the staker equality above relies on.
                throw new Errors.InvalidRequestError('switch-validator transaction sender must not be a contract');
            }

            // recipientType and recipientData
            // Note that the staking proof on recipientData is already checked via _hasStakerOrValidatorProof above.
            const [setActiveStakeData, updateStakerData] = [setActiveStakeTx, updateStakerTx]
                .map(tx => SignTransactionApi._parseIncomingStakingTransactionData(tx));
            if (!setActiveStakeData || setActiveStakeData.type !== 'set-active-stake'
                || !updateStakerData || updateStakerData.type !== 'update-staker') {
                throw new Errors.InvalidRequestError(
                    'switch-validator transactions must be set-active-stake followed by update-staker',
                );
            }
            if (setActiveStakeData.newActiveBalance !== 0) {
                throw new Errors.InvalidRequestError(
                    'switch-validator set-active-stake must deactivate all stake (newActiveBalance must be 0)',
                );
            }
            if (!updateStakerData.newDelegation) {
                throw new Errors.InvalidRequestError(
                    'switch-validator update-staker must include a newDelegation',
                );
            }
            if (!updateStakerData.reactivateAllStake) {
                throw new Errors.InvalidRequestError(
                    'switch-validator update-staker must have reactivateAllStake set',
                );
            }

            // Check validityStartHeights to be what is expected from the Wallet.
            const updateStakerDelay = updateStakerTx.validityStartHeight - setActiveStakeTx.validityStartHeight;
            if (updateStakerDelay <= Nimiq.Policy.BLOCKS_PER_EPOCH
                || updateStakerDelay > 2 * Nimiq.Policy.BLOCKS_PER_EPOCH) {
                throw new Errors.InvalidRequestError(
                    'switch-validator update-staker must start one to two epochs after set-active-stake',
                );
            }

            parsedRequest.senderLabel = this.parseLabel(request.senderLabel);
            parsedRequest.recipientLabel = this.parseLabel(request.recipientLabel);
            parsedRequest.stakerLabel = this.parseLabel(request.stakerLabel);
            parsedRequest.fromValidatorAddress = this.parseAddress(
                request.fromValidatorAddress,
                'fromValidatorAddress',
                false,
            );
            // The signed delegation is authoritative — request data must not influence this.
            parsedRequest.validatorAddress = this.parseAddress(
                updateStakerData.newDelegation,
                'update-staker newDelegation',
                false,
            );

            if (request.validatorImageUrl) {
                parsedRequest.validatorImageUrl = this._parseUrl(request.validatorImageUrl, 'validatorImageUrl');
            }
            if (request.fromValidatorImageUrl) {
                parsedRequest.fromValidatorImageUrl = this._parseUrl(
                    request.fromValidatorImageUrl,
                    'fromValidatorImageUrl',
                );
            }
        } else if (request.layout === SignTransactionApi.Layouts.UNSTAKING
            && parsedRequest.layout === SignTransactionApi.Layouts.UNSTAKING) {
            if (parsedRequest.transactions.length !== 3) {
                throw new Errors.InvalidRequestError(
                    'unstaking layout requires exactly three transactions',
                );
            }

            const [setActiveStakeTx, retireStakeTx, removeStakeTx] = parsedRequest.transactions;

            // Check transactions to be of the expected format and disallow transactions that don't match the standard
            // case the simplified UNSTAKING layout represents. For example, the simplified layout relies on the staker
            // being the user and presents the transactions as operation on the user's own stake and does not display
            // the fee-paying sender at all. That the sender is in fact the user's own address can only be checked once
            // the key is unlocked and is therefore checked in SignTransaction._onConfirm.

            // setActiveStakeTx and retireStakeTx transactions
            // For setActiveStakeTx and retireStakeTx transactions, we don't have to check the following, which are
            // checked by the Nimiq protocol (statically or on commit) or earlier parsing steps above, or are displayed:
            // - senderData (must be empty for transaction from basic account; enforced by protocol)
            // - recipient (must be staking contract for incoming staking transaction; enforced by protocol on commit)
            // - value (must be zero for signaling transactions; enforced by protocol)
            // - total fees (must not exceed MAX_SAFE_INTEGER; checked above and displayed)
            // - validityStartHeight (must be in order and within the typical bounds; checked above and below)
            // - network id (must match CONFIG.NIMIQ_NETWORK_ID; checked above)
            // - flags (must be signaling for these transaction types; enforced by protocol)
            // What must still be checked here: sender, senderType, recipientType, recipientData

            if (!setActiveStakeTx.sender.equals(retireStakeTx.sender)) {
                // Enforce the fee-payer to be the same for all three transactions: for incoming staking transactions
                // setActiveStakeTx and retireStakeTx the fee is paid by the transaction sender, while for the outgoing
                // removeStakeTx it is paid by the staker from the removed stake. Note that in general the fee-payer is
                // not necessarily the same as the staker, because the staker is identified by the staking proof.
                // However, we currently disallow custom staking proofs via the _hasStakerOrValidatorProof check above,
                // such that the staking proofs of setActiveStakeTx and retireStakeTx are generated during signing from
                // the keyPath's keypair, as is removeStakeTx's signature proof, which identifies its staker. By this,
                // the same staker is used for all three transactions, and it also matches the transaction senders, as
                // we enforce the senders to be of basic type below and the signer check in SignTransaction._onConfirm
                // enforces basic senders to be that same keypair's address.
                // If we'd allow user-provided staking proofs in the future, we'd need to add a check that the
                // transaction stakers match and are the same as the transaction senders for the simplified unstaking
                // flow.
                throw new Errors.InvalidRequestError(
                    'unstaking transactions must share the same fee-paying sender and staker',
                );
            }

            if (setActiveStakeTx.senderType !== Nimiq.AccountType.Basic
                || retireStakeTx.senderType !== Nimiq.AccountType.Basic) {
                // Enforce basic senders because the unstaking UI does not show the sender being a contract, and
                // because SignTransaction._onConfirm can only check the sender to be the user's own address for
                // basic senders, which the staker equality above and the payout address check below rely on.
                throw new Errors.InvalidRequestError('unstaking transaction sender must not be a contract');
            }

            // recipientType and recipientData
            // Note that the staking proof on recipientData is already checked via _hasStakerOrValidatorProof above and
            // the set-active-stake newActiveBalance is shown in the UI.
            const [setActiveStakeData, retireStakeData] = [setActiveStakeTx, retireStakeTx]
                .map(tx => SignTransactionApi._parseIncomingStakingTransactionData(tx));
            if (!setActiveStakeData || setActiveStakeData.type !== 'set-active-stake'
                || !retireStakeData || retireStakeData.type !== 'retire-stake') {
                throw new Errors.InvalidRequestError(
                    // remove-stake is checked below
                    'unstaking transactions must be set-active-stake, retire-stake, remove-stake (in order)',
                );
            }
            if (retireStakeData.retireStake > removeStakeTx.value + removeStakeTx.fee) {
                throw new Errors.InvalidRequestError('unstaking must not retire more than is being paid out');
            }

            // removeStake transaction
            // For removeStake, we don't have to check the following, which are checked by the Nimiq protocol
            // (statically or on commit) or earlier parsing steps above, or are displayed:
            // - sender (must be staking contract for outgoing staking transaction; enforced by protocol on commit)
            // - value (value + fee must be >= retired amount; checked above and displayed)
            // - total fees (must not exceed MAX_SAFE_INTEGER; checked above and displayed)
            // - validityStartHeight (must be in order and within the typical bounds; checked above and below)
            // - network id (must match CONFIG.NIMIQ_NETWORK_ID; checked above)
            // - flags (must be none for transaction to basic account; enforced by protocol)
            // What must still be checked here: senderType, senderData, recipient, recipientType, recipientData

            // senderType and senderData
            const removeStakeData = SignTransactionApi._parseOutgoingStakingTransactionData(removeStakeTx);
            if (!removeStakeData || removeStakeData.type !== 'remove-stake') {
                // set-active-stake and retire-stake are checked above
                throw new Errors.InvalidRequestError(
                    'unstaking transactions must be set-active-stake, retire-stake, remove-stake (in order)',
                );
            }

            if (!removeStakeTx.recipient.equals(setActiveStakeTx.sender)) {
                // Enforce the payout address of the unstaked funds to be the same as the fee payer and the staking
                // address. This way, the transactions are easier for the user to interpret, and it is clear where the
                // funds are coming from and where they are going to. Note that this check is also what ties the payout
                // to the user's own address, preventing the unstaked NIM from being sent to an attacker via
                // benign-looking labels.
                throw new Errors.InvalidRequestError(
                    'unstaking transactions must payout to the fee payer and staker address',
                );
            }

            if (removeStakeTx.recipientType !== Nimiq.AccountType.Basic) {
                throw new Errors.InvalidRequestError('unstaking transactions must not payout to a contract');
            }

            if (removeStakeTx.data.length) {
                // Disallow recipient data because we don't display it in the simplified unstaking flow.
                throw new Errors.InvalidRequestError('unstaking transactions must not have recipient data');
            }

            // Check validityStartHeights to be what is expected from the Wallet.
            const retireStakeDelay = retireStakeTx.validityStartHeight - setActiveStakeTx.validityStartHeight;
            if (retireStakeDelay <= Nimiq.Policy.BLOCKS_PER_EPOCH
                || retireStakeDelay > 2 * Nimiq.Policy.BLOCKS_PER_EPOCH) {
                throw new Errors.InvalidRequestError(
                    'unstaking retire-stake must start one to two epochs after set-active-stake',
                );
            }
            if (removeStakeTx.validityStartHeight !== retireStakeTx.validityStartHeight + 1) {
                throw new Errors.InvalidRequestError(
                    'unstaking remove-stake must start one block after retire-stake',
                );
            }

            parsedRequest.senderLabel = this.parseLabel(request.senderLabel);
            parsedRequest.recipientLabel = this.parseLabel(request.recipientLabel);
            parsedRequest.validatorAddress = this.parseAddress(
                request.validatorAddress,
                'validatorAddress',
                false,
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
     * Returns the parsed recipient data for an incoming staking transaction, or `undefined` if the transaction isn't an
     * incoming staking transaction.
     *
     * @param {Nimiq.Transaction} tx
     * @returns {Nimiq.PlainTransactionRecipientData | undefined}
     */
    static _parseIncomingStakingTransactionData(tx) {
        if (tx.recipientType !== Nimiq.AccountType.Staking) return undefined;
        try {
            return Nimiq.StakingContract.dataToPlain(tx.data);
        } catch (e) {
            throw new Errors.InvalidRequestError('Invalid incoming staking transaction data');
        }
    }

    /**
     * Returns the parsed sender data for an outgoing staking transaction, or `undefined` if the transaction isn't an
     * outgoing staking transaction.
     *
     * @param {Nimiq.Transaction} tx
     * @returns {Nimiq.PlainTransactionSenderData | undefined}
     */
    static _parseOutgoingStakingTransactionData(tx) {
        if (tx.senderType !== Nimiq.AccountType.Staking) return undefined;
        try {
            return tx.toPlain().senderData;
        } catch (e) {
            throw new Errors.InvalidRequestError('Invalid transaction or transaction data');
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
     * Throws for incoming staking transactions with invalid recipient data.
     *
     * @param {Nimiq.Transaction} tx
     * @returns {boolean}
     */
    static _hasStakerOrValidatorProof(tx) {
        const data = SignTransactionApi._parseIncomingStakingTransactionData(tx); // validate and throw on invalid data
        if (!data) return false; // not an incoming staking transaction
        if (data.type === 'add-stake') return false; // add-stake has no embedded staking proof.

        const recipientData = tx.data; // tx.data is a getter; cache its result
        if (recipientData.length < Nimiq.SignatureProof.SINGLE_SIG_SIZE) return false;

        const proofStart = recipientData.length - Nimiq.SignatureProof.SINGLE_SIG_SIZE;
        for (let i = proofStart; i < recipientData.length; i++) {
            if (recipientData[i] !== 0) return true;
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
