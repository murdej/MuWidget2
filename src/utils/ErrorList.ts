import {ErrorListMessage} from "./ErrorMarker";
import {it} from "node:test";

export class ErrorList extends Array<ErrorListMessage> {
    public add(field: string, message: string): ErrorListMessage
    {
        const item = { field, message };
        this.push(item);

        return item;
    }

    public isValid(field: string|null = null): boolean {
        if (field == null) return this.length === 0;
        for(const item of this) {
            if (item.field === field) return false;
        }
        return true;
    }

    public merge(other: ErrorListMessage[]|ErrorList): ErrorList {
        for (const item of other)
            this.push(item);
        return this;
    }
}