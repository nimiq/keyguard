/* global I18n */
/* global TemplateTags */

class NoReferrerErrorPage { // eslint-disable-line no-unused-vars
    constructor() {
        this.$el = NoReferrerErrorPage._createElement();
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

        $element.innerHTML = TemplateTags.noVariables`
            <h1 class="nq-h1" data-i18n="error-no-referrer-heading">That went wrong :(</h1>
            <div data-i18n="error-no-referrer-message">
                We could not verify the origin of your request. Please go back and try again.
            </div>
        `;

        I18n.translateDom($element);

        return $element;
    }
}
