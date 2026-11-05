/* global Nimiq */
/* global MultisigSigningState */

describe('MultisigSigningState', () => {
    /** @type {Nimiq.PrivateKey} */
    let privateKey;
    /** @type {Nimiq.PrivateKey} */
    let otherPrivateKey;
    /** @type {Nimiq.PublicKey[]} */
    let publicKeys;
    /** @type {Uint8Array} */
    let content;
    const deviceId = new Uint8Array(16).fill(7);
    const now = 1700000000000;

    beforeAll(() => {
        privateKey = Nimiq.PrivateKey.fromHex('14a3bc3b25c73b6ca3e829aef329a2a6dc69ae52b8d20a164831a021b6a9f9fe');
        otherPrivateKey = Nimiq.PrivateKey.fromHex('2da15ede9992fad834b73283dd1a24f5a7a52b067b09be132ddb5232df863125');
        publicKeys = [
            Nimiq.PublicKey.derive(privateKey),
            Nimiq.PublicKey.derive(otherPrivateKey),
            Nimiq.PublicKey.derive(Nimiq.PrivateKey.fromHex(
                'a3b3d799e7fca4baa3568d58e0c909af1f832926020163a1d48998621a15c9c6',
            )),
        ];
        content = Nimiq.BufferUtils.fromHex('0102030405');
    });

    /**
     * @param {Partial<Parameters<typeof MultisigSigningState.create>[1]>} [overrides]
     * @returns {MultisigSigningState}
     */
    function createState(overrides = {}) {
        return MultisigSigningState.create(privateKey, {
            deviceId,
            transactionContent: content,
            publicKeys,
            numberOfSigners: 2,
            now,
            ...overrides,
        });
    }

    it('can be created, serialized and deserialized', () => {
        const state = createState();
        const bytes = state.serialize();
        expect(bytes.length).toBe(MultisigSigningState.SERIALIZED_SIZE);

        const parsed = MultisigSigningState.deserialize(bytes);
        expect(parsed.version).toBe(MultisigSigningState.VERSION);
        expect(parsed.deviceId).toEqual(deviceId);
        expect(parsed.salt).toEqual(state.salt);
        expect(parsed.createdAt).toBe(now);
        expect(parsed.expiresAt).toBe(now + MultisigSigningState.MAX_AGE);
        expect(parsed.signerPublicKey.equals(publicKeys[0])).toBe(true);
        expect(parsed.serialize()).toEqual(bytes);
        expect(parsed.verify(privateKey)).toBe(true);
    });

    it('uses a fresh random salt for each session', () => {
        expect(createState().salt).not.toEqual(createState().salt);
    });

    it('rejects malformed states', () => {
        const bytes = createState().serialize();
        expect(() => MultisigSigningState.deserialize(undefined)).toThrow();
        expect(() => MultisigSigningState.deserialize([...bytes])).toThrow();
        expect(() => MultisigSigningState.deserialize(bytes.slice(1))).toThrow();
        const wrongVersion = bytes.slice();
        wrongVersion[0] = 2;
        expect(() => MultisigSigningState.deserialize(wrongVersion)).toThrow();
    });

    it('detects any modification of the state', () => {
        const bytes = createState().serialize();
        for (let i = 1; i < bytes.length; i++) {
            const modified = bytes.slice();
            modified[i] ^= 1; // eslint-disable-line no-bitwise
            let parsed;
            try {
                parsed = MultisigSigningState.deserialize(modified);
            } catch (e) {
                continue; // e.g. an invalid public key
            }
            expect(parsed.verify(privateKey) ? i : -1).toBe(-1);
        }
    });

    it('does not verify with another private key', () => {
        const state = createState();
        expect(state.verify(otherPrivateKey)).toBe(false);

        // Even if the signer public key is swapped, which changes the body, the MAC does not match.
        const forged = MultisigSigningState.deserialize(state.serialize());
        forged.signerPublicKey = publicKeys[1];
        expect(forged.verify(otherPrivateKey)).toBe(false);
    });

    it('derives deterministic commitments that are bound to the state', () => {
        const salt = new Uint8Array(32).fill(1);
        const state = createState({ salt });
        const pairs1 = state.deriveCommitmentPairs(privateKey);
        const pairs2 = MultisigSigningState.deserialize(state.serialize()).deriveCommitmentPairs(privateKey);

        expect(pairs1.length).toBe(2);
        expect(pairs1[0].commitment.equals(pairs1[1].commitment)).toBe(false);
        expect(pairs1.map(pair => pair.toHex())).toEqual(pairs2.map(pair => pair.toHex()));
        pairs1.forEach(pair => {
            expect(Nimiq.Commitment.derive(pair.secret).equals(pair.commitment)).toBe(true);
        });

        // Changing any input changes the commitments
        const variants = [
            createState({ salt: new Uint8Array(32).fill(2) }),
            createState({ salt, deviceId: new Uint8Array(16).fill(8) }),
            createState({ salt, now: now + 1 }),
            createState({ salt, transactionContent: Nimiq.BufferUtils.fromHex('010203040506') }),
            createState({ salt, numberOfSigners: 3 }),
        ];
        for (const variant of variants) {
            const variantPairs = variant.deriveCommitmentPairs(privateKey);
            expect(variantPairs[0].commitment.equals(pairs1[0].commitment)).toBe(false);
            expect(variantPairs[1].commitment.equals(pairs1[1].commitment)).toBe(false);
        }

        // Another key derives different commitments for the same state
        const otherPairs = state.deriveCommitmentPairs(otherPrivateKey);
        expect(otherPairs[0].commitment.equals(pairs1[0].commitment)).toBe(false);
    });

    it('binds the transaction and multisig', () => {
        const state = createState();
        expect(state.matchesTransaction(content)).toBe(true);
        expect(state.matchesTransaction(Nimiq.BufferUtils.fromHex('01020304'))).toBe(false);

        expect(state.matchesMultisig(publicKeys, 2)).toBe(true);
        expect(state.matchesMultisig(publicKeys.slice().reverse(), 2)).toBe(true); // order independent
        expect(state.matchesMultisig(publicKeys, 3)).toBe(false);
        expect(state.matchesMultisig(publicKeys.slice(0, 2), 2)).toBe(false);
    });

    it('expires', () => {
        const state = createState();
        expect(state.isExpired(now)).toBe(false);
        expect(state.isExpired(now + MultisigSigningState.MAX_AGE)).toBe(false);
        expect(state.isExpired(now + MultisigSigningState.MAX_AGE + 1)).toBe(true);
    });

    it('hashes signing inputs such that any change is detected', () => {
        const pairs = createState().deriveCommitmentPairs(privateKey);
        const otherPairs = [Nimiq.CommitmentPair.generate(), Nimiq.CommitmentPair.generate()];
        const signers = [
            { publicKey: publicKeys[0], commitments: pairs.map(pair => pair.commitment) },
            { publicKey: publicKeys[1], commitments: otherPairs.map(pair => pair.commitment) },
        ];
        const hash = MultisigSigningState.hashSigningInputs(content, signers);
        expect(MultisigSigningState.hashSigningInputs(content, signers)).toEqual(hash);

        const changedCommitment = [
            signers[0],
            { publicKey: publicKeys[1], commitments: [otherPairs[0].commitment, Nimiq.CommitmentPair.generate().commitment] },
        ];
        expect(MultisigSigningState.hashSigningInputs(content, changedCommitment)).not.toEqual(hash);

        const changedSigner = [signers[0], { publicKey: publicKeys[2], commitments: signers[1].commitments }];
        expect(MultisigSigningState.hashSigningInputs(content, changedSigner)).not.toEqual(hash);

        expect(MultisigSigningState.hashSigningInputs(content, signers.slice().reverse())).not.toEqual(hash);
        expect(MultisigSigningState.hashSigningInputs(Nimiq.BufferUtils.fromHex('01'), signers)).not.toEqual(hash);
    });

    it('derives commitments that produce a valid MuSig2 signature', () => {
        const otherDeviceId = new Uint8Array(16).fill(9);
        const stateA = createState();
        const stateB = MultisigSigningState.create(otherPrivateKey, {
            deviceId: otherDeviceId,
            transactionContent: content,
            publicKeys,
            numberOfSigners: 2,
        });
        const pairsA = stateA.deriveCommitmentPairs(privateKey);
        const pairsB = stateB.deriveCommitmentPairs(otherPrivateKey);
        const commitmentsA = pairsA.map(pair => pair.commitment);
        const commitmentsB = pairsB.map(pair => pair.commitment);

        const partialA = Nimiq.PartialSignature.create(
            privateKey, publicKeys[0], pairsA, [publicKeys[1]], [commitmentsB], content,
        );
        const partialB = Nimiq.PartialSignature.create(
            otherPrivateKey, publicKeys[1], pairsB, [publicKeys[0]], [commitmentsA], content,
        );

        const aggregatedCommitment = Nimiq.Commitment.sumMuSig2(
            [publicKeys[0], publicKeys[1]],
            [commitmentsA, commitmentsB],
            content,
        );
        const signature = Nimiq.PartialSignature.sum([partialA, partialB]).toSignature(aggregatedCommitment);
        const aggregatedPublicKey = Nimiq.PublicKey.combinations([publicKeys[0], publicKeys[1]], 2)[0];
        expect(aggregatedPublicKey.verify(signature, content)).toBe(true);
    });
});
