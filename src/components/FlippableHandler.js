class FlippableHandler { // eslint-disable-line no-unused-vars
    /**
     * classname 'dark' is default flippable name, and has some css already available.
     * If other classes should be flipped to the backside they need to be added to FlippableHandler.css
     * @param {string} [classname = "dark"] - Pages with this classname will be on the backside of the flip.
     */
    constructor(classname = 'dark') {
        /** @type {HTMLElement} */
        const $rotationContainer = (document.getElementById('rotation-container'));
        window.addEventListener('hashchange', event => {
            const newHash = new URL(event.newURL).hash;
            const oldHash = new URL(event.oldURL).hash;
            if (oldHash && newHash) {
                const oldPageElement = document.querySelector(oldHash);
                const newPageElement = document.querySelector(newHash);
                if (newPageElement
                    && oldPageElement
                    && newPageElement.classList.contains(classname) !== oldPageElement.classList.contains(classname)) {
                    newPageElement.classList.add('display-flex');
                    window.setTimeout(() => newPageElement.classList.remove('display-flex'), 600);
                    oldPageElement.classList.add('display-flex');
                    window.setTimeout(() => oldPageElement.classList.remove('display-flex'), 300);
                    $rotationContainer.classList.toggle('flipped');
                }
            }
        });
    }
}
