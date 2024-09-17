# TreeSelector

The `TreeView` component helps to easily render structured data into a tree.

## Options

| Option          | Type                                             | Default       | Meanings |
| --------------- | ------------------------------------------------ | ------------- | -------- |
| srcStructFormat | `"childField"\|"parentField"\|"groupedByParent"` | `parentField` |          |
| outStructType   | `"indent"\|"plunge"`                             | `plunge`      |          |
| parentField     | `string\|null`                                   | `parentId`    |          |
| childField      | `string\|null`                                   | `children`    |          |
| idField         | `string\|null`                                   | `id`          |          |
| childContainer  | `string\|null`                                   | `children`    |          |
| indentField     | `string\|null`                                   | `indent`      |          |
| plungeField     | `string`                                         | `plunge`      |          |
| templateName    | `((item: any) => string)\|string`                | `item`        |          |


## Example

Html for `outStructType` set to `plunge`:

```html
<ul mu="tree:TreeView">
	<li mu=":.@item">
		<span mu-bind="title"></span>
		<ul mu-id="children"></ul>
	</li>
</ul>
```
Html for `outStructType` set to `indent`:

```ts
<table>
	<tbody mu="tvIndent:TreeView">
		<tr mu-widget="." mu-template="item">
			<td mu-bind='title;plunge|append("em"):style.paddingLeft'></th>
			<td>...</td>
		</tr>
	</tbody>
</table>

```

## Default data format

```ts
TreeItemSrcData[]
{
	title : string,
	id : string,
	parentId? : string|null,
	children? : TreeItemSrcData[],
	data? : any,
}[]
```