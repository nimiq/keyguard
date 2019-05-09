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
        expect(parsedKeyInfo).toEqual(Dummy.keyInfos()[0]);

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
            data: new Uint8Array([84, 104, 97, 110, 107, 32, 121, 111, 117, 32, 102, 111, 114, 32, 115, 104, 111, 112, 112, 105, 110, 103, 32, 97, 116, 32, 115, 104, 111, 112, 46, 110, 105, 109, 105, 113, 46, 99, 111, 109, 32, 40, 72, 51, 88, 67, 48, 68, 41]),
            fee: 0,
            recipient: new Uint8Array([225, 253, 0, 255, 238, 105, 158, 173, 122, 16, 27, 203, 31, 16, 3, 178, 231, 105, 81, 188]),
            sender: new Uint8Array([238, 61, 13, 183, 158, 200, 247, 106, 130, 61, 9, 123, 134, 82, 60, 95, 16, 71, 39, 70]),
            senderType: 0,
            validityStartHeight: 176450,
            value: 545000000,
        };
        expect(requestParser.parseTransaction(transaction)).toEqual(
            new Nimiq.ExtendedTransaction(
                new Nimiq.Address(new Uint8Array([238, 61, 13, 183, 158, 200, 247, 106, 130, 61, 9, 123, 134, 82, 60, 95, 16, 71, 39, 70])), //sender
                Nimiq.Account.Type.BASIC, // senderType
                new Nimiq.Address(new Uint8Array([225, 253, 0, 255, 238, 105, 158, 173, 122, 16, 27, 203, 31, 16, 3, 178, 231, 105, 81, 188])), // recipient
                Nimiq.Account.Type.BASIC, //recipientType
                545000000, // value
                0, // fee
                176450, // validityStartHeight
                0, // flags
                new Uint8Array([84, 104, 97, 110, 107, 32, 121, 111, 117, 32, 102, 111, 114, 32, 115, 104, 111, 112, 112, 105, 110, 103, 32, 97, 116, 32, 115, 104, 111, 112, 46, 110, 105, 109, 105, 113, 46, 99, 111, 109, 32, 40, 72, 51, 88, 67, 48, 68, 41]), // data
            ),
        );

        const sender = transaction.sender;
        transaction.sender = transaction.recipient;
        expect( () => requestParser.parseTransaction(transaction)).toThrow();

        transaction.sender = sender; // in case some tests need to be added
        // rest should be thrown (and tested) by core.
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

        expect(() => requestParser.parseShopLogoUrl(5)).toThrow();
        expect(() => requestParser.parseShopLogoUrl({})).toThrow();
        expect(() => requestParser.parseShopLogoUrl('isThisAUrl?')).toThrow();
        expect(() => requestParser.parseShopLogoUrl('file:///home/maxmustermann/image.jpg')).toThrow();

        expect(requestParser.parseShopLogoUrl(undefined)).toBe(undefined);

        const vectors = [
            ['http://exampleshop.com/image.png', 'http://exampleshop.com/image.png'],
            ['https://nimiq.com/some/path/some/where/index.jpg?foo=bar', 'https://nimiq.com/some/path/some/where/index.jpg?foo=bar'],
            ['chrome-extension://cjpalhdlnbpafiamejdnhcphjbkeiagm/logo.jpg', 'chrome-extension://cjpalhdlnbpafiamejdnhcphjbkeiagm/logo.jpg'],
            ['moz-extension://cjpalhdlnbpafiamejdnhcphjbkeiagm/logo.jpg', 'moz-extension://cjpalhdlnbpafiamejdnhcphjbkeiagm/logo.jpg'],
        ]
        for (const vector of vectors) {
            const parsedUrl = /** @type {URL} */ (requestParser.parseShopLogoUrl(vector[0]));
            expect(parsedUrl.href).toEqual(vector[1]);
        }
    });

    // no it('can parse addresses', ...) as it is already tested by core.
});
