

class MuBinder {
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
}
}

type MuBindFilterCallback = (val: any, ev?: MuBindFilterEv, ...args: any[]) => any;

type MuBindOpts = {
forBind: boolean,
forFetch: boolean,
source: string,
target: string | null,
bindFilters: MuBindFilter[],
fetchFilters: MuBindFilter[],
element: AnyElement,
}

type MuBindFilter = {
methodName: string,
args: any[]
}

type MuBindFilterEv = {
originalValue: any,
dataset: Record<string|number, any>,
}

class MuRouter
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

if (name[0] === '/') {
prefix = '/';
}

route.chunks.push({name, prefix});
re += "(" + prefix + reChunk + ")" + (defaultValue !== undefined ? '+' : '');
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
for(let i = 0; i < m.length; i++)
{
if (i > 0) {
res[route.paramNames[i - 1]] = decodeURIComponent(m[i]);
}
}
this.updatePersistent(res);
this.lastName = route.name;
this.lastParameters
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
url += chunk.name in params ? encodeURIComponent(params[chunk.name]) : "";
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

public push(name : string|null, params : MuParameters = {})
{
name = this.getName(name);
this.updatePersistent(params);
history.pushState({}, null, this.makeUrl(name, params));
}

public pushUpdate(name : string|null, params : MuParameters = {})
{
name = this.getName(name);
this.updatePersistent(params, true);
history.pushState({}, null, this.makeUrl(name, { ...this.lastParameters, ...params }));
}

public replace(name : string|null, params : MuParameters = {})
{
name = this.getName(name);
this.updatePersistent(params);
history.replaceState({}, null, this.makeUrl(name, params));
}

public update(name : string|null, params : MuParameters = {})
{
name = this.getName(name);
this.updatePersistent(params, true);
history.replaceState({}, null, this.makeUrl(name, { ...this.lastParameters, ...params }));
}

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
window.onpopstate = ev => this.route(document.location)
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
chunks : (string|{name : string, prefix: string})[]
}

type MuParameters = Record<string,string|true|null>;

type MuRouterContext = {
parameters: MuParameters;
routeName : string;
origin: MuRouterOrigin;
}

type MuRouterOrigin = 'link'|'route'|'other'|string;


class MuUIDs {
public static counters : Counters = {
id: 0,
name: 0
}

public static prefix = "_Mu_";

public static next(k : keyof Counters) : string
{
MuUIDs.counters[k]++;
return MuUIDs.prefix + MuUIDs.counters[k].toString();
}

}

