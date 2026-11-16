/* global Nimiq */
/* global Key */
/* global KeyStore */
// /* global SignMultisigTransactionApi */
/* global PasswordBox */
/* global Errors */
/* global Utf8Tools */
/* global TopLevelApi */
/* global I18n */
/* global MultisigSigningState */
/* global MultisigSessionStore */
/* global MultisigTransactionOverview */

/**
 * @callback SignMultisigTransaction.resolve
 * @param {KeyguardRequest.SignatureResult} result
 */

class SignMultisigTransaction {
    /**
     * @param {Parsed<KeyguardRequest.SignMultisigTransactionRequest>} request
     * @param {SignMultisigTransaction.resolve} resolve
     * @param {reject} reject
     */
    constructor(request, resolve, reject) {
        this._request = request;
        this.$el = /** @type {HTMLElement} */ (
            document.getElementById(SignMultisigTransaction.Pages.CONFIRM_TRANSACTION));
        this.$el.classList.add(request.layout);

        this._overview = new MultisigTransactionOverview(this.$el, {
            transaction: request.transaction,
            multisigAddress: request.multisigAddress,
            numberOfSigners: request.multisigConfig.signers.length,
            numberOfParticipants: request.multisigConfig.publicKeys.length,
            senderLabel: request.senderLabel,
            recipientLabel: request.recipientLabel,
            keyInfo: request.keyInfo,
            keyLabel: request.keyLabel,
            userName: request.multisigConfig.userName,
        });

        // Set up password box.
        const $passwordBox = /** @type {HTMLFormElement} */ (document.querySelector('#password-box'));
        this._passwordBox = new PasswordBox($passwordBox, {
            hideInput: !request.keyInfo.encrypted,
            buttonI18nTag: /* request.layout === SignMultisigTransactionApi.Layouts.CASHLINK
                ? 'passwordbox-create-cashlink'
                : */ 'passwordbox-confirm-tx',
            minLength: request.keyInfo.hasPin ? Key.PIN_LENGTH : undefined,
        });

        this._passwordBox.on(
            PasswordBox.Events.SUBMIT,
            /** @param {string} [password] */ password => {
                this._onConfirm(request, resolve, reject, password);
            },
        );

        // if ('expires' in request && request.expires) {
        //     setTimeout(() => reject(new Errors.RequestExpired()), request.expires - Date.now());
        // }
    }

    /**
     * @param {Parsed<KeyguardRequest.SignMultisigTransactionRequest>} request
     * @param {SignMultisigTransaction.resolve} resolve
     * @param {reject} reject
     * @param {string} [password]
     * @returns {Promise<void>}
     * @private
     */
    async _onConfirm(request, resolve, reject, password) {
        TopLevelApi.setLoading(true);
        const passwordBuf = password ? Utf8Tools.stringToUtf8ByteArray(password) : undefined;
        /** @type {Key?} */
        let key = null;
        try {
            key = await KeyStore.instance.get(request.keyInfo.id, passwordBuf);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            if (errorMessage === 'Invalid key') {
                TopLevelApi.setLoading(false);
                this._passwordBox.onPasswordIncorrect();
                return;
            }
            reject(new Errors.CoreError(error instanceof Error ? error : errorMessage));
            return;
        }
        if (!key) {
            reject(new Errors.KeyNotFoundError());
            return;
        }

        /** @type {Nimiq.PartialSignature} */
        let signature;
        try {
            signature = await SignMultisigTransaction.signSession({
                key,
                keyPath: request.keyPath,
                data: request.transaction.serializeContent(),
                publicKeys: request.multisigConfig.publicKeys,
                signers: request.multisigConfig.signers,
                state: request.multisigConfig.state,
            }, MultisigSessionStore.instance, sessionCreatedAt => this._confirmForeignSession(sessionCreatedAt));
        } catch (error) {
            reject(error instanceof Errors.BaseError
                ? error
                : new Errors.UnclassifiedError(error instanceof Error ? error : String(error)));
            return;
        }

        /** @type {KeyguardRequest.SignatureResult} */
        const result = {
            publicKey: key.derivePublicKey(request.keyPath).serialize(),
            signature: signature.serialize(),
        };
        resolve(result);
    }

