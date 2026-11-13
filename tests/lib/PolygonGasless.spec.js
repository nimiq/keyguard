/* global ethers */
/* global Key */
/* global PolygonKey */
/* global PolygonConstants */
/* global PolygonGasless */
/* global SignPolygonTransaction */
/* global SignPolygonTransactionApi */
/* global Errors */
/* global CONFIG */
/* global Dummy */

describe('PolygonGasless', () => {
    // Golden vectors of NimiqToolbox/gas-abstraction (sdk/test/vectors/gasless-transfer-31337.json), whose digests
    // the GaslessTransfer contract and the token mocks recompute on-chain.
    const VECTORS = {
        transfer: {
            request: {
                token: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
                from: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
                to: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
                amount: '250000000',
                fee: '50000000',
                relay: '0xa0Ee7A142d267C1f36714E4a8F75612F20a79720',
                nonce: '2',
                deadline: '1790007200',
            },
            authorization: {
                mode: /** @type {'permit'} */ ('permit'),
                v: 27,
                r: '0xe379d7a701328879105375ddb7d19c7af3495471e0a2eae193eb454a4941643e',
                s: '0x5e4d7dca26fc2dc95fb723742190073ed61d0703e9be70f985c619c3547680ce',
            },
            digest: '0xba93623653d8b28aa6ceb679ef000d40d007d74dfb6a2b2f5f22f4e893cf2c1d',
        },
        usdcPermit: {
            owner: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
            value: '1',
            nonce: 0,
            deadline: '1790000600',
            digest: '0xbf9d5cc149189a653e7d416e1427d7ea52ee42f3e1df39c02125fd2d12ecf0fb',
        },
        usdt0Permit: {
            owner: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
            value: '300000000',
            nonce: 0,
            deadline: '1790007200',
            digest: '0xae315b3b7b2c96805cbf201f7cedc973494d0e6998e9dcdaf7662c6d9dcbb75a',
        },
    };

    const SENDER = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
    // The local config has no USDT contract. The tests of USDT use the token address of mainnet.
    const USDT = '0xc2132D05D31c914a87C6611C10748AEb04B58e8F';

    /** @type {string} */
    let configuredUsdt;

    beforeEach(() => {
        configuredUsdt = CONFIG.BRIDGED_USDT_CONTRACT_ADDRESS;
        CONFIG.BRIDGED_USDT_CONTRACT_ADDRESS = USDT;
    });

    afterEach(() => {
        CONFIG.BRIDGED_USDT_CONTRACT_ADDRESS = configuredUsdt;
    });

    /**
     * @param {PolygonTypedData} payload
     * @returns {string}
     */
    function digest(payload) {
        return ethers.utils._TypedDataEncoder.hash(payload.domain, payload.types, payload.message);
    }

    /**
     * @param {string} from
     * @param {Partial<KeyguardRequest.PolygonGaslessTransfer>} [overrides]
     * @returns {KeyguardRequest.PolygonGaslessTransfer}
     */
    function transfer(from, overrides = {}) {
        return {
            token: CONFIG.NATIVE_USDC_CONTRACT_ADDRESS,
            from,
            to: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
            amount: '10000000',
            fee: '10000',
            relay: CONFIG.POLYGON_GASLESS_RELAY_ADDRESSES[0],
            nonce: '5',
            ...overrides,
        };
    }

    /**
     * TopLevelApi's constructor does not allow to run in a frame, and the parsers do not need it.
     *
     * @returns {SignPolygonTransactionApi}
     */
    function parser() {
        return Object.create(SignPolygonTransactionApi.prototype);
    }

    /**
     * The values of a network's config file. Karma serves the files but loads only the local config.
     *
     * @param {'mainnet' | 'testnet'} network
     * @returns {Promise<typeof CONFIG>}
     */
    async function loadConfig(network) {
        const response = await fetch(`/base/src/config/config.${network}.js`);
        if (!response.ok) throw new Error(`config.${network}.js is not served`);
        return new Function(`${await response.text()}\nreturn CONFIG;`)(); // eslint-disable-line no-new-func
    }

    /**
     * The typed data of a permit, as the Polygon key signs it.
     *
     * @param {string} token
     * @param {string} owner
     * @param {string} spender
     * @param {string} value
     * @param {number} nonce
     * @param {string} deadline
     * @returns {Promise<PolygonTypedData>}
     */
    async function permitTypedData(token, owner, spender, value, nonce, deadline) {
        const polygonKey = new PolygonKey(new Key(Dummy.secrets[0]));
        const path = PolygonConstants.DEFAULT_DERIVATION_PATH;
        const spy = spyOn(polygonKey, 'signTypedData').and.callThrough();
        await (PolygonGasless.stablecoin(token) === 'usdc'
            ? polygonKey.signUsdcPermit(path, spender, value, nonce, owner, deadline)
            : polygonKey.signUsdtPermit(path, spender, value, nonce, owner, deadline));
        const [, domain, types, message] = spy.calls.mostRecent().args;
        return { domain, types, message };
    }

    /**
     * Signs a transfer as the request's handler does after password entry.
     *
     * @param {PolygonKey} polygonKey
     * @param {KeyguardRequest.PolygonGaslessTransferRequest} request
     * @param {number} tokenNonce
     * @returns {Promise<KeyguardRequest.SignedPolygonGaslessTransfer>}
     */
    function signTransfer(polygonKey, request, tokenNonce) {
        return new Promise((resolve, reject) => {
            Object.create(SignPolygonTransaction.prototype)._signGaslessTransfer(
                { keyPath: PolygonConstants.DEFAULT_DERIVATION_PATH, request, tokenNonce },
                polygonKey,
                resolve,
                reject,
            );
        });
    }

    it('knows the configured tokens', () => {
        expect(PolygonGasless.contract()).toBe(CONFIG.POLYGON_GASLESS_TRANSFER_CONTRACT_ADDRESS);
        expect(PolygonGasless.stablecoin(CONFIG.NATIVE_USDC_CONTRACT_ADDRESS)).toBe('usdc');
        expect(PolygonGasless.stablecoin(CONFIG.BRIDGED_USDT_CONTRACT_ADDRESS)).toBe('usdt');
        expect(PolygonGasless.stablecoin(CONFIG.BRIDGED_USDT_CONTRACT_ADDRESS.toLowerCase())).toBe('usdt');
        expect(() => PolygonGasless.stablecoin(SENDER)).toThrowError(Errors.InvalidRequestError);
    });

    describe('without a USDT contract', () => {
        beforeEach(() => {
            CONFIG.BRIDGED_USDT_CONTRACT_ADDRESS = '';
        });

        it('does not treat an empty token address as USDT', () => {
            expect(() => PolygonGasless.stablecoin('')).toThrowError(Errors.InvalidRequestError);
            expect(PolygonGasless.stablecoin(CONFIG.NATIVE_USDC_CONTRACT_ADDRESS)).toBe('usdc');
        });

        it('rejects USDT transfers', () => {
            expect(() => PolygonGasless.stablecoin(USDT)).toThrowError(Errors.InvalidRequestError);
            expect(() => SignPolygonTransactionApi.createTransferRequest(transfer(SENDER, { token: USDT })))
                .toThrowError(Errors.InvalidRequestError);
            expect(() => parser().parseGaslessTransfer(transfer(SENDER, { token: '' }), 'request'))
                .toThrowError(Errors.InvalidRequestError);
        });

        it('does not deny other recipients', () => {
            expect(PolygonGasless.isDeniedRecipient('0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC')).toBe(false);
            expect(PolygonGasless.isDeniedRecipient(CONFIG.NATIVE_USDC_CONTRACT_ADDRESS)).toBe(true);
        });

        it('still signs USDC transfers', async () => {
            const polygonKey = new PolygonKey(new Key(Dummy.secrets[0]));
            const path = PolygonConstants.DEFAULT_DERIVATION_PATH;
            const from = polygonKey.deriveAddress(path);
            const request = SignPolygonTransactionApi.createTransferRequest(transfer(from));

            const signed = await signTransfer(polygonKey, request, 3);

            const typedData = PolygonGasless.transferTypedData(signed.request, signed.authorization);
            expect(ethers.utils.verifyTypedData(
                typedData.domain,
                typedData.types,
                typedData.message,
                signed.signature,
            )).toBe(from);
        });
    });

    it('refuses to sign transfers without a configured contract or relay', () => {
        const contract = CONFIG.POLYGON_GASLESS_TRANSFER_CONTRACT_ADDRESS;
        const relays = CONFIG.POLYGON_GASLESS_RELAY_ADDRESSES;
        try {
            CONFIG.POLYGON_GASLESS_TRANSFER_CONTRACT_ADDRESS = '';
            expect(() => PolygonGasless.contract()).toThrowError(Errors.KeyguardError);
            CONFIG.POLYGON_GASLESS_TRANSFER_CONTRACT_ADDRESS = contract;
            CONFIG.POLYGON_GASLESS_RELAY_ADDRESSES = [];
            expect(() => PolygonGasless.contract()).toThrowError(Errors.KeyguardError);
        } finally {
            CONFIG.POLYGON_GASLESS_TRANSFER_CONTRACT_ADDRESS = contract;
            CONFIG.POLYGON_GASLESS_RELAY_ADDRESSES = relays;
        }
    });

    it('has the EIP-712 types of the contract', () => {
        expect(ethers.utils._TypedDataEncoder.from(PolygonGasless.TRANSFER_TYPES).encodeType('GaslessTransfer')).toBe(
            'GaslessTransfer(address token,address from,address to,uint256 amount,uint256 fee,address relay,'
            + 'uint256 nonce,uint256 deadline,TokenAuth auth)TokenAuth(uint8 mode,uint8 v,bytes32 r,bytes32 s)',
        );
    });

    describe('with the config of another network', () => {
        const local = { ...CONFIG };

        afterEach(() => {
            Object.assign(CONFIG, local);
        });

        it('builds typed data that matches the contract and token digests', async () => {
            // The deployment of the golden vectors, on the Anvil stack of gas-abstraction
            CONFIG.NATIVE_USDC_CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
            CONFIG.NATIVE_USDC_DOMAIN_NAME = 'USD Coin';
            CONFIG.BRIDGED_USDT_CONTRACT_ADDRESS = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';
            CONFIG.POLYGON_GASLESS_TRANSFER_CONTRACT_ADDRESS = '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0';
            CONFIG.POLYGON_CHAIN_ID = 31337;

            const { request, authorization } = VECTORS.transfer;
            expect(digest(PolygonGasless.transferTypedData(request, authorization))).toBe(VECTORS.transfer.digest);

            for (const [token, vector] of /** @type {const} */ ([
                [CONFIG.NATIVE_USDC_CONTRACT_ADDRESS, VECTORS.usdcPermit],
                [CONFIG.BRIDGED_USDT_CONTRACT_ADDRESS, VECTORS.usdt0Permit],
            ])) {
                // eslint-disable-next-line no-await-in-loop
                const permit = await permitTypedData(
                    token,
                    vector.owner,
                    PolygonGasless.contract(),
                    vector.value,
                    vector.nonce,
                    vector.deadline,
                );
                expect(digest(permit)).toBe(vector.digest);
            }
        });

        it('denies the USDC.e token as a recipient on Polygon mainnet', async () => {
            Object.assign(CONFIG, await loadConfig('mainnet'));

            /** @param {string} to */
            const parse = to => SignPolygonTransactionApi.createTransferRequest(
                parser().parseGaslessTransfer(transfer(SENDER, { to }), 'request'),
            );
            expect(() => parse('0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC')).not.toThrow();

            const usdcE = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174';
            for (const to of [usdcE, usdcE.toLowerCase(), `0x${usdcE.slice(2).toUpperCase()}`]) {
                expect(() => parse(to)).toThrowError(Errors.InvalidRequestError, /request\.to/);
            }
        });

        it('builds the token domains of Polygon mainnet', async () => {
            // The values in config.mainnet.js, which is not loaded in the tests
            CONFIG.NATIVE_USDC_CONTRACT_ADDRESS = '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359';
            CONFIG.NATIVE_USDC_DOMAIN_NAME = 'USD Coin';
            CONFIG.BRIDGED_USDT_CONTRACT_ADDRESS = '0xc2132D05D31c914a87C6611C10748AEb04B58e8F';
            CONFIG.POLYGON_CHAIN_ID = 137;

            // The tokens' `DOMAIN_SEPARATOR()` on Polygon mainnet
            const usdcPermit = await permitTypedData(
                CONFIG.NATIVE_USDC_CONTRACT_ADDRESS, SENDER, SENDER, '1', 0, '1790000600',
            );
            expect(ethers.utils._TypedDataEncoder.hashDomain(usdcPermit.domain))
                .toBe('0xcaa2ce1a5703ccbe253a34eb3166df60a705c561b44b192061e28f2a985be2ca');
            const usdtPermit = await permitTypedData(
                CONFIG.BRIDGED_USDT_CONTRACT_ADDRESS, SENDER, SENDER, '1', 0, '1790000600',
            );
            expect(ethers.utils._TypedDataEncoder.hashDomain(usdtPermit.domain))
                .toBe('0x7b43b7deae87806d0ace67d6c8e9e347fc85db8ad198e756e5c17d126fef9a05');
        });

        it('builds the USDC and transfer domains of Polygon Amoy', async () => {
            // The values in config.testnet.js, which is not loaded in the tests
            CONFIG.NATIVE_USDC_CONTRACT_ADDRESS = '0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582';
            CONFIG.NATIVE_USDC_DOMAIN_NAME = 'USDC';
            CONFIG.POLYGON_GASLESS_TRANSFER_CONTRACT_ADDRESS = '0xe5D40efb4a89F6D3aDd07D8881F4b372f02c8075';
            CONFIG.POLYGON_CHAIN_ID = 80002;

            // The contracts' `DOMAIN_SEPARATOR()` on Polygon Amoy
            const usdcPermit = await permitTypedData(
                CONFIG.NATIVE_USDC_CONTRACT_ADDRESS, SENDER, SENDER, '1', 0, '1790000600',
            );
            expect(ethers.utils._TypedDataEncoder.hashDomain(usdcPermit.domain))
                .toBe('0x5cddc98319864e897e4469bd1d13c2288c677047b54b8cca12bd342adb6be9eb');
            expect(ethers.utils._TypedDataEncoder.hashDomain(
                PolygonGasless.transferTypedData(VECTORS.transfer.request, VECTORS.transfer.authorization).domain,
            )).toBe('0xed1217efe85143e718fc9f59d3cffb6a27f3d671bf2c3a70435f0efc6301a5d7');
        });
    });

    it('checks the relay and the fee', () => {
        const relay = CONFIG.POLYGON_GASLESS_RELAY_ADDRESSES[0];
        expect(() => PolygonGasless.checkFeeAndRelay('50000', relay, 'request')).not.toThrow();
        expect(() => PolygonGasless.checkFeeAndRelay('50000', relay.toLowerCase(), 'request')).not.toThrow();
        expect(() => PolygonGasless.checkFeeAndRelay('50000', SENDER, 'request'))
            .toThrowError(Errors.InvalidRequestError);
        expect(() => PolygonGasless.checkFeeAndRelay(
            (BigInt(CONFIG.POLYGON_GASLESS_MAX_ACCEPTABLE_FEE) + 1n).toString(),
            relay,
            'request',
        )).toThrowError(Errors.InvalidRequestError);
    });

    it('parses transfers into checksummed addresses and canonical integer strings', () => {
        expect(parser().parseGaslessTransfer(transfer(SENDER.toLowerCase(), {
            amount: '010',
            fee: '00',
            nonce: '007',
        }), 'request')).toEqual(transfer(SENDER, {
            amount: '10',
            fee: '0',
            nonce: '7',
        }));
    });

    it('rejects malformed transfers', () => {
        const tooLarge = ethers.constants.MaxUint256.add(1).toString();
        const invalid = [
            /** @type {any} */ (undefined),
            /** @type {any} */ ('transfer'),
            transfer(SENDER.substring(2)), // Without 0x prefix
            transfer('0x70997970c51812dc3A010C7d01b50e0d17dc79C8'), // Wrong checksum, the first C is lowercase
            transfer('XE7338D71C29D66CE2B2B2E3E26C4AA7F49B5CDEC3'),
            transfer(SENDER, { to: /** @type {any} */ (1) }),
            transfer(SENDER, { amount: tooLarge }),
            transfer(SENDER, { amount: '-1' }),
            transfer(SENDER, { amount: '1.5' }),
            transfer(SENDER, { amount: /** @type {any} */ (1) }),
            transfer(SENDER, { fee: '0x01' }),
            transfer(SENDER, { nonce: /** @type {any} */ (undefined) }),
            transfer(SENDER, { nonce: '0x01' }),
        ];
        for (const fields of invalid) {
            expect(() => parser().parseGaslessTransfer(fields, 'request')).toThrowError(Errors.InvalidRequestError);
        }
    });

    it('limits amounts and fees to MAX_SAFE_INTEGER, but not the nonce', () => {
        const parsed = parser().parseGaslessTransfer(transfer(SENDER, {
            amount: '9007199254740991',
            fee: '9007199254740991',
            nonce: '9007199254740992',
        }), 'request');
        expect(parsed.amount).toBe('9007199254740991');
        expect(parsed.fee).toBe('9007199254740991');
        expect(parsed.nonce).toBe('9007199254740992');

        for (const overrides of [{ amount: '9007199254740992' }, { fee: '9007199254740992' }]) {
            expect(() => parser().parseGaslessTransfer(transfer(SENDER, overrides), 'request'))
                .toThrowError(Errors.InvalidRequestError, /safe integer/);
        }
    });

    it('rejects token nonces that are not safe integers', () => {
        expect(parser().parseTokenNonce(7, 'tokenNonce')).toBe(7);
        expect(() => parser().parseTokenNonce(2 ** 53, 'tokenNonce')).toThrowError(Errors.InvalidRequestError);
    });

    it('creates a transfer request with the given nonce and a deadline in 5 minutes', () => {
        expect(PolygonGasless.DEADLINE_SECONDS).toBe(300);
        const now = PolygonGasless.now();
        const request = SignPolygonTransactionApi.createTransferRequest(transfer(SENDER));
        expect(request.nonce).toBe('5');
        expect(Number(request.deadline)).toBeGreaterThanOrEqual(now + 300);
        expect(Number(request.deadline)).toBeLessThanOrEqual(now + 301);
    });

    it('rejects transfers outside the pinned deployment and the fee limit', () => {
        const invalid = [
            transfer(SENDER, { fee: String(Number(CONFIG.POLYGON_GASLESS_MAX_ACCEPTABLE_FEE) + 10000) }),
            transfer(SENDER, { relay: '0xa0Ee7A142d267C1f36714E4a8F75612F20a79720' }),
            transfer(SENDER, { token: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC' }),
            transfer(ethers.constants.AddressZero),
            transfer(SENDER, { to: ethers.constants.AddressZero }),
            transfer(SENDER, { to: CONFIG.POLYGON_GASLESS_TRANSFER_CONTRACT_ADDRESS }),
            transfer(SENDER, { to: CONFIG.NATIVE_USDC_CONTRACT_ADDRESS }),
            transfer(SENDER, { to: CONFIG.BRIDGED_USDT_CONTRACT_ADDRESS }),
            transfer(SENDER, { amount: '0' }),
        ];
        for (const fields of invalid) {
            expect(() => SignPolygonTransactionApi.createTransferRequest(fields))
                .toThrowError(Errors.InvalidRequestError);
        }
    });

    it('rejects the additionally denied recipients', () => {
        const denied = '0x98E69a6927747339d5E543586FC0262112eBe4BD';
        const configured = CONFIG.POLYGON_GASLESS_DENIED_RECIPIENTS;
        expect(() => SignPolygonTransactionApi.createTransferRequest(transfer(SENDER, { to: denied }))).not.toThrow();
        try {
            CONFIG.POLYGON_GASLESS_DENIED_RECIPIENTS = [denied];
            expect(() => SignPolygonTransactionApi.createTransferRequest(transfer(SENDER, { to: denied })))
                .toThrowError(Errors.InvalidRequestError);
        } finally {
            CONFIG.POLYGON_GASLESS_DENIED_RECIPIENTS = configured;
        }
    });

    it('ignores a `corrects` that a caller still sends', async () => {
        /** @type {any} */
        const api = parser();
        spyOn(api, 'parseKeyId').and.returnValue(Promise.resolve({ id: 'key', encrypted: true, hasPin: false }));

        const now = PolygonGasless.now();
        const parsed = await api.parseRequest({
            appName: 'Test',
            keyId: 'key',
            keyLabel: 'Key',
            keyPath: PolygonConstants.DEFAULT_DERIVATION_PATH,
            tokenNonce: 3,
            request: transfer(SENDER),
            corrects: { ...transfer(SENDER), deadline: (now + 2 * PolygonGasless.DEADLINE_SECONDS).toString() },
        });

        // Nothing for the confirm page to show, and no later deadline by claiming an earlier version with one
        expect(parsed.corrects).toBeUndefined();
        expect(Number(parsed.request.deadline)).toBeLessThanOrEqual(now + PolygonGasless.DEADLINE_SECONDS + 1);
    });

    it('signs the permit and then the intent over it with the Polygon key', async () => {
        const path = PolygonConstants.DEFAULT_DERIVATION_PATH;

        for (const token of [CONFIG.NATIVE_USDC_CONTRACT_ADDRESS, CONFIG.BRIDGED_USDT_CONTRACT_ADDRESS]) {
            const polygonKey = new PolygonKey(new Key(Dummy.secrets[0]));
            const from = polygonKey.deriveAddress(path);
            const spy = spyOn(polygonKey, 'signTypedData').and.callThrough();

            const request = SignPolygonTransactionApi.createTransferRequest(transfer(from, { token }));
            // eslint-disable-next-line no-await-in-loop
            const signed = await signTransfer(polygonKey, request, 3);
            expect(signed.request.token).toBe(token);
            expect(signed.authorization.mode).toBe('permit');
            expect([27, 28]).toContain(signed.authorization.v);

            expect(spy.calls.count()).toBe(2);
            const [, permitDomain, permitTypes, permitMessage] = spy.calls.argsFor(0);
            expect(permitDomain.verifyingContract).toBe(token);
            expect(permitMessage).toEqual({
                owner: from,
                spender: CONFIG.POLYGON_GASLESS_TRANSFER_CONTRACT_ADDRESS,
                value: '10010000',
                nonce: '3',
                deadline: signed.request.deadline,
            });
            expect(ethers.utils._TypedDataEncoder.from(permitTypes).encodeType('Permit')).toBe(
                'Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)',
            );
            expect(ethers.utils.verifyTypedData(
                permitDomain,
                permitTypes,
                permitMessage,
                ethers.utils.joinSignature(signed.authorization),
            )).toBe(from);

            const typedData = PolygonGasless.transferTypedData(signed.request, signed.authorization);
            expect(typedData.message.auth).toEqual({
                mode: 1,
                v: signed.authorization.v,
                r: signed.authorization.r,
                s: signed.authorization.s,
            });
            expect(ethers.utils.verifyTypedData(
                typedData.domain,
                typedData.types,
                typedData.message,
                signed.signature,
            )).toBe(from);
        }
    });

    it('refuses to sign a transfer from another address than the one of the key', async () => {
        const polygonKey = new PolygonKey(new Key(Dummy.secrets[0]));
        const request = SignPolygonTransactionApi.createTransferRequest(transfer(SENDER));
        const spy = spyOn(polygonKey, 'signTypedData').and.callThrough();
        let error;
        try {
            await signTransfer(polygonKey, request, 3);
        } catch (e) {
            error = e;
        }
        expect(error instanceof Errors.InvalidRequestError).toBe(true);
        expect(spy).not.toHaveBeenCalled();
    });
});
