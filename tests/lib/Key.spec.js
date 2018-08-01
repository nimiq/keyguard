describe("Key", function () {
    it("can load a plain key pair", function () {
        const key = Key.loadPlain(Dummy.keyPairs[0], EncryptionType.LOW);
        const keyFromHex = Key.loadPlain(Nimiq.BufferUtils.toHex(Dummy.keyPairs[0]), EncryptionType.LOW);

        expect(key.address).toBeDefined();
        expect(key.userFriendlyAddress).toBe(Dummy.keyInfo[0].userFriendlyAddress);
        expect(key.type).toBe(EncryptionType.LOW);
        expect(key.equals(keyFromHex)).toBe(true);
    });

    it("can load an encrypted key pair", async function (done) {
        const key = await Key.loadEncrypted(Dummy.encryptedKeyPairs[0], Dummy.encryptionPassword, EncryptionType.HIGH);

        expect(key.address).toBeDefined();
        expect(key.userFriendlyAddress).toBe(Dummy.keyInfo[0].userFriendlyAddress);
        expect(key.type).toBe(EncryptionType.HIGH);

        try {
            await Key.loadEncrypted(Dummy.encryptedKeyPairs[0], 'wrong password', EncryptionType.HIGH);
            done.fail('Wrong password not detected.');
        } catch (e) {
            done();
        }
    });

    it("can create a valid basic transaction", async function () {
        const key = await Key.loadEncrypted(Dummy.encryptedKeyPairs[0], Dummy.encryptionPassword, EncryptionType.HIGH);
        const recipient = 'NQ47 FS55 KNXG 25XL 37N8 LD78 1DDH 8CS0 QBNF';

        const tx = await key.createBasicTransaction(recipient, 100 * 1e5, 1, 100000);

        expect(tx instanceof Nimiq.BasicTransaction).toBe(true);
        expect(tx.verify()).toBe(true);

        expect(Nimiq.SignatureProof.verifyTransaction(tx)).toBe(true);

        expect(tx.sender.toUserFriendlyAddress()).toBe(Dummy.keyInfo[0].userFriendlyAddress);
        expect(tx.senderType).toBe(Nimiq.Account.Type.BASIC);
        expect(tx.recipient.toUserFriendlyAddress()).toBe(recipient);
        expect(tx.recipientType).toBe(Nimiq.Account.Type.BASIC);
        expect(tx.value).toBe(100 * 1e5);
        expect(tx.fee).toBe(1);
        expect(tx.validityStartHeight).toBe(100000);
    });

    it("can create a valid transaction with message", async function () {
        const key = await Key.loadEncrypted(Dummy.encryptedKeyPairs[0], Dummy.encryptionPassword, EncryptionType.HIGH);
        const recipient = 'NQ47 FS55 KNXG 25XL 37N8 LD78 1DDH 8CS0 QBNF';
        const message = 'Test transaction message';

        const tx = await key.createExtendedTransaction(key.address, undefined, recipient, undefined, 100 * 1e5, 1, 100000, message);

        expect(tx instanceof Nimiq.ExtendedTransaction).toBe(true);
        expect(tx.verify()).toBe(true);

        expect(Nimiq.SignatureProof.verifyTransaction(tx)).toBe(true);

        expect(tx.sender.toUserFriendlyAddress()).toBe(Dummy.keyInfo[0].userFriendlyAddress);
        expect(tx.senderType).toBe(Nimiq.Account.Type.BASIC);
        expect(tx.recipient.toUserFriendlyAddress()).toBe(recipient);
        expect(tx.recipientType).toBe(Nimiq.Account.Type.BASIC);
        expect(tx.value).toBe(100 * 1e5);
        expect(tx.fee).toBe(1);
        expect(tx.validityStartHeight).toBe(100000);
        expect(Utf8Tools.utf8ByteArrayToString(tx.data)).toBe(message);
    });

    it("can create a valid vesting payout transaction", async function () {
        const key = await Key.loadEncrypted(Dummy.encryptedKeyPairs[0], Dummy.encryptionPassword, EncryptionType.HIGH);
        const vestingContract = 'NQ47 FS55 KNXG 25XL 37N8 LD78 1DDH 8CS0 QBNF';
        const message = 'Test transaction message';

        const tx = await key.createExtendedTransaction(vestingContract, Nimiq.Account.Type.VESTING, key.address, undefined, 100 * 1e5, 1, 100000, message);

        expect(tx instanceof Nimiq.ExtendedTransaction).toBe(true);
        expect(tx.verify()).toBe(true);

        const signatureProof = Nimiq.SignatureProof.unserialize(tx.proof);
        expect(signatureProof.verify(signatureProof.publicKey.toAddress(), tx.serializeContent())).toBe(true);
        expect(signatureProof.publicKey.toAddress().toUserFriendlyAddress()).toBe(Dummy.keyInfo[0].userFriendlyAddress);

        expect(tx.sender.toUserFriendlyAddress()).toBe(vestingContract);
        expect(tx.senderType).toBe(Nimiq.Account.Type.VESTING);
        expect(tx.recipient.toUserFriendlyAddress()).toBe(Dummy.keyInfo[0].userFriendlyAddress);
        expect(tx.recipientType).toBe(Nimiq.Account.Type.BASIC);
        expect(tx.value).toBe(100 * 1e5);
        expect(tx.fee).toBe(1);
        expect(tx.validityStartHeight).toBe(100000);
        expect(Utf8Tools.utf8ByteArrayToString(tx.data)).toBe(message);
    });
});
