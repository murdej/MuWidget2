/*	This file is part of MuWidget.

	MuWidget is free software: you can redistribute it and/or modify
	it under the terms of the GNU General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.

	MuWidget is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU General Public License for more details.

	You should have received a copy of the GNU General Public License
	along with MuWidget.  If not, see <https://www.gnu.org/licenses/>. */

import { MuBinder, MuBindOpts } from "./MuBinder";

// export class MuWidget<TP extends MuWidget = MuWidget<any,{},{}>, TU extends Record<string, any&AnyElement> = {}, TW extends Record<string, any&AnyElement> = {}> {
export class MuWidget<TP = MuWidget<any, any, any>, TU extends Record<string, any&AnyElement> = {}, TW extends Record<string, any&AnyElement> = {}> {

	public static fixOldWidgets: boolean|"silent" = false;

	public static sharedTemplates: Record<string, string> = {};

	public ui : MuUi<TU> = {} as unknown as MuUi<TU>; //Record<string, AnyElementA> = {};
	
	public muOpts: MuOpts = {} as MuOpts;
	
	protected muWidgetEventHandlers : Record<string, MuHandler[]> = {};
	
	protected muIndexOpts: MuWidgetOpts|null = null;
	
	public muWidgetFromTemplate(
		templateName : string|{html:string,classType?:any,classInstance?:any}, 
		container : string|AnyElement|null, 
		params : Record<string, any>|((widget : MuWidget)=>Record<string, any>)|null = null, 
		position : "first"|"before"|"after"|"last" = "last",
		ref : AnyElement|null = null) : MuWidget

	{ 
		let finalContainer : AnyElement;
		if (typeof container == 'string')
		{
			var containerName = container;
			finalContainer = this.ui[container];
			if (!finalContainer) throw new Error("Container with mu-id='" + containerName + "' not exists.");
		} else finalContainer = container as AnyElement;
		
		var tmpElemementType = "div";
		let templateContent: string;
		if (typeof templateName === "string") {
			templateContent = this.muFindTemplate(templateName);
			if (!templateContent) throw "No template named '" + templateName + "'.";
		} else {
			templateContent = templateName.html;
		}
		var tmpTemplate = templateContent;
		tmpTemplate = tmpTemplate.toLowerCase();
		if (tmpTemplate.startsWith('<tr')) tmpElemementType = "tbody";
		if (tmpTemplate.startsWith('<td') || tmpTemplate.startsWith('<th')) tmpElemementType = "tr";
		if (tmpTemplate.startsWith('<tbody') || tmpTemplate.startsWith('<thead') || tmpTemplate.startsWith('<tfoot')) tmpElemementType = "table";
		var element = document.createElementNS((finalContainer || this.container).namespaceURI, tmpElemementType) as AnyElement;
		element.innerHTML = templateContent;
		element = element.firstElementChild as AnyElement;
		// const element = this.createElementFromHTML(templateContent, container || this.container);
		// if (params) element.setAttribute('mu-params', JSON.stringify(params));
		
		if (finalContainer)
		{
			switch(position) {
				case 'first':
					if (finalContainer.firstElementChild) {
						finalContainer.insertBefore(element, finalContainer.firstElementChild);
					} else {
						finalContainer.appendChild(element);
					}
					break;
				case 'before':
					finalContainer.insertBefore(element, ref);
					break;
				case 'after':
					if (ref.nextElementSibling) {
						finalContainer.insertBefore(element, ref.nextElementSibling);
					} else {
						finalContainer.appendChild(element);
					}
					break;
				case 'last':
					finalContainer.appendChild(element);
					break;
			}
		}


		let widget = this.muActivateWidget(element, null, params || {}, typeof templateName === "string" ? null : templateName);
		let opts = this.muGetElementOpts(element);
		if (!opts.id) opts.id = (typeof templateName === "string") ? templateName : null;
		this.muAddEvents(opts, element, widget)

		return widget;
	}

	muAppendContent(html: string): void {
		this.container.innerHTML += html;
	}

