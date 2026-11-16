/* global Nimiq */
/* global MultisigSessionStore */
/* global Dummy */

describe('MultisigSessionStore', () => {
    const DB_NAME = 'keyguard-dummy-multisig-database';
    /** @type {MultisigSessionStore} */
    let store;
    /** @type {Nimiq.PublicKey} */
    let signer;
    /** @type {Nimiq.PublicKey} */
    let otherSigner;

    const stateHash = new Uint8Array(32).fill(1);
    const inputsHash = new Uint8Array(32).fill(2);
    const otherInputsHash = new Uint8Array(32).fill(3);

    beforeAll(() => {
        signer = Nimiq.PublicKey.derive(
            Nimiq.PrivateKey.fromHex('14a3bc3b25c73b6ca3e829aef329a2a6dc69ae52b8d20a164831a021b6a9f9fe'),
        );
        otherSigner = Nimiq.PublicKey.derive(
            Nimiq.PrivateKey.fromHex('2da15ede9992fad834b73283dd1a24f5a7a52b067b09be132ddb5232df863125'),
        );
    });

    beforeEach(() => {
        store = new MultisigSessionStore(DB_NAME);
    });

    afterEach(async () => {
        await store.close();
        await Dummy.Utils.deleteDatabase(DB_NAME);
    });

    describe('decide', () => {
        const { decide, Decision } = MultisigSessionStore;
        /** @type {MultisigSessionStore.SessionRecord} */
        const unused = { stateHash: '01', inputsHash: null, usedAt: null, pruneAfter: 0 };
        /**
         * @param {Uint8Array} hash
         * @returns {MultisigSessionStore.SessionRecord}
         */
        const used = hash => ({ ...unused, inputsHash: hash, usedAt: 0 });

        it('signs unused sessions which this device recorded in round 1', () => {
            expect(decide({ isOwnDevice: true, record: unused, inputsHash })).toBe(Decision.SIGN);
            expect(decide({ isOwnDevice: false, record: unused, inputsHash })).toBe(Decision.SIGN);
        });

        it('signs again for identical inputs', () => {
            expect(decide({ isOwnDevice: true, record: used(inputsHash), inputsHash })).toBe(Decision.SIGN);
            expect(decide({ isOwnDevice: false, record: used(inputsHash), inputsHash })).toBe(Decision.SIGN);
        });

        it('refuses used sessions with differing inputs', () => {
            expect(decide({ isOwnDevice: true, record: used(otherInputsHash), inputsHash })).toBe(Decision.REFUSE);
            expect(decide({ isOwnDevice: false, record: used(otherInputsHash), inputsHash })).toBe(Decision.REFUSE);
        });

        it('asks for confirmation for sessions from other devices', () => {
            expect(decide({ isOwnDevice: false, record: null, inputsHash })).toBe(Decision.CONFIRM);
        });

        it('refuses sessions from this device which it has no record of', () => {
            expect(decide({ isOwnDevice: true, record: null, inputsHash })).toBe(Decision.REFUSE_UNKNOWN);
        });
    });

    it('derives a persistent device id', async () => {
        const deviceId = await store.getDeviceId(signer);
        expect(deviceId.length).toBe(16);
        expect(await store.getDeviceId(signer)).toEqual(deviceId);

        await store.close();
        const reopened = new MultisigSessionStore(DB_NAME);
        expect(await reopened.getDeviceId(signer)).toEqual(deviceId);
        await reopened.close();
    });

    it('derives different device ids for different signers', async () => {
        expect(await store.getDeviceId(signer)).not.toEqual(await store.getDeviceId(otherSigner));
    });

    it('derives a new device id after storage was cleared', async () => {
        const deviceId = await store.getDeviceId(signer);
        await store.close();
        await Dummy.Utils.deleteDatabase(DB_NAME);
        expect(await store.getDeviceId(signer)).not.toEqual(deviceId);
    });

    it('registers a session as unused', async () => {
        expect(await store.getRecord(stateHash)).toBeNull();

        await store.register(stateHash, Date.now() + 1000);
        const record = await store.getRecord(stateHash);
        expect(record).not.toBeNull();
        expect(record && record.inputsHash).toBeNull();
    });

    it('never resets a used session by registering it again', async () => {
        await store.register(stateHash, Date.now() + 1000);
        expect(await store.claim(stateHash, inputsHash, Date.now() + 1000)).toBe(true);

        let error = null;
        try {
            await store.register(stateHash, Date.now() + 1000);
        } catch (e) {
            error = e;
        }
        expect(error).not.toBeNull();

        const record = await store.getRecord(stateHash);
        expect(record && record.inputsHash).toEqual(inputsHash);
    });

    it('claims a registered session once, and again only for identical inputs', async () => {
        await store.register(stateHash, Date.now() + 1000);

        expect(await store.claim(stateHash, inputsHash, Date.now() + 1000)).toBe(true);
        const record = await store.getRecord(stateHash);
        expect(record && record.inputsHash).toEqual(inputsHash);

        expect(await store.claim(stateHash, inputsHash, Date.now() + 1000)).toBe(true);
        expect(await store.claim(stateHash, otherInputsHash, Date.now() + 1000)).toBe(false);

        // The record keeps the first inputs
        const recordAfter = await store.getRecord(stateHash);
        expect(recordAfter && recordAfter.inputsHash).toEqual(inputsHash);
    });

    it('allows only one of concurrent claims with differing inputs', async () => {
        await store.register(stateHash, Date.now() + 1000);
        const results = await Promise.all([
            store.claim(stateHash, inputsHash, Date.now() + 1000),
            store.claim(stateHash, otherInputsHash, Date.now() + 1000),
        ]);
        expect(results.filter(Boolean).length).toBe(1);
    });

    it('prunes used and unused records only after expiry plus grace period', async () => {
        const unusedStateHash = new Uint8Array(32).fill(4);
        const expiresAt = 1000;
        await store.register(stateHash, expiresAt);
        await store.claim(stateHash, inputsHash, expiresAt);
        await store.register(unusedStateHash, expiresAt);
        const pruneAfter = expiresAt + MultisigSessionStore.PRUNE_GRACE_PERIOD;

        await store.prune(pruneAfter);
        expect(await store.getRecord(stateHash)).not.toBeNull();
        expect(await store.getRecord(unusedStateHash)).not.toBeNull();

        await store.prune(pruneAfter + 1);
        expect(await store.getRecord(stateHash)).toBeNull();
        expect(await store.getRecord(unusedStateHash)).toBeNull();
    });

    it('writes with strict durability, such that records are not lost in a crash after signing', async () => {
        const transactionSpy = spyOn(IDBDatabase.prototype, 'transaction').and.callThrough();

        await store.getDeviceId(signer);
        await store.register(stateHash, Date.now() + 1000);
        await store.claim(stateHash, inputsHash, Date.now() + 1000);

        const writes = transactionSpy.calls.allArgs().filter(args => args[1] === 'readwrite');
        expect(writes.length).toBe(3);
        for (const args of writes) {
            expect(args[2]).toEqual({ durability: 'strict' });
        }
    });
});
