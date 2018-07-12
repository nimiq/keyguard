/* global Nimiq */
/* global TransactionType */
/* global KeyStore */
/* global Identicon */

class SignTransaction { // eslint-disable-line no-unused-vars
    /**
     * @param {TransactionRequest} txRequest
     * @returns {HTMLDivElement}
     */
    fillTransactionDetails(txRequest) {
        /** @type {HTMLDivElement} */
        const $transaction = (document.querySelector('#transaction-data .transaction'));

        /** @type {HTMLDivElement} */
        const $senderIdenticon = ($transaction.querySelector('#sender-identicon'));
        /** @type {HTMLDivElement} */
        const $recipientIdenticon = ($transaction.querySelector('#recipient-identicon'));

        /** @type {HTMLDivElement} */
        const $senderLabel = ($transaction.querySelector('#sender-label'));
        /** @type {HTMLDivElement} */
        const $recipientLabel = ($transaction.querySelector('#recipient-label'));

        /** @type {HTMLDivElement} */
        const $senderAddress = ($transaction.querySelector('#sender-address'));
        /** @type {HTMLDivElement} */
        const $recipientAddress = ($transaction.querySelector('#recipient-address'));

        /** @type {HTMLDivElement} */
        const $value = ($transaction.querySelector('#value'));
        /** @type {HTMLDivElement} */
        const $fee = ($transaction.querySelector('#fee'));
        /** @type {HTMLDivElement} */
        const $message = ($transaction.querySelector('#message'));

        // Set data
        new Identicon(txRequest.sender, $senderIdenticon); // eslint-disable-line no-new
        new Identicon(txRequest.recipient, $recipientIdenticon); // eslint-disable-line no-new

        if (txRequest.senderLabel) {
            $senderLabel.classList.remove('display-none');
            $senderLabel.textContent = txRequest.senderLabel;
        }
        if (txRequest.recipientLabel) {
            $recipientLabel.classList.remove('display-none');
            $recipientLabel.textContent = txRequest.recipientLabel;
        }

        $senderAddress.textContent = txRequest.sender;
        $recipientAddress.textContent = txRequest.recipient;

        $value.textContent = Nimiq.Policy.satoshisToCoins(txRequest.value).toString();
        if (txRequest.fee > 0) {
            $fee.textContent = Nimiq.Policy.satoshisToCoins(txRequest.fee).toString();
            const $feeSection = $transaction.querySelector('.fee-section');
            if ($feeSection) $feeSection.classList.remove('display-none');
        }

        if (txRequest.type === TransactionType.EXTENDED && txRequest.extraData) {
            $message.textContent = txRequest.extraData;
        }

        return $transaction;
    }

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
