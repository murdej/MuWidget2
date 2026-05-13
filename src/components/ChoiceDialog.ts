import {Dialog} from "./Dialog";
import {makeHtmlElement} from "../utils/utils";
import {VisualParam, VisualParamDef} from "./VisualParam";
import {addCssClass} from "mu-js-utils/lib/cssClass";
import {title} from "process";

export class ChoiceDialog<T=any> extends Dialog {
    options: ChoiceDialogOption<T>[];
    title: string;
    message: string;
    promise = new Promise<T>(resolve => this.promiseResolve = resolve);
    customVisual: VisualParamDef<ChoiceDialogVisualParamName> = {};

    private visualParams: VisualParamDef<ChoiceDialogVisualParamName> = {};
    public visual = new VisualParam<ChoiceDialogVisualParamName>(this.visualParams);
    private promiseResolve: (value: (PromiseLike<unknown> | unknown)) => void;

    beforeIndex() {
        this.visual.addParamDef(ChoiceDialog.visualDefaults);
        this.visual.addParamDef(this.customVisual);
        const vis = this.visual.getAll();
        this.muAppendContent(
            makeHtmlElement(
                vis.titleTag,
                // @ts-ignore
                { 'mu': 'title', 'class': vis.titleClass },
            ),
            makeHtmlElement(
                vis.messageTag,
                // @ts-ignore
                { 'mu': 'message', 'class': vis.messageClass },
            ),
            makeHtmlElement(
                vis.buttonContainerTag,
                // @ts-ignore
                { 'mu': 'buttons', 'class': vis.buttonContainerClass },
                makeHtmlElement(
                    vis.buttonTag,
                    // @ts-ignore
                    { 'mu': ':.@button', 'class': vis.buttonClass },
                )
            ),
        );
    }

    afterIndex() {
        this.ui.title.innerText = this.title ?? '';
        this.ui.message.innerText = this.message ?? '';
        this.bindButtons(this.options);
    }

    public static visualDefaults: VisualParamDef<ChoiceDialogVisualParamName> = {
        containerClass: null,
        buttonTag: 'button',
        titleTag: 'h3',
        messageTag: 'p',
        buttonContainerTag: 'div',
    };

    public bindButtons(options: ChoiceDialogOption<T>[]) {
        this.ui.buttons.innerHTML = '';
        for (const option of options) {
            const widget = this.muWidgetFromTemplate(
                'button',
                'buttons',
                {
                    container_click: () => this.selectOption(option.value)
                },
            );
            addCssClass(widget.container as HTMLElement, option.cssClass);
            widget.container.textContent = option.title;
        }
    }

    private selectOption(value: any) {
        this.promiseResolve(value);
        this.muRemoveSelf();
    }

    static openChoice<T=any>(
        options: ChoiceDialogOption<T>[],
        title: string,
        message: string,
        customVisual: VisualParamDef<ChoiceDialogVisualParamName> = {},
    ): ChoiceDialog<T>
    {
        const widget = Dialog.open<ChoiceDialog>(
            'ChoiceDialog',
            {
                title,
                message,
                options,
                customVisual,
            }
        );

        return widget;
    }

    static openChoicePromise<T=any>(
        options: ChoiceDialogOption<T>[],
        title: string,
        message: string,
        customVisual: VisualParamDef<ChoiceDialogVisualParamName> = {},
    ): Promise<T>
    {
        return this.openChoice<T>(options, title, message, customVisual).promise;
    }
}

export type ChoiceDialogOption<T> = {
    title: string;
    value: T;
    cssClass: string|string[];
};

export type ChoiceDialogVisualParamName = "containerClass" | "titleClass" | "titleTag" | "messageClass" | "messageTag" | "buttonContainerClass" | "buttonContainerTag" | "buttonTag" | "buttonClass";