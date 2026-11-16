/* global Nimiq */
/* global Errors */
/* global MultisigSigningState */
/* global CreateMultisigCommitmentsApi */
/* global SignMultisigTransactionApi */

describe('Multisig request parsers', () => {
    /** @type {Nimiq.PublicKey[]} */
    let publicKeys;
    /** @type {Uint8Array[]} */
    let ownCommitments;
    /** @type {Uint8Array} */
    let serializedState;

    beforeAll(() => {
        const privateKey = Nimiq.PrivateKey.fromHex('14a3bc3b25c73b6ca3e829aef329a2a6dc69ae52b8d20a164831a021b6a9f9fe');
        publicKeys = [
            Nimiq.PublicKey.derive(privateKey),
            Nimiq.PublicKey.derive(
                Nimiq.PrivateKey.fromHex('2da15ede9992fad834b73283dd1a24f5a7a52b067b09be132ddb5232df863125'),
            ),
            Nimiq.PublicKey.derive(
                Nimiq.PrivateKey.fromHex('a3b3d799e7fca4baa3568d58e0c909af1f832926020163a1d48998621a15c9c6'),
            ),
        ];
        const state = MultisigSigningState.create(privateKey, {
            deviceId: new Uint8Array(16).fill(7),
            transactionContent: Nimiq.BufferUtils.fromHex('0102030405'),
            publicKeys,
            numberOfSigners: 2,
        });
        ownCommitments = state.deriveCommitmentPairs(privateKey).map(pair => pair.commitment.serialize());
        serializedState = state.serialize();
    });

    /** @returns {Uint8Array[]} */
    function generateCommitments() {
        return [Nimiq.CommitmentPair.generate(), Nimiq.CommitmentPair.generate()]
            .map(pair => pair.commitment.serialize());
    }

    /** @returns {Uint8Array} */
    function generatePublicKey() {
        return Nimiq.PublicKey.derive(Nimiq.PrivateKey.generate()).serialize();
    }

    /**
     * @param {() => unknown} parse
     * @param {string} expectedMessagePart - To make sure that the request is rejected for the expected reason
     */
    function expectInvalidRequest(parse, expectedMessagePart) {
        let error = null;
        try {
            parse();
        } catch (e) {
            error = /** @type {Error} */ (e);
        }
        expect(error instanceof Errors.InvalidRequestError).toBe(true);
        expect(error ? error.message : null).toContain(expectedMessagePart);
    }

    describe('of sign-multisig-transaction', () => {
        /**
         * The constructor of the request APIs refuses to run in a frame, which the tests run in. The parser methods
         * don't depend on it.
         *
         * @param {unknown} config
         * @returns {MultisigConfig}
         */
        function parse(config) {
            return Object.create(SignMultisigTransactionApi.prototype).parseMultisigConfig(config);
        }

        /**
         * @param {Record<string, unknown>} [overrides]
         * @returns {Record<string, unknown>}
         */
        function validConfig(overrides = {}) {
            return {
                publicKeys: publicKeys.map(publicKey => publicKey.serialize()),
                signers: [
                    { publicKey: publicKeys[0].serialize(), commitments: ownCommitments },
                    { publicKey: publicKeys[1].serialize(), commitments: generateCommitments() },
                ],
                state: serializedState,
                userName: 'Alice',
                ...overrides,
            };
        }

        it('parses a valid config', () => {
            const config = validConfig();
            const parsed = parse(config);

            expect(parsed.publicKeys.map(publicKey => publicKey.toHex()))
                .toEqual(publicKeys.map(publicKey => publicKey.toHex()));
            expect(parsed.signers.length).toBe(2);
            expect(parsed.signers[0].publicKey.equals(publicKeys[0])).toBe(true);
            expect(parsed.signers[0].commitments.map(commitment => commitment.serialize())).toEqual(ownCommitments);
            expect(parsed.signers[1].publicKey.equals(publicKeys[1])).toBe(true);
            expect(parsed.state instanceof MultisigSigningState).toBe(true);
            expect(parsed.state.serialize()).toEqual(serializedState);
            expect(parsed.userName).toBe('Alice');
        });

        it('rejects commitment secrets', () => {
            expectInvalidRequest(
                () => parse(validConfig({ secrets: [new Uint8Array(32), new Uint8Array(32)] })),
                'secrets are not supported anymore',
            );
            expectInvalidRequest(
                () => parse(validConfig({ secrets: { encrypted: [new Uint8Array(256)], keyParams: {} } })),
                'secrets are not supported anymore',
            );
        });

        it('rejects duplicate signers', () => {
            const signers = [
                { publicKey: publicKeys[0].serialize(), commitments: ownCommitments },
                { publicKey: publicKeys[0].serialize(), commitments: generateCommitments() },
            ];
            expectInvalidRequest(() => parse(validConfig({ signers })), 'Invalid signers: duplicate signer');
        });

        it('rejects more than 255 signers', () => {
            const manyPublicKeys = new Array(256).fill(0).map(generatePublicKey);
            const signers = manyPublicKeys.map(publicKey => ({ publicKey, commitments: generateCommitments() }));

            expectInvalidRequest(
                () => parse(validConfig({ publicKeys: manyPublicKeys, signers })),
                'Invalid signers: more than 255 signers',
            );
            const parsed = parse(validConfig({ publicKeys: manyPublicKeys, signers: signers.slice(0, 255) }));
            expect(parsed.signers.length).toBe(255);
        });
    });

    describe('of create-multisig-commitments', () => {
        /**
         * @param {unknown} config
         * @returns {{ publicKeys: Nimiq.PublicKey[], numberOfSigners: number, userName?: string }}
         */
        function parse(config) {
            return Object.create(CreateMultisigCommitmentsApi.prototype).parseMultisigConfig(config);
        }

        /**
         * @param {Record<string, unknown>} [overrides]
         * @returns {Record<string, unknown>}
         */
        function validConfig(overrides = {}) {
            return {
                publicKeys: publicKeys.map(publicKey => publicKey.serialize()),
                numberOfSigners: 2,
                userName: 'Alice',
                ...overrides,
            };
        }

        it('parses a valid config', () => {
            const parsed = parse(validConfig());

            expect(parsed.publicKeys.map(publicKey => publicKey.toHex()))
                .toEqual(publicKeys.map(publicKey => publicKey.toHex()));
            expect(parsed.numberOfSigners).toBe(2);
            expect(parsed.userName).toBe('Alice');

            expect(parse(validConfig({ numberOfSigners: 3, userName: undefined })).numberOfSigners).toBe(3);
        });

        it('rejects more signers than public keys', () => {
            expectInvalidRequest(
                () => parse(validConfig({ numberOfSigners: 4 })),
                'numberOfSigners must not exceed the number of public keys',
            );
        });

        it('rejects more than 255 signers', () => {
            const manyPublicKeys = new Array(256).fill(0).map(generatePublicKey);

            expectInvalidRequest(
                () => parse(validConfig({ publicKeys: manyPublicKeys, numberOfSigners: 256 })),
                'numberOfSigners must not exceed 255',
            );
            expect(parse(validConfig({ publicKeys: manyPublicKeys, numberOfSigners: 255 })).numberOfSigners).toBe(255);
        });
    });
});