type Counters = {
id: number,
name: number
}
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
class MuWidget<TP = MuWidget<any, any, any>, TU extends Record<string, any&AnyElement> = {}, TW extends Record<string, any&AnyElement> = {}> {

public static fixOldWidgets: boolean|"silent" = false;

public static sharedTemplates: Record<string, string> = {};

public ui : MuUi<TU> = {} as unknown as MuUi<TU>; //Record<string, AnyElementA> = {};

public muOpts: MuOpts = {} as MuOpts;

protected muWidgetEventHandlers : Record<string, MuHandler[]> = {};

protected muIndexOpts: MuWidgetOpts|null = null;

public static paramJsonS: boolean = true;

public muWidgetFromTemplate(
templateName : string|{html:string,classType?:any,classInstance?:any},
container : string|AnyElement|null,
params : Record<string, any>|((widget : MuWidget)=>Record<string, any>)|null = null,
position : "first"|"before"|"after"|"last" = "last",
ref : AnyElement|null = null) : MuWidget

{
const finalContainer = this.muGetContainer(container);

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

this.muPlaceElement(
element,
finalContainer,
position,
ref,
);

let widget = this.muActivateWidget(element, null, params || {}, typeof templateName === "string" ? null : templateName);
let opts = this.muGetElementOpts(element);
if (!opts.id) opts.id = (typeof templateName === "string") ? templateName : null;
this.muAddEvents(opts, element, widget)

return widget;
}

protected muGetContainer(
container : string|AnyElement|null,
): AnyElement|null {
let finalContainer : AnyElement = null;
if (typeof container == 'string')
{
var containerName = container;
finalContainer = this.ui[container];
if (!finalContainer) throw new Error("Container with mu-id='" + containerName + "' not exists.");
} else finalContainer = container as AnyElement;

return finalContainer;
}

protected muPlaceElement(
element: AnyElement,
finalContainer : AnyElement,
position : "first"|"before"|"after"|"last" = "last",
ref : AnyElement|null = null,
) {
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

public muCreateWidget<T=MuWidget>(
widgetName : string,
container : string|AnyElement|null,
params : Record<string, any>|((widget : MuWidget)=>Record<string, any>)|null = null,
elementName = 'div',
position : "first"|"before"|"after"|"last" = "last",
ref : AnyElement|null = null,
) : T {
const finalContainer = this.muGetContainer(container);
const element = document.createElementNS(finalContainer.namespaceURI, elementName) as AnyElement;
element.setAttribute("mu-widget", widgetName);
this.muPlaceElement(element, finalContainer, position, ref)
// @ts-ignore
const cWidget = new MuWidget(finalContainer);
const widget = cWidget.muActivateWidget(
// @ts-ignore
element,
{
widget: widgetName,
},
{ muParent: this, ...params }
) as unknown as T;

return widget;
}

muAppendContent(html: string): void {
for (const node of this.createNodeArrayFromHTML(html, this.container)) {
this.container.appendChild(node);
}
// this.container.innerHTML += html;
}

public createNodeArrayFromHTML(
src: string,
container: AnyElement
): AnyElement[]
{
let lSrc = src.toLowerCase();
let tmpElemementType = "div";
if (lSrc.startsWith('<tr')) tmpElemementType = "tbody";
if (lSrc.startsWith('<td') || lSrc.startsWith('<th')) tmpElemementType = "tr";
if (lSrc.startsWith('<tbody') || lSrc.startsWith('<thead') || lSrc.startsWith('<tfoot')) tmpElemementType = "table";
let element = document.createElementNS(container.namespaceURI, tmpElemementType);
element.innerHTML = src;

return Array.from(element.childNodes) as AnyElement[];
}

public createElementFromHTML(
src: string,
container: AnyElement
): AnyElement
{
return this.createNodeArrayFromHTML(src, container).find(item => item instanceof Element);
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
commonParams : (Record<string, any>|((item:Record<string, any>)=>Record<string, any>)) = {},
finalCalback : ((widget : any, item: any) => void)|null = null)
{
var res = [];
for(const item of list)
{
var params = {
...item,
...(typeof commonParams === "function" ? commonParams(item) : commonParams)
};
var widget = this.muWidgetFromTemplate(templateName, container, params);
if (finalCalback) finalCalback(widget, item);
res.push(widget);
}
return res;

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
//@ts-ignore
if (state === "toggle") state = control.style.display === "none";
//@ts-ignore
control.style.display = state !== neg ? null : "none";
}
}

public muSubWidgets : MuWidget[] = [];

public muNamedWidget : MuNamedWidgets<TW> = {} as undefined as MuNamedWidgets<TW>; // Record<string, MuWidget> = {};

//@ts-ignore
public muRoot : MuWidget = this;

public muParent : TP/*|null = null */;

public muTemplates : Record<string, string> = {};

public muTemplateParents : Record<string, AnyElement> = {};

public muOnAfterIndex : ((widget : this) => void)[] = [];

public muBindOpts : Record<string, MuBindOpts[]> = {};

public muBindData(srcData : any)
{
//@ts-ignore
MuBinder.bindData(this.muBindOpts, srcData, this);
this.muAfterBindData(srcData);
}

public muFetchData() : any
{
//@ts-ignore
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
//@ts-ignore
this.container.widget = this;
this.muSubWidgets = [];
this.muNamedWidget = {} as MuNamedWidgets<TW>;
this.muTemplates = {};
this.muTemplateParents = {};
//@ts-ignore
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
//@ts-ignore
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
//@ts-ignore
widget.muRoot = this.muRoot || this;
if (opts.params)
{
const params = typeof opts.params === "string"
? (
MuWidget.paramJsonS
? JSONS.parse(opts.params)
: JSON.parse(opts.params)
)
: opts.params;
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
//@ts-ignore
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
//@ts-ignore
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

public muIndexTree(element : AnyElement, indexWidget : boolean, useName : string|null = null, addToUi: boolean = true)
{
//@ts-ignore
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
if (opts.id && element != this.container && addToUi) this.muAddUi(opts.id, element);
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
for (let i = 0, l = this.muOnAfterIndex.length; i < l; i++)
{
this.muOnAfterIndex[i](this);
}
}
this.muCallPlugin("afterIndexElement", ev);
}

muAddUi(id: string, element: AnyElement) {
if (id in this.ui) console.error("The widget '" + /*this.muGetIdentification()*/ this.muIndexOpts.widget + "#" + this.muIndexOpts.id + "' already contains an element with mu-id '" + id + "'.");
//@ts-ignore
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
var params = paramsStr
? (MuWidget.paramJsonS
? JSONS.parse(paramsStr)
: JSON.parse(paramsStr))
: null;
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
const jsrc = '[' + name.substr(p + 1) + ']';
params = MuWidget.paramJsonS
? JSONS.parse(jsrc)
: JSON.parse(jsrc)
;
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

public muReplaceContent(element: AnyElement|string, newContent: string): void
{
let currentElement = (typeof element === "string")
? this.ui[element]
: element;
if (!currentElement) throw new Error((typeof element === "string")
? "Element with mu-id='" + element + "' not exists."
: 'Argument element is empty'
);

currentElement.innerHTML = newContent;
this.muIndexTree(currentElement, true, null, false);
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

public static registerAll(...args)
{
let _: any;
for(let i = 0; i < args.length; i++)
{
let classes = args[i];
if (classes.default?.__esModule === true) {
const { __esModule, ...newClasses } = classes.default;
classes = newClasses;
}
for(let k in classes) MuWidget.widgetClasses[k] = classes[k];
}
}
public static registerAs(c : new() => any, n : string)
{
MuWidget.widgetClasses[n] = c;
}

public static startup(startElement: AnyElement|null = null, onSucces: OptionalCallback1<MuWidget> = null, onBefore: OptionalCallback = null, onEvent: "DOMContentLoaded"|"load" = "load") {
const fn = window.addEventListener || (window as any).attachEvent || function(type: string, listener: (evt:any)=>void)
{
if (window.onload) {
const curronload = window.onload as (evt:any)=>void;
const newonload = function(evt : any) {
curronload(evt);
listener(evt);
};
window.onload = newonload;
} else {
window.onload = listener;
}
};
const onStart = function() {
if (onBefore) onBefore();
var element = (startElement || document.documentElement) as AnyElement;
var muRoot = new MuWidget(element);
muRoot.muInit(element);
MuWidget.root = muRoot;
if (onSucces) onSucces(muRoot);
}
if (onEvent === "DOMContentLoaded" && ['interactive', 'complete'].includes(document.readyState)
|| onEvent === "load" && 'complete' == document.readyState)
{
onStart();

} else {
fn(onEvent, onStart);
}
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

type MuPluginEventNames = "beforeIndexElement"|"afterIndexElement";

type MuPlugin = Partial<Record<MuPluginEventNames, (ev: MuIndexEvent)=>void>>;

type OptionalCallback = (()=>void)|null;

type OptionalCallback1<T = any> = ((p1 : T)=>void)|null;

type MuOpts = {
attributePrefix: string,
bindEvents: string[]
autoMethodNameSeparator: string,
}

type MuWidgetOpts = Record<string, string>|{
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
keybind: string|null,
// opts: string,
};

type MuIndexEvent = {
element: AnyElement,
widget: MuWidget,
opts: MuWidgetOpts,
}

type AnyElement = (HTMLElement | SVGElement | HTMLInputElement) & {
widget: MuWidget,
setAttribute : (a:string,b:string)=>void
};
type AnyElementA = HTMLElement & SVGElement & HTMLInputElement & {
widget: MuWidget,
setAttribute : (a:string,b:string)=>void
};

function SetAttributes(element : AnyElement, attrs : Record<string,any>)
{
for(const n in attrs)
{
element.setAttribute(n, attrs[n].toString());
}
}

type MuEvent = {
originalEvent : Event,
sender : any,
args: any[]|null
}

type MuPreprocesor = ((element : AnyElement, ...args : any[])=>void)|({preproc: (element : AnyElement) => void});

type MuHandler = (ev? : MuEvent, ...args : any[]) => void;

type MuNamedWidgets<T extends Record<string, any&AnyElement>> = T & Record<string, MuWidget>;

type MuUi<T extends Record<string, any&AnyElement>> = T & Record<string, AnyElementA> & { [key: string ]: AnyElementA };

// export class MuWidget extends MuWidgetTyped<MuWidget, {}, {}> { }



class StrParser
{
protected str : string;

public position : number = 0;

public lastMark : StrParserMark|null = null;

public debugMode : boolean = false;

constructor(str : string) {
this.str = str;
}

public findNext(chunk : string|string[], skipChunk : boolean = false) : StrParserMark|null
{
if (typeof chunk === "string") chunk = [chunk];
// let firstPos : number|null = null;
let firstPos : number|null = null;
let firstChunk : string|null = null;
let firstChunkNum : number = 0;
let i = 0;
for(const ch of chunk)
{
const pos = this.str.indexOf(ch, this.position);
if (pos > 0 && (firstPos === null || pos < firstPos))
{
firstPos = pos;
firstChunk = ch;
firstChunkNum = i;
}
i++;
}
if (firstChunk)
{
if (skipChunk) firstPos += firstChunk.length;
this.position = firstPos;
this.lastMark = {
chunk: firstChunk,
chunkNum: firstChunkNum,
position: firstPos
};
this._onEndChunk = false;
this.debug("findNext(", chunk, ") > '" + firstChunk + "', " + this.position);
return this.lastMark;
} else {
this.debug("findNext(", chunk, ") not found " + this.position);
return null;
}
}

public substring(start : StrParserMark|number|string|null = null, stop : StrParserMark|number|string|null = null) : string
{
if (start === null) start = this.position;
else if (typeof start === "string") start = this.loadPos(start)
else if (typeof start !== "number") start = start.position;

if (stop === null) stop = this.str.length;
else if (typeof stop === "string") stop = this.loadPos(stop)
else if (typeof stop !== "number") stop = stop.position;

const res = this.str.substring(start, stop);
this.debug("substr " + start + ":" + stop + " > " + res);
return res;
}

public moverel(mov : number) : StrParserMark
{
const newPos = this.position + mov;
this.position = Math.min(this.str.length, Math.max(0, newPos));
return { position: this.position };
}

public pos()
{
return { position: this.position };
}

protected storedPositions: Record<string, number> = {};

public loadPos(name: string): number
{
if (name === '.') return this.position;
else if (name === '>') return this.str.length;
return this.storedPositions[name];
}

public savePos(name: string): void
{
this.storedPositions[name] = this.position;
}

protected _onEndChunk = false;
public toEndChunk()
{
const l = this._onEndChunk ? 0 : (this.lastMark?.chunk?.length || 0);
this.moverel(l);
this._onEndChunk = true;
this.debug("toEndChunk +" + l.toString());
}

protected debug(...msgs : any)
{
if (this.debugMode)
{
const msg = msgs.map(ch => typeof ch === "string" ? ch : JSON.stringify(ch)).join('');
// console.log(msg + "\n	" + this.position + "	%c" + this.str.substring(0, this.position) + "%c" + this.str.substring(this.position), "background: green; color: white", "color: blue");
console.log(msg + "\n	" + this.position + "	" + this.str.substring(0, this.position) + "|" + this.str.substring(this.position));
}
}

public isEnd() : boolean
{
return this.position >= this.str.length;
}

public startsWith(chunk : string|string[], skipChunk : boolean = false, saveLast: boolean = true) : StrParserMark|null
{
if (typeof chunk === "string") chunk = [chunk];
// let firstPos : number|null = null;
let firstPos : number|null = null;
let firstChunk : string|null = null;
let firstChunkNum : number = 0;
let i = 0;
for(const ch of chunk)
{
const stw = this.str.startsWith(ch, this.position);
if (stw)
{
const mark = {
chunk: ch,
chunkNum: i,
position: this.position
}
if (saveLast) this.lastMark = mark;
if (skipChunk) this.position += ch.length;
this.debug("startsWith(", chunk, ") > '" + ch + "'");
return mark;
}
i++;
}
this.debug("startsWith(", chunk, ") > not found");
return null;
}

public skipChunks(chunks: string[]) {
while (this.startsWith(chunks, true, false));
}
}

type StrParserMark = {
chunk? : string,
chunkNum? : number,
position : number
}



class MuLabelFor {
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

class JSONS {
public static parse(src: string): any {
const par = new JSONS();
par.tokenize(src);
return par.parseCollection();
}

constructor() {
}

protected chunkToType: Record<string, JSONSTokenType> = {
":": "colon",
",": "comma",
"\n": "newLine",
"{": "oOpen",
"}": "oClose",
"[": "aOpen",
"]": "aClose",
}

protected specValues: Record<string, any> = {
'null': null,
'true': true,
'false': false,
'undefined': undefined,
}

protected stringTermChunks = [ ...Object.keys(this.chunkToType), "\\", "#", "/*" ];

tokenize(src: string): JSONSToken[] {
const res: JSONSToken[] = [];
src = src.replace(/\r\n/g, "\n");
const sp = new StrParser(src);
// sp.debugMode = true;
let lastPos = 0;
while (!sp.isEnd()) {
sp.skipChunks([" ", "\t"]);

if (sp.startsWith(['#', '//'], true))
{ // line comment
sp.findNext("\n", true);
}
else if (sp.startsWith('/*', true))
{ // block comment
let d = 1;
while(d) {
const ch = sp.findNext(['/*', '*/'], true);
if (!ch) throw new JSONSError('Incomplete block comment'); // EXC uncosed comment
if (ch.chunk === '/*') d++;
else d--;
}
}
else if (sp.startsWith(Object.keys(this.chunkToType), true))
{ // control chars
const t = this.chunkToType[sp.lastMark.chunk];
if (t !== "newLine")
res.push({
type: t,
value: null,
pos: sp.lastMark.position,
});
} else if (sp.startsWith(["'", '"'], true))
{ // enclosed string
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
} else throw new JSONSError('missing the right quotation mark'); // EXC unclosed quote
}
let i=0;
str = str.replace(/\n/g, "\\n");
// console.log(["JSSTR [" + str + "]", ...[...str].map(c=>(i++) + ": " + c)]);
res.push({
type: "value",
value: JSON.parse('"' + str + '"'),
pos: strBegin,
});
}
else
{ // unenclosed string
sp.savePos('stringBegin');
const ch = sp.findNext(this.stringTermChunks, false);
const valStr = sp.substring(
'stringBegin',
ch ? '.' : '>'
).trim();
const valStrL = valStr.toLowerCase();
res.push({
type: "value",
value: Object.keys(this.specValues).includes(valStrL)
? this.specValues[valStrL]
// @ts-ignore
: (!isNaN(valStr)
? parseFloat(valStr)
: valStr
),
pos: sp.loadPos('stringBegin'),
});
if (!ch) break;
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

protected tokens: JSONSToken[] = [];

protected tokenI: number = 0;

protected collectionDeep: number = 0;

protected curToken(shift: number = 0): JSONSToken|null
{
return this.tokens[this.tokenI + shift] ?? null;
}

protected nextToken(): JSONSToken|null
{
this.tokenI++;
return this.tokens[this.tokenI] ?? null;
}


parseCollection(): any
{
let type: "array"|"object";
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
if (nt === null) return t.value;
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
if (ct.type !== "colon") throw new JSONSError("Expected ':' ", ct);
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
} else throw new JSONSError("Expected property name ", ct);
}
return res;
} else {
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

type JSONSToken = {
type: JSONSTokenType,
value: string|null,
pos: number,
}

type JSONSTokenType = "value"|"colon"|"comma"|"aOpen"|"aClose"|"oOpen"|"oClose"|"newLine";

class JSONSError extends Error {
constructor(message: string, token: JSONSToken|null = null) {
super(message + (token
? " position: " + token.pos + " [" + token.type + ( token.type === "value" ? ": " + JSON.stringify(token.value) + ']' : '')
: "")
);
this.name = "JSONSError";
// this.token = token;
}
}