    // eslint-disable-next-line valid-jsdoc
    /**
     * Round 2: creates the partial signature of the signer of the given key, for a signing session which was created in
     * round 1. Makes sure that a session is never signed twice with differing inputs, as that would leak the private
     * key.
     *
     * @param {{
     *     key: Key,
     *     keyPath: string,
     *     data: Uint8Array,
     *     publicKeys: Nimiq.PublicKey[],
     *     signers: MultisigConfig['signers'],
     *     state: MultisigSigningState,
     * }} params - `data` is the data to sign, i.e. the serialized transaction content
     * @param {MultisigSessionStore} store
     * @param {(sessionCreatedAt: number) => Promise<boolean>} confirmForeignSession - Asks the user whether to sign a
     *     session which was created on another device
     * @returns {Promise<Nimiq.PartialSignature>}
     */
    static async signSession({
        key,
        keyPath,
        data,
        publicKeys,
        signers,
        state,
    }, store, confirmForeignSession) {
        const privateKey = key.derivePrivateKey(keyPath);
        const publicKey = Nimiq.PublicKey.derive(privateKey);

        // Verify publicKey is part of the signing public keys
        const ownSigner = signers.find(signer => signer.publicKey.equals(publicKey));
        if (!ownSigner) {
            throw new Errors.InvalidRequestError('Selected key is not part of the multisig transaction signers');
        }
        // Get a list of other signers, excluding the own signer. This works because `ownSigner` is a reference into
        // the `signers` array, so we can use object-equality.
        const otherSigners = signers.filter(signer => signer !== ownSigner);

        // Verify the signing state. It must have been created by this key in round 1, for this transaction and
        // multisig, and must not have been modified.
        if (!state.verify(privateKey)) {
            throw new Errors.InvalidRequestError('Invalid state: not created for this key, or modified');
        }
        if (state.isExpired()) {
            throw new Errors.RequestExpired();
        }
        if (!state.matchesTransaction(data)) {
            throw new Errors.InvalidRequestError('Invalid state: created for a different transaction');
        }
        if (!state.matchesMultisig(publicKeys, signers.length)) {
            throw new Errors.InvalidRequestError('Invalid state: created for a different multisig');
        }

        const ownCommitmentPairs = state.deriveCommitmentPairs(privateKey);
        if (ownCommitmentPairs.some((pair, i) => !pair.commitment.equals(ownSigner.commitments[i]))) {
            throw new Errors.InvalidRequestError(
                'This signer\'s commitments do not match the ones created for this state',
            );
        }

        // Never sign the same signing session twice with differing inputs, as that would leak the private key.
        const stateHash = state.hash();
        const inputsHash = MultisigSigningState.hashSigningInputs(data, signers);
        /** @type {MultisigSessionStore.Decision} */
        let decision;
        try {
            const [deviceId, record] = await Promise.all([store.getDeviceId(publicKey), store.getRecord(stateHash)]);
            decision = MultisigSessionStore.decide({
                isOwnDevice: MultisigSigningState.constantTimeEquals(deviceId, state.deviceId),
                record,
                inputsHash,
            });
        } catch (error) {
            throw new Errors.KeyguardError(`Cannot access signing session records: ${String(error)}`);
        }

        if (decision === MultisigSessionStore.Decision.REFUSE) {
            throw new Errors.InvalidRequestError(SignMultisigTransaction.ALREADY_USED_ERROR);
        }
        if (decision === MultisigSessionStore.Decision.REFUSE_UNKNOWN) {
            throw new Errors.InvalidRequestError(SignMultisigTransaction.UNKNOWN_SESSION_ERROR);
        }
        if (decision === MultisigSessionStore.Decision.CONFIRM && !(await confirmForeignSession(state.createdAt))) {
            throw new Errors.RequestCanceled();
        }

        // Sign before recording the use, such that a failure to sign does not use up the signing session. The signature
        // must not leave this method before the use is recorded.
        /** @type {Nimiq.PartialSignature} */
        let signature;
        try {
            signature = key.signPartially(keyPath, data, ownCommitmentPairs, otherSigners);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Errors.InvalidRequestError(`Cannot sign with the given signers: ${errorMessage}`);
        }

        // Record the use atomically, which also catches concurrent requests in multiple tabs.
        let claimed = false;
        try {
            claimed = await store.claim(stateHash, inputsHash, state.expiresAt);
        } catch (error) {
            throw new Errors.KeyguardError(`Cannot record signing session: ${String(error)}`);
        }
        if (!claimed) {
            throw new Errors.InvalidRequestError(SignMultisigTransaction.ALREADY_USED_ERROR);
        }

        // Clean up records of expired sessions. Failures are irrelevant for this request.
        store.prune().catch(() => {});

        return signature;
    }

    /**
     * Shows a warning for signing sessions which were started on another device or browser, as approving the same
     * session on multiple devices can leak the private key.
     *
     * @param {number} sessionCreatedAt
     * @returns {Promise<boolean>} Whether the user confirmed.
     * @private
     */
    _confirmForeignSession(sessionCreatedAt) {
        const $page = /** @type {HTMLElement} */ (
            document.getElementById(SignMultisigTransaction.Pages.FOREIGN_SESSION_WARNING));
        const $createdAt = /** @type {HTMLElement} */ ($page.querySelector('.session-created-at'));
        const $confirm = /** @type {HTMLButtonElement} */ ($page.querySelector('.confirm'));
        const $cancel = /** @type {HTMLButtonElement} */ ($page.querySelector('.cancel'));

        I18n.translateToHtmlContent($createdAt, 'sign-multisig-tx-foreign-session-started', {
            time: new Date(sessionCreatedAt).toLocaleString(I18n.language),
        });

        TopLevelApi.setLoading(false);
        window.location.hash = SignMultisigTransaction.Pages.FOREIGN_SESSION_WARNING;

        return new Promise(resolve => {
            const listeners = new AbortController();
            /**
             * @param {boolean} confirmed
             */
            const finish = confirmed => {
                listeners.abort();
                if (confirmed) TopLevelApi.setLoading(true);
                resolve(confirmed);
            };
            $confirm.addEventListener('click', () => finish(true), { signal: listeners.signal });
            $cancel.addEventListener('click', () => finish(false), { signal: listeners.signal });
        });
    }

    run() {
        // Go to start page
        window.location.hash = SignMultisigTransaction.Pages.CONFIRM_TRANSACTION;
    }
}

SignMultisigTransaction.Pages = {
    CONFIRM_TRANSACTION: 'confirm-transaction',
    FOREIGN_SESSION_WARNING: 'foreign-session-warning',
};

SignMultisigTransaction.ALREADY_USED_ERROR = 'This signing session has already been used with different commitments '
    + 'or signers. Start a new signing session instead.';

SignMultisigTransaction.UNKNOWN_SESSION_ERROR = 'This signing session was started in this browser, which has no record '
    + 'of it, for example because the browser data was restored from a backup. Start a new signing session instead.';
