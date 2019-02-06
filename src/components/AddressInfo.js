/* global Address */
/* global Constants */
/* global Identicon */
/* global Nimiq */

class AddressInfo extends Nimiq.Observable { // eslint-disable-line no-unused-vars
    /**
     * Creates a new AddressInfo and appends it to a new node. Only one Element with isDetailedView=false supported, as
     * event listener added to the Element does not get removed yet.
     * @param {{ userFriendlyAddress: string, label: string?, imageUrl: URL?, accountLabel: string?}} addressInfo
     * @param {HTMLElement} $el
     * @param {boolean} isDetailedView - only one $el with isDetailedView=false supported
     */
    constructor(addressInfo, $el, isDetailedView = false) {
        super();
        if (!document.getElementById('nimiq-rounded-hexagon')) {
            const body = document.getElementsByTagName('body')[0];
            body.insertAdjacentHTML('beforeend', Constants.HEXAGON_CLIP_PATH);
        }

        this._addressInfo = addressInfo;

        this.appendTo($el, isDetailedView);
    }

    /**
     * Appends this AddressInfo object to a new node. Only one Element with isDetailedView=false supported, as
     * event listener added to the Element does not get removed yet.
     * @param {HTMLElement} $el
     * @param {boolean} isDetailedView - only one $el with isDetailedView=false supported
     */
    appendTo($el, isDetailedView = false) {
        $el = this._createElement($el, isDetailedView);
        if (!isDetailedView) {
            $el.addEventListener('click', event => {
                event.preventDefault(); // in case $el is a HTMLLinkElement
                this.fire(AddressInfo.Event.CLICKED, this._addressInfo);
            });
        }
    }

    /**
     * @private
     * @param {HTMLElement} $el
     * @param {boolean} isDetailedView
     * @returns {HTMLElement}
     */
    _createElement($el, isDetailedView) {
        $el = $el || document.createElement('a');
        $el.classList.toggle('addressInfo', true);
        $el.classList.toggle('detailed-view', isDetailedView);

        const label = this._addressInfo.label || (isDetailedView
            ? 'Unnamed Contact'
            : this._addressInfo.userFriendlyAddress);

        const accountLabel = this._addressInfo.accountLabel && isDetailedView
            ? `
            <div class="account-label nq-label">${this._addressInfo.accountLabel}</div>`
            : '';

        $el.innerHTML = `
            <div class="identicon"></div>
            <div class="label">${label}</div>
            ${accountLabel}
            ${isDetailedView ? '<div class="address"></div>' : ''}
        `;

        /** @type {HTMLDivElement} */
        const $identicon = ($el.querySelector('.identicon'));
        if (this._addressInfo.imageUrl) { // URl is given, use image
            const $shopLogo = document.createElement('img');
            $shopLogo.src = this._addressInfo.imageUrl.href;
            $identicon.classList.add('clip');
            $identicon.appendChild($shopLogo);
            $shopLogo.addEventListener('error', () => {
                $shopLogo.remove();
                $identicon.classList.remove('clip');
                // eslint-disable-next-line no-new
                new Identicon(this._addressInfo.userFriendlyAddress, $identicon);
            });
        } else {
            // eslint-disable-next-line no-new
            new Identicon(this._addressInfo.userFriendlyAddress, $identicon);
        }

        if (isDetailedView) {
            // eslint-disable-next-line no-new
            new Address(/** @type {HTMLElement} */($el.querySelector('.address')),
                this._addressInfo.userFriendlyAddress);
        }

        return $el;
    }
}

AddressInfo.Event = {
    CLICKED: 'clicked',
};
