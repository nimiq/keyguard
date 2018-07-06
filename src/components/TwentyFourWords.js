class TwentyFourWords {
        /**
     * @param {Element} [el]
     */
    constructor(el) {
        this.$el = el || this._createElement();
    }

    /** @returns {Element} */
    _createElement() {
        /** @type {Element} */
        const el = document.createElement('div');
        el.classList.add('twenty-four-words');
        return el;
    }

    /**
     * @param {Uint8Array} privateKey
     */
    set privateKey(privateKey) {
        const phrase = MnemonicPhrase.keyToMnemonic(privateKey);
        const words = phrase.split(/\s+/g);

        const html = words.map((word, index) =>
            `${ [0, 8, 16].indexOf(index) >= 0 ? `<div class="word-section section-${ Math.ceil((index + 1) / 8) }" onclick="">` : '' }
                <div class="word">
                    <span class="word-placeholder">${ index + 1 }</span>
                    <span class="word-content" title="word #${ index + 1 }">${ word }</span>
                </div>
            ${ [7, 15, 23].indexOf(index) >= 0 ? `</div>` : '' }
            `).join('');

        this.$el.innerHTML = html;
    }


    /** @returns {Element} */
    getElement() {
        return this.$el;
    }


}
