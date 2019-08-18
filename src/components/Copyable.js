/* global ClipboardUtils */

class Copyable { // eslint-disable-line no-unused-vars
    /**
     * @param {string} text
     * @param {HTMLDivElement} [$el]
     */
    constructor(text, $el) {
        this._text = text;
        this._copiedResetTimeout = -1;

        this.$el = Copyable._createElement($el);
        this.$el.addEventListener('click', () => this.copy());
    }

    copy() {
        ClipboardUtils.copy(this._text);

        window.clearTimeout(this._copiedResetTimeout);
        this.$el.classList.add('copied');
        this._copiedResetTimeout = window.setTimeout(() => this.$el.classList.remove('copied'), 1800);
    }

    /**
     * @returns {HTMLDivElement}
     */
    getElement() {
        return this.$el;
    }

    /**
     * @param {HTMLDivElement} [$el]
     * @returns {HTMLDivElement}
     */
    static _createElement($el) {
        const $element = $el || document.createElement('div');
        $element.classList.add('copyable');
        const $background = document.createElement('div');
        $background.classList.add('copyable-background');
        $element.appendChild($background);
        return $element;
    }
}
