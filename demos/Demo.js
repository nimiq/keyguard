class Demo {
    static serve() {
        const server = new Rpc.RpcServer('*');
        server.onRequest('setUpKey',
            (state, keyPassphrase) => Demo.setUpKey(keyPassphrase).then(() => 'setUpKey'));
        server.onRequest('tearDownKey',
            () => Demo.tearDownKey().then(() => 'tearDownKey'));
        server.init();
    }

    static async setUpKey(keyPassphrase) {
        const entropy = new Nimiq.Entropy(Nimiq.BufferUtils.fromHex(Demo.ENTROPY));

        const secret = entropy.serialize();
        const key = new Key(secret, Key.Type.BIP39);
        const passphrase = keyPassphrase ? Nimiq.BufferUtils.fromAscii(keyPassphrase) : undefined;
        await KeyStore.instance.put(key, passphrase);
    }

    static async tearDownKey() {
        const entropy = new Nimiq.Entropy(Nimiq.BufferUtils.fromHex(Demo.ENTROPY));

        const secret = entropy.serialize();
        const key = new Key(secret, Key.Type.BIP39);
        await KeyStore.instance.remove(key.id);
    }
}
Demo.ENTROPY = 'abb107d2c9adafed0b2ff41c0cfbe4ad4352b11362c5ca83bb4fc7faa7d4cf69';
