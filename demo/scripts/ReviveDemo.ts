import { MuWidget } from "../../src/MuWidget";

export class ReviveDemo extends MuWidget {
	protected counter: number = 0;

	bInject_click() {
		const el = document.createElement('div');
		el.setAttribute('mu-widget', 'ReviveItem');
		el.setAttribute('mu-params', JSON.stringify({ label: `Item ${++this.counter}` }));
		this.ui.list.appendChild(el);
		MuWidget.revive(this.ui.list);
	}
}

export class ReviveItem extends MuWidget {
	label: string = '';

	afterIndex() {
		this.container.innerHTML =
			`<strong>${this.label}</strong> – initialized at ${new Date().toLocaleTimeString()}`;
	}
}