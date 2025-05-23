/*
 * This file is part of the MuWidget components package.
 *
 * (c) Vít Peprníček <vit.peprnicek@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import {AnyElement, MuWidget} from "../MuWidget";
import { Arrays } from "../utils/Arrays";
import {it} from "node:test";

export class TreeView extends MuWidget {
	public opts: TreeViewOpts = {
		srcStructFormat: "parentField",
		outStructType: "plunge",
		parentField: "parentId",
		childField: "children",
		idField: "id",
		childContainer: "children",
		indentField: "indent",
		templateName: "item",
		plungeField: "plunge",
		//todo: widgetParentField: "parentNode",
		prepareItem: null,
	}

	public render(data: any, opts: Partial<TreeViewOpts> = {}) {
		this.opts = { ...this.opts, ...opts };
		let srcStructFormat = this.opts.srcStructFormat;
		let itemsByParent: Record<string, any[]> = {};
		const makeKey = (val: any) => JSON.stringify(val);
		const allIds = [];
		if (srcStructFormat === "parentField") {
			itemsByParent = {};
			for(const item of data) {
				allIds.push(makeKey(item[this.opts.idField!]));
				const k = makeKey(item[this.opts.parentField!]);
				(itemsByParent[k] ?? (itemsByParent[k] = [])).push(item);
			}
			srcStructFormat = "groupedByParent";
		} else if (srcStructFormat === "groupedByParent") {
			for(const k in data)
				for(const item of data[k])
					allIds.push(makeKey(item[this.opts.idField!]));
			itemsByParent = data;
		}

		if (srcStructFormat === "groupedByParent") {
			const rootIds = Arrays.diff(Object.keys(itemsByParent!), allIds);
			for(const k of rootIds) {
				this.renderList(itemsByParent[k], (item) => itemsByParent[makeKey(item[this.opts.idField!])]);
			}
		} else {
			this.renderList(data, (item) => item[this.opts.childField!]);
		}
	}

	public renderList(items: any[], getChilds: (item: any) => any[]|undefined, container: HTMLElement|null = null, plunge: number = 0) {
		if (!container) { // @ts-ignore
			container = this.container;
		}
		for(let item of items)
		{
			if (this.opts.prepareItem) item = this.opts.prepareItem(item);
			const templateName = (typeof this.opts.templateName === "string")
				? this.opts.templateName
				: this.opts.templateName(item);

			// @ts-ignore
			const itemWidget = this.muWidgetFromTemplate(templateName, container);
			itemWidget.muBindData({...item, [this.opts.plungeField]: plunge});

			const childrens = getChilds(item);
			if (childrens) {
				const childContainer = this.opts.outStructType === "plunge"
					? itemWidget.ui[this.opts.childContainer!]
					: container;
				this.renderList(childrens, getChilds, childContainer, plunge + 1);
			}
			this.muDispatchEvent('itemRedered', itemWidget);
		}
	}

	public getItemTree<TW=MuWidget,TR=any>(itemCallback: (item: TW)=>TR, container: AnyElement = null): TreeViewItemNode[]
	{
		return this.container.widget.muGetChildWidgets<TW>(container ?? this.container)
			.map((widget: TW) => ({
				item: itemCallback ? itemCallback(widget): widget,
				/* @ts-ignore */
				children: this.getItemTree(itemCallback, widget.ui[this.opts.childContainer])
			}));
	}

	beforeIndex() {
		this.muRegisterEvent('itemRedered');
	}
}

export type TreeViewOpts = {
	srcStructFormat: "childField"|"parentField"|"groupedByParent";
	outStructType: "indent"|"plunge";
	parentField: string|null;
	childField: string|null;
	idField: string|null;
	childContainer: string|null;
	indentField: string|null;
	plungeField: string;
	templateName: ((item: any) => string)|string;
	prepareItem: ((item: any) => any)|null;
	//todo widgetParentField: string|null;
}

export type TreeViewItemNode<T=any> = {
	item: T;
	children: TreeViewItemNode<T>[];
}