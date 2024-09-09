// @ts-nocheck
/*
    JavaScript autoComplete v1.0.4
    Copyright (c) 2014 Simon Steinberger / Pixabay
    GitHub: https://github.com/Pixabay/JavaScript-autoComplete
    License: http://www.opensource.org/licenses/mit-license.php
*/

class AutoComplete { // eslint-disable-line no-unused-vars
    /**
     * @param {Object} options
     */
    constructor(options) {
        if (!document.querySelector) return;

        // helpers
        /**
         * @param {string} elClass
         * @param {string} event
         * @param {function(HTMLElement, Event):void} cb
         * @param {Node} context
         */
        function live(elClass, event, cb, context = document) {
            context.addEventListener(event, /** @param {Event} e */ e => {
                let el = /** @type {HTMLElement | null} */ (e.target || e.srcElement);
                let found = false;
                do {
                    if (!el) break;
                    found = !!el && el.classList.contains(elClass);
                    if (found) break;
                    el = el.parentElement;
                } while (!found);
                if (el && found) cb((/** @type {HTMLElement} */ (el)), e);
            });
        }

        const defaultOptions = {
            selector: 0,
            source: 0,
            minChars: 3,
            delay: 150,
            offsetLeft: 0,
            offsetTop: 1,
            cache: 1,
            menuClass: '',
            renderItem: /** @param {string} item */ item => {
                const element = document.createElement('div');
                element.classList.add('autocomplete-suggestion');
                element.dataset.val = item;
                element.textContent = item;
                return element;
            },
            // onSelect: /** @param {Event} e @param {string} term @param {Element} item */ (e, term, item) => {},
            onSelect: () => {},
        };
        const o = Object.assign(defaultOptions, options);

        // init
        this.elems = typeof o.selector === 'object' ? [o.selector] : document.querySelectorAll(o.selector);
        for (let i = 0; i < this.elems.length; i++) {
            const that = this.elems[i];

            // create suggestions container "sc"
            that.sc = document.createElement('div');
            that.sc.className = `autocomplete-suggestions ${o.menuClass}`;

            that.autocompleteAttr = that.getAttribute('autocomplete');
            that.setAttribute('autocomplete', 'off');
            that.cache = {};
            that.last_val = '';

            that.updateSC = /** @param {boolean} resize @param {Element} next */ (resize, next) => {
                const rect = that.getBoundingClientRect();
                const scrollX = window.pageXOffset || (document.documentElement && document.documentElement.scrollLeft);
                const scrollY = window.pageYOffset || (document.documentElement && document.documentElement.scrollTop);
                that.sc.style.left = `${Math.round(rect.left + scrollX + o.offsetLeft)}px`;
                that.sc.style.top = `${Math.round(rect.bottom + scrollY + o.offsetTop)}px`;
                that.sc.style.width = `${Math.round(rect.right - rect.left)}px`; // outerWidth
                if (!resize) {
                    that.sc.style.display = 'block';
                    if (!that.sc.maxHeight) {
                        const style = window.getComputedStyle ? getComputedStyle(that.sc, null) : that.sc.currentStyle;
                        that.sc.maxHeight = parseInt(style.maxHeight, 10);
                    }
                    if (!that.sc.suggestionHeight) {
                        that.sc.suggestionHeight = that.sc.querySelector('.autocomplete-suggestion').offsetHeight;
                    }
                    if (that.sc.suggestionHeight) {
                        if (!next) that.sc.scrollTop = 0;
                        else {
                            const scrTop = that.sc.scrollTop; const
                                selTop = next.getBoundingClientRect().top - that.sc.getBoundingClientRect().top;
                            if (selTop + that.sc.suggestionHeight - that.sc.maxHeight > 0) {
                                that.sc.scrollTop = selTop + that.sc.suggestionHeight + scrTop - that.sc.maxHeight;
                            } else if (selTop < 0) {
                                that.sc.scrollTop = selTop + scrTop;
                            }
                        }
                    }
                }
            };
            window.addEventListener('resize', that.updateSC);
            document.body.appendChild(that.sc);

            live('autocomplete-suggestion', 'mouseleave', () => {
                const sel = that.sc.querySelector('.autocomplete-suggestion.selected');
                if (sel) setTimeout(() => { sel.classList.remove('selected'); }, 20);
            }, that.sc);

            live('autocomplete-suggestion', 'mouseover', el => {
                const sel = that.sc.querySelector('.autocomplete-suggestion.selected');
                if (sel) sel.classList.remove('selected');
                el.classList.add('selected');
            }, that.sc);

            live('autocomplete-suggestion', 'mousedown', (el, e) => {
                if (el.classList.contains('autocomplete-suggestion')) { // else outside click
                    const v = el.dataset.val;
                    that.value = v;
                    o.onSelect(e, v, el);
                    that.sc.style.display = 'none';
                }
            }, that.sc);

            that.blurHandler = () => {
                that.last_val = that.value;
                that.sc.style.display = 'none';
                setTimeout(() => { that.sc.style.display = 'none'; }, 350); // hide suggestions on fast input
            };
            that.addEventListener('blur', that.blurHandler);

            /** @param {string[]} data */
            const suggest = data => {
                const val = that.value;
                that.cache[val] = data;
                if (data.length && val.length >= o.minChars) {
                    that.sc.innerHTML = '';
                    for (let x = 0; x < data.length; x++) {
                        that.sc.appendChild(o.renderItem(data[x]));
                    }
                    that.updateSC(0);
                    if (that.sc.childNodes.length === 1) {
                        that.sc.childNodes[0].className += ' selected';
                    }
                } else that.sc.style.display = 'none';
            };

            /**
             * @param {KeyboardEvent} e
             * @returns {boolean}
             */
            that.keydownHandler = e => {
                const key = window.event ? e.keyCode : e.which;
                // down (40), up (38)
                if ((key === 40 || key === 38) && that.sc.innerHTML) {
                    let next;
                    const sel = that.sc.querySelector('.autocomplete-suggestion.selected');
                    if (!sel) {
                        next = (key === 40) ? that.sc.querySelector('.autocomplete-suggestion')
                            : that.sc.childNodes[that.sc.childNodes.length - 1]; // first : last
                        next.className += ' selected';
                        that.value = next.getAttribute('data-val');
                    } else {
                        next = (key === 40) ? sel.nextSibling : sel.previousSibling;
                        if (next) {
                            sel.className = sel.className.replace('selected', '');
                            next.className += ' selected';
                            that.value = next.getAttribute('data-val');
                        } else {
                            sel.className = sel.className.replace('selected', '');
                            that.value = that.last_val; next = 0;
                        }
                    }
                    that.updateSC(0, next);
                    return false;
                }
                // esc
                if (key === 27) {
                    that.value = that.last_val;
                    that.sc.style.display = 'none';
                } else if (key === 13 || key === 9 || key === 32) {
                    const sel = that.sc.querySelector('.autocomplete-suggestion.selected');
                    if (sel && that.sc.style.display !== 'none') {
                        o.onSelect(e, sel.getAttribute('data-val'), sel);
                        setTimeout(() => { that.sc.style.display = 'none'; }, 20);
                    }
                }
                return true;
            };
            that.addEventListener('keydown', that.keydownHandler);

            that.keyupHandler = /** @param {KeyboardEvent} e */ e => {
                const key = window.event ? e.keyCode : e.which;
                if (!key || ((key < 35 || key > 40) && key !== 13 && key !== 27)) {
                    const val = that.value;
                    if (val.length >= o.minChars) {
                        if (val !== that.last_val) {
                            that.last_val = val;
                            clearTimeout(that.timer);
                            if (o.cache) {
                                if (val in that.cache) { suggest(that.cache[val]); return; }
                                // no requests if previous suggestions were empty
                                for (let x = 1; x < val.length - o.minChars; x++) {
                                    const part = val.slice(0, val.length - x);
                                    if (part in that.cache && !that.cache[part].length) { suggest([]); return; }
                                }
                            }
                            that.timer = setTimeout(() => { o.source(val, suggest); }, o.delay);
                        }
                    } else {
                        that.last_val = val;
                        that.sc.style.display = 'none';
                    }
                }
            };
            that.addEventListener('keyup', that.keyupHandler);

            that.focusHandler = /** @param {Event} e */ e => {
                that.last_val = '\n';
                that.keyupHandler(e);
            };
            if (!o.minChars) that.addEventListener('focus', that.focusHandler);
        }
    }

    destroy() {
        for (let i = 0; i < this.elems.length; i++) {
            const that = this.elems[i];
            window.removeEventListener('resize', that.updateSC);
            that.removeEventListener('blur', that.blurHandler);
            that.removeEventListener('focus', that.focusHandler);
            that.removeEventListener('keydown', that.keydownHandler);
            that.removeEventListener('keyup', that.keyupHandler);
            if (that.autocompleteAttr !== undefined) that.setAttribute('autocomplete', that.autocompleteAttr);
            else that.removeAttribute('autocomplete');
            document.body.removeChild(that.sc);
        }
    }
}
