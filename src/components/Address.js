class Address { // eslint-disable-line no-unused-vars
    /**
     *
     * @param {HTMLElement!} $el
     * @param {string!} userFriendlyAddress
     */
    constructor($el, userFriendlyAddress) {
        this.$el = this._createElement($el);

        const $recipientAddresses = ($el.querySelectorAll('.chunk'));
        /** @type {string[]} */
        const recipientAddressChunks = (
            userFriendlyAddress.replace(/[+ ]/g, '').match(/.{4}/g)
        );
        $recipientAddresses.forEach(($element, x) => {
            $element.textContent = recipientAddressChunks[x];
        });
    }

    /**
     * @private
     * @param {HTMLElement?} $el
     * @returns {HTMLElement}
     */
    _createElement($el) {
        $el = $el || document.createElement('div');
        $el.classList.toggle('address', true);
        $el.innerHTML = `
            <span class="chunk"></span>
            <span class="chunk"></span>
            <span class="chunk"></span>
            <span class="chunk"></span>
            <span class="chunk"></span>
            <span class="chunk"></span>
            <span class="chunk"></span>
            <span class="chunk"></span>
            <span class="chunk"></span>`;
        return $el;
    }
}
