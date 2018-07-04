/** Handles a sign-transaction request for keys with encryption type LOW.
 *  Calls this.fire('result', [result]) when done or this.fire('error', [error]) to return with an error.
 */
class SignTransactionWithPin extends Nimiq.Observable {

    // TODO define type of transactionRequest
    constructor(transactionRequest) {
        super();

        // construct UI
        const rootElement = document.getElementById('app');

        const $button = rootElement.querySelector('button');
        const $pinInput = rootElement.querySelector('#enter-pin');

        $button.addEventListener('click', () => location.hash = 'enter-pin');

        $pinInput.on('pin-entered', async pin => {

            document.body.classList.add('loading');

            const keyStore = KeyStore.instance;

            // TODO specify API for different tx types
            const { value, fee, sender, recipient, signer, extraData, validityStartHeight } = transactionRequest;

            try {
                const key = await keyStore.get(signer, pin);
                const tx = key.createTransaction(recipient, value, fee, validityStartHeight);

                const signatureProof = Nimiq.SignatureProof.unserialize(new Nimiq.SerialBuffer(tx.proof));

                this.fire('result', {
                    sender: tx.sender.toUserFriendlyAddress(),
                    senderPubKey: signatureProof.publicKey.serialize(),
                    recipient: tx.recipient.toUserFriendlyAddress(),
                    value: tx.value / Nimiq.Policy.SATOSHIS,
                    fee: tx.fee / Nimiq.Policy.SATOSHIS,
                    validityStartHeight: tx.validityStartHeight,
                    signature: signatureProof.signature.serialize(),
                    extraData: Utf8Tools.utf8ByteArrayToString(tx.data),
                    hash: tx.hash().toBase64()
                });
            } catch (e) {
                // assume the pin was wrong
                console.error(e);

                document.body.classList.remove('loading');

                $pinInput.onPinIncorrect();
            }
        });

        location.hash = 'enter-pin';
    }
}