	public createElementFromHTML(
		src: string, 
		container: AnyElement
	): AnyElement 
	{
		let lSrc = src.toLowerCase();
		let tmpElemementType = "div";
		if (lSrc.startsWith('<tr')) tmpElemementType = "tbody";
		if (lSrc.startsWith('<td') || lSrc.startsWith('<th')) tmpElemementType = "tr";
		if (lSrc.startsWith('<tbody') || lSrc.startsWith('<thead') || lSrc.startsWith('<tfoot')) tmpElemementType = "table";
		let element = document.createElementNS(container.namespaceURI, tmpElemementType);
		element.innerHTML = src;
		element = element.firstElementChild;

		return element as AnyElement;
	}

	public muRemoveSelf() : void {
		if (this.container.parentNode) this.container.parentNode.removeChild(this.container);
	}

	public container : AnyElement;

	public muGetChildWidgets<T = MuWidget>(container : string|AnyElement) : T[]
	{
		return MuWidget.getChildWidgets(
			(typeof container === "string")
			? this.ui[container]
			: container
		);
	}

	public muBindList(
		list: any[], 
		templateName : string, 
		container : string|AnyElement, 
		commonParams : any = null, 
		finalCalback : ((widget : any) => void)|null = null) 
	{ 

	}

	public muVisible(state : boolean|"toggle", control : string|string[]|HTMLElement|SVGElement) { 
		if (Array.isArray(control))
		{
			for(const controlItem of control) this.muVisible(state, controlItem);
		}
		else
		{
			let neg = false;
			if (typeof control === 'string') {
				if (control.startsWith('!')) {
					neg = true;
					control = control.substring(1);
				}
				if (control === ".")
					control = this.container;
				else if (!(control in this.ui)) throw new Error("Control with mu-id='" + control + "' not found.");
				else
					control = this.ui[control];
			}
			if (state === "toggle") state = control.style.display === "none";
			control.style.display = state !== neg ? null : "none";
		}
	}

	public muSubWidgets : MuWidget[] = [];

	public muNamedWidget : MuNamedWidgets<TW> = {} as undefined as MuNamedWidgets<TW>; // Record<string, MuWidget> = {};

	public muRoot : MuWidget = this;
	
	public muParent : TP/*|null = null */;

	public muTemplates : Record<string, string> = {};

	public muTemplateParents : Record<string, AnyElement> = {};

	public muOnAfterIndex : ((widget : this) => void)[] = [];

	public muBindOpts : Record<string, MuBindOpts[]> = {};

	public muBindData(srcData : any)
	{
		MuBinder.bindData(this.muBindOpts, srcData, this);
		this.muAfterBindData(srcData);
	}

	public muFetchData() : any
	{
		return MuBinder.fetchData(this.muBindOpts, this);
	}

	// protected muRegisterEvent(...args) { }

	// public addEventListener(name : string, handler : (...args)=>void) { }

	// public muEventNames() : string[] { return []; }

	protected muAfterBindData(data: any) { }

	public constructor(container : AnyElement) {
		this.container = container;
	}

	// public constructor(container : AnyElement)
	public muInit(container : AnyElement)
	{
		this.muOnAfterIndex = [];
		this.ui = {} as unknown as MuUi<TU>;
		this.muOpts = 
			{
				attributePrefix: "mu-",
				bindEvents: [
					'click', 'dblclick', 'mouseenter', 'mouseleave', 'mousemove', 'mouseout', 'mouseover', 'mouseup', 'blur',
					'change', 'focus', 'select', 'submit', 'keyup', 'keydown', 'keypress', 'scroll',
					'drag', 'dragstart', 'dragend', 'dragover', 'dragenter', 'dragleave', 'drop', 'input', 
					'touchstart', 'touchmove', 'touchend', 'touchcancel',
				],
				autoMethodNameSeparator: "_"
			};
		/*	opts ? opts : {}
		);*/
		this.container = container;
		this.container.widget = this;
		this.muSubWidgets = [];
		this.muNamedWidget = {} as MuNamedWidgets<TW>;
		this.muTemplates = {};
		this.muTemplateParents = {};
		this.muRoot = this;
		this.muWidgetEventHandlers = {};

		this.beforeIndex();
		this.muAddEvents({ id: 'container' }, this.container);
		this.muIndexTree(this.container, true);
	}

