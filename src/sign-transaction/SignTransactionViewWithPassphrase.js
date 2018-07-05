/** Handles a sign-transaction request for keys with encryption type HIGH.
 *  Calls this.fire('result', [result]) when done or this.fire('error', [error]) to return with an error.
 */
class SignTransactionWithPassphrase extends SignTransactionView {

    get Pages() {
        return  {
            ENTER_PASSPHRASE: 'enter-passphrase'
        };
    }

    /** @param {TransactionRequest} txRequest */
    constructor(txRequest) {
        super();

        // construct UI
        const rootElement = document.getElementById('app');

        if (!rootElement) {
            this.fire('error', new InvalidDOMError());
            return;
        }

        // TODO add identicons and other tx data to UI

        const $button = rootElement.querySelector('#enter-passphrase button');
        const $input = /** @type {HTMLInputElement} */ (rootElement.querySelector('#enter-passphrase input'));
        const $error = rootElement.querySelector('#enter-passphrase #error');

        if (!$button || !$input || !$error) {
            this.fire('error', new InvalidDOMError());
            return;
        }

        $button.addEventListener('click', async () => {
            document.body.classList.add('loading');
            $error.textContent = '';

            const passphrase = $input.value;

            try {
                const signedTx = await this._signTx(txRequest, passphrase);
                this.fire('result', signedTx);
            } catch (e) {
                // assume the passphrase was wrong
                console.error(e);

                document.body.classList.remove('loading');

                $input.value = '';
                // TODO i18n
                $error.textContent = 'Wrong Pass Phrase, please try again';
            }
        });

        location.hash = this.Pages.ENTER_PASSPHRASE;
   }
}

