class CreateLow {
    /**
     * @param {CreateRequest} request
     * @param {Function} resolve
     * @param {Function} reject
     */
    constructor(request, resolve, reject) {
        this._resolve = resolve;
        this._reject = reject;
        this.$chooseIdenticon = /** @type {HTMLElement} */ (document.getElementById(CreateLow.Pages.CHOOSE_IDENTICON));
        this.$setPin = /** @type {HTMLElement} */ (document.getElementById(CreateLow.Pages.SET_PIN));

        this._chooseIdenticon = new ChooseIdenticon(request.type, this.$chooseIdenticon);

        const $pinInput = /** @type {HTMLDivElement} */ (this.$setPin.querySelector('.pinpad'));

        this._pinInput = new PinInput($pinInput);

        this._chooseIdenticon.on(
            ChooseIdenticon.EVENTS.CHOOSE_IDENTICON,
            /** @param {Key} key */
            key => {
                this._selectedKey = key;
                window.location.hash = CreateLow.Pages.SET_PIN;
                this._pinInput.open();
            },
        );

        const $confirmMessage = /** @type {HTMLDivElement} */ (this.$setPin.querySelector('.confirm-message'));
        const $notMatchingMessage = /** @type {HTMLDivElement} */ (this.$setPin.querySelector('.not-matching-message'));

        this._pinInput.on(PinInput.Events.PIN_ENTERED, /** @param {number} pin */ async pin => {
            $confirmMessage.classList.add('hidden');
            $notMatchingMessage.classList.add('hidden');

            if (!this._pin) {
                this._pin = pin;
                this._pinInput.reset();
                $confirmMessage.classList.remove('hidden');
            } else if (this._pin !== pin) {
                this._pinInput.onPinIncorrect();
                this._pin = null;
                $notMatchingMessage.classList.remove('hidden');
            } else {
                document.body.classList.add('loading');
                this._resolve(await KeyStore.instance.put(this._selectedKey, pin.toString()));
            }
        });

        window.location.hash = CreateLow.Pages.CHOOSE_IDENTICON;

        this._chooseIdenticon.generateIdenticons();
    }
}

CreateLow.Pages = {
    CHOOSE_IDENTICON: 'choose-identicon',
    SET_PIN: 'set-pin',
};
