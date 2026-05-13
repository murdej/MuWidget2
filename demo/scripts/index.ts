import { MuWidget } from "../../src/MuWidget";
import { MuBinder } from "../../src/MuBinder";
import { MuKeyBind } from "../../src/MuKeyBind";
import { MuLabelFor } from "../../src/MuLabelFor";

import * as example from "./Example";
import * as charCounter from "./CharCounter";
import * as calculator from "./Calculator";
import * as toDoList from "./ToDoList";
import * as uiFlashMessage from "../../src/UiFlashMessage";
import * as sRLForm from "./SRLForm";
import * as recursiveContent from "./RecursiveContent";
import * as createContent from "./CreateContent";
import * as keyBind from "./KeyBind";
import * as widgetEvents from "./WidgetEvents";
import * as radioListDemo from "./RadioListDemo";
// import * as muBindSelf from "./MuBindSelf";
import * as treeView from "../../src/components/TreeView";
import * as treeViewDemo from "./TreeViewDemo";
import * as dialogDemo from "./DialogDemo";
import * as jsonS from "./JsonS";
import * as reviveDemo from "./ReviveDemo";

MuWidget.registerAll(
	example,
	charCounter,
	calculator,
	toDoList,
	uiFlashMessage,
	sRLForm,
	recursiveContent,
	createContent,
	keyBind,
	widgetEvents,
	radioListDemo,
	treeView,
	treeViewDemo,
	dialogDemo,
	jsonS,
	reviveDemo,
);

MuWidget.registerAs(MuWidget, '.');

/* (window as any).LegacyWidget = function(this: any) { }
(window as any).LegacyWidget.prototype = {
	afterIndex(this: any) {
		this.ui.hello.innerText = "Hello world :)";
	}
} */

// import { IMuWidget } from "./IMuWidget";
MuBinder.register(MuWidget);
MuLabelFor.register(MuWidget, true);
MuKeyBind.register(MuWidget);

MuWidget.fixOldWidgets = true;
MuWidget.startup();