class Api {
    async request(transaction) {

        if (transaction.value < 1 / Nimiq.Policy.SATOSHIS_PER_COIN) {
            throw new Error('Amount is too small');
        }

        if (transaction.network !== Nimiq.GenesisConfig.NETWORK_NAME) {
            throw Error(`Network missmatch: ${transaction.network} in transaction, but ${Nimiq.GenesisConfig.NETWORK_NAME} in Keyguard`);
        }


        transaction.value = Nimiq.Policy.coinsToSatoshis(transaction.value);
        transaction.fee = Nimiq.Policy.coinsToSatoshis(transaction.fee);

        // get key from keystore
        const keyStore = KeyStore.instance;
        const keyType = await keyStore.getType(transaction.sender);

        return new Promise((resolve, reject) => {

            const handler = keyType === EncryptionType.HIGH
                ? new SignTransactionWithPassphrase(transaction)
                : new SignTransactionWithPin(transaction);

            handler.on('result', result => resolve(result));
            handler.on('error', error => reject(error));
        });
    }
}

runKeyguard(Api);
