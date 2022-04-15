import {MuWidget} from "./MuWidget";

export class UiSelector extends MuWidget
{
	public items: Record<SelectorValue, SelectorItem> = {};

	public cssClassActive: string = "active";

	public containerTag: string = "span";

	public bindItemValues: ((item : SelectorItem, container : HTMLElement) => void)|null = null;

	public containerCssClass: string = "";

	public textField: string = "text";

	public valueField: string = "value";

	public onchange: ((ev : SelectorChangeEvent) => void)|null = null;

	private value: SelectorValue|null = null;

	public  getActive() : SelectorValue|null
	{
		return this.value;
	}

	public setActive(value : SelectorValue)
	{
		this.value = value;
		for(const el of this.container.children)
		{
			if ((el as any).value == value)
				el.classList.add(this.cssClassActive);
			else
				el.classList.remove(this.cssClassActive);
		}
	}

	public bindValues(items : SelectorItem[])
	{
		this.container.innerHTML = "";
		for(let item of items)
		{
			this.addItem(item);
			this.items[item[this.valueField]] = item;
		}
	}

	public addItem(item: SelectorItem, before: SelectorValue|"first"|null = null)
	{
		const el = document.createElement(this.containerTag);
		const v = item[this.valueField];
		if (this.containerCssClass) el.className = this.containerCssClass;
		(el as any).value = v;
		item.element = el;
		el.addEventListener("click", (ev) => {
			this.setActive(v);
			const sev = {
				originalEvent: ev,
				item: item,
				value: v,
				sender: this
			}	;
			if (this.onchange) this.onchange(sev);
			this.muDispatchEvent("change", sev);
		});
		// el.innerText = item.text;
		const itemBinder = this.bindItemValues || ((item : SelectorItem, container : HTMLElement) => container.innerText = item[this.textField]);
		itemBinder(item, el);
		if (before === null)
		{
			this.container.appendChild(el);
		}
		else
		{
			let bel;
			if (before === "first") bel = this.container.firstChild;
			else bel = this.items[before as SelectorValue];
			this.container.insertBefore(el, bel);
		}
	}
	afterIndex() {
		this.muRegisterEvent("change");
	}
}

export type SelectorValue = number|string;

export type SelectorItem = {
	value : SelectorValue,
	element : HTMLElement
} | any;

export type SelectorChangeEvent = {
	originalEvent : Event,
	sender : UiSelector,
	item : SelectorItem,
	value : SelectorValue,
}

/*
export type SelectorBindOpts = {
	containerTag? : string,
	containerCssClass? : string,
	bindValues? : (item : SelectorItem, container : HTMLElement) => void,
	textField?: string,
	valueField?: string
} */