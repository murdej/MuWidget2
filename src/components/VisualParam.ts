export class VisualParam<T extends string> {

    protected paramDefs: VisualParamDef<T>[];

    constructor(...paramDefs: VisualParamDef<T>[]) {
        this.paramDefs = paramDefs;
    }

    public addParamDef(paramDef: VisualParamDef<T>)
    {
        this.paramDefs.push(paramDef);
    }

    public get(key: T): VisualParamValue {
        for(const paramDef of this.paramDefs) {
            if (typeof paramDef[key] !== 'undefined') return paramDef[key];
        }
        return null;
    }

    public getAll(): VisualParamDefAll<T> {
        // @ts-ignore
        return this.paramDefs.reduce((a,b) =>
            ({...a, ...b})
        );
    }
}

export type VisualParamValue = string | null | string[];

// export type VisualParamDef<T extends string> = Partial<Record<T,VisualParamValue>>;
export type VisualParamDefAll<T extends string> = Partial<{
    [K in T]: StringsOrTag<K>;
}>;

export type VisualParamDef<T extends string> = Partial<VisualParamDefAll<T>>;

type StringsOrTag<K extends string> = K extends `${infer Prefix}Tag` ? keyof HTMLElementTagNameMap : string | string[];

