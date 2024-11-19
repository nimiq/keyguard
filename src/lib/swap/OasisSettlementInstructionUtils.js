/* global Nimiq */

class OasisSettlementInstructionUtils { // eslint-disable-line no-unused-vars
    /**
     * @param {Key} key
     * @param {string} path
     * @param {KeyguardRequest.SettlementInstruction} instruction
     * @returns {string}
     */
    static signSettlementInstruction(key, path, instruction) {
        const header = {
            alg: 'EdDSA',
        };

        // https://tools.ietf.org/html/rfc7515#section-5.1
        // ASCII(BASE64URL(UTF8(JWS Protected Header)) || '.' || BASE64URL(JWS Payload))
        const body = [
            this._textToBase64Url(JSON.stringify(header)),
            this._textToBase64Url(JSON.stringify(instruction)),
        ].join('.');

        const signature = key.sign(path, Nimiq.BufferUtils.fromUtf8(body));
        const base64UrlSignature = Nimiq.BufferUtils.toBase64Url(signature.serialize())
            .replace(/\.*$/, ''); // Remove trailing periods

        return `${body}.${base64UrlSignature}`;
    }

    /**
     * @param {string} data
     * @returns {string}
     * @private
     */
    static _textToBase64Url(data) {
        return btoa(data).replace(/\//g, '_').replace(/\+/g, '-').replace(/=/g, '');
    }
}
