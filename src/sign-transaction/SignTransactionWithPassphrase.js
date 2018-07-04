/** Handles a sign-transaction request for keys with encryption type HIGH.
 *  Calls this.fire('result', [result]) when done or this.fire('error', [error]) to return with an error.
 */
class SignTransactionWithPassphrase extends Nimiq.Observable {

    // TODO define type of transactionRequest
    constructor(transactionRequest) {
        super();
        // run UI
        const rootElement = document.getElementById('app');

        // TODO add identicons and other tx data to UI
        rootElement.innerHTML = `
            <input type="text" name="passphrase">
            <button>Confirm</button>
            <span id="error"></span>
        `;

        const $button = rootElement.querySelector('button');
        const $input = rootElement.querySelector('input');
        const $error = rootElement.querySelector('#error');

        $button.addEventListener('click', async () => {
            // TODO show loading animation

            const passphrase = $input.value;

            const keyStore = KeyStore.instance;

            // TODO specify API for different tx types
            const { value, fee, sender, recipient, signer, extraData, validityStartHeight } = transactionRequest;

            try {
                const key = await keyStore.get(signer, passphrase);
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
                // assume the password was wrong
                console.error(e);

                // TODO stop loading animation

                // TODO i18n
                $input.value = '';
                $error.innerText = 'Wrong Pass Phrase, please try again';
            }

            this.fire('result', );
        });
   }
}