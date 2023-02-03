/* global ethers */
/* global Key */
/* global KeyStore */
/* global SignPolygonTransactionApi */
/* global PasswordBox */
/* global Errors */
/* global Utf8Tools */
/* global TopLevelApi */
/* global PolygonAddressInfo */
/* global NumberFormatting */
/* global CONFIG */
/* global PolygonKey */

/**
 * @callback SignPolygonTransaction.resolve
 * @param {KeyguardRequest.SignedPolygonTransaction} result
 */

class SignPolygonTransaction {
    /**
     * @param {Parsed<KeyguardRequest.SignPolygonTransactionRequest>} request
     * @param {SignPolygonTransaction.resolve} resolve
     * @param {reject} reject
     */
    constructor(request, resolve, reject) {
        this._request = request;
        /** @type {HTMLElement} */
        this.$el = (document.getElementById(SignPolygonTransaction.Pages.CONFIRM_TRANSACTION));

        const transaction = request.transaction;

        /** @type {HTMLLinkElement} */
        const $sender = (this.$el.querySelector('.accounts .sender'));
        new PolygonAddressInfo(transaction.from, request.keyLabel, 'usdc').render($sender);

        const contract = new ethers.Contract(CONFIG.USDC_CONTRACT_ADDRESS, SignPolygonTransactionApi.USDC_CONTRACT_ABI);
        const description = contract.interface.parseTransaction({
            data: request.transaction.data,
            value: request.transaction.value,
        });

        /** @type {HTMLLinkElement} */
        const $recipient = (this.$el.querySelector('.accounts .recipient'));
        const recipientAddress = /** @type {string} */ (description.args.recipient);
        new PolygonAddressInfo(
            recipientAddress,
            request.recipientLabel,
        ).render($recipient);

        /** @type {HTMLDivElement} */
        const $value = (this.$el.querySelector('#value'));
        // /** @type {HTMLDivElement} */
        // const $fee = (this.$el.querySelector('#fee'));
        // /** @type {HTMLDivElement} */
        // const $data = (this.$el.querySelector('#data'));

        // Set value and fee.
        $value.textContent = NumberFormatting.formatNumber(
            /** @type {ethers.BigNumber} */ (description.args.amount).div(1e6).toNumber(),
            6,
            2,
        );
        // if ($fee && transaction.fee > 0) {
        //     $fee.textContent = NumberFormatting.formatNumber(Nimiq.Policy.lunasToCoins(transaction.fee));
        //     /** @type {HTMLDivElement} */
        //     const $feeSection = (this.$el.querySelector('.fee-section'));
        //     $feeSection.classList.remove('display-none');
        // }

        // if ($data && transaction.data) {
        //     // Set transaction extra data.
        //     $data.textContent = transaction.data;
        //     /** @type {HTMLDivElement} */
        //     const $dataSection = (this.$el.querySelector('.data-section'));
        //     $dataSection.classList.remove('display-none');
        // }

        // Set up password box.
        /** @type {HTMLFormElement} */
        const $passwordBox = (document.querySelector('#password-box'));
        this._passwordBox = new PasswordBox($passwordBox, {
            hideInput: !request.keyInfo.encrypted,
            buttonI18nTag: 'passwordbox-confirm-tx',
            minLength: request.keyInfo.hasPin ? Key.PIN_LENGTH : undefined,
        });

        this._passwordBox.on(
            PasswordBox.Events.SUBMIT,
            /** @param {string} [password] */ password => {
                this._onConfirm(request, resolve, reject, password);
            },
        );
    }

    /**
     * @param {Parsed<KeyguardRequest.SignPolygonTransactionRequest>} request
     * @param {SignPolygonTransaction.resolve} resolve
     * @param {reject} reject
     * @param {string} [password]
     * @returns {Promise<void>}
     * @private
     */
    async _onConfirm(request, resolve, reject, password) {
        TopLevelApi.setLoading(true);
        const passwordBuf = password ? Utf8Tools.stringToUtf8ByteArray(password) : undefined;
        /** @type {Key?} */
        let key = null;
        try {
            key = await KeyStore.instance.get(request.keyInfo.id, passwordBuf);
        } catch (e) {
            if (e.message === 'Invalid key') {
                TopLevelApi.setLoading(false);
                this._passwordBox.onPasswordIncorrect();
                return;
            }
            reject(new Errors.CoreError(e));
            return;
        }
        if (!key) {
            reject(new Errors.KeyNotFoundError());
            return;
        }

        const polygonKey = new PolygonKey(key);

        const raw = await polygonKey.sign(request.keyPath, request.transaction);

        /** @type {KeyguardRequest.SignedPolygonTransaction} */
        const result = {
            transactionHash: ethers.utils.keccak256(raw),
            raw,
        };
        resolve(result);
    }

    run() {
        // Go to start page
        window.location.hash = SignPolygonTransaction.Pages.CONFIRM_TRANSACTION;
    }
}

SignPolygonTransaction.Pages = {
    CONFIRM_TRANSACTION: 'confirm-transaction',
};
