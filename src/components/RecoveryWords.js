class RecoveryWords {
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

        for (let sectionIndex = 0; sectionIndex < 3; sectionIndex++) {
            const section = document.createElement('div');
            section.classList.add('word-section', `section-${ sectionIndex + 1 }`);
            for (let wordIndex = sectionIndex * 8; wordIndex < (sectionIndex + 1) * 8; wordIndex++) {
                const placeholder = document.createElement('span');
                placeholder.classList.add('word-placeholder');
                placeholder.textContent = wordIndex + 1 + '';

                const content = document.createElement('span');
                content.classList.add('word-content');
                content.textContent = words[wordIndex];
                content.title = `word #${ wordIndex + 1 }`;

                const word = document.createElement('div');
                word.classList.add('word');
                word.appendChild(placeholder);
                word.appendChild(content);
                section.appendChild(word);
            }
            this.$el.appendChild(section);
        }
    }


    /** @returns {Element} */
    getElement() {
        return this.$el;
    }


}
