import { MuWidget } from "../MuWidget";

export class Table extends MuWidget
{
	public columns: ColumnInfo[] = [];

	public data: any[] = [];

	public render(isInteractive: boolean = true)
	{
		this.ui.head.innerHTML = "";
		this.ui.body.innerHTML = "";

		for(const columnInfo of this.columns) {
			if (!isInteractive && columnInfo.interactiveOnly) continue;
			const wth = this.muWidgetFromTemplate('tableHeadCell', 'head', { columnInfo: columnInfo, isInteractive: isInteractive });
			if (columnInfo.cssClass) wth.container.classList.add(...columnInfo.cssClass.split(' '));
			if (columnInfo.headCssClass) wth.container.classList.add(...columnInfo.headCssClass.split(' '));
		}

		for(const row of this.data) {
			const wRow = this.muWidgetFromTemplate('row', 'body', { data: row });
			wRow.container.addEventListener('click', (ev) => this.muDispatchEvent('rowClick', wRow));
			wRow.muTemplates = { ...wRow.muTemplates, ...this.muTemplates };

			for(const columnInfo of this.columns) {
				const ev = { isInteractive: isInteractive };
				if (!isInteractive && columnInfo.interactiveOnly) continue;
				const cell = wRow.muWidgetFromTemplate(
					columnInfo.template || 'tableCell', wRow.container,
					{ columnInfo: columnInfo, ...columnInfo.widgetParams }
				) as unknown as TableCell;
				let val = columnInfo.transformContent
					? columnInfo.transformContent(row[columnInfo.field], columnInfo, cell, ev)
					: row[columnInfo.field];
				/* if (val !== null && val !== undefined) */
				if (columnInfo.cssClass) cell.container.classList.add(...columnInfo.cssClass.split(' '));
				if (columnInfo.cellCssClass) cell.container.classList.add(...columnInfo.cellCssClass.split(' '));
				cell.render(val, row, ev);
			}

			this.muDispatchEvent('rowRendered', wRow);
		}
	}

	afterIndex() {
		if (this.ui.templates) this.ui.templates.parentElement.removeChild(this.ui.templates);
	}

	public beforeIndex() {
		this.container.innerHTML += `<thead><tr mu-id="head">
			<th mu-widget="TableHeadCell" mu-template="tableHeadCell"></th>
		</tr></thead>
		<tbody mu-id="body">
			<tr mu-widget="." mu-template="row">
				<td mu-template="tableCell" mu-widget="TableCell"></td>
			</tr>
		</tbody>`;
		this.muRegisterEvent('order', 'filter', 'rowClick', 'rowRendered');
	}

	dispatchCommand(ev: TableCellCommandEvent, cmd: string, ...params: any[]) {
		if (this.cellCommands[cmd]) this.cellCommands[cmd](ev, ...params);
	}

	public cellCommands: Record<string, ((ev: TableCellCommandEvent, ...params: any[])=>void)> = {}
}

export class TableHeadCell extends MuWidget {
	public columnInfo: ColumnInfo;
	public isFilted: boolean = false;
	public ordered: "asc"|"desc"|null = null;
	public isInteractive: boolean = true;
	muParent: Table;

	public beforeIndex() {
		this.container.innerHTML += this.isInteractive
			? `<div class="mtable-head-cell">
				<span class="mtable-head-cell__label">
				  <span class="mtable-head-cell__label-label" mu-id="label"></span>
				  <span class="mtable-head-cell__label-indicator" mu-id="indicatorOrderAsc">&and;</span>
				  <span class="mtable-head-cell__label-indicator" mu-id="indicatorOrderDesc">&or;</span>
				  <span class="mtable-head-cell__label-indicator" mu-id="indicatorFilter">&#128269;</span>
				</span>
				<span class="mtable-head-cell__buttons">
				  <span class="mtable-head-cell__button" mu-id="bOrderAsc">&and;</span>
				  <span class="mtable-head-cell__button" mu-id="bOrderDesc">&or;</span>
				  <span class="mtable-head-cell__button" mu-id="bFilter">&#128269;</span>
				</span>
			  </div>`
			: `<strong class="mtable-head-cell__label-label" mu-id="label"></strong>`;
	}
	public afterIndex() {
		if (this.isInteractive) {
			this.muVisible(this.columnInfo.filterable, "bFilter");
			this.muVisible(this.columnInfo.orderable, ["bOrderAsc", "bOrderDesc"]);
			this.muVisible(this.columnInfo.isFiltered, "indicatorFilter");
			this.muVisible(this.columnInfo.isOrdered === "asc", "indicatorOrderAsc");
			this.muVisible(this.columnInfo.isOrdered === "desc", "indicatorOrderDesc");
		}
		this.ui.label.innerText = this.columnInfo.name;
	}

	bOrderAsc_click() {
		// @ts-ignore
		this.muParent.muDispatchEvent("order", this.columnInfo.field, "asc");
	}

	bOrderDesc_click() {
		// @ts-ignore
		this.muParent.muDispatchEvent("order", this.columnInfo.field, "desc");
	}

	bFilter_click() {
		// @ts-ignore
		this.muParent.muDispatchEvent("filter", this.columnInfo.field);
	}

}
export class ColumnInfo
{
	table: Table;
	name: string = "";
	field: string = "";
	position: number = 0;
	orderable: boolean = true;
	filterable: boolean = true;
	template: string|null = null;
	isFiltered: boolean = false;
	isOrdered: "asc"|"desc"|null = null;
	widgetParams: {[key: string]: any} = {};
	cssClass: string|null = null;
	cellCssClass: string|null = null;
	headCssClass: string|null = null;
	transformContent: CellValueTranformer|null = null;
	interactiveOnly: boolean = false;

	constructor(initData: Partial<ColumnInfo> = {}) {
		Object.assign(this, initData);
	}
}

export class TableCell extends MuWidget {
	render(value: any, row: any, ev: CellValueTranformerEvent) {
		(this.container as unknown as HTMLTableCellElement).innerText = value || "";
	}
}

export class TableCommandCell extends TableCell
{
	render(value: any, row: any, ev: CellValueTranformerEvent) {
	}

	public command(ev: Event, cmd: string, ...args: any[])
	{
		(this.muParent.muParent as Table).dispatchCommand(
			{
				event: ev,
				row: (this.muParent as any).data,
				rowWidged: this.muParent,
				cellWidget: this,
				command: cmd,
			},
			cmd,
			...args
		);
	}
}

export type CellValueTranformer = (value: any, columnInf: ColumnInfo, cell: MuWidget, ev: CellValueTranformerEvent) => string|null;

export type CellValueTranformerEvent = {
	isInteractive: boolean;
}

type TableCellCommandEvent = {
	row: any;
	event: Event;
	rowWidged: MuWidget;
	cellWidget: MuWidget;
	command: string;
};

