/* global Key */
/* global OasisSettlementInstructionUtils */

describe('OasisSettlementInstructionUtils', () => {
    it('can sign settlement instructions', () => {
        const key = new Key(Dummy.secrets[0]);
        const jws = OasisSettlementInstructionUtils.signSettlementInstruction(key, 'm/0\'', {
            type: 'mock',
            contractId: 'HLCAZRQWYLDH4WTH22HEO2FCO',
        });

        expect(jws).toEqual('eyJhbGciOiJFZERTQSJ9.eyJ0eXBlIjoibW9jayIsImNvbnRyYWN0SWQiOiJITENBWlJRV1lMREg0V1RIMjJIRU8yRkNPIn0.r2kuH3leZPYv9B0G9_J5gNJ6zV8mHsgiIIu7N4BuM4-pD8aqVmb8yUnx9mZvkQF8H847MfDp8--tRD9tuvB9DA');
    });
});
