class PinInput extends /** @type {any} */ Nimiq.Observable {
    /**
     * @param {Element|undefined} el
     */
    constructor(el = undefined) {
        super();
        this.$el = el || this._createElement();
        this.$dotIndicator = /** @type {Element} */ (this.$el.querySelector('.pin-dot-indicator'));
        this.$dots = Array.from(this.$dotIndicator.children);
        this.$deleteButton = /** @type {Element} */ (this.$el.querySelector('.delete'));
        /** @type {string} */
        this._pin = '';
        /** @type {number} */
        this._attempts = 0;
        /** @type {number} */
        this._waitingTime = 50;
        /** @type {function(KeyboardEvent):void} */
        this._handleKeyboardInput = this._handleKeyboardInput.bind(this);

        this.$el.addEventListener('click', e => this._onClick(/** @type {MouseEvent} */ (e)));
        this.$deleteButton.addEventListener('click', () => this._onDelete());
    }

    /** @returns {Element} */
    _createElement() {
        /** @type {Element} */
        const el = document.createElement('div');
        el.classList.add('pin-input', 'center');
        el.innerHTML = `
            <div class="pin-dot-indicator">
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
                <div></div>
            </div>
            <div class="pin-button-container">
                <button>1</button>
                <button>2</button>
                <button>3</button>
                <button>4</button>
                <button>5</button>
                <button>6</button>
                <button>7</button>
                <button>8</button>
                <button>9</button>
                <button>0</button>
                <button class="delete"></button>
            </div>
        `;
        return el;
    }

    reset() {
        this._pin = '';
        this._setMaskedPin();
        this.$el.classList.remove('unlocking', 'shake-pinpad');
        this._unlocking = false;
    }

    open() {
        this.reset();
        window.addEventListener('keypress', this._handleKeyboardInput);
    }

    close() {
        this.reset();
        window.removeEventListener('keypress', this._handleKeyboardInput);
    }

    get unlocking() {
        return this._unlocking;
    }

    /** @param {KeyboardEvent} e */
    _handleKeyboardInput (e) {
        const inputCharString = e.key;
        const inputNumber = parseInt(inputCharString);
        if (isNaN(inputNumber)){
            e.preventDefault(); //stop character from entering input
        } else {
            this._onKeyPressed(inputNumber);
        }
    }

    /** @param {MouseEvent} e */
    _onClick(e) {
        const target = /** @type {Element} */ (e.target);
        if (target.nodeName.toLowerCase() !== 'button' || target === this.$deleteButton) return;
        const key = parseInt(target.textContent || '');
        this._onKeyPressed(key);
    }

    /** @param {number} key */
    _onKeyPressed(key) {
        if (this._unlocking) return;
        this._pin += key;
        this._setMaskedPin();
        if (this._pin.length === 6) {
            this._submit();
        }
    }

    _submit() {
        this._unlocking = true;
        this.$el.classList.add('unlocking');
        this.fire('pin-entered', this._pin);
    }

    onPinIncorrect() {
        this.$el.classList.remove('unlocking');
        this.$el.classList.add('shake-pinpad');
        this._attempts++;
        if (this._attempts === 3) {
            this._waitingTime *= this._waitingTime;
            this._attempts = 0;
        }
        setTimeout(() => this.reset(), this._waitingTime);
    }

    _onDelete() {
        if (this._unlocking) return;
        this._pin = this._pin.substr(0, this._pin.length - 1);
        this._setMaskedPin();
    }

    _setMaskedPin() {
        const length = this._pin.length;
        /**
         * @param {Element} el
         * @param {number} i
         */
        const fillDot = (el, i) => {
            if (i < length) {
                el.classList.add('on');
            } else {
                el.classList.remove('on');
            }
        };
        this.$dots.forEach(fillDot);
    }
}
