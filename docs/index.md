


<!--
# The simple examples

```html
...
<div mu-widget="ClickCounter" mu-params='{"maxClickCount": 10}'>
	<button mu-id="btn">Click me</button>
	Clicked <span mu-id="clickCount"></span> times.
</div>
...
```

`mu-widget="ClickCounter"` define service class.  
`mu-params='{"maxClickCount": 10}'` define initial property for service class.
`mu-id="btn"` and `mu-id="clickCount"` define element id

```javascript
// class constructor
ClickCounter = function() 
{ 
	// init some properties
	this.clickCount = 0;
	this.maxClickCount = null;
};
// define methods
ClickCounter.prototype = {
	// this method is automaticaly binded for event click on element with id btn
	btn_click: function(sender)
	{
		// this refers to a service class instance
		// the element that triggered the event is passed as the first parameter of the method
		this.clickCount++;
		this.updateView();
		if (this.maxClickCount && this.clickCount >= this.maxClickCount)
		{
			// elements with mu-id atribute is accesible via property this.ui.(id)
			this.ui.btn.disabled = true;
		}
	},
	updateView: function()
	{
		this.ui.clickCount.innerText = this.clickCount;
	},
	// this method is called after indexing html and bindign events
	afterIndex: function()
	{
		this.updateView();
	}
}
window.onload = function()
{
	// index passed and nested html elements and init Widgets
	new MuWidget(document.getElementsByTagName('body')[0]);
}

``` -->
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

<!--
1. The specified class will be extended to the prototype MuWidget
2. Creates an instance of the specified class
3. The property is set
4. The `afterIndex` method is called
-->

## `mu-noindex`
Do not index this and nested elements.

## `mu-nocontent`
Do not index nested elements. 

## `mu-params`
Parameters passed to the service class in `JSON` format.

## `mu-template`
During indexing, this block will be stored in the template collection and removed from the DOM.

## `mu-usetemplate`
Place element from template collection.

<!-- MuWidget constructor parameters
==
|             |                                |
| ----------- | ------------------------------ |
| `container` | HTMLElement containing Widgets |
| `opts`      | Options                        |

MuWidget options
--

| Field                     | What is it for                              | Default value                                                                                                                                                                     |
| ------------------------- | ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `attributePrefix`         | Prefix for HTML element parameters          | `'mu-'`                                                                                                                                                                           |
| `bindEvents`              | List of events to bind                      | `['click', 'dblclick', 'mouseenter', 'mouseleave', 'mousemove', 'mouseout', 'mouseover', 'mouseup', 'blur', 'change', 'focus', 'select', 'submit', 'keyup', 'keydown', 'scroll']` |
| `autoMethodNameSeparator` | id / event separator for autobinded methods | `'_'`                                                                                                                                                                             |

-->

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

| Argument       | Type (default value)         | Meaning                        |
| -------------- | ---------------------------- | ------------------------------ |
| `templateName` | `string`                     | Template name                  |
| `container`    | `string\|AnyElement`         | Container or contained `mu-id` |
| `params`       | `Record<string, any>` (`{}`) | Inital paramters for widget    |
| `position`     | `"first"\|"last"\|"before"\|"after"` (`"last"`) | Position of new element        |
| `ref` | `AnyElement` | Reference element for `before` and `after`

### Example



## `muGetChildWidgets`

## `muBindList`

## `muBindData`

Put binded data into current container. See [bidirectional data binding](#bidirectional-data-binding)

## `muFetchData`

Get binded data from current container. See [bidirectional data binding](#bidirectional-data-binding)

# Widget events

## `muDispatchEvent`

## `muRegisterEvent`

## `addEventListener`

# Overidable methods

## `beforeInit`

## `beforeIndex`

## `muAfterBindData`

# Properties

## `ui`

## `container`

Link to main HTML element of widget.

## `muSubWidgets`

Array of nested widgets.

## `muNamedWidget`

## `muParent`

Link to parent widget.

## `muTemplates`

Collection of stored templates (HTML elemets with `mu-template` attribute).

## `muOnAfterIndex`

# Static properties

## `widgetClasses`

# Static methods

## `registerAll`

## `registerAs`

## `startup`

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

It is also possible to define and use events for service class. The use is similar to `HTMLElement`.

# Bidirectional data binding


<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>