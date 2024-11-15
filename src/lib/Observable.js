/**
 * Javascript port of @nimiq/core/src/main/generic/utils/Observable.js
 */
class Observable { // eslint-disable-line no-unused-vars
    /**
     * @type {string}
     */
    static get WILDCARD() {
        return '*';
    }

    constructor() {
        /**
         * @type {Map<string, Array<(...args: any) => any>>}
         */
        this._listeners = new Map();
    }

    // eslint-disable-next-line valid-jsdoc
    /**
     * @param {string} type
     * @param {(...arg: any[]) => any} callback
     * @returns {number}
     */
    on(type, callback) {
        if (!this._listeners.has(type)) {
            this._listeners.set(type, [callback]);
            return 0;
        }

        return /** @type {Array<(...args: any) => any>} */ (this._listeners.get(type)).push(callback) - 1;
    }

    /**
     * @param {string} type
     * @param {number} id
     */
    off(type, id) {
        if (!this._listeners.has(type)) return;
        if (!(/** @type {Array<(...args: any) => any>} */ (this._listeners.get(type))[id])) return;
        delete /** @type {Array<(...args: any) => any>} */ (this._listeners.get(type))[id];
    }

    /**
     *
     * @param {string} type
     * @param  {any[]} args
     * @returns {Promise<any[]> | null}
     */
    fire(type, ...args) {
        const promises = [];
        // Notify listeners for this event type.
        if (this._listeners.has(type)) {
            const listeners = /** @type {Array<(...args: any) => any>} */ (this._listeners.get(type));
            for (const listener of listeners) {
                const res = listener(...args);
                if (res instanceof Promise) promises.push(res);
            }
        }

        // Notify wildcard listeners. Pass event type as first argument
        if (this._listeners.has(Observable.WILDCARD)) {
            const listeners = /** @type {Array<(...args: any) => any>} */ (this._listeners.get(Observable.WILDCARD));
            for (const listener of listeners) {
                const res = listener(...args);
                if (res instanceof Promise) promises.push(res);
            }
        }

        if (promises.length > 0) return Promise.all(promises);
        return null;
    }

    _offAll() {
        this._listeners.clear();
    }
}
