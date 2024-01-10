import { MuWidget } from "../../src/MuWidget";

export class MuBindSelf extends MuWidget {
	public beforeIndex(): void {
		this.muAppendContent(/*html*/`widget: <strong mu-bind="val"></strong> <div mu-widget="." mu-bind=".">subwidget: <em mu-bind="val"></em></div>`);
	}

	afterIndex(): void {
		this.muBindData({ val: "Hello :)" });
	}
}