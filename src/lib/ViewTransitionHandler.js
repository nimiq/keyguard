/**
 * @template {string | number} State - a supported state's type, e.g. 'state1' | 'state2' | ...
 */
class ViewTransitionHandler { // eslint-disable-line no-unused-vars
    /**
     * @param {Array<State>} transitionableStates
     * @param {(
     *     viewTransition: ViewTransition,
     *     oldState: State,
     *     newState: State,
     * ) => Promise<void>} [customizeViewTransition]
     */
    constructor(transitionableStates, customizeViewTransition) {
        this._transitionableStates = transitionableStates;
        this._customizeViewTransition = customizeViewTransition;
        /** @type {State | null} */
        this._currentlyTransitioningNewState = null;
        /** @type {ViewTransition | null} */
        this._currentViewTransition = null;
        /** @type {Array<Promise<void>>} */
        this._pendingViewTransitionPromises = [];
    }

    /** @type {State | null} */
    get currentlyTransitioningNewState() {
        return this._currentlyTransitioningNewState;
    }

    /** @type {ViewTransition | null} */
    get currentViewTransition() {
        return this._currentViewTransition;
    }

    /**
     * @param {unknown} state
     * @returns {state is State}
     */
    isTransitionableState(state) {
        return this._transitionableStates.includes(/** @type {State} */ (state));
    }

    /**
     * @param {unknown} oldState
     * @param {unknown} newState
     * @returns {boolean}
     */
    shouldTransitionView(oldState, newState) {
        return !!document.startViewTransition // view transitions supported
            && newState !== this._currentlyTransitioningNewState // transition not already running or scheduled
            && this.isTransitionableState(oldState) && this.isTransitionableState(newState);
    }

    /**
     * @param {() => Promise<void> | void} domUpdateHandler
     * @param {unknown} oldState
     * @param {unknown} newState
     * @param {boolean} [awaitPreviousTransitions=false]
     * @returns {Promise<ViewTransition | null>}
     */
    async transitionView(domUpdateHandler, oldState, newState, awaitPreviousTransitions = false) {
        /** @type {Promise<[ViewTransition | null, Promise<void> | null]>} */
        const initializationAndDomUpdatePromise = (async () => {
            if (awaitPreviousTransitions) {
                await Promise.allSettled(this._pendingViewTransitionPromises);
            }
            if (!this.isTransitionableState(oldState)
                || !this.isTransitionableState(newState)
                || !this.shouldTransitionView(oldState, newState)) {
                // Go to new state without a view transition.
                await domUpdateHandler();
                return [null, null];
            }
            this._currentlyTransitioningNewState = newState;
            // Note that starting a new view transition cancels the animation of a previous one, if still running.
            const viewTransition = document.startViewTransition(domUpdateHandler);
            this._currentViewTransition = viewTransition;
            const viewTransitionFinishAndCleanupPromise = Promise.all([
                this._customizeViewTransition
                    ? this._customizeViewTransition(viewTransition, oldState, newState)
                    : null,
                viewTransition.finished,
            ]).catch(e => {
                // Catch exceptions to avoid unhandled promise rejections for non-essential exceptions.
                console.error(e);
            }).then(() => {
                if (this._currentlyTransitioningNewState !== newState) return;
                // Reached target state, and it hasn't changed in the meantime.
                this._currentlyTransitioningNewState = null;
                this._currentViewTransition = null;
            });
            // Await the actual DOM update of domUpdateHandler (i.e. the important part), and throw if it fails.
            await viewTransition.updateCallbackDone;
            return [viewTransition, viewTransitionFinishAndCleanupPromise];
        })();

        // Note that the promise is pushed/queued immediately, without awaiting any asynchronous code before, such that
        // it is visible immediately to any following transitionView calls.
        // initializationAndDomUpdatePromise includes waiting for our turn (if awaitPreviousTransitions is requested),
        // creating the view transition (if it should be transitioned), and the DOM update.
        // viewTransitionFinishAndCleanupPromise includes waiting for the view transition to finish or be skipped (if
        // it should be transitioned), customization of the view transition, and cleanup in the end.
        const pendingViewTransitionPromise = initializationAndDomUpdatePromise
            .then(([, viewTransitionFinishAndCleanupPromise]) => viewTransitionFinishAndCleanupPromise)
            .catch(() => {})
            .then(() => {
                // While _pendingViewTransitions pretty much works like a queue, we can not simply assume that we can
                // remove the first/oldest entry, because calls with awaitPreviousTransitions === false can execute out
                // of order.
                const index = this._pendingViewTransitionPromises.indexOf(pendingViewTransitionPromise);
                if (index === -1) return;
                this._pendingViewTransitionPromises.splice(index, 1);
            });
        this._pendingViewTransitionPromises.push(pendingViewTransitionPromise);

        const [viewTransition] = await initializationAndDomUpdatePromise;
        return viewTransition;
    }
}
