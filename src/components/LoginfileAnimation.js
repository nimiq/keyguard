/* global TemplateTags */
/* global LoginFileConfig */

class LoginfileAnimation { // eslint-disable-line no-unused-vars
    /**
     * @param {HTMLDivElement} [$el]
     */
    constructor($el) {
        this._color = 0;
        this.$el = LoginfileAnimation._createElement($el);

        /** @type {HTMLDivElement} */
        this.$background = (this.$el.querySelector('.background'));
    }

    /**
     * Set the current animation step for both clear and colored states.
     * Does not need to be called when switching between states.
     *
     * @param {number} step
     */
    setStep(step) {
        for (let i = 8; i > step; i--) {
            this.$el.classList.remove(`step-${i}`);
        }
        for (let i = 0; i <= Math.min(step, 8); i++) {
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
        $element.classList.add('loginfile-animation');
        /* eslint-disable max-len */
        $element.innerHTML = TemplateTags.noVars`
            <div class="background"></div>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 114 186">
                <g class="waves" fill="none" stroke="currentColor" stroke-width="0.6">
                    <!-- Wave stroke length is 245 -->
                    <path d="M132.7-54.5c-15.2 15.2-20.2 10.2-35.4 25.4S87.1-9 72 6.3 51.7 16.4 36.5 31.6C21.4 46.8 26.4 51.8 11.2 67S-9 77.2-24.2 92.4"/>
                    <path d="M130.7-56.5c-15.2 15.2-21.2 9.2-36.4 24.4S85.1-11 70 4.3s-21.2 9.2-36.4 24.4C18.4 43.8 24.4 49.8 9.2 65S-12 74.2-27.2 89.4"/>
                    <path d="M128.7-58.5c-15.2 15.2-22.2 8.2-37.4 23.4S83.1-13 68 2.3s-22.2 8.1-37.4 23.3C15.4 40.8 22.3 47.8 7.2 63S-15 71.2-30.2 86.4"/>
                    <path d="M126.7-60.5c-15.2 15.2-23.2 7.2-38.4 22.4S81.1-15 66 .3 42.7 7.5 27.5 22.7 20.3 45.9 5.2 61-18 68.2-33.2 83.4"/>
                    <path d="M124.7-62.5c-15.2 15.2-24.2 6.2-39.4 21.4S79.1-17 64-1.7 39.7 4.5 24.5 19.7C9.4 34.8 18.4 43.8 3.2 59S-21 65.2-36.2 80.4"/>
                    <path d="M122.7-64.5c-15.2 15.2-25.2 5.2-40.4 20.4S77.1-19 62-3.7 36.7 1.5 21.5 16.7C6.4 31.8 16.4 41.8 1.2 57-14 72.2-24 62.2-39.2 77.4"/>
                    <path d="M120.7-66.5c-15.2 15.2-26.2 4.2-41.4 19.4S75.1-21 60-5.7C44.8 9.5 33.8-1.5 18.6 13.6S14.4 39.8-.8 55-27 59.2-42.2 74.4"/>
                    <path d="M118.7-68.5c-15.2 15.2-27.2 3.2-42.4 18.4S73.1-23 58-7.7 30.8-4.5 15.6 10.6C.4 25.8 12.4 37.8-2.8 53S-30 56.2-45.2 71.4"/>
                    <path d="M116.7-70.5c-15.2 15.2-28.2 2.2-43.4 17.4S71.1-25 56-9.7C40.8 5.5 27.8-7.5 12.6 7.7-2.6 22.8 10.4 35.8-4.8 51S-33 53.2-48.2 68.4"/>
                    <path d="M114.7-72.5c-15.2 15.2-29.2 1.2-44.4 16.4S69.1-27 54-11.7C38.8 3.5 24.8-10.5 9.6 4.7S8.4 33.8-6.8 49-36 50.2-51.2 65.4"/>
                </g>
                <g fill="currentColor">
                    <path class="logo" fill="currentColor" d="M29.9 18l-2.1-3.4a.8.8 0 00-.7-.4h-4.2c-.3 0-.6.1-.7.4l-2 3.4c-.2.3-.2.6 0 .8l2 3.5c.1.3.4.4.7.4h4.2c.3 0 .5-.1.7-.4l2-3.5c.2-.2.2-.5 0-.8z"/>
                    <path class="key" fill="currentColor" d="M73.5 57a9.8 9.8 0 00-7.8-9.8c-1.5-.3-3-.3-4.5 0s-2.8 1-4 2a9.9 9.9 0 00-2.8 12l.1.4-.2.4-12.5 12.4a2.8 2.8 0 000 4 2.9 2.9 0 004 0c.1 0 .3-.2.5-.1l.5.2 2 2 .6.4.5.1.6-.1.4-.3c.1-.1.3-.3.3-.5l.1-.5a1.4 1.4 0 00-.4-1l-2.1-2.1-.2-.3V76v-.3l.2-.2.9-1a.7.7 0 011 0l2.1 2.2c.3.2.7.4 1 .4s.8-.2 1-.4c.3-.3.4-.7.4-1 0-.4-.1-.7-.4-1l-2-2.1c-.2-.1-.3-.3-.3-.5l.2-.5 5.6-5.6.4-.2h.5a10 10 0 0013-4 9.8 9.8 0 001.3-4.9zm-10 4.2c-.9 0-1.8-.3-2.5-.8s-1.2-1-1.5-1.8c-.3-.8-.5-1.7-.3-2.5s.6-1.6 1.2-2.2 1.4-1 2.2-1.1a4.3 4.3 0 015.1 4.2c0 1-.5 2.1-1.3 2.9-.8.8-1.8 1.3-3 1.3z"/>
                    <path class="stars" fill="currentColor" d="M48 50c0 .6-.5 1-1 1h-1.5c-.3 0-.5.2-.5.5V53c0 .6-.5 1-1 1s-1-.5-1-1v-1.5c0-.3-.2-.5-.5-.5H41c-.6 0-1-.5-1-1s.5-1 1-1h1.5c.3 0 .5-.2.5-.5V47c0-.6.5-1 1-1s1 .5 1 1v1.5c0 .3.2.5.5.5H47c.5 0 1 .5 1 1zM76 77c0 .6-.5 1-1 1h-1.5c-.3 0-.5.2-.5.5V80c0 .6-.5 1-1 1s-1-.5-1-1v-1.5c0-.3-.2-.5-.5-.5H69c-.6 0-1-.5-1-1s.5-1 1-1h1.5c.3 0 .5-.2.5-.5V74c0-.6.5-1 1-1s1 .5 1 1v1.5c0 .3.2.5.5.5H75c.5 0 1 .5 1 1z"/>
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
