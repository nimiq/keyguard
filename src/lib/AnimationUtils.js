class AnimationUtils { // eslint-disable-line no-unused-vars
    /**
     * @param {string} className
     * @param {HTMLElement} el
     * @param {Function} [afterStartCallback]
     * @param {Function} [beforeEndCallback]
     */
    static async animate(className, el, afterStartCallback, beforeEndCallback) {
        return new Promise(resolve => {
            // 'animiationend' is a native DOM event that fires upon CSS animation completion
            /** @param {Event} e */
            const listener = e => {
                if (e.target !== el) return;
                if (beforeEndCallback instanceof Function) beforeEndCallback();
                this.stopAnimate(className, el);
                el.removeEventListener('animationend', listener);
                resolve(undefined);
            };
            el.addEventListener('animationend', listener);
            el.classList.add(className);
            if (afterStartCallback instanceof Function) afterStartCallback();
        });
    }

    /**
     * @param {string} className
     * @param {HTMLElement} el
     */
    static stopAnimate(className, el) {
        el.classList.remove(className);
    }
}
