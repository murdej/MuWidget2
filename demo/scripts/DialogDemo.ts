import { MuWidget } from "../../src/MuWidget";
import { Dialog } from "../../src/components/Dialog";

export class DialogDemo extends MuWidget {
	public beforeIndex(): void {
		this.muAppendContent(`<span mu="bOpenDialog" class="a">Open modal dialog</span>
			<span mu="#color:style.backgroundColor;text" style="display: inline-block; padding: 2ex; border-radius: 3ex"></span>`);
	}

	async bOpenDialog_click() {
		const res = await Dialog.open('DialogDemoDialog').waitForResponse(null);
		if (res) this.muBindData(res);
	}
}

export class DialogDemoDialog extends Dialog {
	public beforeIndex(): void {
		this.muAppendContent(`
			<h3 class="d-flex m-0">
				<span class="flex-grow-1">Enter text and select color</span>
				<span class="btn-close" mu="btnClose">&times;</span>
			</h3>
			<input type="text" mu-bind="text" /><input type="color" mu-bind="color" />
			<hr>
			<span class="btn" mu="btnOk">Ok</span>
		`);
	}

	btnOk_click() {
		this.resolve(this.muFetchData());
	}

	btnClose_click() {
		this.muRemoveSelf();
	}

}