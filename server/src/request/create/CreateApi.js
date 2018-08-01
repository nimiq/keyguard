/* global PopupApi */
/* global CreateHigh */

class CreateApi extends PopupApi { // eslint-disable-line no-unused-vars
    /**
     * @param {Keyguard.CreateRequest} request
     */
    async onRequest(request) {
        const handler = new CreateHigh(request, this.resolve.bind(this), this.reject.bind(this));
        handler.run();
    }
}
