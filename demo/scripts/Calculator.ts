import { MuEvent, MuWidget } from "../../src/MuWidget";

export class Calculator extends MuWidget {
	pressButton(ev : Event, char : string|null = null) {
		const ch = char || ev.target.innerText;
		this.ui.input.value += ch;
	}

	evaluate() {
		this.ui.result.innerText = math.evaluate(this.ui.input.value);
	}
}