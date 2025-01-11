import { AnyElement, MuWidget } from "./MuWidget";
import { StrParser, StrParserMark } from "mu-js-utils/lib/StrParser";
import {JSONS} from "./utils/JSONS";

export class MuBinder {
	public static parse(src: string, element: AnyElement): MuBindOpts[] {
		/*
		source
		source:target
		source::target
		source^target
		sourcer|filter():target
		*/
		let mode: "source" | "target" | "bindFilter" | "fetchFilter" | "complete" | "end" = "source";
		const optsList: MuBindOpts[] = [];
		const sp = new StrParser(src);
		let p: StrParserMark | null;
		let lastP: number = 0;

		function parseFetchBind(chunk: string, opts: MuBindOpts): boolean {
			switch (chunk) {
				case ":":
				case "::":
				case "^":
					opts.forBind = chunk != "^";
					opts.forFetch = chunk != ":";
					return true;
				case ";":
					mode = "complete";
					opts.forBind = true;
					opts.forFetch = false;
					return true;
				default:
					return false;
			}
		}

		function parseFilter(sp: StrParser, bindPart: boolean, opts: MuBindOpts): MuBindFilter | null {
			p = sp.findNext(["::", ":", "|", "^", ";", "("]);
			let filter: MuBindFilter = {
				methodName: sp.substring(lastP, p).trim(),
				args: []
			};
			if (!p) {
				mode = "end";
			} else if (p.chunk === ";") {
				mode = "complete";
				sp.toEndChunk();
			} else {
				sp.toEndChunk();
				lastP = sp.position;
				if (p.chunk === "(") {
					const argStart = sp.pos();
					while (true) {
						p = sp.findNext([")", "\""]);
						if (p === null) throw "missing ')' after argument(s) '" + src + "'";
						if (p.chunk == ")") {
							sp.toEndChunk();
							lastP = sp.position;
							break;
						}
						// skoč na konec stringu
						sp.toEndChunk();
						do {
							p = sp.findNext(["\\\"", "\""]);
							if (p === null) throw "unterminated string '" + src + "'";
							sp.toEndChunk();
						}
						while (p.chunk === "\\\"")
					}
					const sArgs = sp.substring(argStart, p);
					try {
						filter.args = MuBinder.useJsonS
							? JSONS.parse("[" + sArgs + "]")
							: JSON.parse("[" + sArgs + "]");
					} catch (exc) {
						throw "Invalid arguments - " + exc.toString() + " '" + sArgs + "'";
					}
				}
				mode = parseFetchBind(p.chunk, opts) ? "target" : (bindPart ? "bindFilter" : "fetchFilter");
				// sp.toEndChunk();
				lastP = sp.position;
			}
			return filter.methodName ? filter : null;
		}

		//@ts-ignore
		while (!sp.isEnd() && mode != "end") {
			mode = "source";
			const opts: MuBindOpts = {
				element: element,
				source: null,
				target: null,
				bindFilters: [],
				fetchFilters: [],
				forBind: null,
				forFetch: null
			};

			// sp.debugMode = true;
			while (mode != "complete" && mode != "end") {
				switch (mode) {
					case "source":
						p = sp.findNext(["::", ":", "|", ";", "^"]);
						opts.source = sp.substring(lastP, p).trim();
						if (!p) {
							mode = "end";
						} else if (p.chunk == ";") {
							mode = "complete"
						} else {
							mode = parseFetchBind(p.chunk, opts) ? "target" : "bindFilter";
							sp.toEndChunk();
							lastP = sp.position;
						}
						break;
					case "target":
						p = sp.findNext(["|", ";"]);
						opts.target = sp.substring(lastP, p).trim();
						if (!p) {
							mode = "end";
						} else if (p.chunk == ";") {
							mode = "complete"
						} else {
							mode = "fetchFilter";
							sp.toEndChunk();
							lastP = sp.position;
						}
						break;
					case "bindFilter":
						var f = parseFilter(sp, true, opts);
						if (f) opts.bindFilters.push(f);
						break;
					case "fetchFilter":
						f = parseFilter(sp, false, opts);
						if (f) opts.fetchFilters.push(f);
						break;
				}
			}
			optsList.push(opts);
			sp.toEndChunk();
			lastP = sp.position;
		}

		return optsList;
	}

