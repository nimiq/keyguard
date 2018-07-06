class SignTransactionApi extends RequestApi {
    /**
     * @param {TransactionRequest} txRequest
     */
    async onRequest(txRequest) {

        if (Nimiq.Policy.coinsToSatoshis(txRequest.value) < 1) {
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

        const handler = keyType === EncryptionType.HIGH
            ? new SignTransactionWithPassphrase(txRequest)
            : new SignTransactionWithPin(txRequest);

        handler.on('result', /** @param {any} result */ (result) => this.resolve(result));
        handler.on('error', /** @param {Error} error */ (error) => this.reject(error));
    }
}

runKeyguard(SignTransactionApi);
