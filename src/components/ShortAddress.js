/* global TemplateTags */

class ShortAddress { // eslint-disable-line no-unused-vars
    /**
     * @param {string} userFriendlyAddress
     * @param {number} [blocksToShow = 4]
     */
    constructor(userFriendlyAddress, blocksToShow = 4) {
        // Same style as the Wallet's ShortAddress.
        const $el = document.createElement('span');
        $el.classList.add('short-address', 'address');
        // Expose the full address on hover, as only a shortened address is displayed.
        $el.title = userFriendlyAddress;
        $el.innerHTML = TemplateTags.noVars`
            <svg class="ellipsis" viewBox="0 0 17 3" fill="currentColor" aria-hidden="true">
                <circle cx="1.5" cy="1.5" r="1.5"/>
                <circle cx="8.5" cy="1.5" r="1.5"/>
                <circle cx="15.5" cy="1.5" r="1.5"/>
            </svg>
        `;
        // Prepend / append address as text nodes instead of via innerHTML to avoid potential HTML injection.
        const blocks = userFriendlyAddress.split(' ');
        $el.prepend(blocks.slice(0, Math.ceil(blocksToShow / 2)).join(' '));
        $el.append(blocks.slice(-Math.floor(blocksToShow / 2)).join(' '));

        this.$el = $el;
    }

    /**
     * @returns {HTMLSpanElement}
     */
    getElement() {
        return this.$el;
    }
}
