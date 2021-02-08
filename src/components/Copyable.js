/* global I18n */
/* global ClipboardUtils */

class Copyable {
    /**
     * @param {string} text
     * @param {HTMLDivElement} [$el]
     */
    constructor(text, $el) {
        this._text = text;
        this._copiedResetTimeout = -1;

        this.$el = Copyable._createElement($el);
        this.$el.addEventListener('click', () => this.copy());
        this.$el.addEventListener('keydown', event => {
            if (event.key !== ' ' /* Space */ && event.key !== 'Enter') return;
            this.copy();
        });
    }

    copy() {
        ClipboardUtils.copy(this._text);

        window.clearTimeout(this._copiedResetTimeout);
        this.$el.classList.add('copied', 'show-tooltip');
        this._copiedResetTimeout = window.setTimeout(
            () => this.$el.classList.remove('copied', 'show-tooltip'),
            Copyable.DISPLAY_TIME,
        );
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
        $element.classList.add('copyable', 'tooltip', 'top', 'disable-auto-tooltip');
        $element.tabIndex = 0;
        const $background = document.createElement('div');
        $background.classList.add('copyable-background');
        $element.appendChild($background);
        const $tooltipBox = document.createElement('div');
        $tooltipBox.classList.add('tooltip-box');
        // Apply the translation via translatePhrase such that the translationValidator finds it and additionally
        // apply the data-i18n attribute such that the translation can be updated on language switch.
        $tooltipBox.textContent = I18n.translatePhrase('copyable-copied');
        $tooltipBox.dataset.i18n = 'copyable-copied';
        $element.appendChild($tooltipBox);
        return $element;
    }
}

Copyable.DISPLAY_TIME = 800;
