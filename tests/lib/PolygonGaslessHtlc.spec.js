/* global ethers */
/* global Key */
/* global PolygonKey */
/* global PolygonConstants */
/* global PolygonGaslessHtlc */
/* global Errors */
/* global CONFIG */
/* global Dummy */

describe('PolygonGaslessHtlc', () => {
    // Provisional, no GaslessHTLC contract is deployed on the local Anvil stack yet
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

    /**
     * @param {string} from
     * @returns {KeyguardRequest.PolygonHtlcOpenRequest}
     */
    function openRequest(from) {
        return {
            token: CONFIG.NATIVE_USDC_CONTRACT_ADDRESS,
            from,
            id: ID,
            recipient: RECIPIENT,
            amount: '250000000',
            hash: HASH,
            timeout: '1790007200',
            fee: '50000',
            relay: RELAY,
            deadline: '1790000600',
        };
    }

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

    it('checks the relay and the fee', () => {
        expect(() => PolygonGaslessHtlc.checkFeeAndRelay('50000', RELAY, 'request')).not.toThrow();
        expect(() => PolygonGaslessHtlc.checkFeeAndRelay('50000', RECIPIENT, 'request'))
            .toThrowError(Errors.InvalidRequestError);
        expect(() => PolygonGaslessHtlc.checkFeeAndRelay(
            (BigInt(CONFIG.POLYGON_GASLESS_MAX_ACCEPTABLE_FEE) + 1n).toString(),
            RELAY,
            'request',
        )).toThrowError(Errors.InvalidRequestError);
    });

    it('signs the permit for the HTLC contract and then the opening over it', async () => {
        const polygonKey = new PolygonKey(new Key(Dummy.secrets[0]));
        const path = PolygonConstants.DEFAULT_DERIVATION_PATH;
        const from = polygonKey.deriveAddress(path);
        const request = openRequest(from);

        const signed = await PolygonGaslessHtlc.signOpen(
            (domain, types, message) => polygonKey.signTypedData(path, domain, types, message),
            request,
            3,
        );

        const permit = PolygonGaslessHtlc.permitTypedData(request, 3);
        expect(permit.message).toEqual({
            owner: /** @type {`0x${string}`} */ (from),
            spender: HTLC_CONTRACT,
            value: '250050000',
            nonce: '3',
            deadline: request.deadline,
        });
        const permitSignature = ethers.utils.joinSignature({
            v: signed.authorization.v,
            r: signed.authorization.r,
            s: signed.authorization.s,
        });
        expect(ethers.utils.verifyTypedData(
            permit.domain,
            /** @type {any} */ (permit.types),
            permit.message,
            permitSignature,
        )).toBe(from);

        const open = PolygonGaslessHtlc.openTypedData(request, signed.authorization);
        expect(open.message.auth).toEqual({
            mode: 1,
            v: signed.authorization.v,
            r: signed.authorization.r,
            s: signed.authorization.s,
        });
        expect(ethers.utils.verifyTypedData(open.domain, open.types, open.message, signed.signature)).toBe(from);
        expect(signed.request).toEqual(request);
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
});
