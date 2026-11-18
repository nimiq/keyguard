/* global Nimiq */
/* global Key */
/* global Errors */
/* global Dummy */
/* global MultisigSigningState */
/* global MultisigSessionStore */
/* global CreateMultisigCommitments */
/* global SignMultisigTransaction */

describe('Multisig signing rounds', () => {
    const DB_NAME = 'keyguard-dummy-multisig-rounds-database';
    const OTHER_DEVICE_DB_NAME = 'keyguard-dummy-multisig-rounds-other-device-database';
    const KEY_PATH = 'm/44\'/242\'/0\'/0\'';

    /** @type {MultisigSessionStore} */
    let store;
    /** @type {Key} */
    let key;
    /** @type {Nimiq.PrivateKey} */
    let coSignerPrivateKey;
    /** @type {Nimiq.PublicKey[]} */
    let publicKeys;
    /** @type {Uint8Array} */
    let data;

    beforeAll(() => {
        key = new Key(Nimiq.PrivateKey.fromHex('14a3bc3b25c73b6ca3e829aef329a2a6dc69ae52b8d20a164831a021b6a9f9fe'));
        coSignerPrivateKey = Nimiq.PrivateKey.fromHex(
            '2da15ede9992fad834b73283dd1a24f5a7a52b067b09be132ddb5232df863125',
        );
        publicKeys = [
            key.derivePublicKey(KEY_PATH),
            Nimiq.PublicKey.derive(coSignerPrivateKey),
            Nimiq.PublicKey.derive(Nimiq.PrivateKey.fromHex(
                'a3b3d799e7fca4baa3568d58e0c909af1f832926020163a1d48998621a15c9c6',
            )),
        ];
        data = Nimiq.BufferUtils.fromHex('0102030405');
    });

    beforeEach(() => {
        store = new MultisigSessionStore(DB_NAME);
    });

    afterEach(async () => {
        await store.close();
        await Dummy.Utils.deleteDatabase(DB_NAME);
    });

    /**
     * @typedef {{ publicKey: Nimiq.PublicKey, commitments: Nimiq.Commitment[], state: MultisigSigningState }} Session
     */

    /**
     * Round 1, including the state's way through the caller.
     *
     * @param {MultisigSessionStore} [sessionStore]
     * @returns {Promise<Session>}
     */
    async function startSession(sessionStore = store) {
        const session = await CreateMultisigCommitments.createSession({
            key,
            keyPath: KEY_PATH,
            data,
            publicKeys,
            numberOfSigners: 2,
        }, sessionStore);
        return { ...session, state: MultisigSigningState.deserialize(session.state.serialize()) };
    }

    /** @returns {Nimiq.CommitmentPair[]} */
    function generateCommitmentPairs() {
        return [Nimiq.CommitmentPair.generate(), Nimiq.CommitmentPair.generate()];
    }

    /** @returns {Nimiq.Commitment[]} */
    function generateCommitments() {
        return generateCommitmentPairs().map(pair => pair.commitment);
    }

    /**
     * @param {Session} session
     * @param {Nimiq.Commitment[]} coSignerCommitments
     * @returns {MultisigConfig['signers']}
     */
    function signersOf(session, coSignerCommitments) {
        return [
            { publicKey: session.publicKey, commitments: session.commitments },
            { publicKey: publicKeys[1], commitments: coSignerCommitments },
        ];
    }

    /**
     * Round 2.
     *
     * @param {Session} session
     * @param {MultisigConfig['signers']} signers
     * @param {(sessionCreatedAt: number) => Promise<boolean>} [confirmForeignSession]
     * @returns {Promise<Nimiq.PartialSignature>}
     */
    function sign(session, signers, confirmForeignSession = neverAsked) {
        return SignMultisigTransaction.signSession({
            key,
            keyPath: KEY_PATH,
            data,
            publicKeys,
            signers,
            state: session.state,
        }, store, confirmForeignSession);
    }

    /** @returns {Promise<boolean>} */
    async function neverAsked() {
        throw new Error('Unexpectedly asked for confirmation');
    }

    /**
     * @param {Promise<unknown>} promise
     * @returns {Promise<Error | null>}
     */
    async function errorOf(promise) {
        try {
            await promise;
        } catch (error) {
            return /** @type {Error} */ (error);
        }
        return null;
    }

    it('signs a session of this device without asking, resulting in a valid signature', async () => {
        const session = await startSession();
        const coSignerPairs = generateCommitmentPairs();
        const coSignerCommitments = coSignerPairs.map(pair => pair.commitment);

        const partialSignature = await sign(session, signersOf(session, coSignerCommitments));

        const coSignerPartialSignature = Nimiq.PartialSignature.create(
            coSignerPrivateKey, publicKeys[1], coSignerPairs, [publicKeys[0]], [session.commitments], data,
        );
        const aggregatedCommitment = Nimiq.Commitment.sumMuSig2(
            [publicKeys[0], publicKeys[1]],
            [session.commitments, coSignerCommitments],
            data,
        );
        const signature = Nimiq.PartialSignature.sum([partialSignature, coSignerPartialSignature])
            .toSignature(aggregatedCommitment);
        const aggregatedPublicKey = Nimiq.PublicKey.combinations([publicKeys[0], publicKeys[1]], 2)[0];
        expect(aggregatedPublicKey.verify(signature, data)).toBe(true);
    });

    it('does not use up a session if signing fails', async () => {
        const session = await startSession();
        // No request which passes the request parser is known to make the signing fail, thus force it to.
        const signPartially = spyOn(key, 'signPartially').and.throwError('Signing failed');

        const error = await errorOf(sign(session, signersOf(session, generateCommitments())));
        expect(error instanceof Errors.InvalidRequestError).toBe(true);
        const record = await store.getRecord(session.state.hash());
        expect(record && record.inputsHash).toBeNull();

        // The session can still be signed, also with other inputs.
        signPartially.and.callThrough();
        expect(await errorOf(sign(session, signersOf(session, generateCommitments())))).toBeNull();
    });

    it('refuses a used session for differing inputs', async () => {
        const session = await startSession();
        await sign(session, signersOf(session, generateCommitments()));

        const error = await errorOf(sign(session, signersOf(session, generateCommitments())));
        expect(error instanceof Errors.InvalidRequestError).toBe(true);
        expect(error && error.message).toBe(SignMultisigTransaction.ALREADY_USED_ERROR);
    });

    describe('with a session of another device', () => {
        /** @type {MultisigSessionStore} */
        let otherDeviceStore;
        /** @type {Session} */
        let session;

        beforeEach(async () => {
            otherDeviceStore = new MultisigSessionStore(OTHER_DEVICE_DB_NAME);
            session = await startSession(otherDeviceStore);
        });

        afterEach(async () => {
            await otherDeviceStore.close();
            await Dummy.Utils.deleteDatabase(OTHER_DEVICE_DB_NAME);
        });

        it('signs and records the use after the user confirmed', async () => {
            const confirm = jasmine.createSpy('confirm').and.returnValue(Promise.resolve(true));
            const signers = signersOf(session, generateCommitments());

            expect(await errorOf(sign(session, signers, confirm))).toBeNull();
            expect(confirm).toHaveBeenCalledTimes(1);
            expect(confirm).toHaveBeenCalledWith(session.state.createdAt);

            // From then on, this device knows the session.
            expect(await errorOf(sign(session, signers))).toBeNull();
            const error = await errorOf(sign(session, signersOf(session, generateCommitments())));
            expect(error && error.message).toBe(SignMultisigTransaction.ALREADY_USED_ERROR);
        });

        it('does not sign or record the use if the user declined', async () => {
            const confirm = jasmine.createSpy('confirm').and.returnValue(Promise.resolve(false));

            const error = await errorOf(sign(session, signersOf(session, generateCommitments()), confirm));
            expect(error instanceof Errors.RequestCanceled).toBe(true);
            expect(await store.getRecord(session.state.hash())).toBeNull();
        });
    });

    describe('decides before the password is entered', () => {
        /**
         * @param {Session} session
         * @param {MultisigConfig['signers']} signers
         * @returns {Promise<MultisigSessionStore.Decision>}
         */
        function decide(session, signers) {
            return SignMultisigTransaction.decideSession({ data, signers, state: session.state }, store);
        }

        it('to sign an unused session of this device', async () => {
            const session = await startSession();
            expect(await decide(session, signersOf(session, generateCommitments())))
                .toBe(MultisigSessionStore.Decision.SIGN);
        });

        it('to refuse a used session for differing inputs', async () => {
            const session = await startSession();
            const signers = signersOf(session, generateCommitments());
            await sign(session, signers);

            expect(await decide(session, signers)).toBe(MultisigSessionStore.Decision.SIGN);
            const error = await errorOf(decide(session, signersOf(session, generateCommitments())));
            expect(error instanceof Errors.InvalidRequestError).toBe(true);
            expect(error && error.message).toBe(SignMultisigTransaction.ALREADY_USED_ERROR);
        });

        describe('for a session of another device', () => {
            /** @type {MultisigSessionStore} */
            let otherDeviceStore;
            /** @type {Session} */
            let session;

            beforeEach(async () => {
                otherDeviceStore = new MultisigSessionStore(OTHER_DEVICE_DB_NAME);
                session = await startSession(otherDeviceStore);
            });

            afterEach(async () => {
                await otherDeviceStore.close();
                await Dummy.Utils.deleteDatabase(OTHER_DEVICE_DB_NAME);
            });

            it('to ask for confirmation', async () => {
                expect(await decide(session, signersOf(session, generateCommitments())))
                    .toBe(MultisigSessionStore.Decision.CONFIRM);
            });

            it('to not skip the confirmation if the state was modified to look like one of this device', async () => {
                // The device id is not secret, as the caller gets it with every state created on this device.
                session.state.deviceId = await store.getDeviceId(session.publicKey);

                const error = await errorOf(decide(session, signersOf(session, generateCommitments())));
                expect(error && error.message).toBe(SignMultisigTransaction.UNKNOWN_SESSION_ERROR);
            });

        });
    });

    it('refuses a session of this device which it has no record of', async () => {
        const session = await startSession();
        // Lose the record but not the device secret, like when the browser data is restored from a backup which was
        // made before round 1.
        await store.prune(session.state.expiresAt + MultisigSessionStore.PRUNE_GRACE_PERIOD + 1);
        expect(await store.getRecord(session.state.hash())).toBeNull();

        const error = await errorOf(sign(session, signersOf(session, generateCommitments())));
        expect(error instanceof Errors.InvalidRequestError).toBe(true);
        expect(error && error.message).toBe(SignMultisigTransaction.UNKNOWN_SESSION_ERROR);
        expect(await store.getRecord(session.state.hash())).toBeNull();
    });
});
