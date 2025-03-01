# MuWidget
Tutorial

---

## Instalace prostředí

npm a parceljs

```bash
npm init
npm install --save-dev parcel
npm install mu-widget
touch index.html
npx parcel index.html
```
http://localhost:1234

---

## HTML

```html
<!DOCTYPE html>
<html lang="en">

<head>
	<meta charset="utf-8" />
	<meta http-equiv="x-ua-compatible" content="ie=edge" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<title>Todo list</title>
	<link rel="stylesheet" href="styles/main.scss" />
</head>

<body>
	<div class="todo">
		<h1>Todo list</h1>
		<div class="todo-editor">
			<input type="text" />
			<span class="icon-button">&check;</span>
			<span class="icon-button">&#128473;</span>
			<span class="icon-button">&#x2795;</span>
		</div>
		Show: <span class="a">Complete</span>, <span class="a">Uncomplete</span>, <span class="a">All</span>
		<div class="todo-list">
			<div class="todo-item">
				<label class="icon-button"><input type="checkbox" /></label>
				<span class="icon-button">&#x1F589;</span>
				<span class="icon-button">&#x1F5D1;</span>
				<span class="todo-item-label">New item</span>
			</div>
		</div>

	</div>
	<script src="scripts/app.js" type="module"></script>
</body>

</html>
```
Vytvoření základní HTML šablony.

---

## Doplnění `mu-` artibutů

```html
...
	<div mu-widget="Todo" class="todo">
		<h1>Todo list</h1>
		<div mu-widget="TodoEditor" mu-id="editor" class="todo-editor">
			<input mu-id="label" mu-bind="label" type="text" />
			<span mu-id="bUpdate" class="icon-button">&check;</span>
			<span mu-id="bCancel" class="icon-button">&#128473;</span>
			<span mu-id="bAdd" class="icon-button">&#x2795;</span>
		</div>
		Show: <span class="a" mu-click="show: true">Complete</span>, <span class="a" mu-click="show: false">Uncomplete</span>, <span class="a" mu-click="show: null">All</span>
		<div mu-id="list" class="todo-list">
			<div mu-widget="TodoItem" class="todo-item">
				<label mu-id="complete" class="icon-button"><input type="checkbox" /></label>
				<span mu-id="bEdit" class="icon-button">&#x1F589;</span>
				<span mu-id="bDelete" class="icon-button">&#x1F5D1;</span>
				<span mu-id="label" class="todo-item-label" mu-bind="label::text">New item</span>
			</div>
		</div>
...
```

`mu-id` - jako html id ale platné jen v aktuálním widgetu.
`mu-click` - jako html onclick ale místo funkcí se hledají metody v aktuálním widgetu.
`mu-template` - uloží blok kódu pro pozdější použití
`mu-bind` - určuje jak se budou přenášet data při použití `muBind` a `muFetch`

---

## Vytvoření kostry widgetů

`Widgets.ts`

```typescript
import { MuWidget } from 'mu-widget/lib/MuWidget';

export class Todo extends MuWidget {

}

export class TodoItem extends MuWidget {

}
```

###

## Registrace a iniciace widgetů

`app.js`

```javascript
import { MuBinder } from "mu-widget/lib/MuBinder";
import { MuWidget } from "mu-widget/lib/MuWidget";

MuWidget.registerAll(
	require("./Widgets")
);

MuBinder.register(MuWidget);

MuWidget.startup();

```

---

## Widget `TodoEditor`

Tento widget obsluhuje editor položky. Umožnuje zaregistrovat obsluhu 3 vlastních událostí. Události je doporučeno registrovat v metodě `afterIndex`.

```typescript
export class TodoEditor extends MuWidget {
	afterIndex(): void {
		this.muRegisterEvent('update', 'add', 'cancel');
	}
```

Metoda `load` naplnění dat do editoru a upraví widget podle toho jestli se jedná o vytvářecínebo editační formulář. Pro naplnění dat do formuláře se dá použít metoda `muFetchData`.

