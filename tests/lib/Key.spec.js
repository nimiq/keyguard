/* global Nimiq */
/* global Key */
/* global Dummy */

describe('Key', () => {
    it('can sign a message (LEGACY)', () => {
        const key = new Key(Dummy.secrets[0]);
        const pubkey = Nimiq.PublicKey.derive(Dummy.secrets[0]);
        const data = Nimiq.BufferUtils.fromAscii('hello');
        const signedData = Nimiq.BufferUtils.fromAscii('\x16Nimiq Signed Message:\n5hello');
        const hashedSignedData = Nimiq.Hash.computeSha256(signedData);

        const signature1 = key.signMessage('m', data);
        expect(signature1.verify(pubkey, hashedSignedData)).toBe(true);

        const signature2 = key.signMessage('m/0\'', data);
        expect(signature2.verify(pubkey, hashedSignedData)).toBe(true);

        expect(signature1).toEqual(signature2);
    });

    it('can sign a message (BIP39)', () => {
        const key = new Key(Dummy.secrets[1]);
        const data = new Nimiq.SerialBuffer([1, 2, 3, 4, 5, 6]);
        const signedData = new Uint8Array(
            Array.from(Nimiq.BufferUtils.fromAscii('\x16Nimiq Signed Message:\n6')).concat([1, 2, 3, 4, 5, 6]),
        );
        const hashedSignedData = Nimiq.Hash.computeSha256(signedData);

        const pubkey1 = key.derivePublicKey('m/0\'');
        const signature1 = key.signMessage('m/0\'', data);
        expect(signature1.verify(pubkey1, hashedSignedData)).toBe(true);

        const pubkey2 = key.derivePublicKey('m/0\'/0\'');
        const signature2 = key.signMessage('m/0\'/0\'', data);
        expect(signature2.verify(pubkey2, hashedSignedData)).toBe(true);

        expect(signature1).not.toEqual(signature2);
    });

    it('can derive addresses (LEGACY)', () => {
        const key = new Key(Dummy.secrets[0]);
        const address = 'NQ71 CT4K 7R9R EHSB 7HY9 TSTP XNRQ L2RK 8U4U';
        expect(key.deriveAddress('m').toUserFriendlyAddress()).toEqual(address);
        expect(key.deriveAddress('m/0\'').toUserFriendlyAddress()).toEqual(address);
    });

    it('can derive addresses (BIP39)', () => {
        const key = new Key(Dummy.secrets[1]);
        const address1 = 'NQ46 2RM7 QE4T 82KR 61Q9 9B7E R38G LBVM N6KY';
        const address2 = 'NQ70 APBA 9GCC FL44 D82R UJCD DS4B Y824 3LYJ';
        expect(key.deriveAddress('m').toUserFriendlyAddress()).toEqual(address1);
        expect(key.deriveAddress('m/0\'').toUserFriendlyAddress()).toEqual(address2);
    });
});
