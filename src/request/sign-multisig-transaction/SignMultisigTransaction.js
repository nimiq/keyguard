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

        const privateKey = key.derivePrivateKey(request.keyPath);
        const publicKey = Nimiq.PublicKey.derive(privateKey);

        // Verify publicKey is part of the signing public keys
        const ownSigner = request.multisigConfig.signers.find(signer => signer.publicKey.equals(publicKey));
        if (!ownSigner) {
            reject(new Errors.InvalidRequestError('Selected key is not part of the multisig transaction signers'));
            return;
        }
        // Get a list of other signers, excluding the own signer. This works because `ownSigner` is a reference into
        // the `signers` array, so we can use object-equality.
        const otherSigners = request.multisigConfig.signers.filter(signer => signer !== ownSigner);

        // Verify the signing state. It must have been created by this key in round 1, for this transaction and
        // multisig, and must not have been modified.
        const { state, publicKeys, signers } = request.multisigConfig;
        const data = request.transaction.serializeContent();
        if (!state.verify(privateKey)) {
            reject(new Errors.InvalidRequestError('Invalid state: not created for this key, or modified'));
            return;
        }
        if (state.isExpired()) {
            reject(new Errors.RequestExpired());
            return;
        }
        if (!state.matchesTransaction(data)) {
            reject(new Errors.InvalidRequestError('Invalid state: created for a different transaction'));
            return;
        }
        if (!state.matchesMultisig(publicKeys, signers.length)) {
            reject(new Errors.InvalidRequestError('Invalid state: created for a different multisig'));
            return;
        }

        const ownCommitmentPairs = state.deriveCommitmentPairs(privateKey);
        if (ownCommitmentPairs.some((pair, i) => !pair.commitment.equals(ownSigner.commitments[i]))) {
            reject(new Errors.InvalidRequestError(
                'This signer\'s commitments do not match the ones created for this state',
            ));
            return;
        }

        // Never sign the same signing session twice with differing inputs, as that would leak the private key.
        const store = MultisigSessionStore.instance;
        const stateHash = state.hash();
        const inputsHash = MultisigSigningState.hashSigningInputs(data, signers);
        /** @type {MultisigSessionStore.Decision} */
        let decision;
        try {
            const [deviceId, usage] = await Promise.all([store.getDeviceId(), store.getUsage(stateHash)]);
            decision = MultisigSessionStore.decide({
                isOwnDevice: MultisigSigningState.constantTimeEquals(deviceId, state.deviceId),
                usage,
                inputsHash,
            });
        } catch (error) {
            reject(new Errors.KeyguardError(`Cannot access signing session records: ${String(error)}`));
            return;
        }

        if (decision === MultisigSessionStore.Decision.REFUSE) {
            reject(new Errors.InvalidRequestError(SignMultisigTransaction.ALREADY_USED_ERROR));
            return;
        }
        if (decision === MultisigSessionStore.Decision.CONFIRM) {
            TopLevelApi.setLoading(false);
            const confirmed = await this._confirmForeignSession(state.createdAt);
            if (!confirmed) {
                reject(new Errors.RequestCanceled());
                return;
            }
            TopLevelApi.setLoading(true);
        }

        // Record the use atomically right before signing, which also catches concurrent requests in multiple tabs.
        let claimed = false;
        try {
            claimed = await store.claim(stateHash, inputsHash, state.expiresAt);
        } catch (error) {
            reject(new Errors.KeyguardError(`Cannot record signing session: ${String(error)}`));
            return;
        }
        if (!claimed) {
            reject(new Errors.InvalidRequestError(SignMultisigTransaction.ALREADY_USED_ERROR));
            return;
        }

        const signature = key.signPartially(
            request.keyPath,
            data,
            ownCommitmentPairs,
            otherSigners,
        );

        // Clean up records of expired sessions. Failures are irrelevant for this request.
        store.prune().catch(() => {});

        /** @type {KeyguardRequest.SignatureResult} */
        const result = {
            publicKey: publicKey.serialize(),
            signature: signature.serialize(),
        };
        resolve(result);
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

        window.location.hash = SignMultisigTransaction.Pages.FOREIGN_SESSION_WARNING;

        return new Promise(resolve => {
            const listeners = new AbortController();
            /**
             * @param {boolean} confirmed
             */
            const finish = confirmed => {
                listeners.abort();
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
