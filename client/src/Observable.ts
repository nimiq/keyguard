/**
 * TypeScript port of @nimiq/core/src/main/generic/utils/Observable.js
 */
export default class Observable {
    public static get WILDCARD(): string {
        return '*';
    }

    protected _listeners: Map<string, Array<(...args: any) => any>>;

    constructor() {
        this._listeners = new Map();
    }

    public on<T>(type: string, callback: (arg: T) => any): number {
        if (!this._listeners.has(type)) {
            this._listeners.set(type, [callback]);
            return 0;
        } else {
            return this._listeners.get(type)!.push(callback) - 1;
        }
    }

    public off(type: string, id: number) {
        if (!this._listeners.has(type) || !this._listeners.get(type)![id]) return;
        delete this._listeners.get(type)![id];
    }

    public fire(type: string, ...args: any[]): Promise<any[]> | null {
        const promises = [];
        // Notify listeners for this event type.
        if (this._listeners.has(type)) {
            const listeners = this._listeners.get(type)!;
            for (const key in listeners) {
                // Skip non-numeric properties.
                // @ts-ignore (Argument of type 'string' is not assignable to parameter of type 'number'.)
                if (isNaN(key)) continue;

                const listener = listeners[key];
                const res = listener.apply(null, args);
                if (res instanceof Promise) promises.push(res);
            }
        }

        // Notify wildcard listeners. Pass event type as first argument
        if (this._listeners.has(Observable.WILDCARD)) {
            const listeners = this._listeners.get(Observable.WILDCARD)!;
            for (const key in listeners) {
                // Skip non-numeric properties.
                // @ts-ignore (Argument of type 'string' is not assignable to parameter of type 'number'.)
                if (isNaN(key)) continue;

                const listener = listeners[key];
                const res = listener.apply(null, arguments);
                if (res instanceof Promise) promises.push(res);
            }
        }

        if (promises.length > 0) return Promise.all(promises);
        return null;
    }

    public bubble(observable: Observable, ...types: string[]) {
        for (const type of types) {
            let callback;
            if (type === Observable.WILDCARD) {
                callback = function(this: Observable) {
                    this.fire.apply(this, arguments);
                };
            } else {
                callback = function(this: Observable) {
                    this.fire.apply(this, [type, ...arguments]);
                };
            }
            observable.on(type, callback.bind(this));
        }
    }

    protected _offAll() {
        this._listeners.clear();
    }
}
