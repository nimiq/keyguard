/* global Nimiq */
/* global AddressInfo */
/* global NumberFormatting */
/* global TransactionDataFormatting */
/* global I18n */
/* global lunasToCoins */
/* global LoginFileAccountIcon */
/* global Identicon */

/**
 * Renders a multisig transaction and the account approving it into the confirm-transaction page markup, which is shared
 * by the create-multisig-commitments and sign-multisig-transaction requests, such that the user sees the same
 * transaction details in both rounds of signing.
 */
class MultisigTransactionOverview { // eslint-disable-line no-unused-vars
    // eslint-disable-next-line valid-jsdoc
    /**
     * @param {HTMLElement} $el - The confirm-transaction page
     * @param {{
     *     transaction: Nimiq.Transaction,
     *     multisigAddress: Nimiq.Address,
     *     numberOfSigners: number,
     *     numberOfParticipants: number,
     *     senderLabel?: string,
     *     recipientLabel?: string,
     *     keyInfo: KeyInfo,
     *     keyLabel: string,
     *     userName?: string,
     * }} options
     */
    constructor($el, options) {
        this.$el = $el;
        const { transaction } = options;
        const multisigAddressInfo = {
            signers: options.numberOfSigners,
            participants: options.numberOfParticipants,
        };
        // If the multisig isn't the recipient (for example of a remove-stake transaction), assume that it's the sender,
        // even if the sender address does not match (for example for transactions from a vesting contract owned by the
        // multisig).
        const isSenderMultisig = !options.multisigAddress.equals(transaction.recipient);

        this.$accountDetails = /** @type {HTMLElement} */ (this.$el.querySelector('#account-details'));

        const $sender = /** @type {HTMLElement} */ (this.$el.querySelector('.accounts .sender'));
        const senderAddressInfo = new AddressInfo({
            userFriendlyAddress: transaction.sender.toUserFriendlyAddress(),
            label: options.senderLabel,
            multisig: isSenderMultisig ? multisigAddressInfo : undefined,
        });
        senderAddressInfo.renderTo($sender);
        $sender.addEventListener('click', () => this._openDetails(senderAddressInfo));

        const $recipient = /** @type {HTMLElement} */ (this.$el.querySelector('.accounts .recipient'));
        const recipientAddressInfo = new AddressInfo({
            userFriendlyAddress: transaction.recipient.toUserFriendlyAddress(),
            label: options.recipientLabel,
            multisig: isSenderMultisig ? undefined : multisigAddressInfo,
        });
        recipientAddressInfo.renderTo($recipient);
        $recipient.addEventListener('click', () => this._openDetails(recipientAddressInfo));

        const $closeDetails = /** @type {HTMLButtonElement} */ (this.$accountDetails.querySelector('#close-details'));
        $closeDetails.addEventListener('click', () => this._closeDetails());

        const $value = /** @type {HTMLElement} */ (this.$el.querySelector('#value'));
        const $fee = /** @type {HTMLElement} */ (this.$el.querySelector('#fee'));
        const $data = /** @type {HTMLElement} */ (this.$el.querySelector('#data'));

        $value.textContent = NumberFormatting.formatNumber(lunasToCoins(Number(transaction.value)));
        if (transaction.fee > 0) {
            $fee.textContent = NumberFormatting.formatNumber(lunasToCoins(Number(transaction.fee)));
        } else {
            const $feeSection = /** @type {HTMLElement} */ ($fee.parentElement);
            $feeSection.remove();
        }

        const formattedData = TransactionDataFormatting.formatTransactionData(transaction);
        if (formattedData) {
            $data.textContent = formattedData;
            I18n.observer.on(
                I18n.Events.LANGUAGE_CHANGED,
                () => { $data.textContent = TransactionDataFormatting.formatTransactionData(transaction); },
            );
        } else {
            $data.remove();
        }

        // Set up username and account name with account icon
        const $nameSection = /** @type {HTMLElement} */ (this.$el.querySelector('.user-and-account-names'));
        const $accountIcon = document.createElement('div');
        $accountIcon.classList.add('account-icon');
        const defaultAddress = options.keyInfo.defaultAddress.toUserFriendlyAddress();
        if (options.keyInfo.type === Nimiq.Secret.Type.ENTROPY) {
            // eslint-disable-next-line no-new
            new LoginFileAccountIcon(defaultAddress, $accountIcon);
        } else {
            // Show identicon for legacy accounts (which must be supported to support Team Nimiq Multisig)
            // eslint-disable-next-line no-new
            new Identicon(defaultAddress, $accountIcon);
        }
        const $accountName = document.createElement('div');
        $accountName.classList.add('account-name');
        $accountName.textContent = options.keyLabel;
        const $accountIconAndName = document.createElement('div');
        $accountIconAndName.classList.add('account-icon-and-name');
        $accountIconAndName.append($accountIcon, $accountName);
        if (options.userName) {
            const $userName = document.createElement('div');
            $userName.classList.add('user-name');
            $userName.textContent = options.userName;
            I18n.translateToHtmlContent($nameSection, 'sign-multisig-tx-approving-as-name-with-account', {
                userName: $userName,
                accountName: $accountIconAndName,
            });
        } else {
            I18n.translateToHtmlContent($nameSection, 'sign-multisig-tx-approving-with-account', {
                accountName: $accountIconAndName,
            });
        }
    }

    /**
     * @param {AddressInfo} which
     * @private
     */
    _openDetails(which) {
        which.renderTo(
            /** @type {HTMLElement} */(this.$accountDetails.querySelector('#details')),
            'detailed',
        );
        this.$el.classList.add('account-details-open');
    }

    /** @private */
    _closeDetails() {
        this.$el.classList.remove('account-details-open');
    }
}
