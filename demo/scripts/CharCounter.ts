import { MuWidget } from "../../src/MuWidget";

export class CharCounter extends MuWidget
{
	public maxLength : number|null = 50;

	afterIndex() {
		this.ui.input.maxLength = this.maxLength;
		this.updateWidget();
	}

	input_keyup() {
		this.updateWidget();
	}

	private updateWidget() {
		const l = this.ui.input.value.length;
		this.ui.info.innerText = l + (this.maxLength ? " / " + this.maxLength : "");
	}
}