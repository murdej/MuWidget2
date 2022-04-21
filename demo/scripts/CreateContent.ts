import { MuWidget } from "../../src/MuWidget";

export class CreateContent extends MuWidget {
	protected n : number = 1;
	addItem(pos, ref = null) {
		this.muWidgetFromTemplate(
			"item",
			"list",
			{ label: this.n++ },
			pos,
			ref
		);
	}
	bAddFirst_click() {
		this.addItem("first");
	}
	bAddLast_click() {
		this.addItem("last");
	}
}

export class CreateContentItem extends MuWidget {
	public muParent: CreateContent;

	bAddBefore_click() {
		this.muParent.addItem("before", this.container);
	}
	bAddAfter_click() {
		this.muParent.addItem("aften", this.container);
	}
	bRemove_click() {
		this.muRemoveSelf();
	}
}