const MuWidget = require("../../src/MuWidget").MuWidget;
const MuBinder = require("../../src/MuBinder").MuBinder;

MuWidget.registerAll(
	require("./Example"),
	require("./CharCounter"),
	require("./Calculator"),
	require("./ToDoList"),
	require("../../src/UiFlashMessage"),
	require("./SRLForm"),
	require("./RecursiveContent"),
	require("./CreateContent"),
);

LegacyWidget = function() { }
LegacyWidget.prototype = {
	afterIndex: function() {
		this.ui.hello.innerText = "Hello world :)";
	}
}

// MuWidget.registerAs(require("./IMuWidget").IMuWidget, ".")
MuBinder.register(MuWidget);

MuWidget.fixOldWidgets = true;
MuWidget.startup();
