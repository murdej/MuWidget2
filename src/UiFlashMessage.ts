import { MuWidget } from "./MuWidget";

export class UiFlashMessageContainer extends MuWidget
{
	static instance: UiFlashMessageContainer;
	public afterIndex()
	{
		this.updateVisibility();
		UiFlashMessageContainer.instance = this;
	}

	public updateVisibility() 
	{
		this.container.style.display = this.ui.items.firstElementChild
			? null
			: "none";
	}

	public add(text : string, template : string = "message") : UiFlashMessage
	{
		var item = this.muWidgetFromTemplate(template, "items", { text: text }) as UiFlashMessage;
		this.updateVisibility();
		return item;
	}
}

export class UiFlashMessage extends MuWidget
{
	public text : string;

	public afterIndex()
	{
		if (this.text) this.ui.text.innerText = this.text;
	}

	public remove() : void
	{
		this.muRemoveSelf();
		(this.muParent as UiFlashMessageContainer).updateVisibility();
	}

	public bClose_click() : void
	{
		this.remove();
	}

	public static add() {

	}
}
