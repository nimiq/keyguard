/* global Nimiq */
/* global TemplateTags */

class ProgressIndicator extends Nimiq.Observable { // eslint-disable-line no-unused-vars
    /**
     * @param {?Element | undefined} $el
     * @param {number} numberOfSteps
     * @param {number} [currentStep]
     */
    constructor($el, numberOfSteps, currentStep) {
        super();
        this.$el = ProgressIndicator._createElement($el, numberOfSteps);
        this.setStep(currentStep || 0);
    }

    /**
     * @param {?Element | undefined} $el
     * @param {number} numberOfSteps
     * @returns {Element}
     */
    static _createElement($el, numberOfSteps) {
        $el = $el || document.createElement('div');
        $el.classList.add('progress-indicator');

        let html = '';

        for (let i = 0; i < numberOfSteps; i++) {
            html += TemplateTags.hasVars(1)`<div class="indicator step-${i + 1}"></div>`;
        }

        $el.innerHTML = html;

        return $el;
    }

    /** @returns {Element} @deprecated */
    getElement() {
        return this.$el;
    }

    /** @type {Element} */
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
