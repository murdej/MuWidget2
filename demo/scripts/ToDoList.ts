import { MuEvent, MuWidget } from "../../src/MuWidget";

export class ToDoList extends MuWidget
{
	currentItem: ToDoListItem|null = null;

	afterIndex(): void {
		this.editItem(null);
	}

	editItem(item: ToDoListItem|null) {
		this.currentItem = item;
		(this.muNamedWidget.itemForm as ToDoListForm).bindItem(item)
	}

	bNew_click() {
		this.editItem(null);
	}

	itemForm_save(ev : MuEvent, data : any) {
		if (!this.currentItem) {
			this.currentItem = <unknown>this.muWidgetFromTemplate("item", "itemList") as ToDoListItem;
			data.isComplete = false;
		} 

		this.currentItem.muBindData(data);
		this.editItem(null);
	}

	bDeleteComplete_click() {
		this.muGetChildWidgets<ToDoListItem>("itemList").filter(item => item.getIsComplete()).forEach(item => item.muRemoveSelf());
	}
}

export class ToDoListItem extends MuWidget
{
	getIsComplete(): boolean {
		return this.ui.isComplete.checked;
	}
	bEdit_click() {
		(<unknown>this.muParent as ToDoList).editItem(this);
	}

	bDelete_click() {
		this.muRemoveSelf();
	}

	isComplete_change() {
		this.muBindData({isComplete: this.ui.isComplete.checked});
	}
}

export class ToDoListForm extends MuWidget
{
	bindItem(item: ToDoListItem | null) {
		this.muBindData(
			item ? item.muFetchData() : { title: "", color: "#ffffff", isComplete: false }
		);
		this.ui.formTitle.innerText = item != null ? "Edit item" : "New item";
	}
	afterIndex(): void {
		this.muRegisterEvent("save", "cancel");
	}

	bSave_click() {
		const data = this.muFetchData();
		this.ui.errorLabel.innerText = ""
		if (data.title) {
			this.muDispatchEvent("save", data);
		} else {
			this.ui.errorLabel.innerText = "Enter some text"
		}
	}

	bCancel_click() {
		this.muDispatchEvent("cancel");
	}
}