class Api {
    async request(transaction) {
        // get key from keystore
        const key = await keyStore.getPlain(transaction.sender);
        if (key.type === EncryptionType.HIGH) {
            // start UI

        } else {
            // start UI

        }
    }

    async signSafe(transaction) {
        /*if (transaction.value < 1 / Nimiq.Policy.SATOSHIS_PER_COIN) {
            throw new Error('Amount is too small');
        }
        if (transaction.network !== Nimiq.GenesisConfig.NETWORK_NAME) throw Error(`Network missmatch: ${transaction.network} in transaction, but ${Nimiq.GenesisConfig.NETWORK_NAME} in Keyguard`);

        const key = await keyStore.getPlain(transaction.sender);
        if (key.type !== KeyType.HIGH) throw new Error('Unauthorized: sender is not a Safe account');

        transaction.value = Nimiq.Policy.coinsToSatoshis(transaction.value);
        transaction.fee = Nimiq.Policy.coinsToSatoshis(transaction.fee);

        return this._startRequest(RequestTypes.SIGN_SAFE_TRANSACTION, {
            transaction,
            address: transaction.sender
        });*/
    }
}

runKeyguard(Api);
