/* global Nimiq */
/* global TransactionType */
/* global KeyStore */
/* global Identicon */

class SignTransaction { // eslint-disable-line no-unused-vars
    /**
     * @param {Keyguard.TransactionRequest} txRequest
     * @returns {HTMLDivElement}
     */
    fillTransactionDetails(txRequest) {
        /** @type {HTMLDivElement} */
        const $transaction = (document.querySelector('#transaction-data .transaction'));

        /** @type {HTMLDivElement} */
        const $senderIdenticon = ($transaction.querySelector('#sender-identicon'));
        /** @type {HTMLDivElement} */
        const $signerIdenticon = ($transaction.querySelector('#signer-identicon'));
        /** @type {HTMLDivElement} */
        const $recipientIdenticon = ($transaction.querySelector('#recipient-identicon'));

        /** @type {HTMLDivElement} */
        const $senderLabel = ($transaction.querySelector('#sender-label'));
        /** @type {HTMLDivElement} */
        const $signerLabel = ($transaction.querySelector('#signer-label'));

        /** @type {HTMLDivElement} */
        const $senderAddress = ($transaction.querySelector('#sender-address'));
        /** @type {HTMLDivElement} */
        const $signerAddress = ($transaction.querySelector('#signer-address'));
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

        if (txRequest.type === TransactionType.EXTENDED && txRequest.sender !== txRequest.signer) {
            new Identicon(txRequest.signer, $signerIdenticon); // eslint-disable-line no-new
            $signerIdenticon.classList.remove('display-none');

            $signerAddress.textContent = txRequest.signer;

            if (txRequest.signerLabel) {
                $signerLabel.classList.remove('display-none');
                $signerLabel.textContent = txRequest.signerLabel;
            }

            /** @type {HTMLDivElement} */
            const $signerSection = ($transaction.querySelector('.signer-section'));
            $signerSection.classList.remove('display-none');
        }

        if (txRequest.senderLabel) {
            $senderLabel.classList.remove('display-none');
            $senderLabel.textContent = txRequest.senderLabel;
        }

        $senderAddress.textContent = txRequest.sender;
        $recipientAddress.textContent = txRequest.recipient;

        $value.textContent = Nimiq.Policy.satoshisToCoins(txRequest.value).toString();
        if (txRequest.fee > 0) {
            $fee.textContent = Nimiq.Policy.satoshisToCoins(txRequest.fee).toString();
            /** @type {HTMLDivElement} */
            const $feeSection = ($transaction.querySelector('.fee-section'));
            $feeSection.classList.remove('display-none');
        }

        if (txRequest.type === TransactionType.EXTENDED && txRequest.extraData) {
            $message.textContent = txRequest.extraData;
            /** @type {HTMLDivElement} */
            const $extraDataSection = ($transaction.querySelector('.extra-data-section'));
            $extraDataSection.classList.remove('display-none');
        }

        return $transaction;
    }

    /**
     * Decrypt key and use it to sign a transaction constructed with the data from txRequest.
     *
     * @param {Keyguard.TransactionRequest} txRequest
     * @param {string} passphraseOrPin
     * @returns {Promise<Keyguard.SignedTransactionResult>}
     * @protected
     */
    async _doSignTransaction(txRequest, passphraseOrPin) {
        if (txRequest.type === TransactionType.BASIC) {
            // eslint-disable-next-line object-curly-newline
            const { sender, recipient, value, fee, validityStartHeight } = txRequest;

            const passphrase = Nimiq.BufferUtils.fromAscii(passphraseOrPin);
            const key = await KeyStore.instance.get(sender, passphrase);

            
            const tx = key.createBasicTransaction(recipient, value, fee, validityStartHeight);

            const signatureProof = Nimiq.SignatureProof.unserialize(new Nimiq.SerialBuffer(tx.proof));

            return {
                type: TransactionType.BASIC,
                sender: tx.sender.toUserFriendlyAddress(),
                signerPubKey: signatureProof.publicKey.serialize(),
                recipient: tx.recipient.toUserFriendlyAddress(),
                value: Nimiq.Policy.satoshisToCoins(tx.value),
                fee: Nimiq.Policy.satoshisToCoins(tx.fee),
                network: Nimiq.GenesisConfig.NETWORK_NAME,
                validityStartHeight: tx.validityStartHeight,
                signature: signatureProof.signature.serialize(),
                hash: tx.hash().toBase64(),
            };
        }

        const key = await KeyStore.instance.get(txRequest.signer, passphraseOrPin);
        const tx = key.createExtendedTransaction(
            txRequest.sender,
            txRequest.senderType,
            txRequest.recipient,
            txRequest.recipientType,
            txRequest.value,
            txRequest.fee,
            txRequest.validityStartHeight,
            txRequest.extraData,
        );

        const signatureProof = Nimiq.SignatureProof.unserialize(new Nimiq.SerialBuffer(tx.proof));

        return {
            type: TransactionType.EXTENDED,
            sender: tx.sender.toUserFriendlyAddress(),
            senderType: tx.senderType,
            signerPubKey: signatureProof.publicKey.serialize(),
            recipient: tx.recipient.toUserFriendlyAddress(),
            recipientType: tx.recipientType,
            value: Nimiq.Policy.satoshisToCoins(tx.value),
            fee: Nimiq.Policy.satoshisToCoins(tx.fee),
            network: Nimiq.GenesisConfig.NETWORK_NAME,
            validityStartHeight: tx.validityStartHeight,
            signature: signatureProof.signature.serialize(),
            hash: tx.hash().toBase64(),
        };
    }
}
