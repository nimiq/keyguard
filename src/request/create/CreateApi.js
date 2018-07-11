/* global CreateHigh, CreateLow */
/* global PopupApi */
/* global EncryptionType */

class CreateApi extends PopupApi { // eslint-disable-line no-unused-vars
    /**
     * @param {CreateRequest} request
     */
    async onRequest(request) {
        const handler = request.type === EncryptionType.HIGH
            ? new CreateHigh(request, this.resolve.bind(this), this.reject.bind(this))
            : new CreateLow(request, this.resolve.bind(this), this.reject.bind(this));

        handler.run();
    }
}
