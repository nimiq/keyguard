/* global ChooseIdenticon */
/* global PinInput */
/* global Key */
/* global KeyStore */
class CreateLow {
    /**
     * @param {CreateRequest} request
     * @param {Function} resolve
     * @param {Function} reject
     */
    constructor(request, resolve, reject) {
        this._resolve = resolve;
        this._reject = reject;

        // set html elements
        /** @type {HTMLDivElement} */
        this.$chooseIdenticon = (document.getElementById(CreateLow.Pages.CHOOSE_IDENTICON));

        /** @type {HTMLDivElement} */
        this.$setPin = (document.getElementById(CreateLow.Pages.SET_PIN));

        /** @type {HTMLDivElement} */
        const $pinInput = (this.$setPin.querySelector('.pinpad'));

        /** @type {HTMLDivElement} */
        const $confirmMessage = /** @type {HTMLDivElement} */ (this.$setPin.querySelector('.confirm-message'));

        /** @type {HTMLDivElement} */
        const $notMatchingMessage = /** @type {HTMLDivElement} */ (this.$setPin.querySelector('.not-matching-message'));

        // create components
        this._chooseIdenticon = new ChooseIdenticon(this.$chooseIdenticon);
        this._pinInput = new PinInput($pinInput);

        // wire up logic
        this._chooseIdenticon.on(
            ChooseIdenticon.Events.CHOOSE_IDENTICON,
            /** @param {Nimiq.KeyPair} keyPair */
            keyPair => {
                this._selectedKeyPair = keyPair;
                window.location.hash = CreateLow.Pages.SET_PIN;
                this._pinInput.open();
            },
        );

        this._pinInput.on(
            PinInput.Events.PIN_ENTERED,
            /** @param {number} pin */ async pin => {
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
                    const key = new Key(this._selectedKeyPair, request.type);
                    this._resolve(await KeyStore.instance.put(key, pin.toString()));
                }
            },
        );
    }

    run() {
        // go to start page
        window.location.hash = CreateLow.Pages.CHOOSE_IDENTICON;

        this._chooseIdenticon.generateIdenticons();
    }
}

CreateLow.Pages = {
    CHOOSE_IDENTICON: 'choose-identicon',
    SET_PIN: 'set-pin',
};
