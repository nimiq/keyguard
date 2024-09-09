/* global IqonHash */
/* global LoginFileConfig */
/* global TemplateTags */
/* global I18n */

class PolygonAddressInfo { // eslint-disable-line no-unused-vars
    /**
     * @param {string} address
     * @param {string} [label]
     * @param {'none' | 'usdc' | 'usdc_dark' | 'unknown'} [logo = 'none']
     */
    constructor(address, label, logo = 'none') {
        this._address = address;
        this._label = label;
        this._logo = logo;
    }

    /**
     * Inserts this AddressInfo into $el overwriting the original content of $el.
     * @param {?HTMLElement} [$el]
     * @returns {HTMLElement}
     */
    renderTo($el) {
        $el = $el || document.createElement('div');
        $el.textContent = '';
        $el.classList.add('polygon-address-info');

        // Avatar or Icon
        if (this._logo === 'none') {
            const $avatar = document.createElement('div');
            $avatar.classList.add('avatar');
            if (this._label) {
                $avatar.textContent = this._label[0].toUpperCase();
                const color = IqonHash.getBackgroundColorIndex(this._label);
                $avatar.classList.add(LoginFileConfig[color].className, 'initial');
            } else {
                $avatar.classList.add('unlabelled');
            }
            $el.appendChild($avatar);
        } else if (this._logo === 'usdc' || this._logo === 'usdc_dark' || this._logo === 'unknown') {
            const $img = document.createElement('img');
            $img.classList.add('logo');
            $img.src = `../../assets/icons/${this._logo}.svg`;
            $el.appendChild($img);
        }

        // Label
        const $label = document.createElement('div');
        $label.classList.add('label');
        if (this._label) {
            $label.textContent = this._label;
        } else {
            $label.textContent = I18n.translatePhrase('label-unknown');
            $label.dataset.i18n = 'label-unknown';
            $label.classList.add('unknown');
        }
        $el.appendChild($label);

        // Address
        const $shortAddress = document.createElement('div');
        $shortAddress.classList.add('short-address', 'tooltip');
        const $prefix = document.createElement('span');
        const $suffix = document.createElement('span');
        const $dots = document.createElement('div');
        $dots.classList.add('dots');
        $prefix.textContent = this._address.substring(0, 4);
        $suffix.textContent = this._address.substring(this._address.length - 4);
        $dots.innerHTML = new Array(3).fill(TemplateTags.noVars`
            <svg viewBox="0 0 3 3" xmlns="http://www.w3.org/2000/svg">
                <circle cx="1.5" cy="1.5" r="1.5" fill="currentColor"/>
            </svg>
        `.trim()).join('');

        const $tooltipBox = document.createElement('div');
        $tooltipBox.classList.add('tooltip-box');
        $tooltipBox.textContent = this._address;

        $shortAddress.append($prefix, $dots, $suffix, $tooltipBox);

        $el.appendChild($shortAddress);

        return $el;
    }
}