	public beforeIndex() { }

	protected muDispatchEvent(name : string, ...args : any[]) : void
	{
		if (!(name in this.muWidgetEventHandlers)) throw new Error("Unknown event '" + name + "' on class '" + this.constructor.name + "'.");
		if (this.muWidgetEventHandlers[name])
		{
			// const args = Array.from(arguments);
			// args[0] = <MuEvent>{
			const ev = <MuEvent>{
				sender: this,
				originalEvent: event,
				args: Array.from(arguments).slice(1)
			};
			
			//console.log(args, arguments);
			/* for(const handler of this.muWidgetEventHandlers[name])
				handler.apply(this, args); */

			for(let i = 0, l = this.muWidgetEventHandlers[name].length; i < l; i++)
			{
				const handler = this.muWidgetEventHandlers[name][i];
				handler.call(this, ev);
			} 
		}
	}

	public muRegisterEvent(...args : string[]) : void
	{
		// for(var i = 0; i < arguments.length; i++) this.muWidgetEventHandlers[arguments[i]] = [];
		for(const eventName of args) this.muWidgetEventHandlers[eventName] = [];
	}

	public addEventListener(name : string, handler : MuHandler)
	{
		if (!(name in this.muWidgetEventHandlers)) throw new Error("Unknown event '" + name + "' on class '" + this.constructor.name + "'.");
		this.muWidgetEventHandlers[name].push(handler);
	}

	public muEventNames() : string[]
	{
		return Object.keys(this.muWidgetEventHandlers);
	}

	public muActivateWidget(element : AnyElement, opts : MuWidgetOpts|null, extraParams : Record<string, any> = {}, widgetDef:{classType?:any,classInstance?:any}|null = null) : MuWidget
	{
		if (!opts) opts = this.muGetElementOpts(element);
		const widgetName = opts.widget as string;
		let widget: MuWidget;

		if (widgetDef) {
			if (widgetDef.classInstance)
			{
				widget = widgetDef.classInstance as MuWidget;
				widget.container = element;
			} else if (widgetDef.classType) {
				widget = new widgetDef.classType(element, opts);
			}
		}

		let c: any = null;
		if (!widget) {
			c = MuWidget.widgetClasses[widgetName] || (window as any)[widgetName];
			if (!c) throw "Class '" + opts.widget + "' is not defined.";
			widget = new c(element, opts);
		}

		if (!(widget instanceof MuWidget)) {
			if (MuWidget.fixOldWidgets) {
				if (MuWidget.fixOldWidgets !== "silent") console.error("Widget '" + widgetName + "' is not a descendant of the MuWidget class.");
				// extends prototype, class.prototype can not be enumarated
				if (c === null) c = { prototype: widget.__proto__ };
				for(var k of [ 
					'addEventListener', 'addEventListener(name, handler)', 'beforeIndex', 'createElementFromHTML', 'muActivateWidget', 'muAddEvent', 'muAddEvents', 
					'muAddUi', 'muAfterBindData', 'muBindData', 'muBindList', 'muCallPlugin', 'muDispatchEvent', 'muEventNames', 'muFetchData', 'muFindMethod', 
					'muFindTemplate', 'muGetChildWidgets', 'muGetElementOpts', 'muGetMethodCallback', 'muIndexTree', 'muInit', 'muRegisterEvent', 'muRemoveSelf', 
					'muVisible', 'muWidgetFromTemplate', 'muGetRoot'
				])
				if (!c.prototype[k])
					c.prototype[k] = MuWidget.prototype[k];
				c.prototype.muIndexForm = function(form)
				{
					if (!form)
					{
						if (this.container.tagName == 'FORM') form = this.container;
						else form = this.container.querySelector('form');
					}
					if (form)
					{
						this.muAddUi('form', form);
						this.muAddEvents({ id: 'form' }, form);
						for(var i = 0, l = form.elements.length; i < l; i++)
						{
							var element = form.elements[i];
							this.muAddUi(element.name, element);
							this.muAddEvents({ id: element.name }, element);
						}
					}
				}
			} else 
				throw "Widget '" + widgetName + "' is not a descendant of the MuWidget class.";
		}
		widget.muParent = this;
		widget.muRoot = this.muRoot || this;
		if (opts.params)
		{
			const params = typeof opts.params === "string" ? JSON.parse(opts.params) : opts.params;
			for(const k in params)
			{
				(widget as any)[k] = params[k];
			}
		}
		if (extraParams)
		{
			for(const k in extraParams)
			{
				(widget as any)[k] = extraParams[k];
			}
		}
		// MuWidget.extendPrototype(widget);
		this.muSubWidgets.push(widget);
		if (opts.id) this.muNamedWidget[opts.id] = widget;
		// MuWidget.call(widget, element, /*opts.opts || this.muOpts */);
		widget.muInit(element);

		return widget;
	}

