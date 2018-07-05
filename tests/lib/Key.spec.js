describe("Key", function () {

    const ADDRESS = 'NQ70 21SY 835N V68Y Q2AH K64A UA7G BJBC DB70';
    const PLAIN_KEY_PAIR = '5c3da7e9e7de988c87dfbd8c992333521b4e7dd60baf35406d71b4a176670980719644d6ae5ca44972977d6b1ecd4b0e61ae6edbd703377b9f0dacd1eb0ca4b400';
    const ENCRYPTED_KEY_PAIR = '01080bf074db2535eabf77bb8133743fa5a64259fd19096b11babd0cb2900f7df25d55ad71ca3b5bfee1d6f4b5343fd57ac61075f40c';
    const PASSWORD = 'password';

    beforeAll(async function () {
        await Nimiq.WasmHelper.doImportBrowser();
        Nimiq.GenesisConfig.test();
    });

    it("can load a plain key pair", function () {
        const key = Key.loadPlain(PLAIN_KEY_PAIR, EncryptionType.HIGH);

        expect(key.address).toBeDefined();
        expect(key.userFriendlyAddress).toBe(ADDRESS);
        expect(key.type).toBe(EncryptionType.HIGH);
    });

    it("can load an encrypted key pair", async function (done) {
        const key = await Key.loadEncrypted(ENCRYPTED_KEY_PAIR, PASSWORD, EncryptionType.HIGH);

        expect(key.address).toBeDefined();
        expect(key.userFriendlyAddress).toBe(ADDRESS);
        expect(key.type).toBe(EncryptionType.HIGH);

        try {
            await Key.loadEncrypted(ENCRYPTED_KEY_PAIR, 'wrong password', EncryptionType.HIGH)
        } catch (e) {
            done();
            return;
        }

        done.fail("Wrong password not detected.");
    });

    it("can create a valid basic transaction", async function () {
        const key = await Key.loadEncrypted(ENCRYPTED_KEY_PAIR, PASSWORD, EncryptionType.HIGH);
        const recipient = 'NQ47 FS55 KNXG 25XL 37N8 LD78 1DDH 8CS0 QBNF';

        const tx = await key.createTransaction(recipient, 100 * 1e5, 1, 100000);

        expect(tx instanceof Nimiq.BasicTransaction).toBe(true);
        expect(tx.verify()).toBe(true);

        expect(Nimiq.SignatureProof.verifyTransaction(tx)).toBe(true);

        expect(tx.sender.toUserFriendlyAddress()).toBe(ADDRESS);
        expect(tx.senderType).toBe(Nimiq.Account.Type.BASIC);
        expect(tx.recipient.toUserFriendlyAddress()).toBe(recipient);
        expect(tx.recipientType).toBe(Nimiq.Account.Type.BASIC);
        expect(tx.value).toBe(100 * 1e5);
        expect(tx.fee).toBe(1);
        expect(tx.validityStartHeight).toBe(100000);
    });

    it("can create a valid transaction with message", async function () {
        const key = await Key.loadEncrypted(ENCRYPTED_KEY_PAIR, PASSWORD, EncryptionType.HIGH);
        const recipient = 'NQ47 FS55 KNXG 25XL 37N8 LD78 1DDH 8CS0 QBNF';
        const message = 'Test transaction message';

        const tx = await key.createTransactionWithMessage(recipient, 100 * 1e5, 1, 100000, message);

        expect(tx instanceof Nimiq.ExtendedTransaction).toBe(true);
        expect(tx.verify()).toBe(true);

        expect(Nimiq.SignatureProof.verifyTransaction(tx)).toBe(true);

        expect(tx.sender.toUserFriendlyAddress()).toBe(ADDRESS);
        expect(tx.senderType).toBe(Nimiq.Account.Type.BASIC);
        expect(tx.recipient.toUserFriendlyAddress()).toBe(recipient);
        expect(tx.recipientType).toBe(Nimiq.Account.Type.BASIC);
        expect(tx.value).toBe(100 * 1e5);
        expect(tx.fee).toBe(1);
        expect(tx.validityStartHeight).toBe(100000);
        expect(Utf8Tools.utf8ByteArrayToString(tx.data)).toBe(message);
    });

    it("can create a valid vesting payout transaction", async function () {
        const key = await Key.loadEncrypted(ENCRYPTED_KEY_PAIR, PASSWORD, EncryptionType.HIGH);
        const vestingContract = 'NQ47 FS55 KNXG 25XL 37N8 LD78 1DDH 8CS0 QBNF';
        const message = 'Test transaction message';

        const tx = await key.createVestingPayoutTransaction(vestingContract, 100 * 1e5, 1, 100000, message);

        expect(tx instanceof Nimiq.ExtendedTransaction).toBe(true);
        expect(tx.verify()).toBe(true);

        const signatureProof = Nimiq.SignatureProof.unserialize(tx.proof);
        expect(signatureProof.verify(null, tx.serializeContent())).toBe(true);

        expect(tx.sender.toUserFriendlyAddress()).toBe(vestingContract);
        expect(tx.senderType).toBe(Nimiq.Account.Type.VESTING);
        expect(tx.recipient.toUserFriendlyAddress()).toBe(ADDRESS);
        expect(tx.recipientType).toBe(Nimiq.Account.Type.BASIC);
        expect(tx.value).toBe(100 * 1e5);
        expect(tx.fee).toBe(1);
        expect(tx.validityStartHeight).toBe(100000);
        expect(Utf8Tools.utf8ByteArrayToString(tx.data)).toBe(message);
    });
});
