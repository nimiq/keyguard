/* global Address */
/* global Identicon */
/* global Nimiq */

class AddressInfo extends Nimiq.Observable { // eslint-disable-line no-unused-vars
    /**
     *
     * @param {HTMLLinkElement} $el
     * @param {{ userFriendlyAddress: string, label: string?, imageUrl: URL?, accountLabel: string?}} addressInfo
     */
    constructor($el, addressInfo) {
        super();
        this.$el = this._createElement($el);
        /** @type {HTMLDivElement} */
        const $address = (this.$el.querySelector('.address'));
        this._address = new Address($address, addressInfo.userFriendlyAddress);
        /** @type {HTMLDivElement} */
        const $label = (this.$el.querySelector('.label'));
        $label.innerText = addressInfo.label || '';
        if (addressInfo.accountLabel) {
            /** @type {HTMLDivElement} */
            const $accountLabel = (this.$el.querySelector('.account-label'));
            $accountLabel.innerText = addressInfo.accountLabel;
            $accountLabel.classList.remove('display-none');
        }
        /** @type {HTMLDivElement} */
        const $identicon = (this.$el.querySelector('.identicon'));
        if (addressInfo.imageUrl) { // URl is given, use image
            const $shopLogo = document.createElement('img');
            $shopLogo.src = addressInfo.imageUrl.href;
            $identicon.classList.add('clip');
            $identicon.appendChild($shopLogo);
            $shopLogo.addEventListener('error', () => {
                $shopLogo.remove();
                $identicon.classList.remove('clip');
                // eslint-disable-next-line no-new
                new Identicon(addressInfo.userFriendlyAddress, $identicon);
            });
        } else {
            // eslint-disable-next-line no-new
            new Identicon(addressInfo.userFriendlyAddress, $identicon);
        }

        this.$el.addEventListener('click', event => {
            event.preventDefault();
            this.fire(AddressInfo.Event.CLICKED, addressInfo);
        });
    }

    /**
     * @private
     * @param {HTMLLinkElement} $el
     * @returns {HTMLLinkElement}
     */
    _createElement($el) {
        $el = $el || document.createElement('a');
        $el.classList.toggle('addressInfo', true);
        $el.href = '#';
        $el.innerHTML = `
            <div class="identicon"></div>
            <div class="label"></div>
            <div class="account-label nq-label display-none"></div>
            <div class="address"></div>
        `;
        return $el;
    }
}

AddressInfo.Event = {
    CLICKED: 'clicked',
};
