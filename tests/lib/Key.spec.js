/* global Nimiq */
/* global Key */
/* global Dummy */
describe('Key', () => {
    it('can sign a message (LEGACY)', () => {
        const key = new Key(Dummy.keys[0], Key.Type.LEGACY);
        const pubkey = Nimiq.PublicKey.derive(new Nimiq.PrivateKey(Dummy.keys[0]));
        const data = Nimiq.BufferUtils.fromAscii('hello');

        const signature1 = key.sign('m', data);
        expect(signature1.verify(pubkey, data)).toBe(true);

        const signature2 = key.sign('m/0\'', data);
        expect(signature2.verify(pubkey, data)).toBe(true);

        expect(signature1).toEqual(signature2);
    });

    it('can sign a message (BIP39)', () => {
        const key = new Key(Dummy.keys[1], Key.Type.BIP39);
        const data = Nimiq.BufferUtils.fromAscii('hello');

        const pubkey1 = key.derivePublicKey('m');
        const signature1 = key.sign('m', data);
        expect(signature1.verify(pubkey1, data)).toBe(true);

        const pubkey2 = key.derivePublicKey('m/0\'');
        const signature2 = key.sign('m/0\'', data);
        expect(signature2.verify(pubkey2, data)).toBe(true);

        expect(signature1).not.toEqual(signature2);
    });

    it('can derive addresses (LEGACY)', () => {
        const key = new Key(Dummy.keys[0], Key.Type.LEGACY);
        const address = 'NQ71 CT4K 7R9R EHSB 7HY9 TSTP XNRQ L2RK 8U4U';
        expect(key.deriveAddress('m').toUserFriendlyAddress()).toEqual(address);
        expect(key.deriveAddress('m/0\'').toUserFriendlyAddress()).toEqual(address);
    });

    it('can derive addresses (BIP39)', () => {
        const key = new Key(Dummy.keys[0], Key.Type.BIP39);
        const address1 = 'NQ55 07AD F3U4 9FTD XP5N 1UMS 2FVT 3N69 Q0H9';
        const address2 = 'NQ15 YMBC GHHD S4DY CPR5 LC74 HAKD ES3R 5B7P';
        expect(key.deriveAddress('m').toUserFriendlyAddress()).toEqual(address1);
        expect(key.deriveAddress('m/0\'').toUserFriendlyAddress()).toEqual(address2);
    });
});
