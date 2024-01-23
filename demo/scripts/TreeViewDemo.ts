import { MuNamedWidgets, MuWidget } from "../../src/MuWidget";
import { TreeView } from "../../src/components/TreeView";

export class TreeViewDemo extends MuWidget {
	public beforeIndex(): void {
		this.muAppendContent(/*html*/`
			<table>
				<tbody mu="tvIndent:TreeView">
					<tr mu-widget="." mu-template="item">
						<td><strong mu-bind='name;plunge|append("em"):style.paddingLeft'></strong></th>
						<td mu-bind='description'></td>
					</tr>
				</tbody>
			</table>
			<ul mu="tvPlunge:TreeView">
				<li mu=":.@item">
					<span mu-bind="name"></span> <em mu-bind="description"></em>
					<ul mu-id="children"></ul>
				</li>
			</ul>
		`);
	}

	public muNamedWidget: MuNamedWidgets<{
		tvIndent: TreeView,
		tvPlunge: TreeView,
	}>;

	afterIndex(): void {
		this.muNamedWidget.tvIndent.render(
			this.getTreeData(),
			{ srcStructFormat: "childField", outStructType: "indent" },
		)
		this.muNamedWidget.tvPlunge.render(
			this.getTreeData(),
			{ srcStructFormat: "childField", outStructType: "plunge" },
		)
	}

	getTreeData() {
		return [
			{ name: "Foo", description: "Foo bar baz eee" },
			{ name: "Bar", description: "Bar baz eee foo", "children": [
				{ name: "BarFoo", description: "Foo bar baz eee" },
				{ name: "BarBar", description: "Bar baz eee foo" },
			]},
			{ name: "Baz", description: "Baz eee foo bar" },
		];
	}

}