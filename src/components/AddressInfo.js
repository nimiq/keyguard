/* global I18n */
/* global Copyable */
/* global Identicon */

class AddressInfo { // eslint-disable-line no-unused-vars
    // eslint-disable-next-line valid-jsdoc
    /**
     * @param {{
     *     userFriendlyAddress: string,
     *     label: string?,
     *     imageUrl: URL?,
     *     accountLabel: string?,
     *     multisig?: {
     *         signers: number,
     *         participants: number,
     *     },
     * }} addressInfo
     * @param {boolean} [displayAsCashlink = false]
     */
    constructor(addressInfo, displayAsCashlink = false) {
        this._displayAsCashlink = displayAsCashlink;
        this._addressInfo = addressInfo;
    }

    /**
     * Inserts this AddressInfo into $el overwriting the original content of $el.
     * @param {?HTMLElement} [$el]
     * @param {boolean} [isDetailedView = false]
     * @returns {HTMLElement}
     */
    renderTo($el, isDetailedView = false) {
        $el = $el || document.createElement('div');
        $el.textContent = '';
        $el.classList.add('address-info');
        $el.classList.toggle('detailed-view', isDetailedView);
        $el.classList.toggle('cashlink', this._displayAsCashlink);

        // identicon
        const $identicon = document.createElement('div');
        $identicon.classList.add('identicon');
        if (this._addressInfo.imageUrl) { // URl is given, use image
            const $shopLogo = document.createElement('img');
            $shopLogo.src = this._addressInfo.imageUrl.href;
            $identicon.appendChild($shopLogo);
            $shopLogo.addEventListener('error', () => {
                $shopLogo.remove();
                // eslint-disable-next-line no-new
                new Identicon(this._addressInfo.userFriendlyAddress, $identicon);
            });
        } else if (this._displayAsCashlink) {
            const $cashlinkIcon = document.createElementNS(
                'http://www.w3.org/2000/svg',
                'svg',
            );
            const cashlinkIconUseTag = document.createElementNS(
                'http://www.w3.org/2000/svg',
                'use',
            );
            cashlinkIconUseTag.setAttributeNS(
                'http://www.w3.org/1999/xlink',
                'xlink:href',
                '../../../node_modules/@nimiq/style/nimiq-style.icons.svg#nq-cashlink',
            );
            $cashlinkIcon.appendChild(cashlinkIconUseTag);
            $cashlinkIcon.classList.add('nq-icon', 'nq-blue-bg');
            $identicon.appendChild($cashlinkIcon);
        } else {
            // eslint-disable-next-line no-new
            new Identicon(this._addressInfo.userFriendlyAddress, $identicon);
        }

        if (this._addressInfo.multisig) {
            const $signerCount = document.createElement('span');
            $signerCount.classList.add('count');
            $signerCount.textContent = this._addressInfo.multisig.signers.toString();
            const $totalParticipantCount = document.createElement('span');
            $totalParticipantCount.classList.add('count');
            $totalParticipantCount.textContent = this._addressInfo.multisig.participants.toString();

            const $badge = document.createElement('div');
            $badge.classList.add('multisig-badge', 'nq-blue-bg');
            I18n.translateToHtmlContent($badge, 'address-info-multisig-badge', {
                signerCount: $signerCount,
                totalParticipantCount: $totalParticipantCount,
            });
            $identicon.appendChild($badge);
        }

        $el.appendChild($identicon);

        // label
        const $label = document.createElement('div');
        $label.classList.add('label');
        if (this._displayAsCashlink) {
            // Apply the translation via translatePhrase such that the translationValidator finds it and additionally
            // apply the data-i18n attribute such that the translation can be updated on language switch.
            $label.textContent = I18n.translatePhrase('address-info-new-cashlink');
            $label.dataset.i18n = 'address-info-new-cashlink';
        } else if (this._addressInfo.label) {
            $label.textContent = this._addressInfo.label;
        } else if (!isDetailedView) {
            $label.textContent = this._addressInfo.userFriendlyAddress;
            $label.classList.add('mono'); // Fira Mono font for address display
        }
        if ($label.textContent) {
            $el.appendChild($label);
        }

        if (isDetailedView) {
            // accountLabel
            // if (this._addressInfo.accountLabel) {
            //     const $accountLabel = document.createElement('div');
            //     $accountLabel.classList.add('account-label', 'nq-label');
            //     $accountLabel.textContent = this._addressInfo.accountLabel;
            //     $el.appendChild($accountLabel);
            // }

            // address
            const $address = document.createElement('div');
            $address.classList.add('address');
            // last space is necessary for the rendering to work properly with white-space: pre-wrap.
            $address.textContent = `${this._addressInfo.userFriendlyAddress} `;
            const copyableAddress = new Copyable(this._addressInfo.userFriendlyAddress, $address);
            $el.appendChild(copyableAddress.getElement());
        }

        return $el;
    }
}
