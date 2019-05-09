/* global Identicon */
/* global TemplateTags */

class AddressInfo {
    /**
     * @param {{ userFriendlyAddress: string, label: string?, imageUrl: URL?, accountLabel: string?}} addressInfo
     */
    constructor(addressInfo) {
        if (addressInfo.imageUrl && !document.getElementById('nimiq-rounded-hexagon')) {
            document.body.insertAdjacentHTML('beforeend', AddressInfo.HEXAGON_CLIP_PATH);
        }
        this._addressInfo = addressInfo;
    }

    /**
     * Inserts this AddressInfo into $el overwriting the original content of $el.
     * @param {HTMLElement} $el
     * @param {boolean} [isDetailedView = false]
     */
    renderTo($el, isDetailedView = false) {
        $el = $el || document.createElement('div');
        $el.textContent = '';
        $el.classList.add('address-info');
        $el.classList.toggle('detailed-view', isDetailedView);

        // identicon
        const $identicon = document.createElement('div');
        $identicon.classList.add('identicon');
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
        $el.appendChild($identicon);

        // label
        const $label = document.createElement('div');
        $label.classList.add('label');
        $label.textContent = this._addressInfo.label || (isDetailedView
            ? ''
            : this._addressInfo.userFriendlyAddress);
        if (!this._addressInfo.label && !isDetailedView) {
            // The userfriendly address is displayed, set to Fira Mono font
            $label.classList.add('mono');
        }
        $el.appendChild($label);

        if (isDetailedView) {
            // accountLabel
            if (this._addressInfo.accountLabel) {
                const $accountLabel = document.createElement('div');
                $accountLabel.classList.add('account-label', 'nq-label');
                $accountLabel.textContent = this._addressInfo.accountLabel;
                $el.appendChild($accountLabel);
            }

            // address
            const $address = document.createElement('div');
            $address.classList.add('address');
            // last space is necessary for the rendering to work properly with white-space: pre-wrap.
            $address.textContent = `${this._addressInfo.userFriendlyAddress} `;
            $el.appendChild($address);
        }
    }
}

/* eslint-disable max-len */
AddressInfo.HEXAGON_CLIP_PATH = TemplateTags.noVars`
    <svg width="0" height="0" viewBox="0 0 146 146">
        <defs>
            <clipPath id="nimiq-rounded-hexagon" clipPathUnits="objectBoundingBox">
                <path d="M.302.055A.106.106 0 0 0 .21.108l-.196.34a.106.106 0 0 0 0 .105l.196.34a.106.106 0 0 0 .092.052h.392c.038 0 .073-.02.092-.053l.196-.34a.106.106 0 0 0 0-.105L.786.107A.106.106 0 0 0 .694.056z">
                </path>
            </clipPath>
        </defs>
    </svg>`;
/* eslint-enable max-len */
