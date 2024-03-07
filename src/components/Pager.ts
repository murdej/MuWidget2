/*
 * This file is part of the MuWidget extras package.
 *
 * (c) Vít Peprníček <vit.peprnicek@gmail.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

import {MuWidget} from "mu-widget/lib/MuWidget";

export class Pager extends MuWidget {
	private currentPageCount: number = 0;
	private itemCount: number = -1;
	private oldValues: {
		currentPageNum: number,
		pageCount: number,
		itemFrom: number,
		itemCount: number,
	} = { itemCount: -1, itemFrom: -1, pageCount: -1, currentPageNum: -1 };

	public fullInfoTemplate = "Showing records {firstItem} to {lastItem} of {itemCount} total.";

	public emptyInfo = "No records are displayed.";

	beforeIndex() {
		this.muRegisterEvent('changePage');
		this.container.classList.add('pager');
		this.muAppendContent(`
			<div class="pager__nav">
				<span class="pager__btn" mu-id="bPrev">&lt;</span>
				<input class="pager__page-num" title="Číslo stránky" type="number" min="2" value="1" mu-id="pageNumber" />
				<span class="pager__info"> / <span mu-id="pagesCount"></span> (</span>
				<input class="pager__page-size" title="Počet na stránku" type="number" min="1" value="100" mu-id="itemPerPage" />
				<span class="pager__info">)</span>
				<span class="pager__btn" mu-id="bChangeItemPerPage">Zobrazit</span>
				<span class="pager__btn" mu-id="bNext">&gt;</span>
			</div>
			<div class="pager__numbers" mu-id="pages">
				<span class="pager__btn" mu-widget="PagerItem" mu-template="item">
					<span mu-id="label"></span>
				</span>
			</div>
		`);
	}

	setItemCount(newItemCount: number, launchEvent = false) {
		this.itemCount = newItemCount;
		this.update(launchEvent);
	}

	update(fireEvent: boolean) {

		let newCurrentPageNum = this.currentPageNum; // Math.floor(this.oldValues.itemFrom / this.itemPerPage);
		this.currentPageCount = Math.ceil(this.itemCount / this.itemPerPage);
		newCurrentPageNum = Math.min(this.currentPageCount - 1, Math.max(0, newCurrentPageNum));

		// Změna počtu stránek
		if (this.oldValues.pageCount !== this.currentPageCount) {
			this.ui.pages.innerHTML = "";
			for(let n = 0; n < this.currentPageCount; n++) {
				this.pageItems[n] = this.muWidgetFromTemplate('item', 'pages', {num: n}) as unknown as PagerItem;
			}
			this.ui.pagesCount.innerText = this.ui.pageNumber.max = this.currentPageCount.toString();
		}

		// změna pozice, nebo počtu stránek
		if (this.oldValues.currentPageNum !== newCurrentPageNum || this.oldValues.pageCount !== this.currentPageCount)
		{
			for(const item of this.pageItems) item.setSelected(item.num == newCurrentPageNum);
			this.ui.pageNumber.valueAsNumber = newCurrentPageNum + 1;

			if (fireEvent) {
				// console.log("New set " + newCurrentPageNum + " / " + this.currentPageCount);
				this.muDispatchEvent('changePage', newCurrentPageNum)
			}
		}

		this.oldValues = {
			pageCount: this.currentPageCount,
			currentPageNum: newCurrentPageNum,
			itemFrom: this.currentItemFrom,
			itemCount: this.itemCount,
		};

		// tooltip
		// @ts-ignore
		this.container.title = this.itemCount
			// @ts-ignore
			? this.fullInfoTemplate.replace(/\{([^{}]+)\}/g, (fm, vn) => {
				switch (vn) {
					case "firstItem": return Math.max((newCurrentPageNum) * this.itemPerPage + 1, 0);
					case "lastItem": return Math.min((newCurrentPageNum + 1) * this.itemPerPage, this.itemCount);
					case "itemCount": return this.itemCount.toString();
					default: return fm;
				};
			})
			: this.emptyInfo;
	}

	public get itemPerPage(): number {
		return this.ui.itemPerPage.valueAsNumber;
	}

	public set itemPerPage(c: number) {
		this.ui.itemPerPage.valueAsNumber = Math.max(1, c);
		this.update(true);
	}

	public get currentPageNum(): number {
		return this.ui.pageNumber.valueAsNumber - 1;
	}

	public set currentPageNum(p: number) {
		p = Math.min(this.currentPageCount - 1, Math.max(0, p));
		this.ui.pageNumber.valueAsNumber = p + 1;
		this.update(true);
	}

	public get currentItemFrom() {
		return Math.max(0, this.currentPageNum * this.itemPerPage);
	}

	pageNumber_change() {
		this.update(true);
	}

	public bChangeItemPerPage_click() {
		// this.setPageNum(this.currentItemFrom / this.itemPerPage, true);
		this.update(true);
	}

	pageItems: PagerItem[] = [];

	bPrev_click() {
		this.currentPageNum--;
	}

	bNext_click() {
		this.currentPageNum++;
	}

}

export class PagerItem extends MuWidget<Pager> {
	public num: number = -1;
	afterIndex() {
		this.ui.label.innerText = (this.num + 1).toString();
	}

	container_click() {
		this.muParent.currentPageNum = this.num;
	}

	setSelected(val: boolean) {
		this.container.classList.toggle('pager__btn--active', val);
	}
}
