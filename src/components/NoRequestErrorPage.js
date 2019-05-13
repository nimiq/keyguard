/* global I18n */
/* global TemplateTags */

class NoRequestErrorPage { // eslint-disable-line no-unused-vars
    constructor() {
        this.$el = NoRequestErrorPage._createElement();
    }

    /**
     * @returns {HTMLDivElement}
     */
    getElement() {
        return this.$el;
    }

    /**
     * @returns {HTMLDivElement}
     */
    static _createElement() {
        const $element = document.createElement('div');

        $element.classList.add('page');
        $element.id = 'error';

        $element.innerHTML = TemplateTags.noVars`
            <h1 class="nq-h1" data-i18n="error-no-request-heading">That went wrong :(</h1>
            <div data-i18n="error-no-request-message">
                We could not detect a valid request. Please go back and try again.
            </div>
        `;

        I18n.translateDom($element);

        return $element;
    }
}
