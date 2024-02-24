# `Dialog` component

The Dialog component allows you to wrap a widget in a modal dialog. It also allows easy use similar to the native `alert`, `confirm` or `prompt` dialogs.

## Example of opening a dialog and getting the entered values:

Widget from which the dialog opens:

```ts
	async bOpenDialog_click() {
		// Creating and opening a dialogue
		const dialog = Dialog.open('DialogDemoDialog');
		// Waiting for confirmation or closing the dialog and getting the values
		// the parameter can be used to pass the value that is returned in case of closing the dialog
		const res = await dialog.waitForResponse(null);
		// Here you can use the values obtained
	}
```

Widget displayed in an open dialog:

```ts
export class DialogDemoDialog extends Dialog {
	public beforeIndex(): void {
		this.muAppendContent(`
			<span class="flex-grow-1">Enter text and select color</span>
			<span class="btn-close" mu="btnClose">&times;</span>
			
			<div>
				<input type="text" mu-bind="text" /><input type="color" mu-bind="color" />
			</div>

			<span class="btn" mu="btnOk">Ok</span>
		`);
	}

	btnOk_click() {
		// Confirm, close the dialog and return values.
		this.resolve(this.muFetchData());
	}

	btnClose_click() {
		// Dialogue cancellation
		this.muRemoveSelf();
	}
}
```

## Options for opening a dialogue

The parameters of the static method `Dialog.open` are:

| Parameter  | Type                | Default  | The meaning of the parameter  |
| ---------- | ------------------- | -------- | ----------------------------- |
| `widgetName` | `string`              |          | Widget name                   |
| `params`     | `Record<string, any>` | `{}`       | Optional widge parameters     |
| `tagName`    | `string`              | `'dialog'` | Tag name of container element |
| `container`  | `HTMLElement\|null`   | `null`     | The dialog will be inserted into this element, if the input is not specified, it will be inserted into the html document. |
