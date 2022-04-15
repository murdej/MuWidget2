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

// var autostart = MuWidget && MuWidget.autostart;

// if (!window.MuWidgetPlugIns) window.MuWidgetPlugIns = [];

var MuWidget = function(container, opts)
{
	this.muInit(container, opts);
}

MuWidget.extendPrototype = function(prototype)
{
	for(var k in MuWidget.prototype) prototype[k] = MuWidget.prototype[k];
}

MuWidget.prototype = {
	muInit: function(container, opts)
	{
		this.muOnAfterIndex = [];
		this.ui = {};
		this.muOpts = this.muMergeObjects(
			{
				attributePrefix: "mu-",
				bindEvents: [
					'click', 'dblclick', 'mouseenter', 'mouseleave', 'mousemove', 'mouseout', 'mouseover', 'mouseup', 'blur',
					'change', 'focus', 'select', 'submit', 'keyup', 'keydown', 'keypress', 'scroll',
					'drag', 'dragstart', 'dragend', 'dragover', 'dragenter', 'dragleave', 'drop'
				],
				autoMethodNameSeparator: "_"
			},
			opts ? opts : {}
		);
		this.container = container;
		this.container.widget = this;
		this.muSubWidgets = [];
		this.muNamedWidget = {};
		this.muTemplates = {};
		this.muTemplateParents = {};
		this.muRoot = null;
		this.muWidgetEventHandlers = {};

		if (this['beforeIndex']) this.beforeIndex();
		this.muAddEvents({ id: 'container' }, this.container);
		this.muIndexTree(container, true);
	},

	muDispatchEvent: function (name)
	{
		if (!(name in this.muWidgetEventHandlers)) throw new Error("Unknown event '" + name + "' on class '" + this.constructor.name + "'.");
		if (this.muWidgetEventHandlers[name])
		{
			var args = Array.from(arguments);
			args[0] = {
				sender: this
			};
			for(var i = 0; i < this.muWidgetEventHandlers[name].length; i++)
				this.muWidgetEventHandlers[name][i].apply(this, args);
		}
	},

	muRegisterEvent: function()
	{
		for(var i = 0; i < arguments.length; i++) this.muWidgetEventHandlers[arguments[i]] = [];
	},

	addEventListener: function(name, handler)
	{
		if (!(name in this.muWidgetEventHandlers)) throw new Error("Unknown event '" + name + "' on class '" + this.constructor.name + "'.");
		this.muWidgetEventHandlers[name].push(handler);
	},

	muEventNames: function ()
	{
		return Object.keys(this.muWidgetEventHandlers);
	},

	muIndexTree: function(element, indexWidget, useName)
	{
		var ev = { element: element, widget: this };
		this.muCallPlugin("indexPrepareElement", ev);
		if (!ev.element) return;
		element = ev.element;

		var opts = ev.opts || this.muGetElementOpts(element);
		if (opts.preproc)
		{
			var p = opts.preproc.indexOf(" ");
			var name = opts.preproc;
			var paramsStr = "";

			if (p >= 0)
			{
				var name = opts.preproc.substr(0, p);
				var paramsStr = opts.preproc.substr(p);
			}

			if (!(name in MuWidget.preproc)) throw new Error("Preproc '" + name + '" not defined.');

			var pp = MuWidget.preproc[name];
			mode = pp.prototype.preproc ? "class" : "function";
			if (mode === "function")
				paramsStr = "[" + paramsStr + "]";
			else
				paramsStr = "{" + paramsStr + "}";

			try {
				var params = paramsStr ? JSON.parse(paramsStr) : null;
			}
			catch (exc)
			{
				throw new Erro(exc.toString() + "\n" + paramsStr)
			}

			if (mode === "function")
			{
				params.unshift(element);
				pp.call(null, params);
			}
			else
			{
				var inst = new pp();
				for(var k in params) inst[k] = params[k];
				inst.preproc(element);
			}
		}
		this.muIndexOpts = opts;
		useName = useName || opts.usename;
		if (useName && element.attributes["name"]) opts.id = element.attributes["name"];
		if (opts.noindex) return;
		if (opts.template) 
		{
			element.removeAttribute(this.muOpts.attributePrefix + "template");
			this.muTemplates[opts.template] = element.outerHTML;
			this.muTemplateParents[opts.template] = element.parentNode;
			element.parentNode.removeChild(element);
			return;
		}
		if (opts.id) this.muAddUi(opts.id, element);
		// if (opts.bind) this.muParseBinds(opts.bind, element);
		ev.opts = opts;
		this.muCallPlugin("beforeIndexElement", ev);
		if ((!opts.widget || indexWidget) && !opts.nocontent && element.children)
		{
			// Index children
			var elements = [];
			// Create copy, template modify children
			for(var i = 0, l = element.children.length; i < l; i++) elements.push(element.children[i]);
			
			for(var i = 0, l = elements.length; i < l; i++)
			{
				// if (elements[i])
				this.muIndexTree(elements[i], false, useName);
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
			if (this['afterIndex']) this.afterIndex();
			for (var i = 0, l = this.muOnAfterIndex.length; i < l; i++)
			{
				this.muOnAfterIndex[i](this);
			}
		}
	},

	muRemoveSelf: function()
	{
		this.container.parentNode.removeChild(this.container);
	},

	muIndexForm: function(form)
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
	},

	muIndexByName: function(form)
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
	},

	muActivateWidget: function(element, opts, extraParams)
	{
		if (opts === undefined) opts = this.muGetElementOpts(element);
		/* if (!window[opts.widget]) throw "Class '" + opts.widget + "' is not defined.";
		var widget = new window[opts.widget](element, opts, this);*/

		var widgetName = opts.widget;
		var c = /* widgetName === "." ? MuWidget :*/ MuWidget.widgetClasses[widgetName] || window[widgetName];
		if (!c) throw "Class '" + opts.widget + "' is not defined.";
		var widget = new c(element, opts, this);

		widget.muParent = this;
		widget.muRoot = this.muRoot || this;
		if (opts.params)
		{
			var params = JSON.parse(opts.params);
			for(var k in params)
			{
				widget[k] = params[k];
			}
		}
		if (extraParams)
		{
			for(var k in extraParams)
			{
				widget[k] = extraParams[k];
			}
		}
		MuWidget.extendPrototype(widget);
		this.muSubWidgets.push(widget);
		if (opts.id) this.muNamedWidget[opts.id] = widget;
		MuWidget.call(widget, element, opts.opts || this.muOpts);

		return widget;
	},

	muGetRoot: function()
	{
		return this.muParent ? this.muParent.muGetRoot() : this;
		// return MuWidget.root; // this.muParent || this;
	},

	muWidgetFromTemplate: function(templateName, container, params, addMethod)
	{
		if (!addMethod) addMethod = 'appendChild';
		if (typeof container == 'string')
		{
			var containerName = container;
			container = this.ui[container];
			if (!container) throw new Error("Container with mu-id='" + containerName + "' not exists.");
		} 
		
		var tmpElemementType = "div";
		var tmpTemplate = this.muTemplates[templateName];
		if (!tmpTemplate) throw "No template named '" + templateName + "'.";
		tmpTemplate = tmpTemplate.toLowerCase();
		if (tmpTemplate.startsWith('<tr')) tmpElemementType = "tbody";
		if (tmpTemplate.startsWith('<td') || tmpTemplate.startsWith('<th')) tmpElemementType = "tr";
		if (tmpTemplate.startsWith('<tbody')) tmpElemementType = "table";
		var element = document.createElementNS(container.namespaceURI, tmpElemementType);
		element.innerHTML = this.muTemplates[templateName];
		element = element.firstChild; 
		// if (params) element.setAttribute('mu-params', JSON.stringify(params));
		
		if (container) container[addMethod](element);

		var widget = this.muActivateWidget(element, undefined, params);
		var opts = this.muGetElementOpts(element);
		if (!opts.id) opts.id = templateName;
		this.muAddEvents(opts, element, widget)

		return widget;
	},

	muBindList: function(list, templateName, container, commonParams, finalCalback) 
	{
		var res = [];
		for(var l = list.length, i = 0; i < l; i++)
		{
			var params = this.muMergeObjects(commonParams||{}, list[i]);
			var obj = this.muWidgetFromTemplate(templateName, container, params);
			if (finalCalback) finalCalback(obj);
			res.push(obj);
		}
		return res;
	},

	muGetElementOpts: function(element)
	{
		var res = {};
		for (var i = 0, attributes = element.attributes, n = attributes.length, arr = []; i < n; i++)
		{
			var name = attributes[i].nodeName;
			if (name.startsWith(this.muOpts.attributePrefix))
			{
				var optName = name.substr(this.muOpts.attributePrefix.length);
				res[optName] = attributes[i].nodeValue;
			}
		}
		return res;
	},

	muMergeObjects: function()
	{
		var res = {};
		for (var i = 0; i < arguments.length; i++) {
			for (var k in arguments[i])
			{
				res[k] = arguments[i][k];
			}
		}
		return res;
	},

	muGetMethodCallback: function(name, context)
	{
		var obj = context || this;
		//todo: blbne
		while(name.startsWith("parent."))
		{
			if (!obj.muParent) throw "Widget of class '" + obj.constructor.name + "' has not parent.";
			obj = obj.muParent;
			name = name.substr(7);
		}
		var params = [];
		var p = null;
		if (-1 != (p = name.indexOf(':')))
		{
			params = JSON.parse('[' + name.substr(p + 1) + ']');
			name = name.substr(0, p);
		}
		var method = obj[name];
		if (method === undefined) throw "Undefined method '" + name + "' in class '" + obj.constructor.name + "'.";
		return function()
		{
			var callparams = [];
			for(var i = 0, l = params.length; i < l; i++) callparams.push(params[i]);
			for(var i = 0, l = arguments.length; i < l; i++) callparams.push(arguments[i]);
			// for(var item of params) callparams.push(item);
			// for(var item of arguments) callparams.push(item);
			return method.apply(obj, callparams);
		};
	},

	muAddUi: function(name, element)
	{
		this.ui[name] = element;
	},

	muAddEvents: function(opts, element, widget)
	{
		var autoMethodName, /*i,*/ l;

		var eventNames = [];
		for(var i = 0, l = this.muOpts.bindEvents.length; i < l; i++) eventNames.push(this.muOpts.bindEvents[i]);
		var wEvents = [];
		if (widget)
		{
			wEvents = widget.muEventNames();
			for(var i = 0, l = wEvents.length; i < l; i++) eventNames.push(wEvents[i]);
		}

		var tags = opts.tag ? opts.tag.split(" ") : null;

		for(var i = 0, l = eventNames.length; i < l; i++)
		{
			var eventName = eventNames[i];
			var eventTarget = wEvents.indexOf(eventName) >= 0 ? widget : element;
			var methodName = opts[eventName];
			if (methodName === undefined)
			{
				if (opts.id)
				{
					autoMethodName = opts.id + this.muOpts.autoMethodNameSeparator + eventName;
					if (this[autoMethodName] !== undefined) methodName = autoMethodName;
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
					if (this[autoMethodName] !== undefined)
					{
						this.muAddEvent(eventName, eventTarget, this.muGetMethodCallback(autoMethodName));
					}					
				}
			}
		}
		// init
		if (tags)
		{
			for(var i = 0, l = tags.length; i < l; i++)
			{
				autoMethodName = tags[i] + this.muOpts.autoMethodNameSeparator + "init";
				if (this[autoMethodName] !== undefined)
				{
					this.muGetMethodCallback(autoMethodName)(eventTarget);
				}					
			}
		}
	},

	muAddEvent: function(eventName, element, callback)
	{
		element.addEventListener(eventName, function(ev) {
			// return callback(this, ev);
			return callback.apply(null, [this].concat(Array.from(arguments)));
		});
	},

	muGetId: function(element)
	{
		return this.muGetElementOpts(element).id;
		// this.muIndexOpts
	},

	muVisible: function(state, control)
	{
		if (Array.isArray(control))
		{
			for(var i = 0, l = control.length; i < l; i++) this.muVisible(state, control[i]);
		}
		else
		{
			if (typeof control === 'string'){
				if (!(control in this.ui)) throw new Error("Control with mu-id='" + control + "' not found.");
				control = this.ui[control];
			}
			control.style.display = state ? null : "none";
		}
	},

	muCallPlugin: function(eventName, eventArgs)
	{
		for(var i = 0, l = MuWidget.PlugIns.length; i < l; i++)
		{
			var plugin = MuWidget.PlugIns[i];
			if (plugin[eventName]) plugin[eventName](eventArgs);
		}
	}
}

