/* global Nimiq */
/* global Key */
/* global Dummy */

describe('Key', () => {
    it('can sign a message (LEGACY)', () => {
        const key = new Key(Dummy.secrets[1]);
        const pubkey = Nimiq.PublicKey.derive(Dummy.secrets[1]);
        const data = Nimiq.BufferUtils.fromUtf8('hello');
        const signedData = Nimiq.BufferUtils.fromUtf8('\x16Nimiq Signed Message:\n5hello');
        const hashedSignedData = Nimiq.Hash.computeSha256(signedData);

        const signature1 = key.signMessage('m', data);
        const proof1 = Nimiq.SignatureProof.singleSig(pubkey, signature1);
        expect(proof1.verify(hashedSignedData)).toBe(true);

        const signature2 = key.signMessage('m/0\'', data);
        const proof2 = Nimiq.SignatureProof.singleSig(pubkey, signature2);
        expect(proof2.verify(hashedSignedData)).toBe(true);

        expect(signature1.serialize()).toEqual(signature2.serialize());
    });

    it('can sign a message (BIP39)', () => {
        const key = new Key(Dummy.secrets[0]);
        const data = new Nimiq.SerialBuffer([1, 2, 3, 4, 5, 6]);
        const signedData = new Uint8Array(
            Array.from(Nimiq.BufferUtils.fromUtf8('\x16Nimiq Signed Message:\n6')).concat([1, 2, 3, 4, 5, 6]),
        );
        const hashedSignedData = Nimiq.Hash.computeSha256(signedData);

        const pubkey1 = key.derivePublicKey('m/0\'');
        const signature1 = key.signMessage('m/0\'', data);
        const proof1 = Nimiq.SignatureProof.singleSig(pubkey1, signature1);
        expect(proof1.verify(hashedSignedData)).toBe(true);

        const pubkey2 = key.derivePublicKey('m/0\'/0\'');
        const signature2 = key.signMessage('m/0\'/0\'', data);
        const proof2 = Nimiq.SignatureProof.singleSig(pubkey2, signature2);
        expect(proof2.verify(hashedSignedData)).toBe(true);

        expect(signature1.serialize()).not.toEqual(signature2.serialize());
    });

    it('can derive addresses (LEGACY)', () => {
        const key = new Key(Dummy.secrets[1]);
        const address = 'NQ71 CT4K 7R9R EHSB 7HY9 TSTP XNRQ L2RK 8U4U';
        expect(key.deriveAddress('m').toUserFriendlyAddress()).toEqual(address);
        expect(key.deriveAddress('m/0\'').toUserFriendlyAddress()).toEqual(address);
    });

    it('can derive addresses (BIP39)', () => {
        const key = new Key(Dummy.secrets[0]);
        const address1 = 'NQ46 2RM7 QE4T 82KR 61Q9 9B7E R38G LBVM N6KY';
        const address2 = 'NQ70 APBA 9GCC FL44 D82R UJCD DS4B Y824 3LYJ';
        expect(key.deriveAddress('m').toUserFriendlyAddress()).toEqual(address1);
        expect(key.deriveAddress('m/0\'').toUserFriendlyAddress()).toEqual(address2);
    });

    it('can partially sign a multisig transaction (BIP39)', () => {
        const keypairA = Nimiq.KeyPair.fromHex('14a3bc3b25c73b6ca3e829aef329a2a6dc69ae52b8d20a164831a021b6a9f9feec98d39d98a58c13d399673d6da7dc6c74f379eddd8c8628e40ffc6be7c2498300');
        const keypairB = Nimiq.KeyPair.fromHex('2da15ede9992fad834b73283dd1a24f5a7a52b067b09be132ddb5232df863125bb639b6bbf6db003a94a83ef9d12f12fcc5990f63954b7f6d88f5be58f8c411200');
        const keypairC = Nimiq.KeyPair.fromHex('a3b3d799e7fca4baa3568d58e0c909af1f832926020163a1d48998621a15c9c6b81b12bcb1a6e9ba49a6dec268705c2cc2d70d1d7e22493a4128559eadacdbd400');

        const keyA = new Key(keypairA.privateKey);
        const keyB = new Key(keypairB.privateKey);
        const keyC = new Key(keypairC.privateKey);

        const signerPublicKeys = [
            keyA.derivePublicKey('m'),
            keyB.derivePublicKey('m'),
        ];

        const secretA = Nimiq.RandomSecret.unserialize(Nimiq.BufferUtils.fromHex('79c97389d2670f76d2e55192bc7ed875d9941bbfaa7932f8f452d9a907f94903'));

        const aggregatedCommitment = Nimiq.Commitment.unserialize(Nimiq.BufferUtils.fromHex('1c3eebbd316a7c46c7fb8359fd06ffa54ed77ff076de88ff429ae126d935482e'));

        const transaction = Nimiq.Transaction.unserialize(Nimiq.BufferUtils.fromHex('010000f4e305f34ea1ccf00c0f7fcbc030d1347dc5eafe00000000000000000000000000000000000000000000000000000000000a00000000000000000000000001000000'));

        // Test if participants' public keys create the transaction's sender address
        const expectedAddress = MultisigUtils.calculateAddress([
            keyA.derivePublicKey('m'),
            keyB.derivePublicKey('m'),
            keyC.derivePublicKey('m'),
        ], 2);

        expect(transaction.sender.equals(expectedAddress)).toBe(true);

        const partialSignatureA = keyA.signPartially(
            'm',
            transaction.serializeContent(),
            signerPublicKeys,
            secretA,
            aggregatedCommitment,
        );

        expect(partialSignatureA.toHex()).toEqual('b3584f24b073410d9c6f8c092068a2d1b66e67387fa3319e57609f2b2425be02');


        const secretB = Nimiq.RandomSecret.unserialize(Nimiq.BufferUtils.fromHex('0e400561be5711fc7d39d24774233419fb99b7421a86e0520b98d5399a6a5801'));

        const partialSignatureB = keyB.signPartially(
            'm',
            transaction.serializeContent(),
            signerPublicKeys,
            secretB,
            aggregatedCommitment,
        );

        expect(partialSignatureB.toHex()).toEqual('caa6353261d250e2f1f67499f526c47503015e08d2a69169322fecae83cdf607');
    })
});