```typescript
	public load(data: TodoItemData|"new") {
		// Načte data do editoru, "new" znamená nová položka
		const isNew = data == "new";
		if (data == "new") data = { complete: false, label: "" };
		// Naplní pole editoru
		this.muBindData(data);
		// Zobrazí správné tlačítka podle režimu formuláře
		this.muVisible(isNew, [
			'!bUpdate',
			'!bCancel',
			'bAdd',
		]);
	}
```

Náseldující metody obsluhují kliky na tlačítka a volají obsluhu vlastních událostí. Pro načtení údajů z formuláře se dá použít metoda `muFetchData`.

```typescript

	public bUpdate_click() {
		// Načte data a zavolá obsluhu události update
		this.muDispatchEvent('update', this.muFetchData());
	}

	public bAdd_click() {
		// Načte data a zavolá obsluhu události add
		this.muDispatchEvent('add', this.muFetchData());
	}
	
	public bCancel_click() {
		// Zavolá obsluhu události cancel
		this.muDispatchEvent('cancel');
	}
}
```

Poznámka: Kam jak uložit/načíst data určuje html atribut `mu-bind`.

---

## Widget `TodoItem`

Tento widget obsluhe jednotlivé položky seznamu. 

Jednotlivé metody obsluhují tlačítka a checkbox u položky. První zavolá metodu nadřazeného widgetu pro otevření aktuální položky v editoru,

```typescript
export class TodoItem extends MuWidget {
	
	bEdit_click() {
		(this.muParent as Todo).editItem(this);
	}
```

Další tlačítko odstraní atuální widget i s jeho elementem z html.

```typescript	
	bDelete_click() {
		this.muRemoveSelf();
	}
```

A při změně stavu checkboxu, tato metoda změní třídu elementu.


```typescript
	complete_change() {
		this.container.classList.toggle('todo-item-complete', this.ui.complete.checked);
	}
}
```

---

## Widget `Todo`

Toto je hlavní widget který propojuje ostatní widgety.

**Tip:** Přetypováním property `muNamedWidget` je možné ušetřit si přetypování v kódu a využít našeptávání.

```typescript
export class Todo extends MuWidget {
	muNamedWidget: MuNamedWidgets<{
		editor: TodoEditor
	}>;
```

Po spuštění inicializuje formalář pro novou položku.

```typescript
	public afterIndex(): void {
		this.muNamedWidget.editor.load("new");
	}
```

Tato metoda uloží si aktuálně editovanou položku pro pozdělší aktualizaci. Dále načte data z aktuální položky a naplní jimi editační formulář. Volá se z widgetu položky `TodoItem`.

```typescript
	editItem(item: TodoItem) {
		this.currentItem = item;
		const data = item.muFetchData();
		this.muNamedWidget.editor.load(data);
	}

	protected currentItem: null|TodoItem = null;
```

Obsluha události `update` widgetu `editor`. Aktualizuje položku předanými data a vynuluje formulář.

```typescript
	public editor_update(ev: MuEvent, data: TodoItemData) {
		this.currentItem.muBindData(data);
		this.muNamedWidget.editor.load("new");
	}
```

Obsluha události `update` widgetu `editor`. Vytvoří novou položku s předanými data a vynuluje formulář.

```typescript
	public editor_add(ev: MuEvent, data: TodoItemData) {
		const newItem = this.muWidgetFromTemplate('todoItem', 'list');
		newItem.muBindData(data);
		this.muNamedWidget.editor.load("new");
	}
```

Událost `add` volaná z widgetu `editor` - vynuluje formulář

```typescript
	public editor_cancel(ev: MuEvent) {
		this.muNamedWidget.editor.load("new");
	}
```

Obsluha kliknutí na filtrovací tlačítka. Projde všechny widgeta položek v konteineru `list` a nastaví viditelnost podle aktuálního filtru.

```typescript
	public show(ev: MuEvent, state: boolean|null) {
		// vyfiltruje položky podle 
		this.muGetChildWidgets<TodoItem>("list").map(iw => iw.container.style.display = 
			state === null || iw.ui.complete.checked === state
			? null : "none" 
		)
	}
}
```
