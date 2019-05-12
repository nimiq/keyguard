class FlippableHandler {
    /**
     * Classname 'flipped' is the default flippable name, and has its css already available.
     * If other classes should be flipped to the backside they need to be added to FlippableHandler.css
     * @param {string} [classname = "flipped"] - Pages with this classname will be on the backside of the flip.
     */
    static init(classname = 'flipped') {
        if (!FlippableHandler.flippableHandlerInitialised) {
            /** @type {HTMLElement} */
            const $rotationContainer = (document.getElementById('rotation-container'));
            if (window.location.hash) {
                const $page = document.querySelector(window.location.hash);
                if ($page) {
                    $rotationContainer.classList.add('disable-transition');
                    window.setTimeout(() => {
                        $rotationContainer.classList.toggle('flipped', $page.classList.contains(classname));
                        window.setTimeout(() => $rotationContainer.classList.remove('disable-transition'), 10);
                    }, 0);
                }
            }
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
                        window.setTimeout(() => {
                            $rotationContainer.classList.toggle('flipped', $newEl.classList.contains(classname));
                        }, 0);
                    }
                } else if (newHash) {
                    const $newEl = document.querySelector(newHash);
                    if ($newEl && $newEl.classList.contains(classname)) {
                        $rotationContainer.classList.add('disable-transition');
                        window.setTimeout(() => {
                            $rotationContainer.classList.toggle('flipped', $newEl.classList.contains(classname));
                            window.setTimeout(() => $rotationContainer.classList.remove('disable-transition'), 10);
                        }, 0);
                    }
                }
            });
            FlippableHandler.flippableHandlerInitialised = true;
        }
    }
}
FlippableHandler.flippableHandlerInitialised = false;
