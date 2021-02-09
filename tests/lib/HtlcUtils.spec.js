/* global Nimiq */

describe('HtlcUtils', () => {
    it('can decode NIM HTLC data', () => {
        const vectors = [{
            // Branches verified individually
            data: Nimiq.BufferUtils.fromHex('eb933bf41fdcc9bc2ebf439305a0b2c64d5aea34df2953459bb18ca54537e55fef20144bc35816280309534fd599fcfd6ca4a0b02e93ca1b93e7c6275cb496b156fa20d950b7a7120c010014eb4f'),
            result: {
                refundAddress: 'NQ56 VE9K PV0Y TK4T QBMY 8E9G B85J QR6M MSHL',
                redeemAddress: 'NQ84 TULM 6HCT N66A AH9P UMFX X80L 9F1M G5H8',
                hash: '09534fd599fcfd6ca4a0b02e93ca1b93e7c6275cb496b156fa20d950b7a7120c',
                timeoutBlockHeight: 1370959,
            },
        }];

        for (const vector of vectors) {
            const decoded = HtlcUtils.decodeNimHtlcData(vector.data);
            expect(decoded).toEqual(vector.result);
        }
    });

    it('can decode BTC HTLC script', () => {
        const vectors = [{
            // Branches verified individually
            script: Nimiq.BufferUtils.fromHex('6382012088a82068758b83edce6f565f94e28aab7d7791d883ae24bc3413c2cd84798dc6455d958876a914d40596b18ac54fed16f6534a0bdb41c66ee7563b88ac67043461be5fb17576a91456b09849ad408957231d6c734d4778e5f62a288f88ac68'),
            result: {
                refundAddress: 'tb1q26cfsjddgzy4wgcad3e563mcuhmz52y092ttfl',
                redeemAddress: 'tb1q6szedvv2c48769hk2d9qhk6pcehww43m2fklev',
                hash: '68758b83edce6f565f94e28aab7d7791d883ae24bc3413c2cd84798dc6455d95',
                timeoutTimestamp: 1606315844,
            },
        }, {
            // Branches verified together at the end
            script: Nimiq.BufferUtils.fromHex('6382012088a82068758b83edce6f565f94e28aab7d7791d883ae24bc3413c2cd84798dc6455d958876a914d40596b18ac54fed16f6534a0bdb41c66ee7563b67043461be5fb17576a91456b09849ad408957231d6c734d4778e5f62a288f6888ac'),
            result: {
                refundAddress: 'tb1q26cfsjddgzy4wgcad3e563mcuhmz52y092ttfl',
                redeemAddress: 'tb1q6szedvv2c48769hk2d9qhk6pcehww43m2fklev',
                hash: '68758b83edce6f565f94e28aab7d7791d883ae24bc3413c2cd84798dc6455d95',
                timeoutTimestamp: 1606315844,
            },
        }];

        for (const vector of vectors) {
            const decoded = HtlcUtils.decodeBtcHtlcScript(vector.script);
            expect(decoded).toEqual(vector.result);
        }
    });
});
