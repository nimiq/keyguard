/* global TemplateTags */
/* global LoginFileConfig */

class LoginFileAnimation {
    /**
     * @param {HTMLDivElement} [$el]
     */
    constructor($el) {
        this._color = 0;
        this.$el = LoginFileAnimation._createElement($el);

        this.$background = /** @type {HTMLDivElement} */ (this.$el.querySelector('.background'));
    }

    /**
     * Set the current animation step for both clear and colored states.
     * Does not need to be called when switching between states.
     *
     * @param {number} step
     */
    setStep(step) {
        for (let i = LoginFileAnimation.STEPS; i > step; i--) {
            this.$el.classList.remove(`step-${i}`);
        }
        for (let i = 0; i <= Math.min(step, LoginFileAnimation.STEPS); i++) {
            this.$el.classList.add(`step-${i}`);
        }
    }

    /**
     * Set the color of the LoginFile and transition into colored state.
     *
     * @param {number} color
     */
    setColor(color) {
        this._color = color;
        this.$background.classList.add(LoginFileConfig[this._color].className);

        // Transition to colored state
        this.$el.classList.add('colored');
        this.setStep(0);
    }

    /**
     * Reset to initial state
     */
    reset() {
        this.$background.classList.remove(LoginFileConfig[this._color].className);
        this.$el.classList.remove('colored');
        this.setStep(0);
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
        $element.classList.add('login-file-animation');
        /* eslint-disable max-len */
        $element.innerHTML = TemplateTags.noVars`
            <div class="background"></div>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 114 186">
                <g class="waves" fill="none" stroke="currentColor">
                    <!-- Wave stroke length is 124 -->
                    <path opacity="0.3" d="M-2.8 77.3c4-2 8.4-4.7 13.9-10.3 15.2-15.2 9.2-21.2 24.4-36.4s21.2-9.2 36.4-24.4a57 57 0 006.6-7.7"/>
                    <path opacity="0.6" d="M-8.4 71.7C-4 70.1.6 67.6 6.2 62c15.2-15.2 7.2-23.2 22.4-38.4S51.8 16.4 67 1.2c2.9-2.9 4.9-5.5 6.4-7.9"/>
                    <path opacity="0.75" stroke-width="1.5" d="M-13 67.1a33 33 0 0015.2-9c15.2-15.2 5.2-25.2 20.4-40.4s25.1-5.2 40.3-20.4c2.9-2.9 4.8-5.5 6.2-8.1"/>
                    <path opacity="0.6" d="M-17.6 62.5a28 28 0 0015.8-8.4c15.2-15.2 3.2-27.2 18.4-42.4S43.8 8.4 59-6.7c2.9-2.9 4.8-5.6 6-8.3"/>
                    <path opacity="0.3" d="M-20.9 59.2c5.2-.8 10.5-2.5 16.1-8.1C10.4 35.8-2.6 22.9 12.6 7.7S40.8 5.5 56-9.7a30 30 0 006-8.4"/>
                    <path opacity="0.3" d="M-23.2 56.8c5.4-.6 10.8-2.2 16.4-7.8C8.4 33.8-5.6 19.9 9.6 4.7S38.8 3.5 54-11.7c2.9-2.9 4.7-5.7 5.9-8.5"/>
                </g>
                <g fill="currentColor">
                    <path class="logo" fill="currentColor" d="M29.9 18l-2.1-3.4a.8.8 0 00-.7-.4h-4.2c-.3 0-.6.1-.7.4l-2 3.4c-.2.3-.2.6 0 .8l2 3.5c.1.3.4.4.7.4h4.2c.3 0 .5-.1.7-.4l2-3.5c.2-.2.2-.5 0-.8z"/>
                    <path class="key" fill="currentColor" d="M73.5 57a9.8 9.8 0 00-7.8-9.8c-1.5-.3-3-.3-4.5 0s-2.8 1-4 2a9.9 9.9 0 00-2.8 12l.1.4-.2.4-12.5 12.4a2.8 2.8 0 000 4 2.9 2.9 0 004 0c.1 0 .3-.2.5-.1l.5.2 2 2 .6.4.5.1.6-.1.4-.3c.1-.1.3-.3.3-.5l.1-.5a1.4 1.4 0 00-.4-1l-2.1-2.1-.2-.3V76v-.3l.2-.2.9-1a.7.7 0 011 0l2.1 2.2c.3.2.7.4 1 .4s.8-.2 1-.4c.3-.3.4-.7.4-1 0-.4-.1-.7-.4-1l-2-2.1c-.2-.1-.3-.3-.3-.5l.2-.5 5.6-5.6.4-.2h.5a10 10 0 0013-4 9.8 9.8 0 001.3-4.9zm-10 4.2c-.9 0-1.8-.3-2.5-.8s-1.2-1-1.5-1.8c-.3-.8-.5-1.7-.3-2.5s.6-1.6 1.2-2.2 1.4-1 2.2-1.1a4.3 4.3 0 015.1 4.2c0 1-.5 2.1-1.3 2.9-.8.8-1.8 1.3-3 1.3z"/>
                </g>
                <g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                    <!-- Border stroke length is 585 -->
                    <path class="border" stroke-width="2" d="M1 5a4 4 0 014-4h104a4 4 0 014 4v176a4 4 0 01-4 4H5a4 4 0 01-4-4V5z"/>
                    <path class="border" stroke-width="2" d="M1 5a4 4 0 014-4h104a4 4 0 014 4v176a4 4 0 01-4 4H5a4 4 0 01-4-4V5z"/>
                    <path class="border" stroke-width="2" d="M1 5a4 4 0 014-4h104a4 4 0 014 4v176a4 4 0 01-4 4H5a4 4 0 01-4-4V5z"/>
                    <path class="title" stroke-width="6" d="M89 18H64M55 18H36"/>
                    <path class="date" stroke-width="3" d="M70 31H44"/>
                    <g stroke-width="4">
                        <path class="qr" d="M33 138h14v14H33z"/>
                        <path class="qr" d="M67 104h14v14H67z"/>
                        <path class="qr" d="M61 126v6H33h5v-8M60 146v6h21"/>
                        <path class="qr" d="M58 104h3v14M79 124H67v6"/>
                        <path class="qr" d="M45 125h8v-9M80 131v14"/>
                        <path class="qr" d="M59 139h-6v8"/>
                        <path class="qr" d="M53 104v5h3"/>
                        <path class="qr" d="M33 104h14v14H33zM67 138h6v6h-6z"/>
                    </g>
                </g>
            </svg>
        `;
        /* eslint-enable max-len */
        return $element;
    }
}

LoginFileAnimation.STEPS = 8;
