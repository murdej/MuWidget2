import {AnyElement, MuWidget} from "../MuWidget";

export class ErrorMarker
{
    private rootWidget: MuWidget;
    private pathSeparator: string;
    public errorLabel = {
        containerTag: 'div',
        containerClassName: '',
        itemTag: 'div',
        itemClassName: 'form-error'
    };

    constructor(rootWidget: MuWidget<any,any,any>, pathSeparator: string = "/") {
        this.rootWidget = rootWidget;
        this.pathSeparator = pathSeparator;
    }

    private pathControl: Record<string, AnyElement> = {};

    findControl(path: string): AnyElement|null {
        if (!this.pathControl[path])
        {
            const pathParts = path.split(this.pathSeparator);
            let i = 0, c = pathParts.length;
            let src = this.rootWidget;
            let cbd;
            for(const pathPart of pathParts) {
                i++;
                if (!src.muBindOpts[pathPart]) return null;
                const bd = src.muBindOpts[pathPart][0];
                if (!bd) return null;
                if (i === c) cbd = bd;
                else src = bd.element.widget;
            }
            if (cbd) this.pathControl[path] = cbd.element;
        }

        return this.pathControl[path];
    }

    markErrors(messages: ErrorListMessage[]): ErrorListMessage[] {
        const notShowed = [];
        for(const k in this.pathControl)
        {
            const el = (this.pathControl[k] as any).errorLabel;
            if (el) el.innerHTML = "";
            el.style.display = 'none';
        }
        for(const message of messages) {
            const el = this.findControl(message.field);
            if (!el) notShowed.push(message);
            else {
                // console.log(el);
                let errorLabel;
                if (!(el as any).errorLabel) {
                    errorLabel = document.createElement(this.errorLabel.containerTag);
                    errorLabel.className = this.errorLabel.containerClassName;
                    el.parentElement?.appendChild(errorLabel);
                    (el as any).errorLabel = errorLabel;
                } else {
                    errorLabel = (el as any).errorLabel;
                }
                const elMessage = document.createElement(this.errorLabel.itemTag);
                elMessage.innerText = message.message;
                elMessage.className = this.errorLabel.itemClassName;
                errorLabel.appendChild(elMessage);
                errorLabel.style.display = '';
            }
        }

        return notShowed;
    }

    clearErrors() {
        //todo:
        for(const el of Array.from(this.rootWidget.container.querySelectorAll('[class="' + this.errorLabel.itemClassName + '"]'))) {
            // @ts-ignore
            el.parentElement.removeChild(el);
        }
    }
}

export type ErrorListMessage = {
    field: string;
    message: string;
}
