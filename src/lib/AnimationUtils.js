class AnimationUtils {
    /**
     * @param {string} className
     * @param {HTMLElement} el
     * @param {() => void} [afterStartCallback]
     * @param {() => void} [beforeEndCallback]
     * @returns
     */
    static animate(className, el, afterStartCallback, beforeEndCallback) {
        return new Promise(resolve => {
            // 'animiationend' is a native DOM event that fires upon CSS animation completion
            const listener = /** @param {Event} e */ e => {
                if (e.target !== el) return;
                if (beforeEndCallback instanceof Function) beforeEndCallback();
                this.stopAnimate(className, el);
                el.removeEventListener('animationend', listener);
                resolve();
            };
            el.addEventListener('animationend', listener);
            el.classList.add(className);
            if (afterStartCallback instanceof Function) afterStartCallback();
        })
    }

    /**
     * @param {string} className
     * @param {HTMLElement} el
     */
    static stopAnimate(className, el) {
        el.classList.remove(className);
    }
}
