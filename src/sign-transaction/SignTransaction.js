class SignTransaction {
    /** @param {TransactionRequest} txRequest */
    async request(txRequest) {

        if (txRequest.value < 1 / Nimiq.Policy.SATOSHIS_PER_COIN) {
            throw new AmountTooSmallError();
        }

        if (txRequest.network !== Nimiq.GenesisConfig.NETWORK_NAME) {
            throw new NetworkMissmatchError(txRequest.network, Nimiq.GenesisConfig.NETWORK_NAME);
        }

        txRequest.value = Nimiq.Policy.coinsToSatoshis(txRequest.value);
        txRequest.fee = Nimiq.Policy.coinsToSatoshis(txRequest.fee);

        // get key from keystore
        const keyStore = KeyStore.instance;
        const keyType = await keyStore.getType(txRequest.sender);

        return new Promise((resolve, reject) => {

            const handler = keyType === EncryptionType.HIGH
                ? new SignTransactionWithPassphrase(txRequest)
                : new SignTransactionWithPin(txRequest);

            handler.on('result', /** @param {any} result */ (result) => resolve(result));
            handler.on('error', /** @param {Error} error */ (error) => reject(error));
        });
    }
}

runKeyguard(SignTransaction);
