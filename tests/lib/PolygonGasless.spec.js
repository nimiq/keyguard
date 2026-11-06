/* global ethers */
/* global Key */
/* global PolygonKey */
/* global PolygonConstants */
/* global PolygonGasless */
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

        it('does not deny other recipients', () => {
            expect(PolygonGasless.isDeniedRecipient('0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC')).toBe(false);
            expect(PolygonGasless.isDeniedRecipient(CONFIG.NATIVE_USDC_CONTRACT_ADDRESS)).toBe(true);
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
});
