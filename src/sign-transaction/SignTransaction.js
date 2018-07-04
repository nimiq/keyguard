class Api {
    /** @param {Nimiq.Transaction} transaction */
    // todo choose better type
    async request(transaction) {

        if (transaction.value < 1 / Nimiq.Policy.SATOSHIS_PER_COIN) {
            throw new AmountTooSmallError();
        }

        if (transaction.network !== Nimiq.GenesisConfig.NETWORK_NAME) {
            throw new NetworkMissmatchError(transaction.network, Nimiq.GenesisConfig.NETWORK_NAME);
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

            handler.on('result', /** @param {any} result */ (result) => resolve(result));
            handler.on('error', /** @param {Error} error */ (error) => reject(error));
        });
    }
}

runKeyguard(Api);
