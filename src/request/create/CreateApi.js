class CreateApi extends PopupApi {
    /**
     * @param {CreateRequest} request
     */
    async onRequest(request) {
        request.type === EncryptionType.HIGH
            ? new CreateHigh(request, this.resolve.bind(this), this.reject.bind(this))
            : new CreateLow(request, this.resolve.bind(this), this.reject.bind(this))
    }
}