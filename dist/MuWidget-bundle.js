class MuBinder {
    static parse(src, element) {
        /*
        source
        source:target
        source::target
        source;target
        sourcer|filter():target
        */
        let mode = "source";
        const optsList = [];
        const sp = new StrParser(src);
        let p;
        let lastP = 0;
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
            let filter = {
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
                    const argStart = sp.pos();
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
                    const sArgs = sp.substring(argStart, p);
                    try {
                        filter.args = MuBinder.useJsonS
                            ? JSONS.parse("[" + sArgs + "]")
                            : JSON.parse("[" + sArgs + "]");
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
            const opts = {
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
    }
    static setDefaults(mbo) {
        const defaults = {};
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
            if (mbo[k] === null)
                mbo[k] = defaults[k];
        }
        const targetAlias = {
            text: "innerText",
            html: "innerHTML"
        };
        if (targetAlias[mbo.target])
            mbo.target = targetAlias[mbo.target];
    }
    static beforeIndexElement(ev) {
        if (ev.opts.bind) {
            const bindSrc = ev.opts.bind;
            for (var mbo of MuBinder.parse(bindSrc, ev.element)) {
                MuBinder.setDefaults(mbo);
                if (!ev.widget.muBindOpts)
                    ev.widget.muBindOpts = {};
                if (!ev.widget.muBindOpts[mbo.source])
                    ev.widget.muBindOpts[mbo.source] = [];
                ev.widget.muBindOpts[mbo.source].push(mbo);
            }
        }
    }
    static register(muWidget) {
        // @ts-ignore
        muWidget.plugIns.push({
            beforeIndexElement: MuBinder.beforeIndexElement
        });
    }
    static bindData(bindOpts, srcData, widget) {
        //todo: . stack overflow
        if (srcData === null)
            return;
        let bindedWidget = false;
        let bindedWidgetParam = false;
        for (const k of [/*'.',*/ ...Object.keys(srcData)]) {
            if (bindOpts[k]) {
                for (const mbo of bindOpts[k]) {
                    if (mbo.forBind) {
                        let val = MuBinder.UseFilters(k === "." ? srcData : srcData[k], mbo.bindFilters, widget, { dataset: srcData });
                        if (k === '@widget')
                            bindedWidget = true;
                        else if (k[0] === '.')
                            bindedWidgetParam = true;
                        MuBinder.setValue(val, mbo.target, mbo.element, widget);
                    }
                }
            }
        }
    }
    static fetchData(bindOpts, widget) {
        let resData = {};
        //todo: . stack overflow
        for (const k of [/*'.',*/ ...Object.keys(bindOpts)]) {
            if (bindOpts[k]) {
                for (const mbo of bindOpts[k]) {
                    if (mbo.forFetch) {
                        /* resData[k] = mbo.element[mbo.target];
                        let val = MuBinder.UseFilters(srcData[k], mbo.bindFilters, widget);
                        ; */
                        const values = MuBinder.UseFilters(MuBinder.GetValue(mbo.target, mbo.element, widget), mbo.fetchFilters, widget, { originalValue: resData[k], dataset: resData });
                        if (k === '.')
                            resData = Object.assign({ resData }, values);
                        else
                            resData[k] = values;
                    }
                }
            }
        }
        return resData;
    }
    static UseFilters(val, filters, widget, ev) {
        var _a, _b;
        for (const filter of filters) {
            let obj = null;
            let fn;
            if (filter.methodName in widget)
                obj = widget; // fn = <MuBindFilterCallback>widget[filter.methodName];
            else if (widget.muParent && filter.methodName in widget.muParent)
                obj = widget.muParent; // fn = <MuBindFilterCallback>widget.muParent[filter.methodName];
            else if (filter.methodName in MuBinder.filters)
                obj = MuBinder.filters; //fn = MuBinder.filters[filter.methodName];
            else {
                // Parent widgets
                let w = (_a = widget.muParent) === null || _a === void 0 ? void 0 : _a.muParent;
                while (w) {
                    if (filter.methodName in w) {
                        obj = w;
                        break;
                    }
                    w = w.muParent;
                }
            }
            if (!obj)
                throw new Error("Unknown filter '" + filter.methodName + "'. Source widget: '" + ((_b = widget === null || widget === void 0 ? void 0 : widget.costructor) === null || _b === void 0 ? void 0 : _b.name) + "'");
            fn = obj[filter.methodName];
            val = fn.call(obj, val, Object.assign({}, ev), ...filter.args);
        }
        return val;
    }
    static setValue(val, target, element, widget) {
        if (target === "@widget") {
            element["widget"].muBindData(val);
        }
        else if (target === "foreach" || target === "@foreach") {
            element.innerHTML = "";
            for (const k in widget.muTemplateParents) {
                if (element === widget.muTemplateParents[k]) {
                    let arr = [];
                    if (!Array.isArray(val)) {
                        for (const k in val) {
                            arr.push({
                                key: k,
                                value: val[k]
                            });
                        }
                    }
                    else
                        arr = val;
                    for (const data of arr) {
                        const widgetParams = {};
                        for (const k in data) {
                            if (k.startsWith("."))
                                widgetParams[k.substr(1)] = data[k];
                        }
                        const itemWidget = widget.muWidgetFromTemplate(k, element, widgetParams);
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
            const addOpt = function (val, text) {
                const opt = document.createElement("option");
                opt.text = text;
                opt.value = val;
                element.add(opt);
            };
            element.innerHTML = "";
            if (Array.isArray(val)) {
                for (const item of val) {
                    if (typeof item === "string")
                        addOpt(item, item);
                    else
                        addOpt(item.value, item.text);
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
    static setDeep(value, object, path) {
        let obj = object;
        const fields = path.split(".");
        const lastI = fields.length - 1;
        let i = 0;
        for (const f of fields) {
            if (i < lastI)
                obj = obj[f];
            else
                obj[f] = value;
            if (!obj)
                throw "Can not set value to path'" + path + "'";
            i++;
        }
    }
    static getDeep(object, path) {
        let obj = object;
        const fields = path.split(".");
        for (const f of fields) {
            if (!(f in obj))
                return undefined;
            obj = obj[f];
        }
        return obj;
    }
    static GetValue(target, element, widget) {
        switch (target) {
            case "@widget":
                return element.widget == widget
                    ? null
                    : element["widget"].muFetchData();
            case "foreach":
            case "@foreach":
                return widget.muGetChildWidgets(element).map(itemWidget => itemWidget.muFetchData());
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
}
MuBinder.useJsonS = true;
MuBinder.filters = {
    toLower: val => {
        return val === null || val === void 0 ? void 0 : val.toString().toLocaleLowerCase();
    },
    toUpper: val => val === null || val === void 0 ? void 0 : val.toString().toLocaleUpperCase(),
    short: (val, ev, maxLen, sufix = "...") => {
        let str = val.toString();
        if (str.length >= maxLen - sufix.length)
            str = str.substr(0, maxLen) + sufix;
        return str;
    },
    tern: (val, ev, onTrue, onFalse) => val ? onTrue : onFalse,
    prepend: (val, ev, prefix, ifAny = false) => !ifAny || val ? prefix + val : val,
    append: (val, ev, prefix, ifAny = false) => !ifAny || val ? val + prefix : val,
    map: (val, ev, map) => map[val],
    // toggleClass: (val, ev, trueClass : string, falseClass : string) =>
};
class MuRouter {
    addRoute(name, re, callback) {
        const route = {
            callback: callback,
            name: name,
            reText: re,
        };
        MuRouter.compileRe(route);
        this.routes[name] = route;
        return this;
    }
    static compileRe(route) {
        const defaultReChunk = "[^/?#]*";
        let p = 0;
        let lastP = 0;
        let re = "";
        let s;
        const rete = route.reText;
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
            let chunk = rete.substring(lastP, p);
            const p1 = chunk.indexOf(" ");
            let reChunk;
            let name;
            if (p1 >= 0) {
                reChunk = chunk.substr(p1 + 1);
                name = chunk.substr(0, p1);
            }
            else {
                reChunk = defaultReChunk;
                name = chunk;
            }
            route.chunks.push({ name: name });
            re += "(" + reChunk + ")";
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
    route(location = null) {
        if (!location)
            location = window.location;
        if (this.pathPrefix) {
            if (typeof location != "string") {
                location = location.pathname + location.search + location.hash;
            }
            location = location.substr(this.pathPrefix.length);
        }
        if (typeof location === "string") {
            let p = location.indexOf("?");
            location = {
                pathname: p >= 0 ? location.substr(0, p) : location,
                search: p >= 0 ? location.substr(p) : "",
                hash: ""
            };
        }
        for (let routeName in this.routes) {
            const route = this.routes[routeName];
            const m = route.re.exec(location.pathname);
            if (!m)
                continue;
            const res = this.parseQueryString(location.search);
            for (let i = 0; i < m.length; i++) {
                if (i > 0) {
                    res[route.paramNames[i - 1]] = decodeURIComponent(m[i]);
                }
            }
            this.updatePersistent(res);
            this.lastName = route.name;
            route.callback({ parameters: res, routeName });
            return route;
            // console.log(m);
        }
        return null;
    }
    makeUrl(name, currParams) {
        let url = "";
        let used = [];
        const params = Object.assign({}, this.persistentValues);
        for (const k in currParams)
            if (currParams[k] !== null)
                params[k] = currParams[k];
        if (!(name in this.routes))
            throw new Error("No route '" + name + "'");
        let route = this.routes[name];
        for (const chunk of route.chunks) {
            if (typeof chunk == "string") {
                url += chunk;
            }
            else {
                url += chunk.name in params ? encodeURIComponent(params[chunk.name]) : "";
                used.push(chunk.name);
            }
        }
        const q = Object.keys(params).filter(k => used.indexOf(k) < 0).sort().map(k => encodeURIComponent(k) + "=" + encodeURIComponent(params[k])).join("&");
        if (q)
            url += "?" + q;
        return this.pathPrefix + url;
    }
    getName(name) {
        if (name)
            this.lastName = name;
        return this.lastName;
    }
    push(name, params = {}) {
        name = this.getName(name);
        this.updatePersistent(params);
        history.pushState({}, null, this.makeUrl(name, params));
    }
    pushUpdate(name, params = {}) {
        name = this.getName(name);
        this.updatePersistent(params, true);
        history.pushState({}, null, this.makeUrl(name, Object.assign(Object.assign({}, this.lastParameters), params)));
    }
    replace(name, params = {}) {
        name = this.getName(name);
        this.updatePersistent(params);
        history.replaceState({}, null, this.makeUrl(name, params));
    }
    update(name, params = {}) {
        name = this.getName(name);
        this.updatePersistent(params, true);
        history.replaceState({}, null, this.makeUrl(name, Object.assign(Object.assign({}, this.lastParameters), params)));
    }
    navigate(name, params = {}) {
        name = this.getName(name);
        this.push(name, params);
        this.routes[name].callback({ parameters: params, routeName: name });
    }
    parseQueryString(queryString) {
        var res = {};
        if (queryString.startsWith("?"))
            queryString = queryString.substr(1);
        for (let item of queryString.split("&")) {
            if (!item)
                continue;
            const p = item.indexOf("=");
            let k;
            let v;
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
    }
    constructor() {
        this.routes = {};
        this.persistentKeys = [];
        this.persistentValues = {};
        this.pathPrefix = "";
        this.lastParameters = {};
        this.lastName = "";
        window.onpopstate = ev => this.route(document.location);
    }
    updatePersistent(res, patch = false) {
        for (let k of this.persistentKeys) {
            if (k in res) {
                const v = res[k];
                if (v !== null)
                    this.persistentValues[k] = v;
                else
                    delete this.persistentValues[k];
            }
        }
        if (patch) {
            for (let k in res) {
                const v = res[k];
                if (v !== null)
                    this.lastParameters[k] = v;
                else
                    delete this.lastParameters[k];
            }
        }
        else
            this.lastParameters = res;
    }
    getParameters() {
        return this.lastParameters;
    }
    prepareAnchor(a, name, params, cancelBubble = false) {
        const fullParams = Object.assign(Object.assign({}, this.persistentValues), params);
        if (a instanceof HTMLAnchorElement)
            a.href = this.makeUrl(name, params);
        a.addEventListener("click", (ev) => {
            ev.preventDefault();
            if (cancelBubble)
                ev.stopPropagation();
            this.navigate(name, fullParams);
        });
    }
}
class MuUIDs {
    static next(k) {
        MuUIDs.counters[k]++;
        return MuUIDs.prefix + MuUIDs.counters[k].toString();
    }
}
MuUIDs.counters = {
    id: 0,
    name: 0
};
MuUIDs.prefix = "_Mu_";
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
// export class MuWidget<TP extends MuWidget = MuWidget<any,{},{}>, TU extends Record<string, any&AnyElement> = {}, TW extends Record<string, any&AnyElement> = {}> {
class MuWidget {
    muWidgetFromTemplate(templateName, container, params = null, position = "last", ref = null) {
        let finalContainer;
        if (typeof container == 'string') {
            var containerName = container;
            finalContainer = this.ui[container];
            if (!finalContainer)
                throw new Error("Container with mu-id='" + containerName + "' not exists.");
        }
        else
            finalContainer = container;
        var tmpElemementType = "div";
        let templateContent;
        if (typeof templateName === "string") {
            templateContent = this.muFindTemplate(templateName);
            if (!templateContent)
                throw "No template named '" + templateName + "'.";
        }
        else {
            templateContent = templateName.html;
        }
        var tmpTemplate = templateContent;
        tmpTemplate = tmpTemplate.toLowerCase();
        if (tmpTemplate.startsWith('<tr'))
            tmpElemementType = "tbody";
        if (tmpTemplate.startsWith('<td') || tmpTemplate.startsWith('<th'))
            tmpElemementType = "tr";
        if (tmpTemplate.startsWith('<tbody') || tmpTemplate.startsWith('<thead') || tmpTemplate.startsWith('<tfoot'))
            tmpElemementType = "table";
        var element = document.createElementNS((finalContainer || this.container).namespaceURI, tmpElemementType);
        element.innerHTML = templateContent;
        element = element.firstElementChild;
        // const element = this.createElementFromHTML(templateContent, container || this.container);
        // if (params) element.setAttribute('mu-params', JSON.stringify(params));
        if (finalContainer) {
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
        }
        let widget = this.muActivateWidget(element, null, params || {}, typeof templateName === "string" ? null : templateName);
        let opts = this.muGetElementOpts(element);
        if (!opts.id)
            opts.id = (typeof templateName === "string") ? templateName : null;
        this.muAddEvents(opts, element, widget);
        return widget;
    }
    muAppendContent(html) {
        this.container.innerHTML += html;
    }
    createElementFromHTML(src, container) {
        let lSrc = src.toLowerCase();
        let tmpElemementType = "div";
        if (lSrc.startsWith('<tr'))
            tmpElemementType = "tbody";
        if (lSrc.startsWith('<td') || lSrc.startsWith('<th'))
            tmpElemementType = "tr";
        if (lSrc.startsWith('<tbody') || lSrc.startsWith('<thead') || lSrc.startsWith('<tfoot'))
            tmpElemementType = "table";
        let element = document.createElementNS(container.namespaceURI, tmpElemementType);
        element.innerHTML = src;
        element = element.firstElementChild;
        return element;
    }
    muRemoveSelf() {
        if (this.container.parentNode)
            this.container.parentNode.removeChild(this.container);
    }
    muGetChildWidgets(container) {
        return MuWidget.getChildWidgets((typeof container === "string")
            ? this.ui[container]
            : container);
    }
    muBindList(list, templateName, container, commonParams = {}, finalCalback = null) {
        var res = [];
        for (const item of list) {
            var params = Object.assign(Object.assign({}, item), (typeof commonParams === "function" ? commonParams(item) : commonParams));
            var widget = this.muWidgetFromTemplate(templateName, container, params);
            if (finalCalback)
                finalCalback(widget, item);
            res.push(widget);
        }
        return res;
    }
    muVisible(state, control) {
        if (Array.isArray(control)) {
            for (const controlItem of control)
                this.muVisible(state, controlItem);
        }
        else {
            let neg = false;
            if (typeof control === 'string') {
                if (control.startsWith('!')) {
                    neg = true;
                    control = control.substring(1);
                }
                if (control === ".")
                    control = this.container;
                else if (!(control in this.ui))
                    throw new Error("Control with mu-id='" + control + "' not found.");
                else
                    control = this.ui[control];
            }
            //@ts-ignore
            if (state === "toggle")
                state = control.style.display === "none";
            //@ts-ignore
            control.style.display = state !== neg ? null : "none";
        }
    }
    muBindData(srcData) {
        //@ts-ignore
        MuBinder.bindData(this.muBindOpts, srcData, this);
        this.muAfterBindData(srcData);
    }
    muFetchData() {
        //@ts-ignore
        return MuBinder.fetchData(this.muBindOpts, this);
    }
    // protected muRegisterEvent(...args) { }
    // public addEventListener(name : string, handler : (...args)=>void) { }
    // public muEventNames() : string[] { return []; }
    muAfterBindData(data) { }
    constructor(container) {
        this.ui = {}; //Record<string, AnyElementA> = {};
        this.muOpts = {};
        this.muWidgetEventHandlers = {};
        this.muIndexOpts = null;
        this.muSubWidgets = [];
        this.muNamedWidget = {}; // Record<string, MuWidget> = {};
        //@ts-ignore
        this.muRoot = this;
        this.muTemplates = {};
        this.muTemplateParents = {};
        this.muOnAfterIndex = [];
        this.muBindOpts = {};
        this.container = container;
    }
    // public constructor(container : AnyElement)
    muInit(container) {
        this.muOnAfterIndex = [];
        this.ui = {};
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
        //@ts-ignore
        this.container.widget = this;
        this.muSubWidgets = [];
        this.muNamedWidget = {};
        this.muTemplates = {};
        this.muTemplateParents = {};
        //@ts-ignore
        this.muRoot = this;
        this.muWidgetEventHandlers = {};
        this.beforeIndex();
        this.muAddEvents({ id: 'container' }, this.container);
        this.muIndexTree(this.container, true);
    }
    beforeIndex() { }
    muDispatchEvent(name, ...args) {
        if (!(name in this.muWidgetEventHandlers))
            throw new Error("Unknown event '" + name + "' on class '" + this.constructor.name + "'.");
        if (this.muWidgetEventHandlers[name]) {
            // const args = Array.from(arguments);
            // args[0] = <MuEvent>{
            const ev = {
                sender: this,
                originalEvent: event,
                args: Array.from(arguments).slice(1)
            };
            //console.log(args, arguments);
            /* for(const handler of this.muWidgetEventHandlers[name])
            handler.apply(this, args); */
            for (let i = 0, l = this.muWidgetEventHandlers[name].length; i < l; i++) {
                const handler = this.muWidgetEventHandlers[name][i];
                handler.call(this, ev);
            }
        }
    }
    muRegisterEvent(...args) {
        // for(var i = 0; i < arguments.length; i++) this.muWidgetEventHandlers[arguments[i]] = [];
        for (const eventName of args)
            this.muWidgetEventHandlers[eventName] = [];
    }
    addEventListener(name, handler) {
        if (!(name in this.muWidgetEventHandlers))
            throw new Error("Unknown event '" + name + "' on class '" + this.constructor.name + "'.");
        this.muWidgetEventHandlers[name].push(handler);
    }
    muEventNames() {
        return Object.keys(this.muWidgetEventHandlers);
    }
    muActivateWidget(element, opts, extraParams = {}, widgetDef = null) {
        if (!opts)
            opts = this.muGetElementOpts(element);
        const widgetName = opts.widget;
        let widget;
        if (widgetDef) {
            if (widgetDef.classInstance) {
                widget = widgetDef.classInstance;
                widget.container = element;
            }
            else if (widgetDef.classType) {
                widget = new widgetDef.classType(element, opts);
            }
        }
        let c = null;
        if (!widget) {
            c = MuWidget.widgetClasses[widgetName] || window[widgetName];
            if (!c)
                throw "Class '" + opts.widget + "' is not defined.";
            widget = new c(element, opts);
        }
        if (!(widget instanceof MuWidget)) {
            if (MuWidget.fixOldWidgets) {
                if (MuWidget.fixOldWidgets !== "silent")
                    console.error("Widget '" + widgetName + "' is not a descendant of the MuWidget class.");
                // extends prototype, class.prototype can not be enumarated
                //@ts-ignore
                if (c === null)
                    c = { prototype: widget.__proto__ };
                for (var k of [
                    'addEventListener', 'addEventListener(name, handler)', 'beforeIndex', 'createElementFromHTML', 'muActivateWidget', 'muAddEvent', 'muAddEvents',
                    'muAddUi', 'muAfterBindData', 'muBindData', 'muBindList', 'muCallPlugin', 'muDispatchEvent', 'muEventNames', 'muFetchData', 'muFindMethod',
                    'muFindTemplate', 'muGetChildWidgets', 'muGetElementOpts', 'muGetMethodCallback', 'muIndexTree', 'muInit', 'muRegisterEvent', 'muRemoveSelf',
                    'muVisible', 'muWidgetFromTemplate', 'muGetRoot'
                ])
                    if (!c.prototype[k])
                        c.prototype[k] = MuWidget.prototype[k];
                c.prototype.muIndexForm = function (form) {
                    if (!form) {
                        if (this.container.tagName == 'FORM')
                            form = this.container;
                        else
                            form = this.container.querySelector('form');
                    }
                    if (form) {
                        this.muAddUi('form', form);
                        this.muAddEvents({ id: 'form' }, form);
                        for (var i = 0, l = form.elements.length; i < l; i++) {
                            var element = form.elements[i];
                            this.muAddUi(element.name, element);
                            this.muAddEvents({ id: element.name }, element);
                        }
                    }
                };
            }
            else
                throw "Widget '" + widgetName + "' is not a descendant of the MuWidget class.";
        }
        widget.muParent = this;
        //@ts-ignore
        widget.muRoot = this.muRoot || this;
        if (opts.params) {
            const params = typeof opts.params === "string"
                ? (MuWidget.paramJsonS
                    ? JSONS.parse(opts.params)
                    : JSON.parse(opts.params))
                : opts.params;
            for (const k in params) {
                widget[k] = params[k];
            }
        }
        if (extraParams) {
            for (const k in extraParams) {
                widget[k] = extraParams[k];
            }
        }
        // MuWidget.extendPrototype(widget);
        this.muSubWidgets.push(widget);
        //@ts-ignore
        if (opts.id)
            this.muNamedWidget[opts.id] = widget;
        // MuWidget.call(widget, element, /*opts.opts || this.muOpts */);
        widget.muInit(element);
        return widget;
    }
    muGetElementOpts(element) {
        var res = {};
        // Convert simplified syntax id:widget@template
        const simpleAttributeName = this.muOpts.attributePrefix.substring(0, this.muOpts.attributePrefix.length - 1);
        const simpleAttributeValue = element.getAttribute(simpleAttributeName);
        const ire = MuWidget.identifierRe;
        if (simpleAttributeValue) {
            const m = simpleAttributeValue.match('(' + ire + ')? *(:(' + ire + '))? *(@(' + ire + '))? *(#(.*))?');
            if (m) {
                if (m[1])
                    element.setAttribute(this.muOpts.attributePrefix + 'id', m[1]);
                if (m[3])
                    element.setAttribute(this.muOpts.attributePrefix + 'widget', m[3]);
                if (m[5])
                    element.setAttribute(this.muOpts.attributePrefix + 'template', m[5]);
                if (m[7])
                    element.setAttribute(this.muOpts.attributePrefix + 'bind', m[7]);
                element.removeAttribute(simpleAttributeName);
            }
        }
        // other mu- parameters
        for (var i = 0, attributes = element.attributes, n = attributes.length, arr = []; i < n; i++) {
            var name = attributes[i].nodeName;
            if (name.startsWith(this.muOpts.attributePrefix)) {
                var optName = name.substr(this.muOpts.attributePrefix.length);
                res[optName] = attributes[i].nodeValue;
            }
        }
        return res;
    }
    muFindTemplate(templateName) {
        let tmpTemplate = null;
        if (templateName.startsWith("shared:")) {
            let aTemplateName = templateName.substr(7);
            tmpTemplate = MuWidget.sharedTemplates[aTemplateName];
        }
        else if (templateName.startsWith("ancestor:")) {
            let aTemplateName = templateName.substr(9);
            //@ts-ignore
            let w = this;
            while (w) {
                if (w.muTemplates[aTemplateName]) {
                    tmpTemplate = w.muTemplates[aTemplateName];
                    break;
                }
                w = w.muParent;
            }
        }
        else {
            tmpTemplate = this.muTemplates[templateName];
        }
        return tmpTemplate;
    }
    muIndexTree(element, indexWidget, useName = null) {
        var _a;
        //@ts-ignore
        var ev = { element: element, widget: this, opts: this.muGetElementOpts(element) };
        if (indexWidget) {
            this.muMetaData = {
                id: ev.opts.id,
                widget: this.constructor.name,
            };
        }
        //TODO: MuBinder
        // this.muCallPlugin("indexPrepareElement", ev);
        if (!ev.element)
            return;
        element = ev.element;
        var opts = ev.opts;
        if (opts.usetemplate) {
            var src = this.muFindTemplate(opts.usetemplate);
            // element.outerHTML = src;
            if (typeof src === "undefined")
                throw new Error("Template '" + opts.usetemplate + "' not exists.");
            var newElement = this.createElementFromHTML(src, element.parentNode);
            element.parentNode.insertBefore(newElement, element);
            element.parentNode.removeChild(element);
            element = newElement;
            if (opts.id)
                element.setAttribute(this.muOpts.attributePrefix + "id", opts.id);
            if (opts.params)
                element.setAttribute(this.muOpts.attributePrefix + "params", opts.params);
            if (opts.widget)
                element.setAttribute(this.muOpts.attributePrefix + "widget", opts.widget);
            if (opts.template)
                element.setAttribute(this.muOpts.attributePrefix + "template", opts.template);
            opts = this.muGetElementOpts(element);
        }
        if (opts.preproc) {
            this.preproc(element, opts.preproc);
        }
        this.muIndexOpts = opts;
        useName = useName || opts.usename;
        if (useName) {
            const n = (_a = element.attributes.getNamedItem("name")) === null || _a === void 0 ? void 0 : _a.value;
            if (n)
                opts.id = n;
        }
        if (opts.noindex)
            return;
        if (opts.template) {
            element.removeAttribute(this.muOpts.attributePrefix + "template");
            if (opts.template.startsWith("shared:")) {
                const name = opts.template.substring(7);
                if (name in MuWidget.sharedTemplates)
                    console.error("The widget already contains template '" + opts.template + "'.");
                MuWidget.sharedTemplates[name] = element.outerHTML;
            }
            else {
                if (opts.template in this.muTemplates)
                    console.error("The widget already contains template '" + opts.template + "'.");
                this.muTemplates[opts.template] = element.outerHTML;
                this.muTemplateParents[opts.template] = element.parentNode;
            }
            if (element.parentNode)
                element.parentNode.removeChild(element);
            return;
        }
        if (opts.id && element != this.container)
            this.muAddUi(opts.id, element);
        // if (opts.bind) this.muParseBinds(opts.bind, element);
        ev.opts = opts;
        this.muCallPlugin("beforeIndexElement", ev);
        if ((!opts.widget || indexWidget) && !opts.nocontent && element.children) {
            // Index children
            var elements = [];
            // Create copy, template modify children
            for (const el of element.children)
                elements.push(el);
            for (const el of elements) {
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
        this.muCallPlugin("afterIndexElement", ev);
    }
    muAddUi(id, element) {
        if (id in this.ui)
            console.error("The widget '" + /*this.muGetIdentification()*/ this.muIndexOpts.widget + "#" + this.muIndexOpts.id + "' already contains an element with mu-id '" + id + "'.");
        //@ts-ignore
        this.ui[id] = element;
    }
    /* muGetIdentification() {
    return this.muIndexOpts.widget + (this.muIndexOpts.id ? "#" + this.muIndexOpts.id : "");
    } */
    muCallPlugin(eventName, eventArgs) {
        for (var plugin of MuWidget.plugIns) {
            if (plugin[eventName])
                plugin[eventName](eventArgs);
        }
    }
    afterIndex() { }
    preproc(element, preproc) {
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
        const mode = pp.prototype.preproc ? "class" : "function";
        if (mode === "function")
            paramsStr = "[" + paramsStr + "]";
        else
            paramsStr = "{" + paramsStr + "}";
        try {
            var params = paramsStr
                ? (MuWidget.paramJsonS
                    ? JSONS.parse(paramsStr)
                    : JSON.parse(paramsStr))
                : null;
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
    }
    muAddEvents(opts, element, widget = null) {
        var autoMethodName;
        var eventNames = [...this.muOpts.bindEvents];
        var wEvents = [];
        if (widget) {
            wEvents = widget.muEventNames();
            eventNames = [...new Set([...eventNames, ...wEvents])];
        }
        var tags = opts.tag ? opts.tag.split(" ") : null;
        for (var i = 0, l = eventNames.length; i < l; i++) {
            const eventName = eventNames[i];
            const eventTarget = (widget && wEvents.indexOf(eventName) >= 0) ? widget : element;
            let methodName = opts[eventName];
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
            const eventTarget = element;
            for (var i = 0, l = tags.length; i < l; i++) {
                autoMethodName = tags[i] + this.muOpts.autoMethodNameSeparator + "init";
                if (autoMethodName in this) {
                    this.muGetMethodCallback(autoMethodName)(eventTarget);
                }
            }
        }
    }
    muFindMethod(name, context) {
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
            const jsrc = '[' + name.substr(p + 1) + ']';
            params = MuWidget.paramJsonS
                ? JSONS.parse(jsrc)
                : JSON.parse(jsrc);
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
    }
    muGetMethodCallback(name, context = null) {
        const methodInfo = this.muFindMethod(name, context);
        return (ev /* , event : Event */) => {
            const callparams = [ev, ...methodInfo.args, ...(ev.args || [])];
            return methodInfo.method.apply(methodInfo.context, callparams);
        };
    }
    muAddEvent(eventName, element, callback) {
        element.addEventListener(eventName, callback);
        /* (element as any).addEventListener(eventName, (/*ev : Event* /) => {
        // return callback(this, ev);
        // return callback.apply(null, arguments);
        console.log("muAddEvent:wrapper", arguments);
        return callback(...Array.from(arguments));
        // return callback.apply(null, [this].concat(Array.from(arguments)));
        }); */
    }
    muGetRoot() {
        //@ts-ignore
        return this.muParent ? this.muParent.muGetRoot() : this;
    }
    muDebugGetClasses() {
        const uniqueClasses = new Set();
        this.container.querySelectorAll('[class]').forEach(function (element) {
            element.classList.forEach(function (className) {
                uniqueClasses.add(className);
            });
        });
        return Array.from(uniqueClasses);
    }
    static getChildWidgets(container) {
        const ls = [];
        for (const item of container.children) {
            if (item.widget)
                ls.push(item.widget);
        }
        return ls;
    }
    static registerAll() {
        for (var i = 0; i < arguments.length; i++) {
            var classes = arguments[i];
            for (var k in classes)
                MuWidget.widgetClasses[k] = classes[k];
        }
    }
    static registerAs(c, n) {
        MuWidget.widgetClasses[n] = c;
    }
    static startup(startElement = null, onSucces = null, onBefore = null) {
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
    }
    static getWidget(el) {
        while (el) {
            if (el.widget)
                return el.widget;
            //@ts-ignore
            el = el.parentElement;
        }
        return null;
    }
}
MuWidget.fixOldWidgets = false;
MuWidget.sharedTemplates = {};
/*
use json simplified in params
true - always
false - newer
string - if content begining defined string
*/
MuWidget.paramJsonS = '!';
MuWidget.identifierRe = '[a-zA-Z_.][0-9a-zA-Z_.]*';
// statics
MuWidget.widgetClasses = {};
MuWidget.plugIns = [];
MuWidget.eventLegacy = false;
function SetAttributes(element, attrs) {
    for (const n in attrs) {
        element.setAttribute(n, attrs[n].toString());
    }
}
// export class MuWidget extends MuWidgetTyped<MuWidget, {}, {}> { }
class StrParser {
    constructor(str) {
        this.position = 0;
        this.lastMark = null;
        this.debugMode = false;
        this.storedPositions = {};
        this._onEndChunk = false;
        this.str = str;
    }
    findNext(chunk, skipChunk = false) {
        if (typeof chunk === "string")
            chunk = [chunk];
        // let firstPos : number|null = null;
        let firstPos = null;
        let firstChunk = null;
        let firstChunkNum = 0;
        let i = 0;
        for (const ch of chunk) {
            const pos = this.str.indexOf(ch, this.position);
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
            this.debug("findNext(", chunk, ") > '" + firstChunk + "', " + this.position);
            return this.lastMark;
        }
        else {
            this.debug("findNext(", chunk, ") not found " + this.position);
            return null;
        }
    }
    substring(start = null, stop = null) {
        if (start === null)
            start = this.position;
        else if (typeof start === "string")
            start = this.loadPos(start);
        else if (typeof start !== "number")
            start = start.position;
        if (stop === null)
            stop = this.str.length;
        else if (typeof stop === "string")
            stop = this.loadPos(stop);
        else if (typeof stop !== "number")
            stop = stop.position;
        const res = this.str.substring(start, stop);
        this.debug("substr " + start + ":" + stop + " > " + res);
        return res;
    }
    moverel(mov) {
        const newPos = this.position + mov;
        this.position = Math.min(this.str.length, Math.max(0, newPos));
        return { position: this.position };
    }
    pos() {
        return { position: this.position };
    }
    loadPos(name) {
        if (name === '.')
            return this.position;
        else if (name === '>')
            return this.str.length;
        return this.storedPositions[name];
    }
    savePos(name) {
        this.storedPositions[name] = this.position;
    }
    toEndChunk() {
        var _a, _b;
        const l = this._onEndChunk ? 0 : (((_b = (_a = this.lastMark) === null || _a === void 0 ? void 0 : _a.chunk) === null || _b === void 0 ? void 0 : _b.length) || 0);
        this.moverel(l);
        this._onEndChunk = true;
        this.debug("toEndChunk +" + l.toString());
    }
    debug(...msgs) {
        if (this.debugMode) {
            const msg = msgs.map(ch => typeof ch === "string" ? ch : JSON.stringify(ch)).join('');
            // console.log(msg + "\n	" + this.position + "	%c" + this.str.substring(0, this.position) + "%c" + this.str.substring(this.position), "background: green; color: white", "color: blue");
            console.log(msg + "\n	" + this.position + "	" + this.str.substring(0, this.position) + "|" + this.str.substring(this.position));
        }
    }
    isEnd() {
        return this.position >= this.str.length;
    }
    startsWith(chunk, skipChunk = false, saveLast = true) {
        if (typeof chunk === "string")
            chunk = [chunk];
        // let firstPos : number|null = null;
        let firstPos = null;
        let firstChunk = null;
        let firstChunkNum = 0;
        let i = 0;
        for (const ch of chunk) {
            const stw = this.str.startsWith(ch, this.position);
            if (stw) {
                const mark = {
                    chunk: ch,
                    chunkNum: i,
                    position: this.position
                };
                if (saveLast)
                    this.lastMark = mark;
                if (skipChunk)
                    this.position += ch.length;
                this.debug("startsWith(", chunk, ") > '" + ch + "'");
                return mark;
            }
            i++;
        }
        this.debug("startsWith(", chunk, ") > not found");
        return null;
    }
    skipChunks(chunks) {
        while (this.startsWith(chunks, true, false))
            ;
    }
}
class MuLabelFor {
    beforeIndexElement(ev) {
        if (ev.opts.for) {
            const id = ev.opts.for;
            const iddb = getIdDb(ev.widget);
            if (id.startsWith("error:")) {
                const ids = id.substr(6).split(",").map(s => s.trim());
                for (const eid of ids) {
                    if (ev.widget.ui[eid]) {
                        ev.widget.ui[eid].errorLabel = ev.element;
                    }
                    else if (iddb["bind:" + eid]) {
                        iddb["bind:" + eid].errorLabel = ev.element;
                    }
                    else {
                        iddb["error:" + eid] = ev.element;
                    }
                }
            }
            else {
                if (!iddb[id])
                    iddb[id] = MuUIDs.next("id");
                const did = iddb[id];
                ev.element.setAttribute("for", did);
                if (ev.widget.ui[id])
                    ev.widget.ui[id].id = did;
                if (iddb["bind:" + id])
                    iddb["bind:" + id].id = did;
            }
        }
        if (ev.opts.id || (this.alsoUseBind && ev.opts.bind)) {
            const id = ev.opts.id || ev.opts.bind;
            const iddb = getIdDb(ev.widget);
            if ((this.alsoUseBind && ev.opts.bind))
                iddb["bind:" + ev.opts.bind] = ev.element;
            if (iddb[id])
                ev.element.id = iddb[id];
            if (iddb["error:" + id])
                ev.element.errorLabel = iddb["error:" + id];
        }
        if (ev.opts.name) {
            const iddb = getIdDb(ev.widget);
            const k = "name:" + ev.opts.name;
            if (!iddb[k])
                iddb[k] = MuUIDs.next("name");
            ev.element.setAttribute("name", iddb[k]);
        }
    }
    static register(muWidget, alsoUseBind = false) {
        const inst = new MuLabelFor(alsoUseBind);
        muWidget.plugIns.push({
            beforeIndexElement: (ev) => inst.beforeIndexElement(ev)
        });
    }
    /**
    *
    */
    constructor(alsoUseBind = false) {
        this.alsoUseBind = alsoUseBind;
    }
}
function getIdDb(widget) {
    if (!widget.muPluginMuLabelFor)
        widget.muPluginMuLabelFor = {};
    return widget.muPluginMuLabelFor;
}
class JSONS {
    static parse(src) {
        const par = new JSONS();
        par.tokenize(src);
        return par.parseCollection();
    }
    constructor() {
        this.chunkToType = {
            ":": "colon",
            ",": "comma",
            "\n": "newLine",
            "{": "oOpen",
            "}": "oClose",
            "[": "aOpen",
            "]": "aClose",
        };
        this.specValues = {
            'null': null,
            'true': true,
            'false': false,
            'undefined': undefined,
        };
        this.stringTermChunks = [...Object.keys(this.chunkToType), "\\", "#", "/*"];
        this.tokens = [];
        this.tokenI = 0;
        this.collectionDeep = 0;
    }
    tokenize(src) {
        const res = [];
        src = src.replace(/\r\n/g, "\n");
        const sp = new StrParser(src);
        // sp.debugMode = true;
        let lastPos = 0;
        while (!sp.isEnd()) {
            sp.skipChunks([" ", "\t"]);
            if (sp.startsWith(['#', '//'], true)) { // line comment
                sp.findNext("\n", true);
            }
            else if (sp.startsWith('/*', true)) { // block comment
                let d = 1;
                while (d) {
                    const ch = sp.findNext(['/*', '*/'], true);
                    if (!ch)
                        throw new JSONSError('Incomplete block comment'); // EXC uncosed comment
                    if (ch.chunk === '/*')
                        d++;
                    else
                        d--;
                }
            }
            else if (sp.startsWith(Object.keys(this.chunkToType), true)) { // control chars
                const t = this.chunkToType[sp.lastMark.chunk];
                if (t !== "newLine")
                    res.push({
                        type: t,
                        value: null,
                        pos: sp.lastMark.position,
                    });
            }
            else if (sp.startsWith(["'", '"'], true)) { // enclosed string
                const q = sp.lastMark.chunk;
                const strBegin = sp.position;
                sp.savePos('stringBegin');
                let str = "";
                let strEnd = false;
                while (!strEnd) {
                    if (sp.findNext(['\\"', "\\'", q])) {
                        const strPart = sp.substring('stringBegin', '.');
                        // console.log(['++', strPart, str]);
                        str += strPart;
                        sp.toEndChunk();
                        sp.savePos('stringBegin');
                        // console.log('Str chunk: ' + sp.lastMark.chunk);
                        switch (sp.lastMark.chunk) {
                            case '\\"':
                                str += "\\\"";
                                break;
                            case "\\'":
                                str += "'";
                                break;
                            default:
                                strEnd = true;
                                break;
                        }
                    }
                    else
                        throw new JSONSError('missing the right quotation mark'); // EXC unclosed quote
                }
                let i = 0;
                str = str.replace(/\n/g, "\\n");
                // console.log(["JSSTR [" + str + "]", ...[...str].map(c=>(i++) + ": " + c)]);
                res.push({
                    type: "value",
                    value: JSON.parse('"' + str + '"'),
                    pos: strBegin,
                });
            }
            else { // unenclosed string
                sp.savePos('stringBegin');
                const ch = sp.findNext(this.stringTermChunks, false);
                const valStr = sp.substring('stringBegin', ch ? '.' : '>').trim();
                const valStrL = valStr.toLowerCase();
                res.push({
                    type: "value",
                    value: Object.keys(this.specValues).includes(valStrL)
                        ? this.specValues[valStrL]
                        // @ts-ignore
                        : (!isNaN(valStr)
                            ? parseFloat(valStr)
                            : valStr),
                    pos: sp.loadPos('stringBegin'),
                });
                if (!ch)
                    break;
            }
            if (lastPos === sp.position) {
                // console.log(["Zacyklilo se.", ...res]);
                throw Error('The parsing is looping. Please create an issue and attach the source text for parsing. https://github.com/murdej/MuWidget2/issues');
            }
            lastPos = sp.position;
        }
        this.tokens = res;
        return res;
    }
    curToken(shift = 0) {
        var _a;
        return (_a = this.tokens[this.tokenI + shift]) !== null && _a !== void 0 ? _a : null;
    }
    nextToken() {
        var _a;
        this.tokenI++;
        return (_a = this.tokens[this.tokenI]) !== null && _a !== void 0 ? _a : null;
    }
    parseCollection() {
        let type;
        const t = this.curToken();
        if (t.type === "aOpen") {
            type = "array";
            this.nextToken();
        }
        else if (t.type === "oOpen") {
            type = "object";
            this.nextToken();
        }
        else if (t.type === "value") { // autodetect
            const nt = this.curToken(1);
            if (nt === null)
                return t.value;
            type = nt.type === "colon" ? "object" : "array";
        }
        if (type === "object") {
            const res = {};
            while (this.curToken()) {
                let ct = this.curToken();
                // end of collection
                if (ct.type === "oClose") {
                    // this.nextToken();
                    return res;
                }
                // key : ....
                if (ct.type === "value") {
                    const key = ct.value;
                    ct = this.nextToken();
                    // collon
                    if (ct.type !== "colon")
                        throw new JSONSError("Expected ':' ", ct);
                    ct = this.nextToken();
                    switch (ct.type) {
                        case "value":
                            res[key] = ct.value;
                            break;
                        case "aOpen":
                        case "oOpen":
                            res[key] = this.parseCollection();
                            break;
                        default:
                            throw new JSONSError("Expected value or [ or { or }", ct);
                    }
                    // optional comma
                    ct = this.nextToken();
                    if (ct.type === "comma")
                        this.nextToken();
                }
                else
                    throw new JSONSError("Expected property name ", ct);
            }
            return res;
        }
        else {
            const res = [];
            while (this.curToken()) {
                let ct = this.curToken();
                // end of collection
                if (ct.type === "aClose") {
                    // this.nextToken();
                    return res;
                }
                switch (ct.type) {
                    case "value":
                        res.push(ct.value);
                        break;
                    case "aOpen":
                    case "oOpen":
                        res.push(this.parseCollection());
                        break;
                    default:
                        throw new JSONSError("Expected value or [ or { or }", ct);
                }
                // optional comma
                ct = this.nextToken();
                if (ct && ct.type === "comma")
                    this.nextToken();
            }
            return res;
        }
    }
}
class JSONSError extends Error {
    constructor(message, token = null) {
        super(message + (token
            ? " position: " + token.pos + " [" + token.type + (token.type === "value" ? ": " + JSON.stringify(token.value) + ']' : '')
            : ""));
        this.name = "JSONSError";
        // this.token = token;
    }
}
