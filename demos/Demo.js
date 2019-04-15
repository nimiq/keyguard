class Demo {
    static serve() {
        const server = new Rpc.RpcServer('*');
        server.onRequest('setUpLegacyAccounts',
            (state) => Demo.setUpLegacyAccounts().then(() => 'setUpLegacyAccounts done'));
        server.onRequest('list', () => Demo.list());
        server.init();
    }

    static async setUpLegacyAccounts() {
        await this._createDummyAccountStore();
    }

    static async _createDummyAccountStore() {
        // create database
        const db = await new Promise((resolve, reject) => {
            const request = window.indexedDB.open(AccountStore.ACCOUNT_DATABASE, AccountStore.VERSION);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
            request.onupgradeneeded = () => {
                const _db = request.result;
                _db.createObjectStore(AccountStore.ACCOUNT_DATABASE, { keyPath: 'userFriendlyAddress' });
            };
        });

        // add accounts to database
        /**
         * @type {AccountRecord}
         */
        const deprecatedAccountRecord1 = {
            userFriendlyAddress: 'NQ71 CT4K 7R9R EHSB 7HY9 TSTP XNRQ L2RK 8U4U',
            type: 'high',
            label: 'Dummy Account 1',
            encryptedKeyPair: Uint8Array.from([ 0x01, 0x08, 0x18, 0xb1, 0x0b, 0x3e, 0x07, 0x2d, 0x4e, 0x52, 0x39, 0x3e, 0x80, 0x22, 0x17, 0x4d, 0x7d, 0x0a, 0x2d, 0x07, 0x87, 0x8d, 0xf0, 0x9f, 0xc5, 0x31, 0x2a, 0x6b, 0x0e, 0xb6, 0xc7, 0x45, 0xb3, 0xcc, 0x45, 0x11, 0x2c, 0xef, 0xcb, 0xe5, 0x91, 0xf8, 0x26, 0xbd, 0xbf, 0x03, 0x19, 0x7f, 0x4e, 0x8c, 0x66, 0xc9, 0x33, 0xe5 ]),
        }

        /**
         * @type {AccountRecord}
         */
        const deprecatedAccountRecord2 = { // Vesting owner
            userFriendlyAddress: 'NQ92 EED8 CLJB 0GRL 6RR5 9TXG 7R75 KF07 PU3J',
            type: 'high',
            label: 'Vesting Owner',
            encryptedKeyPair: Uint8Array.from([ 0x02, 0x08, 0x19, 0x7b, 0xf3, 0x2a, 0xb9, 0x53, 0x16, 0x34, 0x1c, 0xb6, 0x1d, 0xdd, 0x26, 0x7d, 0xa6, 0xb3, 0xab, 0x86, 0x10, 0xc3, 0x3f, 0x3f, 0xf7, 0x8c, 0xf3, 0x2d, 0xe9, 0x32, 0x78, 0x98, 0x61, 0x73, 0xed, 0x5d, 0x75, 0x28, 0xd8, 0x6d, 0x90, 0x24, 0x0b, 0x3f, 0x40, 0xdc, 0xc1, 0x31, 0x1b, 0x70, 0xf9, 0x95, 0xed, 0x5e ]),
        }

        await this._addEntryToDatabase(db, AccountStore.ACCOUNT_DATABASE, deprecatedAccountRecord1);
        await this._addEntryToDatabase(db, AccountStore.ACCOUNT_DATABASE, deprecatedAccountRecord2);

        db.close();
    }

    static async _addEntryToDatabase(db, objectStoreName, entry) {
        return new Promise((resolve, reject) => {
            const request = db.transaction([objectStoreName], 'readwrite')
                .objectStore(objectStoreName)
                .put(entry);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    static async list() {
        return (await KeyStore.instance.list()).map(ki => ki.toObject());
    }
}
