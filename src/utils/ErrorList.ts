import {ErrorListMessage} from "./ErrorMarker";

/**
 * Represents a list of error messages, each associated with a specific field.
 *
 * Inherits from the Array class, providing array-like functionality.
 */
export class ErrorList extends Array<ErrorListMessage> {
    /**
     * Adds a new error message to the list.
     *
     * @param {string} field The field associated with the error.
     * @param {string} message The error message.
     * @returns {ErrorListMessage} The added error message object.
     */
    public add(field: string, message: string): ErrorListMessage
    {
        const item = { field, message };
        this.push(item);

        return item;
    }

    /**
     * Checks if the list contains any error messages for the specified field.
     *
     * @param {string|null} field The field to check. If null, checks if entire list.
     * @returns {boolean} True if the list is valid for the given field, false otherwise.
     */
    public isValid(field: string|null = null): boolean {
        if (field == null) return this.length === 0;
        for(const item of this) {
            if (item.field === field) return false;
        }
        return true;
    }

    /**
     * Merges another error list into this one.
     *
     * @param {ErrorListMessage[]|ErrorList} other The error list to merge.
     * @returns {ErrorList} The merged error list.
     */
    public merge(other: ErrorListMessage[]|ErrorList): ErrorList {
        for (const item of other)
            this.push(item);
        return this;
    }
}