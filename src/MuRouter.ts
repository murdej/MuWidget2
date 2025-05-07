export class MuRouter
{
	protected routes : Record<string, Route> = {};

	public persistentKeys : string[] = [];

	public persistentValues : MuParameters = {};

	public pathPrefix : string = "";

	public addRoute(name : string, re : string, callback : RouteCallback) : MuRouter
	{
		const route = {
			callback: callback,
			name: name,
			reText: re,
		} as Route;
		MuRouter.compileRe(route);
		this.routes[name] = route;
		return this;
	}

	private static compileRe(route : Route)
	{
		const defaultReChunk = "[^/?#]*";
		let p = 0;
		let lastP = 0;
		let re = "";
		let s;
		const rete = route.reText;
		route.chunks = [];
		route.paramNames = [];
		while(true)
		{
			p = rete.indexOf("<", lastP);
			if (p < 0) {
				s = rete.substr(lastP);
				if (s)
				{
					route.chunks.push(s);
					re += s;
				}
				break;
			}
			else
			{
				s = rete.substring(lastP, p);
				if (s)
				{
					route.chunks.push(s);
					re += s;
				}
			}
			lastP = p + 1;
			p = rete.indexOf(">", lastP);
			if (p < 0) {
				throw new Error("Missing ending '>'");
			}
			let chunk = rete.substring(lastP, p);
			const p1 = chunk.indexOf(" ");
			const p2 = chunk.indexOf("=");
			let reChunk = defaultReChunk;
			let name;
			let defaultValue = undefined;
			let prefix = '';
			if (p1 < 0 && p2 < 0) {
				name = chunk;
			} else if (p1 >= 0 && p2 >= 0 && p1 > p2) {
				// name=foo bar
				// p1=8 p2=4
				name = chunk.substring(0, p2);
				defaultValue = chunk.substring(p2 + 1);
			} else if (p1 >= 0 && p2 >= 0 && p1 < p2) {
				// name re=foo bar
				// p1=4 p2=8
				name = chunk.substring(0, p1);
				reChunk = chunk.substring(p1 + 1, p2);
				defaultValue = chunk.substring(p2 + 1);
			} else if (p1 >= 0) {
				// name re
				reChunk = chunk.substring(p1 + 1);
				name = chunk.substring(0, p1);
			} else {
				// name=foo
				name = chunk.substring(0, p2);
				defaultValue = chunk.substring(p2 + 1);
			}

			const pp = name.indexOf('+');
			if (pp >= 0) {
				prefix = name.substring(0, pp);
				name = name.substring(pp + 1);
			}

			route.chunks.push({name, prefix, defaultValue});
			re += "(" + prefix + reChunk + ")" + (defaultValue !== undefined ? '?' : '');
			route.paramNames.push(name);

			lastP = p + 1;
		}
		/* const re = route.reText.replace(/<[^>]+>/, (chunk) => {
			const p = chunk.indexOf(" ");
			let reChunk;
			let name;
			if (p >= 0)
			{
				reChunk = chunk.substr(p + 1);
				name = chunk.substr(0, p);
			}
			else
			{
				reChunk = defaultReChunk;
				name = chunk;
			}
			route.chunkNames.push(name);
			return reChunk;
		}); */
		route.re = new RegExp(re);
	}

	public lastParameters : MuParameters = {};

	public route(location : Location|{pathname : string, search : string, hash: string}|string = null, origin: MuRouterOrigin = 'route'): Route|null
	{
		//@ts-ignore
		if (!location) location = window.location;
		if (this.pathPrefix)
		{
			if (typeof location != "string")
			{
				location = location.pathname + location.search + location.hash;
			}
			location = location.substr(this.pathPrefix.length);
		}
		if (typeof location === "string")
		{
			let p = location.indexOf("?");
			location = {
				pathname: p >= 0 ? location.substr(0, p) : location,
				search:  p >= 0 ? location.substr(p) : "",
				hash: ""
			}
		}
		for(let routeName in this.routes)
		{
			const route = this.routes[routeName];
			const m = route.re.exec(location.pathname);
			if (!m) continue;
			const res = this.parseQueryString(location.search);
			const dynamicChunks = route.chunks.filter(ch => typeof ch !== 'string');
			for(let i = 0; i < m.length; i++)
			{
				if (i > 0) {
					//@ts-ignore
					const chunk: {prefix: string, defaultValue: undefined|string} = dynamicChunks[i - 1];
					let value = m[i];
					if (m[i] === undefined) value = chunk.defaultValue;
					else {
						value = decodeURIComponent(value);
						if (chunk.prefix) {
							value = value.substring(chunk.prefix.length);
						}
					}
					res[route.paramNames[i - 1]] = value;
				}
			}
			this.updatePersistent(res);
			this.lastName = route.name;
			this.lastParameters = res;
			route.callback({
				parameters: res,
				routeName,
				origin
			});
			return route;
			// console.log(m);
		}

		return null;
	}

	public makeUrl(name : string, currParams : any) : string
	{
		let url = "";
		let used = [];
		const params = { ...this.persistentValues };
		for(const k in currParams)
			if (currParams[k] !== null) params[k] = currParams[k];

		if (!(name in this.routes)) throw new Error("No route '" + name + "'")
		let route = this.routes[name];
		for(const chunk of route.chunks)
		{
			if (typeof chunk == "string") {
				url += chunk;
			} else {
				const value = params[chunk.name] ?? chunk.defaultValue;
				if (value != chunk.defaultValue) {
					url += chunk.prefix;
					url += chunk.name in params ? encodeURIComponent(value) : "";
				}
				used.push(chunk.name);
			}
		}
		const q = Object.keys(params).filter(k => used.indexOf(k) < 0).sort().map(k => encodeURIComponent(k) + "=" + encodeURIComponent(params[k])).join("&");
		if (q) url += "?" + q;

		return this.pathPrefix + url;
	}

	public lastName = "";
	public getName(name: string|null): string {
		if (name) this.lastName = name;
		return this.lastName;
	}

	/**
	 * @deprecated use pushSet
	 */
	public push(name : string|null, params : MuParameters = {}) {
		this.pushSet(name, params);
	}

	/**
	 * Set parameters and push url into history.
	 * @param name Route name
	 * @param params Updated parameters
	 */
	public pushSet(name : string|null, params : MuParameters = {})
	{
		name = this.getName(name);
		this.updatePersistent(params);
		history.pushState({}, null, this.makeUrl(name, params));
	}

	/**
	 * Updates parameters and push url into history.
	 * @param name Route name
	 * @param params Updated parameters
	 */
	public pushUpdate(name : string|null, params : MuParameters = {})
	{
		name = this.getName(name);
		this.updatePersistent(params, true);
		history.pushState({}, null, this.makeUrl(name, { ...this.lastParameters, ...params }));
	}

	/** @deprecated use replaceSet **/
	public replace(name : string|null, params : MuParameters = {})
	{
		this.replaceSet(name, params);
	}

	/**
	 * Set parameters and replace url in history.
	 * @param name Route name
	 * @param params New parameters
	 */
	public replaceSet(name : string|null, params : MuParameters = {})
	{
		name = this.getName(name);
		this.updatePersistent(params);
		history.replaceState({}, null, this.makeUrl(name, params));
	}

	/**
	 * Update parameters and replace url in history.
	 * @param name Route name
	 * @param params Updated parameters
	 */
	public replaceUpdate(name : string|null, params : MuParameters = {})
	{
		name = this.getName(name);
		this.updatePersistent(params, true);
		history.replaceState({}, null, this.makeUrl(name, { ...this.lastParameters, ...params }));
	}

	/**
	 * @deprecated use replaceUpdate
	 */
	public update(name : string|null, params : MuParameters = {})
	{
		this.replaceUpdate(name, params);
	}


	/**
	 * Set parameters, push url into history and call route action.
	 * @param name Route name
	 * @param params New params
	 * @param origin Origin
	 */
	public navPushSet(name: string|null, params: MuParameters = {}, origin: MuRouterOrigin = 'other') {
		name = this.getName(name);
		this.pushSet(name, params);
		this.routes[name].callback({ parameters: this.lastParameters, routeName: name, origin });
	}

	/**
	 * Updates parameters, push url into history and call route action.
	 * @param name Route name
	 * @param params Changed params
	 * @param origin Origin
	 */
	public navPushUpdate(name: string|null, params: MuParameters = {}, origin: MuRouterOrigin = 'other') {
		name = this.getName(name);
		this.pushUpdate(name, params);
		this.routes[name].callback({ parameters: this.lastParameters, routeName: name, origin });
	}

	/**
	 * Set parameters, replace url in history and call route action.
	 * @param name Route name
	 * @param params New params
	 * @param origin Origin
	 */
	public navReplaceSet(name: string|null, params: MuParameters = {}, origin: MuRouterOrigin = 'other') {
		name = this.getName(name);
		this.replaceSet(name, params);
		this.routes[name].callback({ parameters: this.lastParameters, routeName: name, origin });
	}

	/**
	 * Update parameters, replace url in history and call route action.
	 * @param name Route name
	 * @param params Changed params
	 * @param origin Origin
	 */
	public navReplaceUpdate(name: string|null, params: MuParameters = {}, origin: MuRouterOrigin = 'other') {
		name = this.getName(name);
		this.replaceUpdate(name, params);
		this.routes[name].callback({ parameters: this.lastParameters, routeName: name, origin });
	}

	/**
	 * @deprecated use navPushSet
	 */
	public navigate(name : string|null, params : MuParameters = {}, origin: MuRouterOrigin = 'other')
	{
		name = this.getName(name);
		this.push(name, params);
		this.routes[name].callback({ parameters: params, routeName : name, origin });
	}

	public parseQueryString(queryString : string) : MuParameters
	{
		var res : MuParameters = {};

		if (queryString.startsWith("?")) queryString = queryString.substr(1);
		for(let item of queryString.split("&"))
		{
			if (!item) continue;
			const p = item.indexOf("=");
			let k : string;
			let v : string|true;
			if (p >= 0) {
				k = decodeURIComponent(item.substr(0, p));
				v = decodeURIComponent(item.substr(p + 1));
			}
			else
			{
				k = decodeURIComponent(item);
				v = true;
			}
			res[k] = v;
		}

		return res;
	}

	constructor() {
		if (typeof window !== 'undefined')
			window.addEventListener('popstate', ev => {
				this.route(document.location)
			});
	}

	public updatePersistent(res: MuParameters, patch : boolean = false)
	{
		for(let k of this.persistentKeys)
		{
			if (k in res)
			{
				const v = res[k];
				if (v !== null) this.persistentValues[k] = v;
				else delete this.persistentValues[k];
			}
		}
		if (patch)
		{
			for(let k in res)
			{
				const v = res[k];
				if (v !== null) this.lastParameters[k] = v;
				else delete this.lastParameters[k];
			}
		}
		else this.lastParameters = res;
	}

	public getParameters() : MuParameters
	{
		return this.lastParameters;
	}

	public prepareAnchor(a: HTMLAnchorElement|HTMLElement, name: string, params: MuParameters, cancelBubble = false)
	{
		const fullParams = { ...this.persistentValues, ...params };
		if (a instanceof HTMLAnchorElement)
			a.href = this.makeUrl(name, params);
		a.addEventListener("click", (ev) => {
			ev.preventDefault();
			if (cancelBubble) ev.stopPropagation();
			this.navigate(name, fullParams, 'link');
		});
	}

	public catchAnchor(a: HTMLAnchorElement, cancelBubble = false) {
		a.addEventListener("click", (ev) => {
			if (cancelBubble) ev.stopPropagation();
			if (this.route(a.href, 'link')) ev.preventDefault();
		});
	}
}

type RouteCallback = (context: MuRouterContext) => void;

type Route = {
	paramNames: string[];
	reText : string
	re : RegExp,
	name : string,
	callback : RouteCallback,
	chunks : (string|{name : string, prefix: string, defaultValue: string|undefined})[]
}

export type MuParameters = Record<string,string|true|null>;

export type MuRouterContext = {
	parameters: MuParameters;
	routeName : string;
	origin: MuRouterOrigin;
}

export type MuRouterOrigin = 'link'|'route'|'other'|string;

