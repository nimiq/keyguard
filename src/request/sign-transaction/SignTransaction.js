/* global Nimiq */
/* global TransactionType */
/* global KeyStore */

class SignTransaction { // eslint-disable-line no-unused-vars
    /**
     * Decrypt key and use it to sign a transaction constructed with the data from txRequest.
     *
     * @param {TransactionRequest} txRequest
     * @param {string} passphraseOrPin
     * @returns {Promise<SignedTransactionResult>}
     * @protected
     */
    async _doSignTransaction(txRequest, passphraseOrPin) {
        if (txRequest.type === TransactionType.BASIC) {
            // eslint-disable-next-line object-curly-newline
            const { value, fee, recipient, signer, validityStartHeight } = txRequest;

            const key = await KeyStore.instance.get(signer, passphraseOrPin);
            const tx = key.createTransaction(recipient, value, fee, validityStartHeight);

            const signatureProof = Nimiq.SignatureProof.unserialize(new Nimiq.SerialBuffer(tx.proof));

            return {
                type: TransactionType.BASIC,
                sender: tx.sender.toUserFriendlyAddress(),
                signerPubKey: signatureProof.publicKey.serialize(),
                recipient: tx.recipient.toUserFriendlyAddress(),
                value: Nimiq.Policy.satoshisToCoins(tx.value),
                fee: Nimiq.Policy.satoshisToCoins(tx.fee),
                validityStartHeight: tx.validityStartHeight,
                signature: signatureProof.signature.serialize(),
                hash: tx.hash().toBase64(),
            };
        }

        if (txRequest.type === TransactionType.EXTENDED) {

            // return {
            //     sender: tx.sender.toUserFriendlyAddress(),
            //     signerPubKey: signatureProof.publicKey.serialize(),
            //     recipient: tx.recipient.toUserFriendlyAddress(),
            //     value: Nimiq.Policy.satoshisToCoins(tx.value),
            //     fee: Nimiq.Policy.satoshisToCoins(tx.fee),
            //     validityStartHeight: tx.validityStartHeight,
            //     signature: signatureProof.signature.serialize(),
            //     extraData: Utf8Tools.utf8ByteArrayToString(tx.data),
            //     hash: tx.hash().toBase64(),
            // };
        }

        throw new Error('Unknown transaction type. Must be "basic" or "extended"');
    }
}
