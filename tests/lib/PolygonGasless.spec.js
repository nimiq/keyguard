/* global ethers */
/* global Key */
/* global PolygonKey */
/* global PolygonConstants */
/* global PolygonGasless */
/* global NimiqGaslessCore */
/* global SignPolygonTransactionApi */
/* global Errors */
/* global CONFIG */
/* global Dummy */

describe('PolygonGasless', () => {
    // Golden vectors of NimiqToolbox/gas-abstraction (sdk/test/vectors/gasless-transfer-31337.json), whose digests
    // the GaslessTransfer contract and the token mocks recompute on-chain. The local config pins the same addresses.
    const VECTORS = {
        transfer: {
            request: {
                token: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
                from: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
                to: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
                amount: '250000000',
                fee: '5000000',
                relay: '0xa0Ee7A142d267C1f36714E4a8F75612F20a79720',
                nonce: '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
                deadline: '1790007200',
            },
            digest: '0x07b9ae6976f0bdfc96b87913160b89f56a02c77b130a8fc0a5d29b37a5faf399',
        },
        usdcPermit: {
            owner: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
            value: '1',
            nonce: '0',
            deadline: '1790000600',
            digest: '0xbf9d5cc149189a653e7d416e1427d7ea52ee42f3e1df39c02125fd2d12ecf0fb',
        },
        usdt0Permit: {
            owner: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
            value: '255000000',
            nonce: '0',
            deadline: '1790007200',
            digest: '0x3bc3b63f626827381d2d7221bc7f030710f2ec6b27c01e96660f714a9b2d622a',
        },
    };

    /**
     * @param {{domain: any, types: any, message: any}} payload
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
            ...overrides,
        };
    }

    const SENDER = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';

    it('pins the configured deployment', () => {
        const pins = PolygonGasless.pins();
        expect(pins.chainId).toBe(CONFIG.POLYGON_CHAIN_ID);
        expect(pins.transfer.address).toBe(CONFIG.POLYGON_GASLESS_TRANSFER_CONTRACT_ADDRESS);
        expect(pins.tokens.map(token => /** @type {string} */ (token.address))).toEqual([
            CONFIG.NATIVE_USDC_CONTRACT_ADDRESS,
            CONFIG.BRIDGED_USDT_CONTRACT_ADDRESS,
        ]);
        expect(PolygonGasless.stablecoin(CONFIG.NATIVE_USDC_CONTRACT_ADDRESS)).toBe('usdc');
        expect(PolygonGasless.stablecoin(CONFIG.BRIDGED_USDT_CONTRACT_ADDRESS)).toBe('usdt');
    });

    it('builds typed data that matches the contract and token digests', () => {
        const pins = PolygonGasless.pins();
        expect(digest(NimiqGaslessCore.buildTransferTypedData(
            pins.chainId,
            pins.transfer.address,
            /** @type {any} */ (VECTORS.transfer.request),
        ))).toBe(VECTORS.transfer.digest);

        const [usdc, usdt0] = pins.tokens;
        for (const [token, vector] of /** @type {const} */ ([
            [usdc, VECTORS.usdcPermit],
            [usdt0, VECTORS.usdt0Permit],
        ])) {
            /** @type {any} */
            const addresses = { owner: vector.owner };
            expect(digest(NimiqGaslessCore.buildPermitTypedData({
                tokenDomain: token.domain,
                owner: addresses.owner,
                spender: pins.transfer.address,
                value: vector.value,
                nonce: vector.nonce,
                deadline: vector.deadline,
            }))).toBe(vector.digest);
        }
    });

    it('creates an intent with a fresh nonce, a permit and a short deadline', () => {
        const now = PolygonGasless.now();
        const intent = SignPolygonTransactionApi.createIntent(transfer(SENDER), 7);
        expect(intent.authMode).toBe('permit');
        expect(intent.request.nonce).toMatch(/^0x[0-9a-f]{64}$/);
        expect(Number(intent.request.deadline)).toBeGreaterThanOrEqual(now + 600);
        expect(Number(intent.request.deadline)).toBeLessThanOrEqual(now + 601);
        expect(/** @type {any} */ (intent.tokenAuth).message).toEqual(jasmine.objectContaining({
            owner: SENDER,
            spender: CONFIG.POLYGON_GASLESS_TRANSFER_CONTRACT_ADDRESS,
            value: '10010000',
            nonce: '7',
            deadline: intent.request.deadline,
        }));

        const other = SignPolygonTransactionApi.createIntent(transfer(SENDER), 7);
        expect(other.request.nonce).not.toBe(intent.request.nonce);
    });

    it('rejects transfers outside the pins and the fee limit', () => {
        const invalid = [
            transfer(SENDER, { fee: String(Number(CONFIG.POLYGON_GASLESS_MAX_ACCEPTABLE_FEE) + 10000) }),
            transfer(SENDER, { relay: '0xa0Ee7A142d267C1f36714E4a8F75612F20a79720' }),
            transfer(SENDER, { token: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC' }),
            transfer(SENDER, { to: CONFIG.POLYGON_GASLESS_TRANSFER_CONTRACT_ADDRESS }),
            transfer(SENDER, { to: CONFIG.BRIDGED_USDT_CONTRACT_ADDRESS }),
            transfer(SENDER, { amount: '0' }),
        ];
        for (const fields of invalid) {
            expect(() => SignPolygonTransactionApi.createIntent(fields, 0))
                .toThrowError(Errors.InvalidRequestError);
        }
    });

    it('keeps the payment nonce for a correction and enforces the correction rules', () => {
        const first = SignPolygonTransactionApi.createIntent(transfer(SENDER), 3);

        const corrected = SignPolygonTransactionApi.createIntent(
            transfer(SENDER, { fee: '20000' }),
            3,
            first.request,
        );
        expect(corrected.request.nonce).toBe(first.request.nonce);
        expect(Number(corrected.request.deadline)).toBeGreaterThanOrEqual(Number(first.request.deadline));

        expect(() => SignPolygonTransactionApi.createIntent(
            transfer(SENDER, { to: '0x90F79bf6EB2c4f870365E785982E1f101E93b906' }),
            3,
            first.request,
        )).toThrowError(Errors.InvalidRequestError);
    });

    it('signs the intent and the permit with the Polygon key', async () => {
        const key = new Key(Dummy.secrets[0]);
        const polygonKey = new PolygonKey(key);
        const path = PolygonConstants.DEFAULT_DERIVATION_PATH;
        const from = polygonKey.deriveAddress(path);

        const intent = SignPolygonTransactionApi.createIntent(transfer(from), 0);
        const { transfer: transferPayload, tokenAuth } = NimiqGaslessCore.transferSigningPayloads(
            PolygonGasless.pins(),
            intent,
            PolygonGasless.now(),
        );
        if (!tokenAuth) throw new Error('Missing token authorization');

        const signature = await polygonKey.signTypedData(
            path,
            transferPayload.domain,
            /** @type {any} */ (transferPayload.types),
            transferPayload.message,
        );
        const tokenSignature = await polygonKey.signTypedData(
            path,
            tokenAuth.domain,
            /** @type {any} */ (tokenAuth.types),
            tokenAuth.message,
        );

        expect(ethers.utils.verifyTypedData(
            transferPayload.domain,
            /** @type {any} */ (transferPayload.types),
            transferPayload.message,
            signature,
        )).toBe(from);
        expect(ethers.utils.verifyTypedData(
            tokenAuth.domain,
            /** @type {any} */ (tokenAuth.types),
            tokenAuth.message,
            tokenSignature,
        )).toBe(from);

        const body = NimiqGaslessCore.buildSubmitTransferBody({
            request: intent.request,
            signature,
            authorization: NimiqGaslessCore.toTokenAuthorization('permit', tokenSignature),
        });
        expect(body.authorization.mode).toBe('permit');
        expect(NimiqGaslessCore.transferDigest(
            PolygonGasless.pins().chainId,
            PolygonGasless.pins().transfer.address,
            body.request,
        )).toBe(intent.id);
    });
});
