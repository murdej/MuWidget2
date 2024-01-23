import { AnyElement, MuWidget } from "../../src/MuWidget";

export class Example extends MuWidget
{
	srcHtml: string;

	constructor(container : AnyElement) {
		const srcHtml = container.innerHTML
		container.innerHTML = `<fieldset class="src-html">
			<legend>HTML source</legend>
			<pre mu-id="srcHtml"></pre>
		</fieldset>
		<fieldset class="src-ts">
			<legend>Typscript source</legend>
			<pre mu-id="srcTs"></pre>
		</fieldset>
		<fieldset class="widget" mu-id="widgetContainer">
			<legend>Example widget</legend>`
			+ container.innerHTML + `
		</fieldset>`;
		super(container);

		this.srcHtml = srcHtml;
	}

	afterIndex(): void {
		this.container.classList.add('example');
		this.ui.srcHtml.appendChild(document.createTextNode(this.muTemplates['widget'].replaceAll('"', "'").replaceAll("&quot;", '"')));
		const widget = this.muWidgetFromTemplate('widget', 'widgetContainer');
		this.highlight(this.ui.srcHtml, "html");
		const c = new XMLHttpRequest();
		c.open("GET", "../scripts/" + widget.constructor.name + ".ts");
		c.send();
		c.onload = (ev) => {
			this.ui.srcTs.appendChild(document.createTextNode(c.responseText));
			this.highlight(this.ui.srcTs, "typescript");
		} 
	}

	highlight(el : AnyElement, lang : string) : void
	{
		if (window.EnlighterJS)
			window.EnlighterJS.enlight(el, {
				language: lang,
				theme: 'bootstrap4',
			});
	}

}