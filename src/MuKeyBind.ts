import { AnyElement, MuIndexEvent, MuWidget } from "./MuWidget";

export class MuKeyBind 
{
	public static register(muWidget : typeof MuWidget, alsoUseBind : boolean = false)
	{
		const inst = new MuKeyBind()
		muWidget.plugIns.push({
			afterIndexElement: (ev) => inst.afterIndexElement(ev)
		});
	}

	afterIndexElement(ev: MuIndexEvent): void {
		if (ev.opts.keybind) {
			const defs = this.parseDefs(ev.opts.keybind);
			if (defs.length) {
				ev.element.addEventListener("keyup", (kev: KeyboardEvent) => {
					for(const def of defs) {
						if (
							kev.ctrlKey == !!def.modificators.includes('ctrl')
							&& kev.altKey == !!def.modificators.includes('alt')
							&& kev.metaKey == !!def.modificators.includes('meta')
							&& kev.shiftKey == !!def.modificators.includes('shift')
							&& kev.key.toLowerCase() == def.key.toLowerCase()
						) {
							kev.preventDefault();
							kev.stopPropagation();
							ev.widget.ui[def.controlId].click();
						}
					}
				});
			}
		}
	}

	parseDefs(defs: string): MuKeyBindDef[] {
		const res = [];
		for(const def of defs.split(';')) {
			const m = / *^((ctrl\+|alt\+|shift\+|meta\+)*)([^:+]+|\+|\:):(.+)? *$/.exec(def);
			if (!m) {
				console.error("Invalid keybind '" + def + "'");
				continue;
			}
			// console.log(m);
			res.push({
				modificators: (m[1] || "").split("+").filter(k => !!k),
				key: m[3],
				controlId: m[4]
			});
		}

		return res;
	}
}

export type MuKeyBindDef = {
	modificators: string[],
	key: string,
	controlId: string,
	control: AnyElement,
}