/** Handles a sign-transaction request for keys with encryption type HIGH.
 *  Calls this.fire('result', [result]) when done or this.fire('error', [error]) to return with an error.
 */
class SignTransactionWithPassphrase extends Nimiq.Observable {

    /** @param {TransactionRequest} txRequest */
    constructor(txRequest) {
        super();

        // construct UI
        const rootElement = document.getElementById('app');

        if (!rootElement) return;

        // TODO add identicons and other tx data to UI

        const $button = rootElement.querySelector('#enter-passphrase button');
        const $input = /** @type {HTMLInputElement} */ (rootElement.querySelector('#enter-passphrase input'));
        const $error = rootElement.querySelector('#enter-passphrase #error');

        if (!$button || !$input || !$error) return;

        $button.addEventListener('click', async () => {

            document.body.classList.add('loading');
            $error.textContent = '';

            const passphrase =$input.value;

            const keyStore = KeyStore.instance;

            if (txRequest.type !== TransactionType.BASIC) {
                throw new Error('not yet implemented');
            }

            const { value, fee, recipient, signer, validityStartHeight } = txRequest;

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

                document.body.classList.remove('loading');

                // TODO i18n
                $input.value = '';
                $error.textContent = 'Wrong Pass Phrase, please try again';
            }
        });

        location.hash = 'enter-passphrase';
   }
}