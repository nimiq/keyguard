/* global Nimiq */
/* global Errors */
/* global MultisigSigningState */
/* global CreateMultisigCommitmentsApi */
/* global SignMultisigTransactionApi */
/* global RequestParser */

describe('Multisig request parsers', () => {
    /** @type {Nimiq.PublicKey[]} */
    let publicKeys;
    /** @type {Uint8Array[]} */
    let ownCommitments;
    /** @type {Uint8Array} */
    let serializedState;

    /** @type {Uint8Array} */
    let transactionContent;

    beforeAll(() => {
        transactionContent = Nimiq.BufferUtils.fromHex('0102030405');
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
            transactionContent,
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

        it('rejects more than 16 public keys', () => {
            const maxPublicKeys = [
                ...publicKeys.map(publicKey => publicKey.serialize()),
                ...new Array(RequestParser.MAX_MULTISIG_PUBLIC_KEYS - publicKeys.length).fill(0).map(generatePublicKey),
            ];

            expectInvalidRequest(
                () => parse(validConfig({ publicKeys: [...maxPublicKeys, generatePublicKey()] })),
                'Invalid public keys: more than 16 public keys',
            );
            expect(parse(validConfig({ publicKeys: maxPublicKeys })).publicKeys.length).toBe(16);
        });

        it('rejects an empty list of signers', () => {
            expectInvalidRequest(() => parse(validConfig({ signers: [] })), 'Invalid signers: empty');
        });

        describe('state checks', () => {
            /**
             * @param {Uint8Array} content
             * @returns {Nimiq.Transaction}
             */
            function transactionWithContent(content) {
                return /** @type {Nimiq.Transaction} */ (/** @type {unknown} */ ({ serializeContent: () => content }));
            }

            /**
             * @param {MultisigConfig} config
             * @param {Nimiq.Transaction} [transaction]
             */
            function checkStateMatches(config, transaction = transactionWithContent(transactionContent)) {
                Object.create(SignMultisigTransactionApi.prototype).checkStateMatches(config, transaction);
            }

            it('accept a state for the given transaction and multisig', () => {
                expect(() => checkStateMatches(parse(validConfig()))).not.toThrow();
            });

            it('reject an expired state', () => {
                const config = parse(validConfig());
                spyOn(config.state, 'isExpired').and.returnValue(true);
                expect(() => checkStateMatches(config)).toThrowError(Errors.RequestExpired);
            });

            it('reject a state for a different transaction', () => {
                expectInvalidRequest(
                    () => checkStateMatches(parse(validConfig()), transactionWithContent(new Uint8Array([1, 2, 3]))),
                    'Invalid state: created for a different transaction',
                );
            });

            it('reject a state for a different multisig', () => {
                // Different number of signers
                const signers = [{ publicKey: publicKeys[0].serialize(), commitments: ownCommitments }];
                expectInvalidRequest(
                    () => checkStateMatches(parse(validConfig({ signers }))),
                    'Invalid state: created for a different multisig',
                );
                // Different public keys
                expectInvalidRequest(
                    () => checkStateMatches(parse(validConfig({
                        publicKeys: [...publicKeys.map(publicKey => publicKey.serialize()), generatePublicKey()],
                    }))),
                    'Invalid state: created for a different multisig',
                );
            });
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

        it('rejects more than 16 public keys', () => {
            const maxPublicKeys = new Array(RequestParser.MAX_MULTISIG_PUBLIC_KEYS).fill(0).map(generatePublicKey);

            expectInvalidRequest(
                () => parse(validConfig({ publicKeys: [...maxPublicKeys, generatePublicKey()] })),
                'Invalid public keys: more than 16 public keys',
            );
            expect(parse(validConfig({ publicKeys: maxPublicKeys, numberOfSigners: 16 })).numberOfSigners).toBe(16);
        });
    });
});
