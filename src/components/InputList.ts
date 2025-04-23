import {MuWidget} from "../MuWidget";
import {VisualParam, VisualParamDef} from "./VisualParam";
import {MuUIDs} from "../MuUIDs";
import {addCssClass} from "mu-js-utils/lib/cssClass";

abstract class InputList<TV> extends MuWidget {
    public currentItems: ListItem[] = [];

    public controls: Record<string, HTMLInputElement&{item:ListItem}> = {};

    private visualParams: VisualParamDef<InputListVisualParamName> = {};

    public visual = new VisualParam<InputListVisualParamName>(this.visualParams);

    public setOptions(options: ListItem[]): void
    {
        this.items = options;
    }

    public set items(newItems: ListItem[])
    {
        const oldValue = this.getValue();
        this.currentItems = newItems;
        this.renderItems();
        this.setValue(oldValue);
    }

    public get items(): ListItem[]
    {
        return this.currentItems;
    }

    public get value(): TV {
        return this.getValue();
    }

    public set value(newValue: TV) {
        this.setValue(newValue);
    }

    muBindData(srcData: any) {
        this.setValue(srcData);
    }

    muFetchData(): any {
        return this.getValue();
    }

    renderItems() {
        this.container.innerHTML = '';
        this.controls = {};
        const vis = this.visual.getAll();

        for (const item of this.currentItems) {
            const controlId = vis.labelTag
                ? MuUIDs.next('id')
                : null;
            // @ts-ignore
            let itemContainer: HTMLElement = this.container;
            if (vis.itemTag) {
                itemContainer = document.createElement(vis.itemTag);
                addCssClass(itemContainer, vis.itemClass);
                this.container.appendChild(itemContainer);
            }
            // @ts-ignore
            const control: HTMLInputElement&{item:ListItem} = document.createElement(vis.controlTag) as HTMLInputElement;
            control.type = vis.controlType as string;
            control.value = item.value;
            control.addEventListener('change', (ev) => this.muDispatchEvent('change'));
            control.item = item;
            addCssClass(control, vis.controlClass)
            if (controlId) control.id = controlId;
            if (vis.controlName) control.name = vis.controlName === '#uniqueByWidget'
                ? this.getWidgetUniqueName()
                : vis.controlName as string;
            itemContainer.append(control);
            this.controls[item.value] = control;

            if (vis.labelTag) {
                const label = document.createElement(vis.labelTag);
                addCssClass(label, vis.labelClass);
                label.setAttribute('for', controlId);
                label.textContent = item.text;
                itemContainer.append(label);
            } else {
                itemContainer.append(item.text);
            }
            this.container.append(' ');
        }
    }

    abstract setValue(value: TV): void;

    abstract getValue(): TV;

    beforeIndex() {
        this.muRegisterEvent('change');
    }

    private widgetUniqueName: string|null = null;
    private getWidgetUniqueName() {
        if (!this.widgetUniqueName) this.widgetUniqueName = MuUIDs.next('name');
        return this.widgetUniqueName;
    }
}

export class RadioList extends InputList<string|null> {
    setValue(value: string|null): void {
        if (this.controls[value]) this.controls[value].checked = true;
    }
    getValue(): string|null {
        for (const k in this.controls) {
            if (this.controls[k].checked) return k;
        }
        return null;
    }
    beforeIndex() {
        super.beforeIndex();
        this.visual.addParamDef(RadioList.visualDefaults);
    }

    public static visualDefaults: VisualParamDef<InputListVisualParamName> = {
        containerClass: null,
        controlClass: null,
        controlTag: 'input',
        controlType: 'radio',
        itemClass: null,
        itemTag: 'label',
        labelClass: null,
        labelTag: null,
        controlName: '#uniqueByWidget',
    };
}

export class CheckboxList extends InputList<string[]> {
    setValue(value: string[]): void {
        value = value.map(v => v.toString());
        for (const control of Object.values(this.controls))
            control.checked = value.includes(control.value);
    }
    getValue(): string[] {
        const controls = Object.values(this.controls);
        return controls.filter(ctl => ctl.checked).map(ctl => ctl.value)
    }
    beforeIndex() {
        super.beforeIndex();
        // @ts-ignore
        this.visual.addParamDef(CheckboxList.visualDefaults);
    }

    public static visualDefaults = {
        containerClass: null,
        controlClass: null,
        controlTag: 'input',
        controlType: 'checkbox',
        itemClass: null,
        itemTag: 'label',
        labelClass: null,
        labelTag: null,
    };
}

export type ListItem = {
    text: string;
    value: string;
    metadata?: any;
}

export type InputListVisualParamName = 'containerClass'|'itemClass'|'itemTag'|'labelTag'|'labelClass'|'controlClass'|'controlTag'|'controlType'|'controlName';

