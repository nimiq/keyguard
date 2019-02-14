class FlippableHandler {
    /**
     * Classname 'dark' is the default flippable name, and has its css already available.
     * If other classes should be flipped to the backside they need to be added to FlippableHandler.css
     * @param {string} [classname = "dark"] - Pages with this classname will be on the backside of the flip.
     */
    constructor(classname = 'dark') {
        if (!FlippableHandler.flippableHandlerInitialised) {
            /** @type {HTMLElement} */
            const $rotationContainer = (document.getElementById('rotation-container'));
            window.addEventListener('hashchange', event => {
                const newHash = new URL(event.newURL).hash;
                const oldHash = new URL(event.oldURL).hash;
                if (oldHash && newHash) {
                    const $oldEl = document.querySelector(oldHash);
                    const $newEl = document.querySelector(newHash);
                    if ($newEl && $oldEl
                        && $newEl.classList.contains(classname) !== $oldEl.classList.contains(classname)) {
                        $newEl.classList.add('display-flex');
                        window.setTimeout(() => $newEl.classList.remove('display-flex'), 600);
                        $oldEl.classList.add('display-flex');
                        window.setTimeout(() => $oldEl.classList.remove('display-flex'), 300);
                        $rotationContainer.classList.toggle('flipped');
                    }
                }
            });
            FlippableHandler.flippableHandlerInitialised = true;
        }
    }
}
FlippableHandler.flippableHandlerInitialised = false;
