# Change log

## 2.27.0

 - `MuWidget.muWidgetFromTemplate`: argument container can contain `'.'`. In this case, the new widget is inserted into the main widget container.
 - `InputList`: new events  `click`, `renderItem`.
 - `TreeView`: new event `itemRedered`.
 - `UiFlashItem`: smart close timer


## 2.26.0 

 - `MuWidget.muAppendContent` now accepts multiple arguments, it is possible to pass a string or HTMLElement.
 - Component `ChoiceDialog`
 - Component `Table` 
   - It is possible to define defaultOrderable and defaultFilterable which are used for columns that do not have orderable and sortable set.
   - Method `addRow` for add one row to table
   - Correction of typo
   - For the widget of the `TableCommandCell` cell it is possible to pass the content by the `content` parameter.
   - New cell widget `TableCellComplex` and `TableCellStatic` 

## 2.25.0

- `MuBinder`
  - New filters `jsonStringify`, `jsonsParse` and `jsonParse`
- Component `Table`
  - transformContent can returns `HTMLElement`

## 2.24.0

 - `MuBinder`
   - When muBindData and muFetchData apply the Date type to the intput type date(time).
 - `MuWidget`
   - `muVisible` allows to hide element in `display`, `hidden`, `collapse` modes
   - `muExposeElement` allows to expose an element outside the widget.

## 2.23.0

 - Moving auxiliary utilities to the mu-js-utils package
 - Extension of FlashMessage functionalities
   - Autoclose
   - Themes
   - Visual types (succes, error, ...)

## 2.22.0

 - class `ErrorList`
 - `MuWidget`.`muWidgetFromTemplate` can create widget without place into page.

## 2.20.0

 - `MuBinder` filters `ifEmpty` and `ifNull`
 - `JSONS` parse format `foo:bar`
 
## 2.19.0

 - `MuRouter` can define optional parts of the url pattern 

## 2.18.0

 - Component `SideModal`
 - Triggers

## 2.17.0

 - utils functions
 - `MuWidget`.`muCreateWidget`

## 2.16.0
 - `MuWidget`.`muReplaceContent`
 - `MuWidget`.`startup` can start on `DOMContentLoaded` event
 - `MuRouter`: `lastParameters` is now public
 - `MuRouter`: `catchAnchor`
 - `MuBinder`: Binding `Date` or iso string to input type datetime-local and date
 - `MuBinder`: Filter `getField`

## 2.15.0

 - `MuBinder`: Using `@options` it is possible to populate `<datalist>` items
 - `UiTable`: `CellValueTranformerEvent` also contains the whole source row

## 2.14.0

 - `Pager` customizable css class names
 - `ErrorMarker` helper

## 2.13.0

 - `Dialog`: you can define default container
 - Added `Table` component
 - Support for EsModules in `MuWidget.registerAll`

## 2.12.0

 - Added JSONS as an alternative to JSON

## 2.11.0

 - Added dialog box component
 - Added component

## 2.10.2

 - Fix: `MuBindex`.`bindData` will fail if null is passed.

## 2.10.1

 - `MuRouter` -> `prepareAnchor` If no anchor is passed, it does not set the href but only the click handler.
 - `MuRouter` -> `prepareAnchor` Fix bug when persistence parameters were not used.

## 2.10.0

 - Simple attribute allowe space, some documentation
 - Added Arrays helper class for working with arrays.
 - TreeView component

## 2.9.2

>
> Leones hic vivunt
>
