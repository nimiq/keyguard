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
                    FlippableHandler._updateContainerHeight($page);
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
                            FlippableHandler._updateContainerHeight($newEl);
                        }, 0);
                    } else {
                        FlippableHandler._updateContainerHeight($newEl || undefined);
                    }
                } else if (newHash) {
                    const $newEl = document.querySelector(newHash);
                    if ($newEl && $newEl.classList.contains(classname)) {
                        $rotationContainer.classList.add('disable-transition');
                        FlippableHandler._updateContainerHeight($newEl);
                        window.setTimeout(() => {
                            $rotationContainer.classList.toggle('flipped', $newEl.classList.contains(classname));
                            window.setTimeout(() => $rotationContainer.classList.remove('disable-transition'), 10);
                        }, 0);
                    } else {
                        window.setTimeout(() => {
                            $rotationContainer.classList.add('disable-transition');
                            FlippableHandler._updateContainerHeight($newEl || undefined);
                            window.setTimeout(() => {
                                $rotationContainer.classList.remove('disable-transition');
                            }, 0);
                        }, 0);
                    }
                }
            });
            FlippableHandler.flippableHandlerInitialised = true;
        }
    }

    /**
     * Update the height of the #rotation-container element to match its content.
     * The default behavior is to look for every visible `.page` element,
     * and, if there is multiple, take the height of the higher.
     * @param {Element} [$enforcedElement] - Enforce which element the function is taking the height from.
     *  Must be a child of `#rotation-container`
     */
    static _updateContainerHeight($enforcedElement) {
        /** @type {HTMLElement} */
        const $rotationContainer = (document.getElementById('rotation-container'));
        if ($enforcedElement && $rotationContainer.contains($enforcedElement)) {
            $rotationContainer.style.height = `${$enforcedElement.clientHeight}px`;
        } else {
            /** @type {Array<HTMLElement>} */
            const $pages = Array.from($rotationContainer.querySelectorAll('.page'));
            if ($pages && $pages.length > 0) {
                const heights = $pages.map($el => ($el.offsetParent ? $el.clientHeight : 0));
                const visiblePageHeight = Math.max(...heights);
                $rotationContainer.style.height = visiblePageHeight > 0 ? `${visiblePageHeight}px` : '';
            }
        }
    }
}
FlippableHandler.flippableHandlerInitialised = false;
