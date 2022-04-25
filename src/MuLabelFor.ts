import { AnyElement, MuWidget } from "./MuWidget";
import { MuUIDs } from "./MuUIDs";

export class MuLabelFor {
	alsoUseBind: boolean;
	public beforeIndexElement(ev : { opts : any, element : AnyElement, widget : MuWidget})
	{
		if (ev.opts.for)
		{
			const id : string = ev.opts.for;
			const iddb = getIdDb(ev.widget);
			
			if (id.startsWith("error:")) {
				const ids = id.substr(6).split(",").map(s => s.trim());
				for(const eid of ids) {
					if (ev.widget.ui[eid]) {
						(ev.widget.ui[eid] as any).errorLabel = ev.element;
					} else if (iddb["bind:" + eid]) {
						iddb["bind:" + eid].errorLabel = ev.element;
					} else {
						iddb["error:" + eid] = ev.element;
					}
				}
			} else {
				if (!iddb[id]) iddb[id] = MuUIDs.next("id");
				const did = iddb[id];
				ev.element.setAttribute("for", did);
				if (ev.widget.ui[id]) ev.widget.ui[id].id = did;
				if (iddb["bind:" + id]) iddb["bind:" + id].id = did;
			}
		}
		if (ev.opts.id || (this.alsoUseBind && ev.opts.bind)) {
			const id = ev.opts.id || ev.opts.bind;
			const iddb = getIdDb(ev.widget);
			if ((this.alsoUseBind && ev.opts.bind))
				iddb["bind:" + ev.opts.bind] = ev.element;
			if (iddb[id]) ev.element.id = iddb[id];
			if (iddb["error:" + id]) (ev.element as any).errorLabel = iddb["error:" + id];
		}
		if (ev.opts.name)
		{
			const iddb = getIdDb(ev.widget);
			const k = "name:" + ev.opts.name;
			if (!iddb[k]) iddb[k] = MuUIDs.next("name");
			ev.element.setAttribute("name", iddb[k]);
		}
	}

	public static register(muWidget : typeof MuWidget, alsoUseBind : boolean = false)
	{
		const inst = new MuLabelFor(alsoUseBind)
		muWidget.plugIns.push({
			beforeIndexElement: (ev) => inst.beforeIndexElement(ev)
		});
	}

	/**
	 *
	 */
	constructor(alsoUseBind : boolean = false) {
		this.alsoUseBind = alsoUseBind;
	}
}

function getIdDb(widget : /*IMuWidget*/any) {
	if (!widget.muPluginMuLabelFor)
		widget.muPluginMuLabelFor = {}
	return widget.muPluginMuLabelFor;
}