	static setDefaults(mbo: MuBindOpts) {
		const defaults: any = {};
		// mbo.element.hasAttribute("mu-widget")
		if (mbo.element.hasAttribute("mu-widget")) {
			defaults.forBind = true;
			defaults.forFetch = true;
			defaults.target = "@widget";
		}
		else if (mbo.element instanceof HTMLInputElement || mbo.element instanceof HTMLTextAreaElement || mbo.element instanceof HTMLSelectElement) {
			if (mbo.element.type === "file") {
				defaults.forBind = false;
				defaults.forFetch = true;
				defaults.target = "files";
			}
			else {
				defaults.forBind = true;
				defaults.forFetch = true;
				if (mbo.element.type === "checkbox")
					defaults.target = "checked";
				else
					defaults.target = "value";
			}
		}
		else if (mbo.element instanceof HTMLImageElement || mbo.element instanceof HTMLAudioElement || mbo.element instanceof HTMLVideoElement) {
			defaults.forBind = true;
			defaults.forFetch = false;
			defaults.target = "src";
		}
		else {
			defaults.forBind = true;
			defaults.forFetch = false;
			defaults.target = "text";
		}
		for (const k in defaults) {
			if (mbo[k] === null) mbo[k] = defaults[k];
		}
		const targetAlias = {
			text: "innerText",
			html: "innerHTML"
		}
		if (targetAlias[mbo.target]) mbo.target = targetAlias[mbo.target];
	}

	public static beforeIndexElement(ev: { opts: any, element: AnyElement, widget: MuWidget }) {
		if (ev.opts.bind) {
			const bindSrc: string = ev.opts.bind;
			for (var mbo of MuBinder.parse(bindSrc, ev.element)) {
				MuBinder.setDefaults(mbo);
				if (!ev.widget.muBindOpts) ev.widget.muBindOpts = {};
				if (!ev.widget.muBindOpts[mbo.source]) ev.widget.muBindOpts[mbo.source] = [];
				ev.widget.muBindOpts[mbo.source].push(mbo);
			}
		}
	}

	public static useJsonS: boolean = true;

	public static register(muWidget: any) {
		// @ts-ignore
		muWidget.plugIns.push({
			beforeIndexElement: MuBinder.beforeIndexElement
		});
	}

	public static bindData(bindOpts: Record<string, MuBindOpts[]>, srcData: any, widget: MuWidget) {
		//todo: . stack overflow
		if (srcData === null) return;
		let bindedWidget = false;
		let bindedWidgetParam = false;
		for (const k of [ /*'.',*/ ...Object.keys(srcData)]) {
			if (bindOpts[k]) {
				for (const mbo of bindOpts[k]) {
					if (mbo.forBind) {
						let val = MuBinder.UseFilters(
							k === "." ? srcData : srcData[k],
							mbo.bindFilters, widget, { dataset: srcData }
						);
						if (k === '@widget') bindedWidget = true;
						else if (k[0] === '.') bindedWidgetParam = true;
						MuBinder.setValue(val, mbo.target, mbo.element, widget);
					}
				}
			}
		}
	}

	static fetchData(bindOpts: Record<string, MuBindOpts[]>, widget: MuWidget): any {
		let resData = {};
		//todo: . stack overflow
		for (const k of [ /*'.',*/ ...Object.keys(bindOpts)]) {
			if (bindOpts[k]) {
				for (const mbo of bindOpts[k]) {
					if (mbo.forFetch) {
						/* resData[k] = mbo.element[mbo.target];
						let val = MuBinder.UseFilters(srcData[k], mbo.bindFilters, widget);
						; */
	
						const values = MuBinder.UseFilters(MuBinder.GetValue(mbo.target, mbo.element, widget), mbo.fetchFilters, widget, { originalValue: resData[k], dataset: resData });
						if (k === '.') resData = { resData, ...values };
						else resData[k] = values;
					}
				}
			}
		}
		return resData;
	}

	private static UseFilters(val: any, filters: MuBindFilter[], widget: MuWidget, ev: Partial<MuBindFilterEv>): any {
		for (const filter of filters) {
			let obj = null;
			let fn: MuBindFilterCallback;
			if (filter.methodName in widget) obj = widget; // fn = <MuBindFilterCallback>widget[filter.methodName];
			else if (widget.muParent && filter.methodName in widget.muParent) obj = widget.muParent; // fn = <MuBindFilterCallback>widget.muParent[filter.methodName];
			else if (filter.methodName in MuBinder.filters) obj = MuBinder.filters; //fn = MuBinder.filters[filter.methodName];
			else {
				// Parent widgets
				let w = widget.muParent?.muParent;
				while (w) {
					if (filter.methodName in w) {
						obj = w;
						break;
					}
					w = w.muParent;
				}
			}
			if (!obj) throw new Error("Unknown filter '" + filter.methodName + "'. Source widget: '" + (widget as any)?.costructor?.name + "'");
			fn = obj[filter.methodName];
			val = fn.call(obj, val, <MuBindFilterEv>{ ...ev }, ...filter.args);
		}
		return val;
	}