	public static identifierRe = '[a-zA-Z_.][0-9a-zA-Z_.]*'

	public muGetElementOpts(element : AnyElement) : MuWidgetOpts
	{
		var res : Partial<MuWidgetOpts> = {};
		// Convert simplified syntax id:widget@template
		const simpleAttributeName = this.muOpts.attributePrefix.substring(0, this.muOpts.attributePrefix.length - 1);
		const simpleAttributeValue = element.getAttribute(simpleAttributeName);
		const ire = MuWidget.identifierRe;
		if (simpleAttributeValue) {
			const m = simpleAttributeValue.match('(' + ire + ')? *(:(' + ire + '))? *(@(' + ire + '))? *(#(.*))?');
			if (m) {
				if (m[1]) element.setAttribute(this.muOpts.attributePrefix + 'id', m[1]);
				if (m[3]) element.setAttribute(this.muOpts.attributePrefix + 'widget', m[3]);
				if (m[5]) element.setAttribute(this.muOpts.attributePrefix + 'template', m[5]);
				if (m[7]) element.setAttribute(this.muOpts.attributePrefix + 'bind', m[7]);
				element.removeAttribute(simpleAttributeName);
			}
		}

		// other mu- parameters
		for (var i = 0, attributes = element.attributes, n = attributes.length, arr = []; i < n; i++)
		{
			var name = attributes[i].nodeName;
			if (name.startsWith(this.muOpts.attributePrefix))
			{
				var optName = name.substr(this.muOpts.attributePrefix.length);
				(res as any)[optName] = attributes[i].nodeValue;
			}
		}

		return res as MuWidgetOpts;
	}

	public muFindTemplate(templateName: string): null|string {
		let tmpTemplate = null;
		if (templateName.startsWith("shared:"))
		{
			let aTemplateName = templateName.substr(7);
			tmpTemplate = MuWidget.sharedTemplates[aTemplateName];
		}
		else if (templateName.startsWith("ancestor:"))
		{
			let aTemplateName = templateName.substr(9);
			let w: MuWidget = this;
			while (w) {
				if (w.muTemplates[aTemplateName]) {
					tmpTemplate = w.muTemplates[aTemplateName];
					break;
				}
				w = w.muParent;
			}
		}
		else
		{
			tmpTemplate = this.muTemplates[templateName];
		}

		return tmpTemplate;
	}

	public muMetaData: {
		id: string,
		widget: string,
	};

