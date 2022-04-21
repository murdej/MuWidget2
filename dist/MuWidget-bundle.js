var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var MuBinder = /** @class */ (function () {
    function MuBinder() {
    }
    MuBinder.parse = function (src, element) {
        /*
        source
        source:target
        source::target
        source;target
        sourcer|filter():target
        */
        var mode = "source";
        var optsList = [];
        var sp = new StrParser(src);
        var p;
        var lastP = 0;
        function parseFetchBind(chunk, opts) {
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
        function parseFilter(sp, bindPart, opts) {
            p = sp.findNext(["::", ":", "|", "^", ";", "("]);
            var filter = {
                methodName: sp.substring(lastP, p).trim(),
                args: []
            };
            if (!p) {
                mode = "end";
            }
            else if (p.chunk === ";") {
                mode = "complete";
                sp.toEndChunk();
            }
            else {
                sp.toEndChunk();
                lastP = sp.position;
                if (p.chunk === "(") {
                    var argStart = sp.pos();
                    while (true) {
                        p = sp.findNext([")", "\""]);
                        if (p === null)
                            throw "missing ')' after argument(s) '" + src + "'";
                        if (p.chunk == ")") {
                            sp.toEndChunk();
                            lastP = sp.position;
                            break;
                        }
                        // skoč na konec stringu
                        sp.toEndChunk();
                        do {
                            p = sp.findNext(["\\\"", "\""]);
                            if (p === null)
                                throw "unterminated string '" + src + "'";
                            sp.toEndChunk();
                        } while (p.chunk === "\\\"");
                    }
                    var sArgs = sp.substring(argStart, p);
                    try {
                        filter.args = JSON.parse("[" + sArgs + "]");
                    }
                    catch (exc) {
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
            var opts = {
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
                        }
                        else if (p.chunk == ";") {
                            mode = "complete";
                        }
                        else {
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
                        }
                        else if (p.chunk == ";") {
                            mode = "complete";
                        }
                        else {
                            mode = "fetchFilter";
                            sp.toEndChunk();
                            lastP = sp.position;
                        }
                        break;
                    case "bindFilter":
                        var f = parseFilter(sp, true, opts);
                        if (f)
                            opts.bindFilters.push(f);
                        break;
                    case "fetchFilter":
                        f = parseFilter(sp, false, opts);
                        if (f)
                            opts.fetchFilters.push(f);
                        break;
                }
            }
            optsList.push(opts);
            sp.toEndChunk();
            lastP = sp.position;
        }
        return optsList;
    };
    MuBinder.setDefaults = function (mbo) {
        var defaults = {};
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
        for (var k in defaults) {
            if (mbo[k] === null)
                mbo[k] = defaults[k];
        }
        var targetAlias = {
            text: "innerText",
            html: "innerHTML"
        };
        if (targetAlias[mbo.target])
            mbo.target = targetAlias[mbo.target];
    };
    MuBinder.beforeIndexElement = function (ev) {
        if (ev.opts.bind) {
            var bindSrc = ev.opts.bind;
            for (var _i = 0, _a = MuBinder.parse(bindSrc, ev.element); _i < _a.length; _i++) {
                var mbo = _a[_i];
                MuBinder.setDefaults(mbo);
                if (!ev.widget.muBindOpts)
                    ev.widget.muBindOpts = {};
                if (!ev.widget.muBindOpts[mbo.source])
                    ev.widget.muBindOpts[mbo.source] = [];
                ev.widget.muBindOpts[mbo.source].push(mbo);
            }
        }
    };
    MuBinder.register = function (muWidget) {
        // @ts-ignore
        muWidget.plugIns.push({
            beforeIndexElement: MuBinder.beforeIndexElement
        });
    };
    MuBinder.bindData = function (bindOpts, srcData, widget) {
        for (var k in srcData) {
            if (bindOpts[k]) {
                for (var _i = 0, _a = bindOpts[k]; _i < _a.length; _i++) {
                    var mbo = _a[_i];
                    if (mbo.forBind) {
                        var val = MuBinder.UseFilters(srcData[k], mbo.bindFilters, widget);
                        MuBinder.setValue(val, mbo.target, mbo.element, widget);
                    }
                }
            }
        }
    };
    MuBinder.fetchData = function (bindOpts, widget) {
        var resData = {};
        for (var k in bindOpts) {
            for (var _i = 0, _a = bindOpts[k]; _i < _a.length; _i++) {
                var mbo = _a[_i];
                if (mbo.forFetch) {
                    /* resData[k] = mbo.element[mbo.target];
                    let val = MuBinder.UseFilters(srcData[k], mbo.bindFilters, widget);
                    ; */
                    resData[k] = MuBinder.UseFilters(MuBinder.GetValue(mbo.target, mbo.element, widget), mbo.fetchFilters, widget);
                }
            }
        }
        return resData;
    };
    MuBinder.UseFilters = function (val, filters, widget) {
        var _a, _b, _c;
        for (var _i = 0, filters_1 = filters; _i < filters_1.length; _i++) {
            var filter = filters_1[_i];
            var obj = null;
            var fn = void 0;
            if (filter.methodName in widget)
                obj = widget; // fn = <MuBindFilterCallback>widget[filter.methodName];
            else if (widget.muParent && filter.methodName in widget.muParent)
                obj = widget.muParent; // fn = <MuBindFilterCallback>widget.muParent[filter.methodName];
            else if (filter.methodName in MuBinder.filters)
                obj = MuBinder.filters; //fn = MuBinder.filters[filter.methodName];
            else {
                // Parent widgets
                var w = (_a = widget.muParent) === null || _a === void 0 ? void 0 : _a.muParent;
                while (w) {
                    if (filter.methodName in w) {
                        obj = w;
                        break;
                    }
                    w = w.muParent;
                }
            }
            if (!obj)
                throw new Error("Unknown filter '" + filter.methodName + "'. Source widget: '" + ((_c = (_b = widget) === null || _b === void 0 ? void 0 : _b.costructor) === null || _c === void 0 ? void 0 : _c.name) + "'");
            fn = obj[filter.methodName];
            val = fn.call.apply(fn, __spreadArray([obj, val, {}], filter.args, false));
        }
        return val;
    };
    MuBinder.setValue = function (val, target, element, widget) {
        if (target === "@widget") {
            element["widget"].muBindData(val);
        }
        else if (target === "foreach" || target === "@foreach") {
            element.innerHTML = "";
            for (var k in widget.muTemplateParents) {
                if (element === widget.muTemplateParents[k]) {
                    var arr = [];
                    if (!Array.isArray(val)) {
                        for (var k_1 in val) {
                            arr.push({
                                key: k_1,
                                value: val[k_1]
                            });
                        }
                    }
                    else
                        arr = val;
                    for (var _i = 0, arr_1 = arr; _i < arr_1.length; _i++) {
                        var data = arr_1[_i];
                        var widgetParams = {};
                        for (var k_2 in data) {
                            if (k_2.startsWith("."))
                                widgetParams[k_2.substr(1)] = data[k_2];
                        }
                        var itemWidget = widget.muWidgetFromTemplate(k, element, widgetParams);
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
            element.style.display = val ? "" : "none";
        else if (target == "@options") {
            var addOpt = function (val, text) {
                var opt = document.createElement("option");
                opt.text = text;
                opt.value = val;
                element.add(opt);
            };
            element.innerHTML = "";
            if (Array.isArray(val)) {
                for (var _a = 0, val_1 = val; _a < val_1.length; _a++) {
                    var item = val_1[_a];
                    if (typeof item === "string")
                        addOpt(item, item);
                    else
                        addOpt(item.value, item.text);
                }
            }
            else if (typeof val === "object") {
                for (var v in val) {
                    addOpt(v, val[v]);
                }
            }
        }
        else
            this.setDeep(val, element, target); // element[target] = val;
    };
    MuBinder.setDeep = function (value, object, path) {
        var obj = object;
        var fields = path.split(".");
        var lastI = fields.length - 1;
        var i = 0;
        for (var _i = 0, fields_1 = fields; _i < fields_1.length; _i++) {
            var f = fields_1[_i];
            if (i < lastI)
                obj = obj[f];
            else
                obj[f] = value;
            if (!obj)
                throw "Can not set value to path'" + path + "'";
            i++;
        }
    };
    MuBinder.getDeep = function (object, path) {
        var obj = object;
        var fields = path.split(".");
        for (var _i = 0, fields_2 = fields; _i < fields_2.length; _i++) {
            var f = fields_2[_i];
            if (!(f in obj))
                return undefined;
            obj = obj[f];
        }
        return obj;
    };
    MuBinder.GetValue = function (target, element, widget) {
        switch (target) {
            case "@widget":
                return element["widget"].muFetchData();
            case "foreach":
            case "@foreach":
                return widget.muGetChildWidgets(element).map(function (itemWidget) { return itemWidget.muFetchData(); });
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
    };
    MuBinder.filters = {
        toLower: function (val) {
            return val === null || val === void 0 ? void 0 : val.toString().toLocaleLowerCase();
        },
        toUpper: function (val) { return val === null || val === void 0 ? void 0 : val.toString().toLocaleUpperCase(); },
        short: function (val, ev, maxLen, sufix) {
            if (sufix === void 0) { sufix = "..."; }
            var str = val.toString();
            if (str.length >= maxLen - sufix.length)
                str = str.substr(0, maxLen) + sufix;
            return str;
        },
        tern: function (val, ev, onTrue, onFalse) { return val ? onTrue : onFalse; },
        prepend: function (val, ev, prefix, ifAny) {
            if (ifAny === void 0) { ifAny = false; }
            return !ifAny || val ? prefix + val : val;
        },
        append: function (val, ev, prefix, ifAny) {
            if (ifAny === void 0) { ifAny = false; }
            return !ifAny || val ? val + prefix : val;
        },
        map: function (val, ev, map) { return map[val]; }
    };
    return MuBinder;
}());
var MuRouter = /** @class */ (function () {
    function MuRouter() {
        var _this = this;
        this.routes = {};
        this.persistentKeys = [];
        this.persistentValues = {};
        this.pathPrefix = "";
        this.lastParameters = {};
        window.onpopstate = function (ev) { return _this.route(document.location); };
    }
    MuRouter.prototype.addRoute = function (name, re, callback) {
        var route = {
            callback: callback,
            name: name,
            reText: re
        };
        MuRouter.compileRe(route);
        this.routes[name] = route;
        return this;
    };
    MuRouter.compileRe = function (route) {
        var defaultReChunk = "[^/?#]*";
        var p = 0;
        var lastP = 0;
        var re = "";
        var s;
        var rete = route.reText;
        route.chunks = [];
        route.paramNames = [];
        while (true) {
            p = rete.indexOf("<", lastP);
            if (p < 0) {
                s = rete.substr(lastP);
                if (s) {
                    route.chunks.push(s);
                    re += s;
                }
                break;
            }
            else {
                s = rete.substring(lastP, p);
                if (s) {
                    route.chunks.push(s);
                    re += s;
                }
            }
            lastP = p + 1;
            p = rete.indexOf(">", lastP);
            if (p < 0) {
                throw new Error("Missing parametr end");
            }
            var chunk = rete.substring(lastP, p);
            var p1 = chunk.indexOf(" ");
            var reChunk = void 0;
            var name_1 = void 0;
            if (p1 >= 0) {
                reChunk = chunk.substr(p1 + 1);
                name_1 = chunk.substr(0, p1);
            }
            else {
                reChunk = defaultReChunk;
                name_1 = chunk;
            }
            route.chunks.push({ name: name_1 });
            re += "(" + reChunk + ")";
            route.paramNames.push(name_1);
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
    };
    MuRouter.prototype.route = function (location) {
        if (location === void 0) { location = null; }
        if (!location)
            location = window.location;
        if (this.pathPrefix) {
            if (typeof location != "string") {
                location = location.pathname + location.search;
            }
            location = location.substr(this.pathPrefix.length);
        }
        if (typeof location == "string") {
            var p = location.indexOf("?");
            location = {
                pathname: p >= 0 ? location.substr(0, p) : location,
                search: p >= 0 ? location.substr(p) : ""
            };
        }
        for (var routeName in this.routes) {
            var route = this.routes[routeName];
            var m = route.re.exec(location.pathname);
            if (!m)
                continue;
            var res = this.parseQueryString(location.search);
            for (var i = 0; i < m.length; i++) {
                if (i > 0) {
                    res[route.paramNames[i - 1]] = decodeURIComponent(m[i]);
                }
            }
            this.updatePersistent(res);
            route.callback({ parameters: res, routeName: routeName });
            break;
            // console.log(m);
        }
    };
    MuRouter.prototype.makeUrl = function (name, currParams) {
        var url = "";
        var used = [];
        var params = __assign({}, this.persistentValues);
        for (var k in currParams)
            if (currParams[k] !== null)
                params[k] = currParams[k];
        if (!(name in this.routes))
            throw new Error("No route '" + name + "'");
        var route = this.routes[name];
        for (var _i = 0, _a = route.chunks; _i < _a.length; _i++) {
            var chunk = _a[_i];
            if (typeof chunk == "string") {
                url += chunk;
            }
            else {
                url += chunk.name in params ? encodeURIComponent(params[chunk.name]) : "";
                used.push(chunk.name);
            }
        }
        var q = Object.keys(params).filter(function (k) { return used.indexOf(k) < 0; }).sort().map(function (k) { return encodeURIComponent(k) + "=" + encodeURIComponent(params[k]); }).join("&");
        if (q)
            url += "?" + q;
        return this.pathPrefix + url;
    };
    MuRouter.prototype.push = function (name, params) {
        if (params === void 0) { params = {}; }
        this.updatePersistent(params);
        history.pushState({}, null, this.makeUrl(name, params));
    };
    MuRouter.prototype.replace = function (name, params) {
        if (params === void 0) { params = {}; }
        this.updatePersistent(params);
        history.replaceState({}, null, this.makeUrl(name, params));
    };
    MuRouter.prototype.update = function (name, params) {
        if (params === void 0) { params = {}; }
        this.updatePersistent(params, true);
        history.replaceState({}, null, this.makeUrl(name, __assign(__assign({}, this.lastParameters), params)));
    };
    MuRouter.prototype.navigate = function (name, params) {
        if (params === void 0) { params = {}; }
        this.push(name, params);
        this.routes[name].callback({ parameters: params, routeName: name });
    };
    MuRouter.prototype.parseQueryString = function (queryString) {
        var res = {};
        if (queryString.startsWith("?"))
            queryString = queryString.substr(1);
        for (var _i = 0, _a = queryString.split("&"); _i < _a.length; _i++) {
            var item = _a[_i];
            if (!item)
                continue;
            var p = item.indexOf("=");
            var k = void 0;
            var v = void 0;
            if (p >= 0) {
                k = decodeURIComponent(item.substr(0, p));
                v = decodeURIComponent(item.substr(p + 1));
            }
            else {
                k = decodeURIComponent(item);
                v = true;
            }
            res[k] = v;
        }
        return res;
    };
    MuRouter.prototype.updatePersistent = function (res, patch) {
        if (patch === void 0) { patch = false; }
        for (var _i = 0, _a = this.persistentKeys; _i < _a.length; _i++) {
            var k = _a[_i];
            if (k in res) {
                var v = res[k];
                if (v !== null)
                    this.persistentValues[k] = v;
                else
                    delete this.persistentValues[k];
            }
        }
        if (patch) {
            for (var k in res) {
                var v = res[k];
                if (v !== null)
                    this.lastParameters[k] = v;
                else
                    delete this.lastParameters[k];
            }
        }
        else
            this.lastParameters = res;
    };
    MuRouter.prototype.getParameters = function () {
        return this.lastParameters;
    };
    return MuRouter;
}());
var MuUIDs = /** @class */ (function () {
    function MuUIDs() {
    }
    MuUIDs.next = function (k) {
        MuUIDs.counters[k]++;
        return MuUIDs.prefix + MuUIDs.counters[k].toString();
    };
    MuUIDs.counters = {
        id: 0,
        name: 0
    };
    MuUIDs.prefix = "_Mu_";
    return MuUIDs;
}());
var MuWidget = /** @class */ (function () {
    function MuWidget(container) {
        this.ui = {};
        this.muOpts = {};
        this.muWidgetEventHandlers = {};
        this.muIndexOpts = null;
        this.muSubWidgets = [];
        this.muNamedWidget = {};
        this.muRoot = this;
        this.muParent = null;
        this.muTemplates = {};
        this.muTemplateParents = {};
        this.muOnAfterIndex = [];
        this.muBindOpts = {};
        this.container = container;
    }
    MuWidget.prototype.muWidgetFromTemplate = function (templateName, container, params, position, ref) {
        if (params === void 0) { params = null; }
        if (position === void 0) { position = "last"; }
        if (ref === void 0) { ref = null; }
        var finalContainer;
        if (typeof container == 'string') {
            var containerName = container;
            finalContainer = this.ui[container];
            if (!finalContainer)
                throw new Error("Container with mu-id='" + containerName + "' not exists.");
        }
        else
            finalContainer = container;
        var tmpElemementType = "div";
        var tmpTemplate = this.muTemplates[templateName];
        if (!tmpTemplate)
            throw "No template named '" + templateName + "'.";
        tmpTemplate = tmpTemplate.toLowerCase();
        if (tmpTemplate.startsWith('<tr'))
            tmpElemementType = "tbody";
        if (tmpTemplate.startsWith('<td') || tmpTemplate.startsWith('<th'))
            tmpElemementType = "tr";
        if (tmpTemplate.startsWith('<tbody'))
            tmpElemementType = "table";
        var element = document.createElementNS(finalContainer.namespaceURI, tmpElemementType);
        element.innerHTML = this.muTemplates[templateName];
        element = element.firstElementChild;
        // if (params) element.setAttribute('mu-params', JSON.stringify(params));
        switch (position) {
            case 'first':
                if (finalContainer.firstElementChild) {
                    finalContainer.insertBefore(element, finalContainer.firstElementChild);
                }
                else {
                    finalContainer.appendChild(element);
                }
                break;
            case 'before':
                finalContainer.insertBefore(element, ref);
                break;
            case 'after':
                if (ref.nextElementSibling) {
                    finalContainer.insertBefore(element, ref.nextElementSibling);
                }
                else {
                    finalContainer.appendChild(element);
                }
                break;
            case 'last':
                finalContainer.appendChild(element);
                break;
        }
        var widget = this.muActivateWidget(element, null, params || {});
        var opts = this.muGetElementOpts(element);
        if (!opts.id)
            opts.id = templateName;
        this.muAddEvents(opts, element, widget);
        return widget;
    };
    ;
    MuWidget.prototype.muRemoveSelf = function () {
        this.container.parentNode.removeChild(this.container);
    };
    ;
    MuWidget.prototype.muGetChildWidgets = function (container) {
        return MuWidget.getChildWidgets((typeof container === "string")
            ? this.ui[container]
            : container);
    };
    MuWidget.prototype.muBindList = function (list, templateName, container, commonParams, finalCalback) {
        if (commonParams === void 0) { commonParams = null; }
        if (finalCalback === void 0) { finalCalback = null; }
    };
    MuWidget.prototype.muVisible = function (state, control) { };
    MuWidget.prototype.muBindData = function (srcData) {
        MuBinder.bindData(this.muBindOpts, srcData, this);
        this.muAfterBindData();
    };
    MuWidget.prototype.muFetchData = function () {
        return MuBinder.fetchData(this.muBindOpts, this);
    };
    // protected muRegisterEvent(...args) { }
    // public addEventListener(name : string, handler : (...args)=>void) { }
    // public muEventNames() : string[] { return []; }
    MuWidget.prototype.muAfterBindData = function () { };
    // public constructor(container : AnyElement)
    MuWidget.prototype.muInit = function (container) {
        this.muOnAfterIndex = [];
        this.ui = {};
        this.muOpts =
            {
                attributePrefix: "mu-",
                bindEvents: [
                    'click', 'dblclick', 'mouseenter', 'mouseleave', 'mousemove', 'mouseout', 'mouseover', 'mouseup', 'blur',
                    'change', 'focus', 'select', 'submit', 'keyup', 'keydown', 'keypress', 'scroll',
                    'drag', 'dragstart', 'dragend', 'dragover', 'dragenter', 'dragleave', 'drop'
                ],
                autoMethodNameSeparator: "_"
            };
        /*	opts ? opts : {}
        );*/
        this.container = container;
        this.container.widget = this;
        this.muSubWidgets = [];
        this.muNamedWidget = {};
        this.muTemplates = {};
        this.muTemplateParents = {};
        this.muRoot = this;
        this.muWidgetEventHandlers = {};
        this.beforeIndex();
        this.muAddEvents({ id: 'container' }, this.container);
        this.muIndexTree(container, true);
    };
    MuWidget.prototype.beforeIndex = function () { };
    MuWidget.prototype.muDispatchEvent = function (name) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        if (!(name in this.muWidgetEventHandlers))
            throw new Error("Unknown event '" + name + "' on class '" + this.constructor.name + "'.");
        if (this.muWidgetEventHandlers[name]) {
            // const args = Array.from(arguments);
            // args[0] = <MuEvent>{
            var ev = {
                sender: this,
                originalEvent: event,
                args: Array.from(arguments).slice(1)
            };
            //console.log(args, arguments);
            /* for(const handler of this.muWidgetEventHandlers[name])
            handler.apply(this, args); */
            for (var i = 0, l = this.muWidgetEventHandlers[name].length; i < l; i++) {
                var handler = this.muWidgetEventHandlers[name][i];
                handler.call(this, ev);
            }
        }
    };
    MuWidget.prototype.muRegisterEvent = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        // for(var i = 0; i < arguments.length; i++) this.muWidgetEventHandlers[arguments[i]] = [];
        for (var _a = 0, args_1 = args; _a < args_1.length; _a++) {
            var eventName = args_1[_a];
            this.muWidgetEventHandlers[eventName] = [];
        }
    };
    MuWidget.prototype.addEventListener = function (name, handler) {
        if (!(name in this.muWidgetEventHandlers))
            throw new Error("Unknown event '" + name + "' on class '" + this.constructor.name + "'.");
        this.muWidgetEventHandlers[name].push(handler);
    };
    MuWidget.prototype.muEventNames = function () {
        return Object.keys(this.muWidgetEventHandlers);
    };
    MuWidget.prototype.muActivateWidget = function (element, opts, extraParams) {
        if (extraParams === void 0) { extraParams = {}; }
        if (!opts)
            opts = this.muGetElementOpts(element);
        var widgetName = opts.widget;
        var c = MuWidget.widgetClasses[widgetName] || window[widgetName];
        if (!c)
            throw "Class '" + opts.widget + "' is not defined.";
        var widget = new c(element, opts);
        if (!(widget instanceof MuWidget))
            console.error("Widget '" + widgetName + "' is not a descendant of the MuWidget class.");
        widget.muParent = this;
        widget.muRoot = this.muRoot || this;
        if (opts.params) {
            var params = JSON.parse(opts.params);
            for (var k in params) {
                widget[k] = params[k];
            }
        }
        if (extraParams) {
            for (var k in extraParams) {
                widget[k] = extraParams[k];
            }
        }
        // MuWidget.extendPrototype(widget);
        this.muSubWidgets.push(widget);
        if (opts.id)
            this.muNamedWidget[opts.id] = widget;
        // MuWidget.call(widget, element, /*opts.opts || this.muOpts */);
        widget.muInit(element);
        return widget;
    };
    MuWidget.prototype.muGetElementOpts = function (element) {
        var res = {};
        for (var i = 0, attributes = element.attributes, n = attributes.length, arr = []; i < n; i++) {
            var name = attributes[i].nodeName;
            if (name.startsWith(this.muOpts.attributePrefix)) {
                var optName = name.substr(this.muOpts.attributePrefix.length);
                res[optName] = attributes[i].nodeValue;
            }
        }
        return res;
    };
    MuWidget.prototype.muIndexTree = function (element, indexWidget, useName) {
        var _a;
        if (useName === void 0) { useName = null; }
        var ev = { element: element, widget: this, opts: this.muGetElementOpts(element) };
        //TODO: MuBinder
        // this.muCallPlugin("indexPrepareElement", ev);
        if (!ev.element)
            return;
        element = ev.element;
        var opts = ev.opts;
        if (opts.preproc) {
            this.preproc(element, opts.preproc);
        }
        this.muIndexOpts = opts;
        useName = useName || opts.usename;
        if (useName) {
            var n = (_a = element.attributes.getNamedItem("name")) === null || _a === void 0 ? void 0 : _a.value;
            if (n)
                opts.id = n;
        }
        if (opts.noindex)
            return;
        if (opts.template) {
            element.removeAttribute(this.muOpts.attributePrefix + "template");
            if (opts.template in this.muTemplates)
                console.error("The widget already contains template '" + opts.template + "'.");
            this.muTemplates[opts.template] = element.outerHTML;
            this.muTemplateParents[opts.template] = element.parentNode;
            if (element.parentNode)
                element.parentNode.removeChild(element);
            return;
        }
        if (opts.id)
            this.muAddUi(opts.id, element);
        // if (opts.bind) this.muParseBinds(opts.bind, element);
        ev.opts = opts;
        this.muCallPlugin("beforeIndexElement", ev);
        if ((!opts.widget || indexWidget) && !opts.nocontent && element.children) {
            // Index children
            var elements = [];
            // Create copy, template modify children
            for (var _i = 0, _b = element.children; _i < _b.length; _i++) {
                var el = _b[_i];
                elements.push(el);
            }
            for (var _c = 0, elements_1 = elements; _c < elements_1.length; _c++) {
                var el = elements_1[_c];
                // if (elements[i])
                this.muIndexTree(el, false, useName);
            }
        }
        var widget = null;
        if (opts.widget && !indexWidget) {
            // Initialize widget
            widget = this.muActivateWidget(element, opts);
        }
        this.muAddEvents(opts, element, widget);
        if (indexWidget) {
            this.afterIndex();
            for (var i = 0, l = this.muOnAfterIndex.length; i < l; i++) {
                this.muOnAfterIndex[i](this);
            }
        }
    };
    MuWidget.prototype.muAddUi = function (id, element) {
        if (id in this.ui)
            console.error("The widget already contains an element with mu-id '" + id + "'.");
        this.ui[id] = element;
    };
    MuWidget.prototype.muCallPlugin = function (eventName, eventArgs) {
        for (var _i = 0, _a = MuWidget.plugIns; _i < _a.length; _i++) {
            var plugin = _a[_i];
            if (plugin[eventName])
                plugin[eventName](eventArgs);
        }
    };
    MuWidget.prototype.afterIndex = function () { };
    MuWidget.prototype.preproc = function (element, preproc) {
        var p = preproc.indexOf(" ");
        var name = preproc;
        var paramsStr = "";
        if (p >= 0) {
            var name = preproc.substr(0, p);
            var paramsStr = preproc.substr(p);
        }
        if (!(name in MuWidget.preproc))
            throw new Error("Preproc '" + name + '" not defined.');
        var pp = MuWidget.preproc[name];
        var mode = pp.prototype.preproc ? "class" : "function";
        if (mode === "function")
            paramsStr = "[" + paramsStr + "]";
        else
            paramsStr = "{" + paramsStr + "}";
        try {
            var params = paramsStr ? JSON.parse(paramsStr) : null;
        }
        catch (exc) {
            throw new Error(exc.toString() + "\n" + paramsStr);
        }
        if (mode === "function") {
            params.unshift(element);
            pp.call(null, params);
        }
        else {
            var inst = new pp();
            for (var k in params)
                inst[k] = params[k];
            inst.preproc(element);
        }
    };
    MuWidget.prototype.muAddEvents = function (opts, element, widget) {
        if (widget === void 0) { widget = null; }
        var autoMethodName;
        var eventNames = __spreadArray([], this.muOpts.bindEvents, true);
        var wEvents = [];
        if (widget) {
            wEvents = widget.muEventNames();
            eventNames = __spreadArray(__spreadArray([], eventNames, true), wEvents, true);
        }
        var tags = opts.tag ? opts.tag.split(" ") : null;
        for (var i = 0, l = eventNames.length; i < l; i++) {
            var eventName = eventNames[i];
            var eventTarget = (widget && wEvents.indexOf(eventName) >= 0) ? widget : element;
            var methodName = opts[eventName];
            if (methodName === undefined) {
                if (opts.id) {
                    autoMethodName = opts.id + this.muOpts.autoMethodNameSeparator + eventName;
                    if (autoMethodName in this)
                        methodName = autoMethodName;
                }
            }
            if (methodName) {
                this.muAddEvent(eventName, eventTarget, this.muGetMethodCallback(methodName));
            }
            if (tags) {
                for (var i1 = 0, l1 = tags.length; i1 < l1; i1++) {
                    autoMethodName = tags[i1] + this.muOpts.autoMethodNameSeparator + eventName;
                    if (autoMethodName in this) {
                        this.muAddEvent(eventName, eventTarget, this.muGetMethodCallback(autoMethodName));
                    }
                }
            }
        }
        // init
        if (tags) {
            var eventTarget = element;
            for (var i = 0, l = tags.length; i < l; i++) {
                autoMethodName = tags[i] + this.muOpts.autoMethodNameSeparator + "init";
                if (autoMethodName in this) {
                    this.muGetMethodCallback(autoMethodName)(eventTarget);
                }
            }
        }
    };
    MuWidget.prototype.muFindMethod = function (name, context) {
        var obj = context || this;
        //todo: blbne
        while (name.startsWith("parent.")) {
            if (!obj.muParent)
                throw "Widget of class '" + obj.constructor.name + "' has not parent.";
            obj = obj.muParent;
            name = name.substr(7);
        }
        var params = [];
        var p = null;
        if (-1 != (p = name.indexOf(':'))) {
            params = JSON.parse('[' + name.substr(p + 1) + ']');
            name = name.substr(0, p);
        }
        var method = obj[name];
        if (method === undefined)
            throw "Undefined method '" + name + "' in class '" + obj.constructor.name + "'.";
        return {
            method: method,
            args: params,
            context: obj
        };
    };
    MuWidget.prototype.muGetMethodCallback = function (name, context) {
        if (context === void 0) { context = null; }
        var methodInfo = this.muFindMethod(name, context);
        return function (ev /* , event : Event */) {
            /* const callparams = [<MuEvent>{
            sender: event?.target,
            source: source,
            originalEvent: event
            }, ...methodInfo.args, ...Array.from(arguments).slice(1)]; */
            var callparams = __spreadArray(__spreadArray([ev], methodInfo.args, true), (ev.args || []), true);
            return methodInfo.method.apply(methodInfo.context, callparams);
        };
    };
    MuWidget.prototype.muAddEvent = function (eventName, element, callback) {
        element.addEventListener(eventName, callback);
        /* (element as any).addEventListener(eventName, (/*ev : Event* /) => {
        // return callback(this, ev);
        // return callback.apply(null, arguments);
        console.log("muAddEvent:wrapper", arguments);
        return callback(...Array.from(arguments));
        // return callback.apply(null, [this].concat(Array.from(arguments)));
        }); */
    };
    MuWidget.getChildWidgets = function (container) {
        var ls = [];
        for (var _i = 0, _a = container.children; _i < _a.length; _i++) {
            var item = _a[_i];
            if (item.widget)
                ls.push(item.widget);
        }
        return ls;
    };
    MuWidget.registerAll = function () {
        for (var i = 0; i < arguments.length; i++) {
            var classes = arguments[i];
            for (var k in classes)
                MuWidget.widgetClasses[k] = classes[k];
        }
    };
    MuWidget.registerAs = function (c, n) {
        MuWidget.widgetClasses[n] = c;
    };
    MuWidget.startup = function (startElement, onSucces, onBefore) {
        if (startElement === void 0) { startElement = null; }
        if (onSucces === void 0) { onSucces = null; }
        if (onBefore === void 0) { onBefore = null; }
        var fn = window.addEventListener || window.attachEvent || function (type, listener) {
            if (window.onload) {
                var curronload = window.onload;
                var newonload = function (evt) {
                    curronload(evt);
                    listener(evt);
                };
                window.onload = newonload;
            }
            else {
                window.onload = listener;
            }
        };
        fn('load', function () {
            if (onBefore)
                onBefore();
            var element = (startElement || document.documentElement);
            var muRoot = new MuWidget(element);
            muRoot.muInit(element);
            MuWidget.root = muRoot;
            if (onSucces)
                onSucces(muRoot);
        });
    };
    // statics
    MuWidget.widgetClasses = {};
    MuWidget.plugIns = [];
    MuWidget.eventLegacy = false;
    return MuWidget;
}());
function SetAttributes(element, attrs) {
    for (var n in attrs) {
        element.setAttribute(n, attrs[n].toString());
    }
}
var StrParser = /** @class */ (function () {
    function StrParser(str) {
        this.position = 0;
        this.lastMark = null;
        this.debugMode = false;
        this._onEndChunk = false;
        this.str = str;
    }
    StrParser.prototype.findNext = function (chunk, skipChunk) {
        if (skipChunk === void 0) { skipChunk = false; }
        if (typeof chunk === "string")
            chunk = [chunk];
        // let firstPos : number|null = null;
        var firstPos = null;
        var firstChunk = null;
        var firstChunkNum = 0;
        var i = 0;
        for (var _i = 0, chunk_1 = chunk; _i < chunk_1.length; _i++) {
            var ch = chunk_1[_i];
            var pos = this.str.indexOf(ch, this.position);
            if (pos > 0 && (firstPos === null || pos < firstPos)) {
                firstPos = pos;
                firstChunk = ch;
                firstChunkNum = i;
            }
            i++;
        }
        if (firstChunk) {
            if (skipChunk)
                firstPos += firstChunk.length;
            this.position = firstPos;
            this.lastMark = {
                chunk: firstChunk,
                chunkNum: firstChunkNum,
                position: firstPos
            };
            this._onEndChunk = false;
            this.debug("findNext(" + chunk.join('", "') + ") > '" + firstChunk + "', " + this.position);
            return this.lastMark;
        }
        else {
            this.debug("findNext(" + chunk.join('", "') + ") not found " + this.position);
            return null;
        }
    };
    StrParser.prototype.substring = function (start, stop) {
        if (start === void 0) { start = null; }
        if (stop === void 0) { stop = null; }
        if (start === null)
            start = this.position;
        else if (typeof start !== "number")
            start = start.position;
        if (stop === null)
            stop = this.str.length;
        else if (typeof stop !== "number")
            stop = stop.position;
        var res = this.str.substring(start, stop);
        this.debug("substr " + start + ":" + stop + " > " + res);
        return res;
    };
    StrParser.prototype.moverel = function (mov) {
        var newPos = this.position + mov;
        this.position = Math.min(this.str.length, Math.max(0, newPos));
        return { position: this.position };
    };
    StrParser.prototype.pos = function () {
        return { position: this.position };
    };
    StrParser.prototype.toEndChunk = function () {
        var _a, _b;
        var l = this._onEndChunk ? 0 : (((_b = (_a = this.lastMark) === null || _a === void 0 ? void 0 : _a.chunk) === null || _b === void 0 ? void 0 : _b.length) || 0);
        this.moverel(l);
        this._onEndChunk = true;
        this.debug("toEndChunk +" + l.toString());
    };
    StrParser.prototype.debug = function (msg) {
        if (this.debugMode) {
            console.log(msg + "\n		%c" + this.str.substring(0, this.position) + "%c" + this.str.substring(this.position), "background: green; color: white", "color: blue");
        }
    };
    StrParser.prototype.isEnd = function () {
        return this.position >= this.str.length;
    };
    return StrParser;
}());