	private static setValue(val: any, target: string, element: AnyElement, widget: MuWidget) {
		if (target === "@widget") {
			(element["widget"] as MuWidget).muBindData(val);
		}
		else if (target === "foreach" || target === "@foreach") {
			element.innerHTML = "";
			for (const k in widget.muTemplateParents) {
				if (element === widget.muTemplateParents[k]) {
					let arr: any[] = [];
					if (!Array.isArray(val)) {
						for (const k in val) {
							arr.push({
								key: k,
								value: val[k]
							});
						}
					} else arr = val;
					for (const data of arr) {
						const widgetParams = {};
						for (const k in data) {
							if (k.startsWith(".")) widgetParams[k.substr(1)] = data[k];
						}
						const itemWidget: MuWidget = widget.muWidgetFromTemplate(k, element, widgetParams);
						itemWidget.muBindData(data);
						if ("AferBind" in itemWidget) { // @ts-ignore
							itemWidget.AferBind();
						}
					}
					break;
				}
			}
		}
		else if (target.startsWith("."))
			this.setDeep(val, element["widget"], target.substr(1));
		else if (target.startsWith("@attr."))
			element.setAttribute(target.substr(6), val);
		else if (target == "@visible")
			element.style.display = val ? "" : "none"
		else if (target == "@options") {
			const addOpt = function (val, text) {
				const opt = document.createElement("option");
				opt.text = text;
				opt.value = val;
				if (element instanceof  HTMLSelectElement)
					(element as any as HTMLSelectElement).add(opt);
				else {
					const optEl = document.createElement('option');
					optEl.value = opt.value;
					optEl.innerText = opt.text;
					element.append(optEl);
				}
			};
			element.innerHTML = "";
			if (Array.isArray(val)) {
				for (const item of val) {
					if (typeof item === "string") addOpt(item, item);
					else addOpt(item.value, item.text);
				}
			}
			else if (typeof val === "object") {
				for (const v in val) {
					addOpt(v, val[v]);
				}
			}
		}
		else
			this.setDeep(val, element, target); // element[target] = val;
	}

	public static setDeep(value: any, object: any, path: string) {
		let obj = object;
		const fields = path.split(".");
		const lastI = fields.length - 1;
		let i = 0;
		for (const f of fields) {
			if (i < lastI) obj = obj[f];
			else obj[f] = value;
			if (!obj) throw "Can not set value to path'" + path + "'";
			i++;
		}
	}

	public static getDeep(object: any, path: string): any {
		let obj = object;
		const fields = path.split(".");
		for (const f of fields) {
			if (!(f in obj)) return undefined;
			obj = obj[f];
		}
		return obj;
	}

	private static GetValue(target: string, element: AnyElement, widget: MuWidget): any {
		switch (target) {
			case "@widget":
				return (element as any).widget == widget 
					? null
					: (element["widget"] as MuWidget).muFetchData();
			case "foreach":
			case "@foreach":
				return widget.muGetChildWidgets<MuWidget>(element).map(itemWidget => itemWidget.muFetchData());
			default:
				if (target.startsWith("."))
					return this.getDeep(element["widget"], target.substr(1));
				else if (target.startsWith("@attr."))
					return element.getAttribute(target.substr(6));
				else if (target == "@visible")
					return element.style.display != "none";
				else
					return this.getDeep(element, target); // element[target] = val;
				break;
			// return element[target];
		}
	}

	public static filters: Record<string, MuBindFilterCallback> = {
		toLower: val => {
			return val?.toString().toLocaleLowerCase();
		},
		toUpper: val => val?.toString().toLocaleUpperCase(),
		short: (val, ev, maxLen: number, sufix = "...") => {
			let str = val.toString();
			if (str.length >= maxLen - sufix.length) str = str.substr(0, maxLen) + sufix;
			return str;
		},
		tern: (val, ev, onTrue, onFalse) => val ? onTrue : onFalse,
		prepend: (val, ev, prefix: string, ifAny: boolean = false) =>
			!ifAny || val ? prefix + val : val,
		append: (val, ev, prefix: string, ifAny: boolean = false) =>
			!ifAny || val ? val + prefix : val,
		map: (val, ev, map) => map[val],
		// toggleClass: (val, ev, trueClass : string, falseClass : string) =>
		getField: (val, ev, field) => (val ?? {})[field],
		ifEmpty: (val, ev, newValue: any) => val || newValue,
		ifNull: (val, ev, newValue: any) => val ?? newValue,
	}
}

export type MuBindFilterCallback = (val: any, ev?: MuBindFilterEv, ...args: any[]) => any;

export type MuBindOpts = {
	forBind: boolean,
	forFetch: boolean,
	source: string,
	target: string | null,
	bindFilters: MuBindFilter[],
	fetchFilters: MuBindFilter[],
	element: AnyElement,
}

export type MuBindFilter = {
	methodName: string,
	args: any[]
}

export type MuBindFilterEv = {
	originalValue: any,
	dataset: Record<string|number, any>,
}