	public muIndexTree(element : AnyElement, indexWidget : boolean, useName : string|null = null)
	{
		var ev : MuIndexEvent = { element: element, widget: this, opts: this.muGetElementOpts(element)};
		if (indexWidget) 
		{
			this.muMetaData = { 
				id: ev.opts.id,
				widget: this.constructor.name,
			};
		}

		//TODO: MuBinder
		// this.muCallPlugin("indexPrepareElement", ev);
		if (!ev.element) return;
		element = ev.element;

		var opts = ev.opts;

		if (opts.usetemplate) {
			var src = this.muFindTemplate(opts.usetemplate);
			// element.outerHTML = src;
			if (typeof src === "undefined") throw new Error("Template '" + opts.usetemplate + "' not exists.");
			var newElement = this.createElementFromHTML(src, (element as any).parentNode);
			element.parentNode.insertBefore(newElement, element);
			element.parentNode.removeChild(element);
			element = newElement;
			if (opts.id) element.setAttribute(this.muOpts.attributePrefix + "id", opts.id);
			if (opts.params) element.setAttribute(this.muOpts.attributePrefix + "params", opts.params);
			if (opts.widget) element.setAttribute(this.muOpts.attributePrefix + "widget", opts.widget);
			if (opts.template) element.setAttribute(this.muOpts.attributePrefix + "template", opts.template);
			opts = this.muGetElementOpts(element);
		}

		if (opts.preproc)
		{
			this.preproc(element, opts.preproc);
		}
		this.muIndexOpts = opts;
		useName = useName || opts.usename;
		if (useName) {
			const n = element.attributes.getNamedItem("name")?.value;
			if (n) opts.id = n;

		} 
		if (opts.noindex) return;
		if (opts.template) 
		{
			element.removeAttribute(this.muOpts.attributePrefix + "template");
			if (opts.template.startsWith("shared:")) {
				const name = opts.template.substring(7);
				if (name in MuWidget.sharedTemplates) console.error("The widget already contains template '" + opts.template + "'.");
				MuWidget.sharedTemplates[name] = element.outerHTML;
			} else {
				if (opts.template in this.muTemplates) console.error("The widget already contains template '" + opts.template + "'.");
				this.muTemplates[opts.template] = element.outerHTML;
				this.muTemplateParents[opts.template] = (element.parentNode as AnyElement);
			}
			if (element.parentNode) element.parentNode.removeChild(element);
			return;
		}
		if (opts.id && element != this.container) this.muAddUi(opts.id, element);
		// if (opts.bind) this.muParseBinds(opts.bind, element);
		ev.opts = opts;
		this.muCallPlugin("beforeIndexElement", ev);
		if ((!opts.widget || indexWidget) && !opts.nocontent && element.children)
		{
			// Index children
			var elements : AnyElement[] = [];
			// Create copy, template modify children
			for(const el of element.children) elements.push(el as AnyElement);
			
			for(const el of elements)
			{
				// if (elements[i])
				this.muIndexTree(el, false, useName);
			}
		}
		var widget = null;
		if (opts.widget && !indexWidget)
		{
			// Initialize widget
			widget = this.muActivateWidget(element, opts);
		}
		this.muAddEvents(opts, element, widget);
		if (indexWidget)
		{
			this.afterIndex();
			for (var i = 0, l = this.muOnAfterIndex.length; i < l; i++)
			{
				this.muOnAfterIndex[i](this);
			}
		}
		this.muCallPlugin("afterIndexElement", ev);
	}
	
	muAddUi(id: string, element: AnyElement) {
		if (id in this.ui) console.error("The widget '" + /*this.muGetIdentification()*/ this.muIndexOpts.widget + "#" + this.muIndexOpts.id + "' already contains an element with mu-id '" + id + "'.");
		this.ui[id] = element as AnyElementA;
	}

	/* muGetIdentification() {
		return this.muIndexOpts.widget + (this.muIndexOpts.id ? "#" + this.muIndexOpts.id : "");
	} */

	muCallPlugin(eventName : MuPluginEventNames, eventArgs : MuIndexEvent)
	{
		for(var plugin of MuWidget.plugIns)
		{
			if (plugin[eventName]) plugin[eventName](eventArgs);
		}
	}

	afterIndex() { }

	public preproc(element : AnyElement, preproc : string) {
		var p = preproc.indexOf(" ");
		var name = preproc;
		var paramsStr = "";

		if (p >= 0)
		{
			var name = preproc.substr(0, p);
			var paramsStr = preproc.substr(p);
		}

		if (!(name in MuWidget.preproc)) throw new Error("Preproc '" + name + '" not defined.');

		var pp = MuWidget.preproc[name];
		const mode = pp.prototype.preproc ? "class" : "function";
		if (mode === "function")
			paramsStr = "[" + paramsStr + "]";
		else
			paramsStr = "{" + paramsStr + "}";

		try {
			var params = paramsStr ? JSON.parse(paramsStr) : null;
		}
		catch (exc : any)
		{
			throw new Error(exc.toString() + "\n" + paramsStr)
		}

		if (mode === "function")
		{
			params.unshift(element);
			(pp as (a:any)=>void).call(null, params);
		}
		else
		{
			var inst = new (pp as new()=>any)();
			for(var k in params) inst[k] = params[k];
			inst.preproc(element);
		}
	}

