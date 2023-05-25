import { MuEvent, MuWidget } from "../../src/MuWidget";

export class WEMain extends MuWidget {

	red_plus() {
		this.addMessage("red_plus");
	}
	
	red_minus() {
		this.addMessage("red_minus");
	}
	
	green_plus() {
		this.addMessage("green_plus");
	}
	
	green_minus() {
		this.addMessage("gree_minus");
	}
	
	blue_plus() {
		this.addMessage("blue_plus");
	}
	
	blue_minus() {
		this.addMessage("blue_minus");
	}

	addMessage(message: string) {
		this.ui.log.innerText += message + "\n";
	}

}
export class WEPlusMinus extends MuWidget {
	public beforeIndex(): void {
		this.muRegisterEvent("plus", "minus");
		this.muAppendContent(`<span class="btn" mu-id="plus"> + </span><span class="btn" mu-id="minus"> - </span>`)
	}

	plus_click() {
		this.muDispatchEvent('plus');
	}

	minus_click() {
		this.muDispatchEvent('minus');
	}
}