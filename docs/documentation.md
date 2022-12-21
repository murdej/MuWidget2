# How to get started with MuWidget

There are several ways to get MuWidget into your project.

Install over npm:

```shell
npm i mu-widget
```

Or download all in one file from https://github.com/murdej/MuWidget2/raw/master/dist/MuWidget-bundle.js and include into project.

You can use this template to test on codepen: https://codepen.io/pen?template=qBpQVrX


# Very simple example

<p class="codepen" data-height="524.5454406738281" data-default-tab="js,result" data-slug-hash="jOYQdxe" data-editable="true" data-user="murdej" style="height: 524.5454406738281px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/murdej/pen/jOYQdxe">
  MuWidget example 1</a> by Murděj Ukrutný (<a href="https://codepen.io/murdej">@murdej</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>

# HTML element parameters

## `mu-id` 
Unique identifier in current widget scope.

After indexing, the html element will be available in the collection `this.ui` under its `mu-id`.

```html
<span mu-id="label"></label>
```

```javascript
this.ui.label.innerText = "Hello world";
```

## `mu-widget`
Widget service class. An instance of the class will be created during indexing.

## `mu-noindex`
Do not index this and nested elements.

## `mu-nocontent`
Do not index nested elements. 

## `mu-params`
Parameters passed to the service class in `JSON` format.

## `mu-template`
During indexing, this block will be stored in the template collection and removed from the DOM. 
It can be used later with the [`mu-usetemplate` attribute](#mu-usetemplate) or the [`muWidgetFromTemplate` method](#muwidgetfromtemplate).

## `mu-usetemplate`
Place element from template collection. 

# Initialize widgets

To initialize all widgets, just call the static `startup` method. You can pass an element parameter and widgets are initialized only in the passed element.

```javascrip
MuWidget.startup();
// or initialize only any element
MuWidget.startup(document.getElemenetById("foo"));
```

# Access elements and child widgets

HTML elements with the `mu-id` attribute are available in the` this.ui` collection. If the element is also a widget, this widget is available in the `this.muNamedWidget` collection.

All child widgets, whether or not they have the `mu-id` attribute, are available in the` this.muSubWidgets` list.

<!-- # Indexing html elements

-->

# Widget initialize

1. Create instalnce of service class
2. Setting parameters from `mu-params` attribute.
3. Call service class method `beforeIndex` if exists.
4. Index content and initialize nested component
5. Call service class method `afterIndex` if exists.
7. Call all calbacks in `muOnAferIndex`

<p class="codepen" data-height="415.4545593261719" data-default-tab="html,result" data-slug-hash="OJzaYQO" data-editable="true" data-user="murdej" style="height: 415.4545593261719px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/murdej/pen/OJzaYQO">
  MuWidget lifecycle</a> by Murděj Ukrutný (<a href="https://codepen.io/murdej">@murdej</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>

# Service methods

## `muVisible(state : boolean, control : string|string[])`

Hide or show element(s). Use CSS property `display`. The `state` argument determines the visibility of the element. The `control` argument contains `mu-id` of element(s).

## `muWidgetFromTemplate`

Create HTML element from stored template, initialize widget and placed in the specified container.

| Argument       | Type (default value)                            | Meaning                                    |
| -------------- | ----------------------------------------------- | ------------------------------------------ |
| `templateName` | `string`                                        | Template name                              |
| `container`    | `string\|AnyElement`                            | Container or contained `mu-id`             |
| `params`       | `Record<string, any>` (`{}`)                    | Inital paramters for widget                |
| `position`     | `"first"\|"last"\|"before"\|"after"` (`"last"`) | Position of new element                    |
| `ref`          | `AnyElement`                                    | Reference element for `before` and `after` |

### Example

<p class="codepen" data-height="356.3636474609375" data-default-tab="js,result" data-slug-hash="rNpRPYd" data-editable="true" data-user="murdej" style="height: 356.3636474609375px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/murdej/pen/rNpRPYd">
  MuWidget example 2</a> by Murděj Ukrutný (<a href="https://codepen.io/murdej">@murdej</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>

## `muGetChildWidgets`

Passes the children of the passed container and returns array of service class instances.

Parameter is container element or his `mu-id`.

Used to load dynamically added widgets added by the `muWidgetFromTemplate` method.

<!-- ## `muBindList`

For each item in array create new element and service class instances from template. Using

| Argument       | Type (default value)                            | Meaning                                    |
| -------------- | ----------------------------------------------- | ------------------------------------------ |
-->

## `muBindData`

Put binded data into current container. See [bidirectional data binding](#bidirectional-data-binding)

## `muFetchData`

Get binded data from current container. See [bidirectional data binding](#bidirectional-data-binding)


## `muDispatchEvent`

Invoke event handlers. [See Widgets events](#widget-events)

## `muRegisterEvent`

Register event name(s). [See Widgets events](#widget-events)

## `addEventListener`

Add event handler to this widget; [See Widgets events](#widget-events)

# Overidable methods

## `beforeInit`

## `beforeIndex`

## `muAfterBindData`

# Properties

## `ui`

Object containing elements with attribute `mu-id` indexed by value of `mu-id` attribute.

## `container`

Link to main HTML element of widget.

## `muSubWidgets`

Array of nested widgets.

## `muNamedWidget`

Object containing nested widget of elements with attribute `mu-id` and `mu-widget` indexed by value of `mu-id` attribute.

## `muParent`

Link to parent widget.

## `muTemplates`

Collection of stored templates (HTML elemets with `mu-template` attribute).

## `muOnAfterIndex`

Array callbacks that run after indexing the widget. (Similar to `afterIndex`). This property is public, so it can be accessed from other widgets.

# Static properties

## `widgetClasses`

Object of service classes. 

# Static methods

## `registerAll`

Register all srevice class in object. It is easy to use with `require` or `import`.

``` javascript
MuWidget.registerAll(
	require('./commonWigets'),
	require('./myCoolWigets'),
)
```

``` typescript
import * as CommonWidgets from './commonWigets';
import * as MyCoolWigets from './myCoolWigets';

MuWidget.registerAll(CommonWidgets, MyCoolWigets);
```

## `registerAs`

Register single service class

``` typescript
MuWidget.registerAs(
	class extends MuWidget {
		...
	},
	'MyWidget'
);
```

## `startup`

Initalize widgets on page or element. [See Initialize widgets](#initialize-widgets)

# Event procesing

## Event handler mapping

The event handler fires in the context of a service class instance. (`this` refers to an instance of the service class)

There are several ways to map event handlers.

### According to naming convention

If there is a method in the format `[mu-id of element]_[event name]` it is mapped to the given event on the given element. Example:

```html
<div mu-widget="ClickCounter">
	<button mu-id="bCounter">Click</button>    
</div>
```

```typescript
class ClickCounter {
	public clickCount : number = 0;
	public bCounter_click(ev, cc: number = 1) {
		this.clickCount += cc;
	}
}
```

### By HTML attribute

Attribute format is `mu-[event name]`. In this case, it is possible to pass arguments, written after ':' after the method name. For example `doSometing: "foo" , 2`

```html
<div mu-widget="ClickCounter">
	<button mu-click="bCounter_click">Click</button>    
	<button mu-click="bCounter_click: 3" mu-scroll="otherMethod">3 × Click</button>    
</div>
```

## Widgets events

<p class="codepen" data-height="300" data-default-tab="html,result" data-slug-hash="qBxOGGz" data-user="murdej" style="height: 300px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/murdej/pen/qBxOGGz">
  Untitled</a> by Murděj Ukrutný (<a href="https://codepen.io/murdej">@murdej</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>

It is also possible to define and use events for service class. The use is similar to `HTMLElement`.

The event must be registered first. Best in the `afterIndex` method to make automatic handler mapping work.

```typescript
class SubWidget extends MuWidget
{
  afterIndex() {
    this.muRegisterEvent("redalert");
  }
  ...
```

It is now possible to connect an event handler. 

You can use `addEventHandler` or let MuWidget take care of it himself.

```typescript
class MainWidget extends MuWidget
{
  subWidget_redalert(ev) {
    // Handler for event redalert on subWidget
    ...
  } 
  afterIndex() {
    // manual add handler
    this.muNamedWidget.subWidget.addEventListener("redalert", () => ... );
  }
  ...
```

You can use the `muDispatchEvent` method to trigger an event.

```typescript
	this.muDispatchEvent("redalert");
```

## Passing parameters

The first argument of the handler is an event in the structure:

```typescript
{
	originalEvent : Event,
	sender : any,
	args: any[]|null
}
```

The other arguments are the arguments passed when calling the `muDispatchEvent` method.

```typescript
// Triggering event
this.muDispatchEvent("redalert", this.ui.message.value);

// Event handler
subWidget_redalert(ev, message) {
```

# Bidirectional data binding

`MuWidget` allows bidirectional data binding. It is not done automatically but on demand by calling `this.muBindData` to transfer the data to HTML or` this.muFetchData` to load the data from HTML.

To enable databinding place this code before `startup`;

```javascript
MuBinder.register(MuWidget);
```

The data binding formula is written to the `mu-bind` attribute and has the following syntax.

<div>
    <b>source field</b>[[<b>|bind filter</b>[<b>(parameters)</b>][<b>|next filter</b>...]][<b>direction</b> <b>target</b>[[<b>|fetch filter</b>[[<b>(parameters)</b>]][<b>|next filter...</b>]]]]][<b>;next binding</b>]
</div>

The only required fragment is the SourceField. Others are optional.

`source field` - data field from which the value is taken.

`bind filter` - filter (s) to use with `muBindData`. The filter name is preceded by the `|` character. The filter can have parameters, only static parameters can be used. It is possible to arrange multiple filters in a row.

`direction`

| Code          | Meaning                                              |
| ------------- | ---------------------------------------------------- |
| `:`           | Only Bind                                            |
| `::`          | Bind and Fetch                                       |
| `^`           | Fetch only                                           |
| Not specified | Automatically according to the relevant HTML element |

`target` - determine where / from where the value in the element is stored / retrieved.

When:

- the target string starts with a letter set, the javascript property of the HTML element is set.
* starts with a dot `.` sets the javascript property instance of the service class of the given element.
- starts with `@attr.` the html attribute of the element is set.
- is `@foreach` passes the value as an array and creates a new widget for each element.
- `@options` is used to easily populate the html element`<select>`
- `@visible` TODO:

`fetch filter` - filter (s) to use with `muFetchData`. The syntax is identical to bindFiltr.

## Automatic destination determination

If no target is specified, it is determined according to the HTML element and possibly other parameters:

| Target element                              | Direction | Target         |
| ------------------------------------------- | ---- | ----------- |
| `<input type="checkbox" />`                 | `::` | `checked`   |
| `<input type="file" />`                     | `^`  | `files`     |
| `<input ...`                                | `::` | `value`     |
| `<img />`<br />`<audio />`<br />`<video />` | :    | `src`       |
| All other cases                             |      | `innerText` |

## Filters

Filters allow you to transform a value. Filters can be local - methods defined in the service class, or global.

### Predefined filters

`toLower`: changes the case to lowercase.

`toUpper`: changes the case to uppercase.

`short (maxLen, suffix="...")`: if the string is longer than the specified number of characters, it will be shortened and added.

`tern(valueOnTrue, valueOnFalse)`: similar to the ternal operator, if the value can be evaluated as `true` it will change the value to the value of the first parameter, otherwise to the value of the second parameter (example of changing `bool` to "yes" and "no ": `value|tern("yes", "no")`).

`prepend (prefix, ifAny = false)`: adds text before the value. If the second parameter is `true` and the value is empty, the text will not be added.

`append (suffix, ifAny = false)`: add text after the value. If the second parameter is `true` and the value is empty, the text will not be added.

### Custom filters

The local filter (valid only for the current widget) is written as a method of the service class of the widget in which it is used.

Parameter 1 contains the value (or result of the previous filter).
The 2nd parameter will contain additional data (currently empty object, for future use).
3. and other parameters contain optional parameters from the formula.

```javascript
public strRepeat (value, ev, count: number) {
     return value.repeat (count);
}
```

Global filters are entered into the static collection `MuBinder.filters`

```javascript
MuBinder.filters.strRepeat (value, ev, count: number) => value.repeat (count);
```

<p class="codepen" data-height="300" data-default-tab="html,result" data-slug-hash="ZErQxeq" data-user="murdej" style="height: 300px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/murdej/pen/ZErQxeq">
  MuWidget - Binding</a> by Murděj Ukrutný (<a href="https://codepen.io/murdej">@murdej</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>

# Routing

TODO:

# HTML ID and NAME helper

This helper allows you to link `<label>` with `<input>` without having to type a unique id.

It also allows you to link a group of `<input type="checkbox" />` with a unique `name`.

To use it, just register helper

```javascript
MuLabelFor.register(MuWidget, true);
```

 and start using the `mu-for` attribute. This attribute works similarly to the regular `for` attribute, except that it contains the `mu-id` (`mu-id` must be unique only in widget scope) of the referenced `<input>`. Helper will generate a `id` that is unique within the page.

Example:
```html
<label mu-for="message">Message</label>
<textarea mu-id="message"></textarea>
<div>
    <input type="radio" mu-id="priorityNormal" mu-name="priority" />
    <label mu-for="priorityNorma">Normal</label>

    <input type="radio" mu-id="priorityHigh" mu-name="priority" />
    <label mu-for="priorityHigh">High</label>
</div>
```

After index:
```html
<label mu-for="message" for="_Mu_1">Message</label>
<input mu-id="message" id="_Mu_1">
<div>
    <input type="radio" mu-id="priorityNormal" mu-name="priority" name="_Mu_1" id="_Mu_2">
    <label mu-for="priorityNormal" for="_Mu_2">Normal</label>

    <input type="radio" mu-id="priorityHigh" mu-name="priority" name="_Mu_1" id="_Mu_3">
    <label mu-for="priorityHigh" for="_Mu_3">High</label>
</div>
```


<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>