	muAddEvents(opts : MuWidgetOpts, element: AnyElement, widget : MuWidget|null = null)
	{
		var autoMethodName : string;

		var eventNames = [...this.muOpts.bindEvents];
		var wEvents : string[] = [];
		if (widget)
		{
			wEvents = widget.muEventNames();
			eventNames = [ ... new Set([...eventNames, ...wEvents]) ];
		}

		var tags = opts.tag ? opts.tag.split(" ") : null;

		for(var i = 0, l = eventNames.length; i < l; i++)
		{
			const eventName = eventNames[i];
			const eventTarget = (widget && wEvents.indexOf(eventName) >= 0) ? widget : element;
			let methodName = (opts as any)[eventName];
			if (methodName === undefined)
			{
				if (opts.id)
				{
					autoMethodName = opts.id + this.muOpts.autoMethodNameSeparator + eventName;
					if (autoMethodName in this) methodName = autoMethodName;
				}
			} 
			if (methodName)
			{
				this.muAddEvent(eventName, eventTarget, this.muGetMethodCallback(methodName));
			}
			if (tags)
			{
				for(var i1 = 0, l1 = tags.length; i1 < l1; i1++)
				{
					autoMethodName = tags[i1] + this.muOpts.autoMethodNameSeparator + eventName;
					if (autoMethodName in this)
					{
						this.muAddEvent(eventName, eventTarget, this.muGetMethodCallback(autoMethodName));
					}					
				}
			}
		}
		// init
		if (tags)
		{
			const eventTarget = element;
			for(var i = 0, l = tags.length; i < l; i++)
			{
				autoMethodName = tags[i] + this.muOpts.autoMethodNameSeparator + "init";
				if (autoMethodName in this)
				{
					this.muGetMethodCallback(autoMethodName)(eventTarget);
				}					
			}
		}
	}

	muFindMethod(name: string, context : any) : { method: ((...args: any[])=>void|any), args : any[], context: any }
	{
		var obj = context || this;
		//todo: blbne
		while(name.startsWith("parent."))
		{
			if (!obj.muParent) throw "Widget of class '" + obj.constructor.name + "' has not parent.";
			obj = obj.muParent;
			name = name.substr(7);
		}
		var params : any[] = [];
		var p = null;
		if (-1 != (p = name.indexOf(':')))
		{
			params = JSON.parse('[' + name.substr(p + 1) + ']');
			name = name.substr(0, p);
		}
		var method = obj[name];
		if (method === undefined) throw "Undefined method '" + name + "' in class '" + obj.constructor.name + "'.";

		return {
			method: method,
			args: params,
			context: obj
		}
	}

	muGetMethodCallback(name : string, context : any|null = null) : any
	{
		const methodInfo = this.muFindMethod(name, context);

		return (ev : any/* , event : Event */) =>
		{
			
			/* const callparams = [<MuEvent>{
				sender: event?.target,
				source: source, 
				originalEvent: event 
			}, ...methodInfo.args, ...Array.from(arguments).slice(1)]; */
			const callparams = [ev, ...methodInfo.args, ...(ev.args||[])]

			return methodInfo.method.apply(methodInfo.context, callparams);
		};
	}

	public muAddEvent(eventName : string, element : AnyElement|MuWidget, callback : any) : void 
	{
		(element as any).addEventListener(eventName, callback);
		/* (element as any).addEventListener(eventName, (/*ev : Event* /) => {
			// return callback(this, ev);
			// return callback.apply(null, arguments);
			console.log("muAddEvent:wrapper", arguments);
			return callback(...Array.from(arguments));
			// return callback.apply(null, [this].concat(Array.from(arguments)));
		}); */
	}

	public muGetRoot()
	{
		//@ts-ignore
		return this.muParent ? this.muParent.muGetRoot() : this;
	}