MuWidget.startup = function(startElement, onSucces, onBefore)
{
	var fn = window.addEventListener || window.attachEvent || function(type, listener)
	{
		if (window.onload) {
			var curronload = window.onload;
			var newonload = function(evt) {
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
		var element = startElement || document.documentElement;
		var muRoot = new MuWidget(element);
		MuWidget.root = muRoot;
		if (onSucces) onSucces(muRoot);
	});
}

MuWidget.getWidget = function(currentElement)
{
	var el = currentElement;
	while(el)
	{
		if (el.widget) return el.widget;
		el = el.parentNode;
	}
}

MuWidget.getChildWidgets = function(list, fn)
{
	var ls = [];
	for(var i = 0; i < list.children.length; i++)
	{
		var item = list.children[i].widget; // MuWidget.getWidget(list.children[i]);
		if (!item) continue;
		if (fn) item = fn(item);
		ls.push(item);
	};
	return ls;
}

MuWidget.widgetClasses = {};
MuWidget.PlugIns = [];
MuWidget.preproc = {}

MuWidget.registerAll = function()
{
	for(var i = 0; i < arguments.length; i++)
	{
		var classes = arguments[i];
		for(var k in classes) MuWidget.widgetClasses[k] = classes[k];
	}
}
MuWidget.registerAs = function(c, n)
{
	MuWidget.widgetClasses[n] = c;
}


// if (typeof MuWidget_autostart != "undefined" ? MuWidget_autostart : false) MuWidget.startup();

/* function htmlFromString(htmlString) {
	var div = document.createElement('div');
	div.innerHTML = htmlString.trim();
	return div.firstChild; 
} */

if (typeof exports != "undefined") exports.MuWidget = MuWidget;