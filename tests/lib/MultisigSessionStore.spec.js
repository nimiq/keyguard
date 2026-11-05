/* global MultisigSessionStore */
/* global Dummy */

describe('MultisigSessionStore', () => {
    const DB_NAME = 'keyguard-dummy-multisig-database';
    /** @type {MultisigSessionStore} */
    let store;

    const stateHash = new Uint8Array(32).fill(1);
    const inputsHash = new Uint8Array(32).fill(2);
    const otherInputsHash = new Uint8Array(32).fill(3);

    beforeEach(() => {
        store = new MultisigSessionStore(DB_NAME);
    });

    afterEach(async () => {
        await store.close();
        await Dummy.Utils.deleteDatabase(DB_NAME);
    });

    describe('decide', () => {
        const { decide, Decision } = MultisigSessionStore;
        /** @param {Uint8Array} hash */
        const usage = hash => ({ stateHash: '01', inputsHash: hash, usedAt: 0, pruneAfter: 0 });

        it('signs unused states from this device without warning', () => {
            expect(decide({ isOwnDevice: true, usage: null, inputsHash })).toBe(Decision.SIGN);
        });

        it('signs again for identical inputs', () => {
            expect(decide({ isOwnDevice: true, usage: usage(inputsHash), inputsHash })).toBe(Decision.SIGN);
            expect(decide({ isOwnDevice: false, usage: usage(inputsHash), inputsHash })).toBe(Decision.SIGN);
        });

        it('refuses used states with differing inputs', () => {
            expect(decide({ isOwnDevice: true, usage: usage(otherInputsHash), inputsHash })).toBe(Decision.REFUSE);
            expect(decide({ isOwnDevice: false, usage: usage(otherInputsHash), inputsHash })).toBe(Decision.REFUSE);
        });

        it('asks for confirmation for unused states from other devices', () => {
            expect(decide({ isOwnDevice: false, usage: null, inputsHash })).toBe(Decision.CONFIRM);
        });
    });

    it('creates a persistent device id', async () => {
        const deviceId = await store.getDeviceId();
        expect(deviceId.length).toBe(16);
        expect(await store.getDeviceId()).toEqual(deviceId);

        await store.close();
        const reopened = new MultisigSessionStore(DB_NAME);
        expect(await reopened.getDeviceId()).toEqual(deviceId);
        await reopened.close();
    });

    it('creates a new device id after storage was cleared', async () => {
        const deviceId = await store.getDeviceId();
        await store.close();
        await Dummy.Utils.deleteDatabase(DB_NAME);
        expect(await store.getDeviceId()).not.toEqual(deviceId);
    });

    it('claims a state once, and again only for identical inputs', async () => {
        expect(await store.getUsage(stateHash)).toBeNull();

        expect(await store.claim(stateHash, inputsHash, Date.now() + 1000)).toBe(true);
        const usage = await store.getUsage(stateHash);
        expect(usage && usage.inputsHash).toEqual(inputsHash);

        expect(await store.claim(stateHash, inputsHash, Date.now() + 1000)).toBe(true);
        expect(await store.claim(stateHash, otherInputsHash, Date.now() + 1000)).toBe(false);

        // The record keeps the first inputs
        const usageAfter = await store.getUsage(stateHash);
        expect(usageAfter && usageAfter.inputsHash).toEqual(inputsHash);
    });

    it('allows only one of concurrent claims with differing inputs', async () => {
        const results = await Promise.all([
            store.claim(stateHash, inputsHash, Date.now() + 1000),
            store.claim(stateHash, otherInputsHash, Date.now() + 1000),
        ]);
        expect(results.filter(Boolean).length).toBe(1);
    });

    it('prunes records only after expiry plus grace period', async () => {
        const expiresAt = 1000;
        await store.claim(stateHash, inputsHash, expiresAt);
        const pruneAfter = expiresAt + MultisigSessionStore.PRUNE_GRACE_PERIOD;

        await store.prune(pruneAfter);
        expect(await store.getUsage(stateHash)).not.toBeNull();

        await store.prune(pruneAfter + 1);
        expect(await store.getUsage(stateHash)).toBeNull();
    });
});
