export class Triggers<T = string> {
    public static addHandler(names: string|string[], handler: TriggerCallback) {
        for(const name of (typeof names === "string" ? [ names ] : names)) {
            this.handlers[name] = this.handlers[name] ?? [];
            this.handlers[name].push({
                callback: handler
            })
        }
    }

    public static dispatch(name: string, ...args: any[]) {
        if (this.useLog) console.log(['Dispatching "' + name + '"', args]);
        for(const handler of this.handlers[name] ?? []) {
            if (this.useLog) console.log([' - Handler', handler]);
            const ev: TriggerEvent = {
                name
            };
            handler.callback(ev, ...args);
        }
    }

    public static async dispatchAsync(name: string, ...args: any[]) {
        this.dispatch(name, ...args);
    }

    protected static handlers: Record<string, Trigger[]> = {};

    public static useLog = false;
}

export type TriggerCallback = (ev: TriggerEvent, ...args: any[]) => any;

export type TriggerEvent = {
    name: string,
};

export type Trigger = {
    callback: TriggerCallback,
}