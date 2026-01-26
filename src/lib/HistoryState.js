class HistoryState { // eslint-disable-line no-unused-vars
    /**
     * @param {string} key
     * @returns {unknown | undefined}
     */
    static get(key) {
        const state = window.history.state;
        return state && typeof state === 'object' ? state[key] : undefined;
    }

    /**
     * @param {string} key
     * @param {unknown} value - can be anything that can be structurally cloned, see
     *  developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm
     */
    static set(key, value) {
        const oldState = window.history.state;
        window.history.replaceState({
            ...(typeof oldState === 'object' ? oldState : null),
            [key]: value,
        }, '');
    }

    /**
     * @param {string} key
     * @param {unknown} value - can be anything that can be structurally cloned, see
     *  developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm
     */
    static push(key, value) {
        window.history.pushState({ [key]: value }, '');
    }
}
