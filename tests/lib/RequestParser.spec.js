/* global Nimiq */
/* global RequestParser */
/* global Dummy */
/* global Errors */

describe('RequestParser', () => {
    it('can parse appName', () => {
        const requestParser = new RequestParser();

        expect(() => requestParser.parseAppName(undefined)).toThrow();
        expect(() => requestParser.parseAppName(5)).toThrow();
        expect(() => requestParser.parseAppName({appName: 'Ein Test'})).toThrow();
        const appName = 'Ein Test';
        expect(requestParser.parseAppName(appName)).toEqual(appName);
    });

    it('can parse path', () => {
        const requestParser = new RequestParser();

        expect(() => requestParser.parsePath(undefined, '1')).toThrow();
        expect(() => requestParser.parsePath(5, '2')).toThrow();
        expect(() => requestParser.parsePath({path: 'A test'}, '3')).toThrow();
        expect(() => requestParser.parsePath('A test', '4')).toThrow();
        const path = "m/44'/242'/0'/6'";
        expect(requestParser.parsePath(path, '5')).toEqual(path);
    });

    it('can parse paths arrays', () => {
        const requestParser = new RequestParser();

        expect(() => requestParser.parsePathsArray(undefined, '1')).toThrow();
        expect(() => requestParser.parsePathsArray(5, '1')).toThrow();
        expect(() => requestParser.parsePathsArray({something: 5}, '1')).toThrow();
        expect(() => requestParser.parsePathsArray([], '1')).toThrow();
        expect(() => requestParser.parsePathsArray(['something'], '1')).toThrow();
        const paths = ["m/44'/242'/0'/6'","m/44'/242'/0'/6'"];
        expect(requestParser.parsePathsArray(paths, '1')).toEqual(paths);
    });

    it('can parse label', () => {
        const requestParser = new RequestParser();

        expect(requestParser.parseLabel(undefined)).toBe(undefined);
        expect(() => requestParser.parseLabel(5)).toThrow();
        expect(requestParser.parseLabel('')).toBe(undefined);
        expect(() => requestParser.parseLabel({})).toThrow();
        const label = 'Ein Test';
        expect(requestParser.parseLabel(label)).toEqual(label);
    });

    it('can parse keyId to keyInfo', async () => {
        await Dummy.Utils.createDummyKeyStore();

        const requestParser = new RequestParser();
        let error;

        try {
            const x = await requestParser.parseKeyId(undefined);
        } catch(e) {
            error = e;
        }
        expect(error).toEqual(new Errors.InvalidRequestError('keyId must be a string'));

        try {
            const x = await requestParser.parseKeyId({keyId:75});
        } catch(e) {
            error = e;
        }
        expect(error).toEqual(new Errors.InvalidRequestError('keyId must be a string'));

        try {
            const x = await requestParser.parseKeyId(99999);
        } catch(e) {
            error = e;
        }
        expect(error).toEqual(new Errors.InvalidRequestError('keyId must be a string'));

        try {
            const x = await requestParser.parseKeyId('string');
        } catch(e) {
            error = e;
        }
        expect(error).toEqual(new Errors.KeyNotFoundError());

        const parsedKeyInfo = await requestParser.parseKeyId(Dummy.keyInfos()[0].id);
        expect(parsedKeyInfo.equals(Dummy.keyInfos()[0])).toBe(true);

        await Dummy.Utils.deleteDummyKeyStore();
    });

    it('can parse indicesArrays', () => {
        const requestParser = new RequestParser();

        expect(() => requestParser.parseIndicesArray(undefined)).toThrow();
        expect(() => requestParser.parseIndicesArray({x: 7})).toThrow();
        expect(() => requestParser.parseIndicesArray('ThisIsNotAnArray')).toThrow();
        expect(() => requestParser.parseIndicesArray(9)).toThrow();
        expect(() => requestParser.parseIndicesArray([])).toThrow();
        expect(() => requestParser.parseIndicesArray([1,2,3,4,5])).toThrow();
        expect(() => requestParser.parseIndicesArray(["1","2","3"])).toThrow();
        const indicesArray = ["1'","2'","3'"];
        expect(requestParser.parseIndicesArray(indicesArray)).toEqual(indicesArray);
    });

    it('can parse transactions', () => {
        const requestParser = new RequestParser();

        expect(() => requestParser.parseTransaction(undefined)).toThrow();
        expect(() => requestParser.parseTransaction(5)).toThrow();
        expect(() => requestParser.parseTransaction({})).toThrow();

        const transaction = {
            recipientData: new Uint8Array([84, 104, 97, 110, 107, 32, 121, 111, 117, 32, 102, 111, 114, 32, 115, 104, 111, 112, 112, 105, 110, 103, 32, 97, 116, 32, 115, 104, 111, 112, 46, 110, 105, 109, 105, 113, 46, 99, 111, 109, 32, 40, 72, 51, 88, 67, 48, 68, 41]),
            fee: 0,
            recipient: new Uint8Array([225, 253, 0, 255, 238, 105, 158, 173, 122, 16, 27, 203, 31, 16, 3, 178, 231, 105, 81, 188]),
            sender: new Uint8Array([238, 61, 13, 183, 158, 200, 247, 106, 130, 61, 9, 123, 134, 82, 60, 95, 16, 71, 39, 70]),
            senderType: 0,
            validityStartHeight: 176450,
            value: 545000000,
        };

        const parsed = requestParser.parseTransaction(transaction);
        const expected = new Nimiq.Transaction(
            new Nimiq.Address(new Uint8Array([238, 61, 13, 183, 158, 200, 247, 106, 130, 61, 9, 123, 134, 82, 60, 95, 16, 71, 39, 70])), //sender
            Nimiq.AccountType.Basic, // senderType
            new Uint8Array(0),
            new Nimiq.Address(new Uint8Array([225, 253, 0, 255, 238, 105, 158, 173, 122, 16, 27, 203, 31, 16, 3, 178, 231, 105, 81, 188])), // recipient
            Nimiq.AccountType.Basic, //recipientType
            new Uint8Array([84, 104, 97, 110, 107, 32, 121, 111, 117, 32, 102, 111, 114, 32, 115, 104, 111, 112, 112, 105, 110, 103, 32, 97, 116, 32, 115, 104, 111, 112, 46, 110, 105, 109, 105, 113, 46, 99, 111, 109, 32, 40, 72, 51, 88, 67, 48, 68, 41]), // recipientData
            545000000n, // value
            0n, // fee
            0, // flags
            176450, // validityStartHeight
            5, // networkId
        );
        expect(parsed.sender.equals(expected.sender)).toBe(true);
        expect(parsed.senderType).toBe(expected.senderType);
        expect(parsed.senderData).toEqual(expected.senderData);
        expect(parsed.recipient.equals(expected.recipient)).toBe(true);
        expect(parsed.recipientType).toBe(expected.recipientType);
        expect(parsed.data).toEqual(expected.data);
        expect(parsed.value).toEqual(expected.value);
        expect(parsed.fee).toEqual(expected.fee);
        expect(parsed.flags).toEqual(expected.flags);
        expect(parsed.validityStartHeight).toEqual(expected.validityStartHeight);
        expect(parsed.networkId).toEqual(expected.networkId);

        const sender = transaction.sender;
        transaction.sender = transaction.recipient;
        expect( () => requestParser.parseTransaction(transaction)).toThrow();

        transaction.sender = sender; // in case some tests need to be added
        // rest should be thrown (and tested) by core.
    });

    it('can parse HTLC creation transactions', () => {
        const requestParser = new RequestParser();

        const refundAddress = 'eb933bf41fdcc9bc2ebf439305a0b2c64d5aea34';
        // Same HTLC data as the NIM HTLC test vector in HtlcUtils.spec.js:
        // refund address + redeem address + hash algorithm + hash root + hash count + timeout
        const htlcData = `${refundAddress}df2953459bb18ca54537e55fef20144bc35816280309534fd599fcfd6ca4a0b02e93ca1b93e7c6275cb496b156fa20d950b7a7120c010000000051b72c98`;
        const transaction = {
            sender: Nimiq.BufferUtils.fromHex(refundAddress),
            recipient: 'CONTRACT_CREATION',
            recipientType: Nimiq.AccountType.HTLC,
            recipientData: Nimiq.BufferUtils.fromHex(htlcData),
            flags: Nimiq.TransactionFlag.ContractCreation,
            value: 545000000,
            fee: 0,
            validityStartHeight: 176450,
        };

        const parsed = requestParser.parseTransaction(transaction);
        expect(parsed.flags).toBe(Nimiq.TransactionFlag.ContractCreation);
        expect(parsed.recipientType).toBe(Nimiq.AccountType.HTLC);
        expect(Nimiq.BufferUtils.toHex(parsed.data)).toBe(htlcData);
        // The recipient is not part of the request. It must be the address of the contract that gets created.
        expect(parsed.recipient.equals(parsed.getContractCreationAddress())).toBe(true);
    });

    it('can parse vesting contract creation transactions', () => {
        const requestParser = new RequestParser();

        const owner = 'ee3d0db79ec8f76a823d097b86523c5f10472746';
        const vectors = [
            // owner + time step
            `${owner}0000000005265c00`,
            // owner + start time + time step + step amount
            `${owner}0000018bcfe568000000000005265c0000000000067f3540`,
            // owner + start time + time step + step amount + total amount
            `${owner}0000018bcfe568000000000005265c0000000000067f354000000000207c0a40`,
        ];

        for (const vector of vectors) {
            const transaction = {
                sender: Nimiq.BufferUtils.fromHex(owner),
                recipient: 'CONTRACT_CREATION',
                recipientType: Nimiq.AccountType.Vesting,
                recipientData: Nimiq.BufferUtils.fromHex(vector),
                flags: Nimiq.TransactionFlag.ContractCreation,
                value: 545000000,
                fee: 0,
                validityStartHeight: 176450,
            };

            const parsed = requestParser.parseTransaction(transaction);
            expect(parsed.flags).toBe(Nimiq.TransactionFlag.ContractCreation);
            expect(parsed.recipientType).toBe(Nimiq.AccountType.Vesting);
            expect(Nimiq.BufferUtils.toHex(parsed.data)).toBe(vector);
            // The recipient is not part of the request. It must be the address of the contract that gets created.
            expect(parsed.recipient.equals(parsed.getContractCreationAddress())).toBe(true);
        }
    });

    it('rejects invalid contract creation transactions', () => {
        const requestParser = new RequestParser();

        const transaction = {
            sender: Nimiq.BufferUtils.fromHex('ee3d0db79ec8f76a823d097b86523c5f10472746'),
            recipient: 'CONTRACT_CREATION',
            recipientType: Nimiq.AccountType.Vesting,
            recipientData: Nimiq.BufferUtils.fromHex('ee3d0db79ec8f76a823d097b86523c5f104727460000000005265c00'),
            flags: Nimiq.TransactionFlag.ContractCreation,
            value: 545000000,
            fee: 0,
            validityStartHeight: 176450,
        };

        // The contract address is derived from the transaction and can therefore not be specified in the request.
        const recipient = Nimiq.BufferUtils.fromHex('e1fd00ffee699ead7a101bcb1f1003b2e76951bc');
        expect(() => requestParser.parseTransaction({ ...transaction, recipient }))
            .toThrowError(/recipient must be "CONTRACT_CREATION"/);

        // Conversely, the recipient "CONTRACT_CREATION" is only allowed for transactions that create a contract.
        const flags = Nimiq.TransactionFlag.None;
        expect(() => requestParser.parseTransaction({ ...transaction, flags }))
            .toThrowError(/recipient must be "CONTRACT_CREATION"/);

        // The data must be of a length that is valid for creating a contract.
        const recipientData = new Uint8Array(27);
        expect(() => requestParser.parseTransaction({ ...transaction, recipientData }))
            .toThrowError(/^Contract creation data must be/);
    });

    it('can parse messages', () => {
        const requestParser = new RequestParser();

        expect(() => requestParser.parseMessage(undefined)).toThrow();
        expect(() => requestParser.parseMessage(5)).toThrow();
        expect(() => requestParser.parseMessage({})).toThrow();
        expect(() => requestParser.parseMessage(Utf8Tools.utf8ByteArrayToString(new Uint8Array([72, 101, 108, 108, 111, 0, 32, 87, 111, 114, 108, 100, 33])))).toThrow(); // 'Hello World!' with a zero byte in the middle
        expect(requestParser.parseMessage('Sign this message!')).toEqual('Sign this message!');
        const message = new Uint8Array([238, 61, 13, 183, 158, 200, 247, 106, 130, 61, 9, 123, 134, 82, 60, 95, 16, 71, 39, 70]);
        expect(requestParser.parseMessage(message)).toEqual(message);
    });

    it('can parse shopOrigins', () => {
        const requestParser = new RequestParser();

        expect(() => requestParser.parseShopOrigin(undefined)).toThrow();
        expect(() => requestParser.parseShopOrigin(5)).toThrow();
        expect(() => requestParser.parseShopOrigin({})).toThrow();
        expect(() => requestParser.parseShopOrigin('isThisAUrl?')).toThrow();
        expect(() => requestParser.parseShopOrigin('file:///home/maxmustermann/file.html')).toThrow();

        const vectors = [
            ['http://nimiq.com', 'http://nimiq.com'],
            ['https://nimiq.com/some/path/some/where/index.html?foo=bar', 'https://nimiq.com'],
            // The following two tests are not possible in headless browsers, as they don't know extension protocols
            // ['chrome-extension://cjpalhdlnbpafiamejdnhcphjbkeiagm/dashboard.html', 'chrome-extension://cjpalhdlnbpafiamejdnhcphjbkeiagm'],
            // ['moz-extension://cjpalhdlnbpafiamejdnhcphjbkeiagm/dashboard.html', 'moz-extension://cjpalhdlnbpafiamejdnhcphjbkeiagm'],
        ]
        for (const vector of vectors) {
            expect(requestParser.parseShopOrigin(vector[0])).toEqual(vector[1]);
        }
    });

    it('can parse shopLogoUrl', () => {
        const requestParser = new RequestParser();

        expect(() => requestParser.parseLogoUrl(5, true, 'shopLogoUrl')).toThrow();
        expect(() => requestParser.parseLogoUrl({}, true, 'shopLogoUrl')).toThrow();
        expect(() => requestParser.parseLogoUrl('isThisAUrl?', true, 'shopLogoUrl')).toThrow();
        expect(() => requestParser.parseLogoUrl('file:///home/maxmustermann/image.jpg', true, 'shopLogoUrl')).toThrow();

        expect(requestParser.parseLogoUrl(undefined, true, 'shopLogoUrl')).toBe(undefined);

        // Test allowEmpty = false
        expect(() => requestParser.parseLogoUrl('http://exampleshop.com/image.png', false, 'shopLogoUrl')).not.toThrow();
        expect(() => requestParser.parseLogoUrl(undefined, false, 'shopLogoUrl')).toThrow();

        const vectors = [
            ['http://exampleshop.com/image.png', 'http://exampleshop.com/image.png'],
            ['https://nimiq.com/some/path/some/where/index.jpg?foo=bar', 'https://nimiq.com/some/path/some/where/index.jpg?foo=bar'],
            ['chrome-extension://cjpalhdlnbpafiamejdnhcphjbkeiagm/logo.jpg', 'chrome-extension://cjpalhdlnbpafiamejdnhcphjbkeiagm/logo.jpg'],
            ['moz-extension://cjpalhdlnbpafiamejdnhcphjbkeiagm/logo.jpg', 'moz-extension://cjpalhdlnbpafiamejdnhcphjbkeiagm/logo.jpg'],
        ]
        for (const vector of vectors) {
            const parsedUrl = /** @type {URL} */ (requestParser.parseLogoUrl(vector[0], true, 'shopLogoUrl'));
            expect(parsedUrl.href).toEqual(vector[1]);
        }
    });

    // no it('can parse addresses', ...) as it is already tested by core.
});
