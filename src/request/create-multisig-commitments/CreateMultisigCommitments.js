/* global Nimiq */
/* global KeyStore */
/* global Key */
/* global PasswordBox */
/* global Errors */
/* global Utf8Tools */
/* global TopLevelApi */
/* global MultisigSigningState */
/* global MultisigSessionStore */
/* global MultisigTransactionOverview */

/**
 * @callback CreateMultisigCommitments.resolve
 * @param {KeyguardRequest.MultisigCommitmentsResult} result
 */

class CreateMultisigCommitments {
    /**
     * @param {Parsed<KeyguardRequest.CreateMultisigCommitmentsRequest>} request
     * @param {CreateMultisigCommitments.resolve} resolve
     * @param {reject} reject
     */
    constructor(request, resolve, reject) {
        this._request = request;
        this._resolve = resolve;
        this._reject = reject;

        const $page = /** @type {HTMLElement} */ (
            document.getElementById(CreateMultisigCommitments.Pages.CONFIRM_TRANSACTION));
        this._overview = new MultisigTransactionOverview($page, {
            transaction: request.transaction,
            multisigAddress: request.multisigAddress,
            numberOfSigners: request.multisigConfig.numberOfSigners,
            numberOfParticipants: request.multisigConfig.publicKeys.length,
            senderLabel: request.senderLabel,
            recipientLabel: request.recipientLabel,
            keyInfo: request.keyInfo,
            keyLabel: request.keyLabel,
            userName: request.multisigConfig.userName,
        });

        const $passwordBox = /** @type {HTMLFormElement} */ ($page.querySelector('#password-box'));
        this._passwordBox = new PasswordBox($passwordBox, {
            hideInput: !request.keyInfo.encrypted,
            buttonI18nTag: 'passwordbox-continue',
            minLength: request.keyInfo.hasPin ? Key.PIN_LENGTH : undefined,
        });
        this._passwordBox.on(PasswordBox.Events.SUBMIT, /** @param {string|undefined} password */ password => {
            this._onPasswordEntered(password);
        });
    }

    /**
     * @param {string} [password]
     * @returns {Promise<void>}
     */
    async _onPasswordEntered(password) {
        TopLevelApi.setLoading(true);
        const passwordBuffer = password ? Utf8Tools.stringToUtf8ByteArray(password) : undefined;

        /** @type {Key|null} */
        let key = null;
        try {
            key = await KeyStore.instance.get(this._request.keyInfo.id, passwordBuffer);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            if (errorMessage === 'Invalid key') {
                TopLevelApi.setLoading(false);
                this._passwordBox.onPasswordIncorrect();
                return;
            }
            this._reject(new Errors.CoreError(error instanceof Error ? error : errorMessage));
            return;
        }
        if (!key) {
            this._reject(new Errors.KeyNotFoundError());
            return;
        }

        /** @type {{ publicKey: Nimiq.PublicKey, commitments: Nimiq.Commitment[], state: MultisigSigningState }} */
        let session;
        try {
            session = await CreateMultisigCommitments.createSession({
                key,
                keyPath: this._request.keyPath,
                data: this._request.transaction.serializeContent(),
                publicKeys: this._request.multisigConfig.publicKeys,
                numberOfSigners: this._request.multisigConfig.numberOfSigners,
            }, MultisigSessionStore.instance);
        } catch (error) {
            this._reject(error instanceof Errors.BaseError
                ? error
                : new Errors.UnclassifiedError(error instanceof Error ? error : String(error)));
            return;
        }

        /** @type {KeyguardRequest.MultisigCommitmentsResult} */
        const result = {
            publicKey: session.publicKey.serialize(),
            commitments: session.commitments.map(commitment => commitment.serialize()),
            state: session.state.serialize(),
        };
        this._resolve(result);
    }

    /**
     * Round 1: creates a new signing session for the signer of the given key.
     *
     * @param {{
     *     key: Key,
     *     keyPath: string,
     *     data: Uint8Array,
     *     publicKeys: Nimiq.PublicKey[],
     *     numberOfSigners: number,
     * }} params - `data` is the data to sign, i.e. the serialized transaction content
     * @param {MultisigSessionStore} store
     * @returns {Promise<{ publicKey: Nimiq.PublicKey, commitments: Nimiq.Commitment[], state: MultisigSigningState }>}
     */
    static async createSession({
        key,
        keyPath,
        data,
        publicKeys,
        numberOfSigners,
    }, store) {
        const privateKey = key.derivePrivateKey(keyPath);
        const publicKey = Nimiq.PublicKey.derive(privateKey);
        if (!publicKeys.some(multisigPublicKey => multisigPublicKey.equals(publicKey))) {
            throw new Errors.InvalidRequestError('Selected key is not part of the multisig');
        }

        /** @type {Uint8Array} */
        let deviceId;
        try {
            deviceId = await store.getDeviceId(publicKey);
        } catch (error) {
            throw new Errors.KeyguardError(`Cannot access signing session records: ${String(error)}`);
        }

        const state = MultisigSigningState.create(privateKey, {
            deviceId,
            transactionContent: data,
            publicKeys,
            numberOfSigners,
        });
        const commitments = state.deriveCommitmentPairs(privateKey).map(pair => pair.commitment);

        // Record the session before handing out its state, as round 2 only signs states from this device without
        // asking if this device has a record of them.
        try {
            await store.register(state.hash(), state.expiresAt);
        } catch (error) {
            throw new Errors.KeyguardError(`Cannot record signing session: ${String(error)}`);
        }

        return { publicKey, commitments, state };
    }

    run() {
        window.location.hash = CreateMultisigCommitments.Pages.CONFIRM_TRANSACTION;
    }
}

CreateMultisigCommitments.Pages = {
    CONFIRM_TRANSACTION: 'confirm-transaction',
};