	public muDebugGetClasses() {
		const uniqueClasses = new Set();
		this.container.querySelectorAll('[class]').forEach(function(element) {
			element.classList.forEach(function(className) {
				uniqueClasses.add(className);
			});
		});

		return Array.from(uniqueClasses);
	}

	// statics
	public static widgetClasses : Record<string, new(container : AnyElement/*, opts : MuOpts*/) => MuWidget> = {};

	public static preproc: Record<string, (()=>void)|(new() => {preproc: ()=>void})>;

	public static plugIns: MuPlugin[] = [];

	static root: MuWidget;

	static eventLegacy: boolean = false;

	public static getChildWidgets<T = MuWidget>(container: AnyElement): T[] {
		const ls = [];
		for(const item of container.children) {
			if ((item as any).widget) ls.push((item as any).widget);
		}
		return ls;
	}

	public static registerAll()
	{
		for(var i = 0; i < arguments.length; i++)
		{
			var classes = arguments[i];
			for(var k in classes) MuWidget.widgetClasses[k] = classes[k];
		}
	}
	public static registerAs(c : new() => any, n : string)
	{
		MuWidget.widgetClasses[n] = c;
	}
	
	public static startup(startElement: AnyElement|null = null, onSucces: OptionalCallback1<MuWidget> = null, onBefore: OptionalCallback = null) {
		var fn = window.addEventListener || (window as any).attachEvent || function(type: string, listener: (evt:any)=>void)
		{
			if (window.onload) {
				var curronload = window.onload as (evt:any)=>void;
				var newonload = function(evt : any) {
					curronload(evt);
					listener(evt);
				};
				window.onload = newonload;
			} else {
				window.onload = listener;
			}
		};
		fn('load', function() {
			if (onBefore) onBefore();
			var element = (startElement || document.documentElement) as AnyElement;
			var muRoot = new MuWidget(element);
			muRoot.muInit(element);
			MuWidget.root = muRoot;
			if (onSucces) onSucces(muRoot);
		});
	}

	public static getWidget(el: AnyElement): MuWidget|null
	{
		while(el) {
			if (el.widget) return el.widget;
			//@ts-ignore
			el = el.parentElement;
		}
		return null;
	}
}

export type MuPluginEventNames = "beforeIndexElement"|"afterIndexElement";

export type MuPlugin = Partial<Record<MuPluginEventNames, (ev: MuIndexEvent)=>void>>;

export type OptionalCallback = (()=>void)|null;

export type OptionalCallback1<T = any> = ((p1 : T)=>void)|null;

export type MuOpts = {
	attributePrefix: string,
	bindEvents: string[]
	autoMethodNameSeparator: string,
}

export type MuWidgetOpts = Record<string, string>|{
	widget: string|null,
	params: string|null,
	id: string|null,
	preproc: string|null,
	usename: string|null,
	noindex: string|null,
	template: string|null,
	tag: string|null,
	nocontent: string|null,
	usetemplate: string|null,
	// opts: string,
};

export type MuIndexEvent = {
	element: AnyElement,
	widget: MuWidget,
	opts: MuWidgetOpts
}

export type AnyElement = (HTMLElement | SVGElement | HTMLInputElement) & {
	widget: MuWidget, 
	setAttribute : (a:string,b:string)=>void
};
export type AnyElementA = HTMLElement & SVGElement & HTMLInputElement & {
	widget: MuWidget, 
	setAttribute : (a:string,b:string)=>void
};

export function SetAttributes(element : AnyElement, attrs : Record<string,any>)
{
	for(const n in attrs)
	{
		element.setAttribute(n, attrs[n].toString());
	}
}

export type MuEvent = {
	originalEvent : Event,
	sender : any,
	args: any[]|null
}

export type MuPreprocesor = ((element : AnyElement, ...args : any[])=>void)|({preproc: (element : AnyElement) => void});

export type MuHandler = (ev? : MuEvent, ...args : any[]) => void;

export type MuNamedWidgets<T extends Record<string, any&AnyElement>> = T & Record<string, MuWidget>;

export type MuUi<T extends Record<string, any&AnyElement>> = T & Record<string, AnyElementA> & { [key: string ]: AnyElementA };

// export class MuWidget extends MuWidgetTyped<MuWidget, {}, {}> { }

