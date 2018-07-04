class Api {
    async request(transaction) {

        if (transaction.value < 1 / Nimiq.Policy.SATOSHIS_PER_COIN) {
            throw new Error('Amount is too small');
        }

        if (transaction.network !== Nimiq.GenesisConfig.NETWORK_NAME) {
            throw Error(`Network missmatch: ${transaction.network} in transaction, but ${Nimiq.GenesisConfig.NETWORK_NAME} in Keyguard`);
        }

        // get key from keystore
        const keyStore = KeyStore.instance;
        const keyType = await keyStore.getType(transaction.sender);

        return new Promise((resolve, reject) => {

            if (keyType === EncryptionType.HIGH) {
                const signTransactionSafe = new SignTransactionSafe(transaction);

                signTransactionSafe.on('result', result => resolve(result));
                signTransactionSafe.on('error', error => reject(error));
            } else {
                // start UI
            }
        });
    }
}

runKeyguard(Api);
