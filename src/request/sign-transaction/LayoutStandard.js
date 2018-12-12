/* global BaseLayout */
/* global Identicon */

class LayoutStandard extends BaseLayout { // eslint-disable-line no-unused-vars
    /**
     * @param {KeyguardRequest.ParsedSignTransactionRequest} request
     * @param {Function} resolve
     * @param {Function} reject
     */
    constructor(request, resolve, reject) {
        // `this` can only be accessed after `super` has been called,
        // but `super` requires the HTML to already exist.
        const $recipient = LayoutStandard._createRecipient();

        // set recipient data
        /** @type {HTMLDivElement} */
        const $recipientIdenticon = ($recipient.querySelector('.identicon'));
        if (request.shopLogoUrl) {
            const $shopLogo = document.createElement('img');
            $shopLogo.src = request.shopLogoUrl.href;
            $recipientIdenticon.classList.add('clip');
            $recipientIdenticon.appendChild($shopLogo);
            $shopLogo.addEventListener('error', () => {
                $shopLogo.remove();
                $recipientIdenticon.classList.remove('clip');
                // eslint-disable-next-line no-new
                new Identicon(request.transaction.recipient.toUserFriendlyAddress(), $recipientIdenticon);
            });
        } else {
            // eslint-disable-next-line no-new
            new Identicon(request.transaction.recipient.toUserFriendlyAddress(), $recipientIdenticon);
        }

        const $recipientAddresses = ($recipient.querySelectorAll('.address > .chunk'));
        /** @type {string[]} */
        const recipientAddressChunks = (
            request.transaction.recipient
                .toUserFriendlyAddress()
                .replace(/[+ ]/g, '').match(/.{4}/g)
        );
        $recipientAddresses.forEach(($element, x) => {
            $element.textContent = recipientAddressChunks[x];
        });

        /** @type {HTMLElement} */
        const $recipientLabel = ($recipient.querySelector('.label'));
        if (request.shopOrigin) {
            $recipientLabel.textContent = LayoutStandard._originToDomain(request.shopOrigin);
            $recipientLabel.classList.remove('display-none');
        } else if (request.recipientLabel) {
            $recipientLabel.textContent = request.recipientLabel;
            $recipientLabel.classList.remove('display-none');
        }

        super(request, resolve, reject, $recipient);
    }

    /**
     * @param {string} [origin]
     * @returns {string}
     */
    static _originToDomain(origin) {
        if (!origin) return '---';
        return origin.split('://')[1] || '---';
    }

    static _createRecipient() {
        const $recipient = document.createElement('a');
        $recipient.classList.add('account', 'recipient');
        $recipient.href = '#';
        $recipient.innerHTML = `
            <div class="identicon"></div>
            <div class="label display-none"></div>
            <div class="address">
                <span class="chunk"></span><span class="space">&nbsp;</span>
                <span class="chunk"></span><span class="space">&nbsp;</span>
                <span class="chunk"></span><span class="space">&nbsp;</span>
                <span class="chunk"></span><span class="space">&nbsp;</span>
                <span class="chunk"></span><span class="space">&nbsp;</span>
                <span class="chunk"></span><span class="space">&nbsp;</span>
                <span class="chunk"></span><span class="space">&nbsp;</span>
                <span class="chunk"></span><span class="space">&nbsp;</span>
                <span class="chunk"></span><span class="space">&nbsp;</span>
            </div>
        `;
        return $recipient;
    }
}
