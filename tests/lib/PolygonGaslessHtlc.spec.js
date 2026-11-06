/* global ethers */
/* global Key */
/* global PolygonKey */
/* global PolygonConstants */
/* global PolygonGasless */
/* global PolygonGaslessHtlc */
/* global Errors */
/* global CONFIG */
/* global Dummy */

describe('PolygonGaslessHtlc', () => {
    // Provisional, no GaslessHTLC contract is deployed yet
    const HTLC_CONTRACT = '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9';
    const RELAY = CONFIG.POLYGON_GASLESS_RELAY_ADDRESSES[0];
    const ID = `0x${'11'.repeat(32)}`;
    const HASH = `0x${'22'.repeat(32)}`;
    const RECIPIENT = '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC';

    /** @type {string} */
    let configuredContract;

    beforeEach(() => {
        configuredContract = CONFIG.POLYGON_GASLESS_HTLC_CONTRACT_ADDRESS;
        CONFIG.POLYGON_GASLESS_HTLC_CONTRACT_ADDRESS = HTLC_CONTRACT;
    });

    afterEach(() => {
        CONFIG.POLYGON_GASLESS_HTLC_CONTRACT_ADDRESS = configuredContract;
    });

    it('has the provisional EIP-712 types', () => {
        expect(ethers.utils._TypedDataEncoder.from(PolygonGaslessHtlc.OPEN_TYPES).encodeType('HtlcOpen')).toBe(
            'HtlcOpen(address token,address from,bytes32 id,address recipient,uint256 amount,bytes32 hash,'
            + 'uint256 timeout,uint256 fee,address relay,uint256 deadline,TokenAuth auth)'
            + 'TokenAuth(uint8 mode,uint8 v,bytes32 r,bytes32 s)',
        );
        expect(ethers.utils._TypedDataEncoder.from(PolygonGaslessHtlc.REDEEM_TYPES).encodeType('HtlcRedeem')).toBe(
            'HtlcRedeem(address from,bytes32 id,address target,uint256 fee,address relay,uint256 deadline)',
        );
        expect(ethers.utils._TypedDataEncoder.from(PolygonGaslessHtlc.REFUND_TYPES).encodeType('HtlcRefund')).toBe(
            'HtlcRefund(address from,bytes32 id,address target,uint256 fee,address relay,uint256 deadline)',
        );
        expect(PolygonGaslessHtlc.domain()).toEqual({
            name: 'Nimiq Gasless HTLC',
            version: '3',
            chainId: CONFIG.POLYGON_CHAIN_ID,
            verifyingContract: HTLC_CONTRACT,
        });
    });

    it('refuses to sign without a configured contract', () => {
        CONFIG.POLYGON_GASLESS_HTLC_CONTRACT_ADDRESS = '';
        expect(() => PolygonGaslessHtlc.domain()).toThrowError(Errors.KeyguardError);
    });

    it('decodes the HTLC data of the swap service', () => {
        const htlcData = new ethers.utils.Interface(PolygonGaslessHtlc.HTLC_DATA_ABI).encodeFunctionData('open', [
            ID,
            CONFIG.NATIVE_USDC_CONTRACT_ADDRESS,
            '250000000',
            '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
            RECIPIENT,
            HASH,
            1790007200,
            0,
        ]);
        expect(PolygonGaslessHtlc.decodeHtlcData(htlcData)).toEqual({
            id: ID,
            token: CONFIG.NATIVE_USDC_CONTRACT_ADDRESS,
            amount: '250000000',
            refundAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
            recipient: RECIPIENT,
            hash: HASH,
            timeout: 1790007200,
        });
    });

    it('signs redeems and refunds as different types', async () => {
        const polygonKey = new PolygonKey(new Key(Dummy.secrets[0]));
        const path = PolygonConstants.DEFAULT_DERIVATION_PATH;
        const from = polygonKey.deriveAddress(path);
        /** @type {KeyguardRequest.PolygonHtlcSettlementRequest} */
        const request = {
            from,
            id: ID,
            target: from,
            fee: '50000',
            relay: RELAY,
            deadline: '1790000600',
        };
        /** @type {PolygonGaslessHtlc.Sign} */
        const sign = (domain, types, message) => polygonKey.signTypedData(path, domain, types, message);

        const redeem = await PolygonGaslessHtlc.signSettlement(sign, 'redeem', request);
        const refund = await PolygonGaslessHtlc.signSettlement(sign, 'refund', request);
        expect(redeem.signature).not.toBe(refund.signature);

        const redeemPayload = PolygonGaslessHtlc.settlementTypedData('redeem', request);
        expect(ethers.utils.verifyTypedData(
            redeemPayload.domain,
            redeemPayload.types,
            redeemPayload.message,
            redeem.signature,
        )).toBe(from);
        const refundPayload = PolygonGaslessHtlc.settlementTypedData('refund', request);
        expect(ethers.utils.verifyTypedData(
            refundPayload.domain,
            refundPayload.types,
            refundPayload.message,
            refund.signature,
        )).toBe(from);
    });

    it('checks the deadline of an opening', () => {
        const now = PolygonGasless.now();
        const deadline = now + 30 * 60;

        expect(() => PolygonGaslessHtlc.checkOpeningDeadline(deadline, deadline)).not.toThrow();
        // Fastspot's HTLCs time out after 2 hours
        expect(() => PolygonGaslessHtlc.checkOpeningDeadline(deadline, now + 2 * 60 * 60)).not.toThrow();

        // The HTLC times out before the deadline
        expect(() => PolygonGaslessHtlc.checkOpeningDeadline(deadline, deadline - 1))
            .toThrowError(Errors.InvalidRequestError);

        // The deadline does not leave the relay enough time, or has passed
        for (const passed of [now + 30, now, now - 3600]) {
            expect(() => PolygonGaslessHtlc.checkOpeningDeadline(passed, now + 24 * 60 * 60))
                .toThrowError(Errors.InvalidRequestError);
        }
    });

    it('rejects redeeming an HTLC that has timed out', () => {
        const now = PolygonGasless.now();
        expect(() => PolygonGaslessHtlc.checkRedeemTimeout(now + 3600)).not.toThrow();
        for (const timeout of [now, now - 3600]) {
            expect(() => PolygonGaslessHtlc.checkRedeemTimeout(timeout)).toThrowError(Errors.InvalidRequestError);
        }
    });

    describe('without a USDT contract', () => {
        /** @type {string} */
        let configuredUsdt;

        beforeEach(() => {
            configuredUsdt = CONFIG.BRIDGED_USDT_CONTRACT_ADDRESS;
            CONFIG.BRIDGED_USDT_CONTRACT_ADDRESS = '';
        });

        afterEach(() => {
            CONFIG.BRIDGED_USDT_CONTRACT_ADDRESS = configuredUsdt;
        });

        it('has no USDT token address', () => {
            expect(() => PolygonGaslessHtlc.tokenAddress('USDT_MATIC')).toThrowError(Errors.InvalidRequestError);
            expect(PolygonGaslessHtlc.tokenAddress('USDC_MATIC')).toBe(CONFIG.NATIVE_USDC_CONTRACT_ADDRESS);
        });
    });
});
