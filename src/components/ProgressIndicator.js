/* global Nimiq */
/* global TemplateTags */

class ProgressIndicator extends Nimiq.Observable { // eslint-disable-line no-unused-vars
    /**
     * @param {?HTMLElement} $el
     * @param {number} numberOfSteps
     * @param {number} [currentStep]
     */
    constructor($el, numberOfSteps, currentStep) {
        super();
        this.$el = ProgressIndicator._createElement($el, numberOfSteps);
        this.setStep(currentStep || 0);
    }

    /**
     * @param {?HTMLElement} [$el]
     * @param {number} numberOfSteps
     * @returns {HTMLElement}
     */
    static _createElement($el, numberOfSteps) {
        $el = $el || document.createElement('div');
        $el.classList.add('progress-indicator');

        let html = '';

        for (let i = 0; i < numberOfSteps; i++) {
            html += TemplateTags.hasVariables(1)`<div class="indicator step-${i + 1}"></div>`;
        }

        $el.innerHTML = html;

        return $el;
    }

    /** @returns {HTMLElement} @deprecated */
    getElement() {
        return this.$el;
    }

    /** @type {HTMLElement} */
    get element() {
        return this.$el;
    }

    /**
     * @param {number} step
     */
    setStep(step) {
        this.$el.setAttribute('data-step', step.toString());
    }
}
