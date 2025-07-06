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
        const keypairA = Nimiq.KeyPair.derive(Nimiq.PrivateKey.fromHex('14a3bc3b25c73b6ca3e829aef329a2a6dc69ae52b8d20a164831a021b6a9f9fe'));
        const keypairB = Nimiq.KeyPair.derive(Nimiq.PrivateKey.fromHex('2da15ede9992fad834b73283dd1a24f5a7a52b067b09be132ddb5232df863125'));
        const keypairC = Nimiq.KeyPair.derive(Nimiq.PrivateKey.fromHex('a3b3d799e7fca4baa3568d58e0c909af1f832926020163a1d48998621a15c9c6'));

        const keyA = new Key(keypairA.privateKey);
        const keyB = new Key(keypairB.privateKey);
        const keyC = new Key(keypairC.privateKey);

        const signerPublicKeys = [
            keyA.derivePublicKey('m'),
            keyB.derivePublicKey('m'),
        ];

        // The fixed hex strings have been generated with the multisig-app's Demo.vue page

        const transaction = Nimiq.Transaction.deserialize(Nimiq.BufferUtils.fromHex('01f4e305f34ea1ccf00c0f7fcbc030d1347dc5eafe0000e7741e4ae69075ec75b7779e787f22fbac594fa9000000000000000f4240000000000000000001613cca050000'));

        // Test if participants' public keys create the transaction's sender address
        const expectedAddress = Nimiq.Address.fromPublicKeys([
            keyA.derivePublicKey('m'),
            keyB.derivePublicKey('m'),
            keyC.derivePublicKey('m'),
        ], 2);

        expect(transaction.sender.equals(expectedAddress)).toBe(true);

        const commitmentPairsA = [
            new Nimiq.CommitmentPair(
                Nimiq.RandomSecret.fromHex("34e57d9589653e25474403e14a06a8a27f3b96767497a2a3fc8ff787a8f0ed0a"),
                Nimiq.Commitment.fromHex("30ed83f0ea0f6ca1a0a087dac6d6f7b3c61459ae0489b4aa57aae6ac92f79647"),
            ),
            new Nimiq.CommitmentPair(
                Nimiq.RandomSecret.fromHex("ca35586032118b1f9ac0655ead843cea423c0e6590240b2c416da625cdb6f50b"),
                Nimiq.Commitment.fromHex("665c9a9010fda255d5765af22194a4039a86bae2335433c8a93628c1d26da002"),
            ),
        ];

        const commitmentPairsB = [
            new Nimiq.CommitmentPair(
                Nimiq.RandomSecret.fromHex("218f4e3f2b136f75ff5b5e7a23f154993a0f1ca174853f3fdc533d09f3d42d08"),
                Nimiq.Commitment.fromHex("43bbd3695d2d53f121b585a4d5a4c4edf878934a0b811fa6334b79f790a80908"),
            ),
            new Nimiq.CommitmentPair(
                Nimiq.RandomSecret.fromHex("51ed42bb96c5a6058f7cb0056dac059cd7225b9a991b4b442d3d4c9d71caac01"),
                Nimiq.Commitment.fromHex("3de45bb9f05349abffa74707b44d7eaa3588cbe3da0629bac5bc2b7333a6858b"),
            ),
        ];

        const partialSignatureA = keyA.signPartially(
            'm',
            transaction.serializeContent(),
            commitmentPairsA,
            [{
                publicKey: signerPublicKeys[1],
                commitments: commitmentPairsB.map(pair => pair.commitment),
            }],
        );

        expect(partialSignatureA.toHex()).toEqual('40ac7aeb69d2ad7e6418bfc289a18950ef6c10b9198f075cc6afbf6c51a6ef07');

        const partialSignatureB = keyB.signPartially(
            'm',
            transaction.serializeContent(),
            commitmentPairsB,
            [{
                publicKey: signerPublicKeys[0],
                commitments: commitmentPairsA.map(pair => pair.commitment),
            }],
        );

        expect(partialSignatureB.toHex()).toEqual('1705344a6421a7010dbf6db6410d1e7f0f1eaaa65afb80d6404cf0e8d064db06');
    })
});
