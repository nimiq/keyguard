/* global Nimiq */
/* global RequestParser */
/* global Dummy */
/* global Errors */

describe('RequestParser', () => {
    beforeEach(async () => Dummy.Utils.createDummyKeyStore());
    afterEach(async () => Dummy.Utils.deleteDummyKeyStore());

    it('can parse appName', () => {
        const requestParser = new RequestParser();

        /** @type {any} */
        let appName = undefined;
        expect( () => { requestParser.parseAppName(appName); }).toThrow();
        appName = 5;
        expect( () => { requestParser.parseAppName(appName); }).toThrow();
        appName = { appName: 'Ein Test' };
        expect( () => { requestParser.parseAppName(appName); }).toThrow();
        appName = 'Ein Test';
        expect(requestParser.parseAppName(appName)).toEqual(appName);
    });

    it('can parse Path', () => {
        const requestParser = new RequestParser();

        /** @type {any} */
        let path = undefined;
        expect( () => { requestParser.parsePath(path, '1'); }).toThrow();
        path = 5;
        expect( () => { requestParser.parsePath(path, '2'); }).toThrow();
        path = { path: 'Ein Test' };
        expect( () => { requestParser.parsePath(path, '3'); }).toThrow();
        path = 'Ein Test';
        expect( () => { requestParser.parsePath(path, '4'); }).toThrow();
        path = "m/44'/242'/0'/6'";
        expect(requestParser.parsePath(path, '5')).toEqual(path);
    });

    it('can parse Path Arrays', () => {
        const requestParser = new RequestParser();

        /** @type {any} */
        let paths = undefined;
        expect( () => { requestParser.parsePathsArray(paths, '1'); }).toThrow();
        paths = 5;
        expect( () => { requestParser.parsePathsArray(paths, '1'); }).toThrow();
        paths = { something: 5 };
        expect( () => { requestParser.parsePathsArray(paths, '1'); }).toThrow();
        paths = [];
        expect( () => { requestParser.parsePathsArray(paths, '1'); }).toThrow();
        paths = ['something'];
        expect( () => { requestParser.parsePathsArray(paths, '1'); }).toThrow();
        paths = ["m/44'/242'/0'/6'","m/44'/242'/0'/6'"];
        expect(requestParser.parsePathsArray(paths, '1')).toEqual(paths);
    });

    it('can parse label', () => {
        const requestParser = new RequestParser();

        /** @type {any} */
        let label = undefined;
        expect(requestParser.parseLabel(label)).toBe(undefined);
        label = 5;
        expect( () => { requestParser.parseLabel(label); }).toThrow();
        label = '';
        expect( requestParser.parseLabel(label)).toBe(undefined);
        label = {};
        expect( () => { requestParser.parseLabel(label); }).toThrow();
        label = 'Ein Test';
        expect(requestParser.parseLabel(label)).toEqual(label);
    });

    it('can parse KeyId to keyInfo', async () => {
        const requestParser = new RequestParser();
        let error;

        /** @type {any} */
        let keyId = undefined;
        try {
            const x = await requestParser.parseKeyId(keyId);
        } catch(e) {
            error = e;
        }
        expect(error).toEqual(new Errors.InvalidRequestError('keyId is required'));

        keyId = {keyId: 75};
        try {
            const x = await requestParser.parseKeyId(keyId);
        } catch(e) {
            error = e;
        }
        expect(error).toEqual(new Errors.InvalidRequestError('keyId must be of type string'));

        keyId = 'SuchMalNachDieserKeyId';
        try {
            const x = await requestParser.parseKeyId(keyId);
        } catch(e) {
            error = e;
        }
        expect(error).toEqual(new Errors.KeyNotFoundError());

        keyId = 5;
        try {
            const x = await requestParser.parseKeyId(keyId);
        } catch(e) {
            error = e;
        }
        expect(error).toEqual(new Errors.InvalidRequestError('keyId must be of type string'));


        keyId = '2ec615522906'; // dummy data
        let parsedKeyInfo = await requestParser.parseKeyId(keyId);
        expect(new KeyInfo(
            '2ec615522906',
            Key.Type.LEGACY,
            true,
            false,
        )).toEqual(parsedKeyInfo);
    });

    it('can parse indiceArrays', () => {
        const requestParser = new RequestParser();

        /** @type {any} */
        let indicesArray = undefined;
        expect( () => { requestParser.parseIndicesArray(indicesArray); }).toThrow();
        indicesArray = { x: 7 };
        expect( () => { requestParser.parseIndicesArray(indicesArray); }).toThrow();
        indicesArray = 'SindDasIndices';
        expect( () => { requestParser.parseIndicesArray(indicesArray); }).toThrow();
        indicesArray = 9;
        expect( () => { requestParser.parseIndicesArray(indicesArray); }).toThrow();
        indicesArray = [];
        expect( () => { requestParser.parseIndicesArray(indicesArray); }).toThrow();
        indicesArray = [1,2,3,4,5];
        expect( () => { requestParser.parseIndicesArray(indicesArray); }).toThrow();
        indicesArray = ["1","2","3"];
        expect( () => { requestParser.parseIndicesArray(indicesArray); }).toThrow();
        indicesArray = ["1'","2'","3'"];
        expect(requestParser.parseIndicesArray(indicesArray)).toEqual(indicesArray);
    });

    it('can parse transaction', () => {
        const requestParser = new RequestParser();

        /** @type {any} */
        let transaction = undefined;
        expect( () => { requestParser.parseTransaction(transaction); }).toThrow();
        transaction = 5;
        expect( () => { requestParser.parseTransaction(transaction); }).toThrow();
        transaction = {};
        expect( () => { requestParser.parseTransaction(transaction); }).toThrow();

        transaction = {
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
                0, // senderType
                new Nimiq.Address(new Uint8Array([225, 253, 0, 255, 238, 105, 158, 173, 122, 16, 27, 203, 31, 16, 3, 178, 231, 105, 81, 188])), // recipient
                0, //recipientType
                545000000, // value
                0, // fee
                176450, // validityStartHeight
                0, // flags
                new Uint8Array([84, 104, 97, 110, 107, 32, 121, 111, 117, 32, 102, 111, 114, 32, 115, 104, 111, 112, 112, 105, 110, 103, 32, 97, 116, 32, 115, 104, 111, 112, 46, 110, 105, 109, 105, 113, 46, 99, 111, 109, 32, 40, 72, 51, 88, 67, 48, 68, 41]), // data
                new Uint8Array(0), // proof
                1, // networkId
            ),
        );

        const sender = transaction.sender;
        transaction.sender = transaction.recipient;
        expect( () => { requestParser.parseTransaction(transaction); }).toThrow();

        transaction.sender = sender; // in case some tests need to be added
        // rest should be thrown (and tested) by core.
    });

    it('can parse message', () => {
        const requestParser = new RequestParser();

        /** @type {any} */
        let message = undefined;
        expect( () => { requestParser.parseMessage(message); }).toThrow();
        message = '123456';
        expect(requestParser.parseMessage(message)).toEqual(new Uint8Array([49, 50, 51, 52, 53, 54]));
        message = 5;
        expect( () => { requestParser.parseMessage(message); }).toThrow();
        message = {};
        expect( () => { requestParser.parseMessage(message); }).toThrow();
        message = new Uint8Array([238, 61, 13, 183, 158, 200, 247, 106, 130, 61, 9, 123, 134, 82, 60, 95, 16, 71, 39, 70]);
        expect(requestParser.parseMessage(message)).toEqual(message);
    });

    it('can parse shopOrigin', () => {
        const requestParser = new RequestParser();

        /** @type {any} */
        let url = undefined;
        expect( () => { requestParser.parseShopOrigin(url); }).toThrow();
        url = 5;
        expect( () => { requestParser.parseShopOrigin(url); }).toThrow();
        url = {};
        expect( () => { requestParser.parseShopOrigin(url); }).toThrow();
        url = 'isThisAUrl?';
        expect( () => { requestParser.parseShopOrigin(url); }).toThrow();
        url = 'http://nimiq.com';
        expect(requestParser.parseShopOrigin(url)).toEqual('http://nimiq.com');
        url = 'http://nimiq.com/some/path/some/where/index.html?foo=bar';
        expect(requestParser.parseShopOrigin(url)).toEqual('http://nimiq.com');
    });
});
