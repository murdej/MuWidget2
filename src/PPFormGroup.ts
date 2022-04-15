import {MuUIDs} from "./MuUIDs";

class PPFormGroupConfig {
	containerCssClass : ConfigItem<string>;
	labelCssClass : ConfigItem<string>;
	inputContainerCssClass : ConfigItem<string>;
	inputCssClass : ConfigItem<string>;
	labelSize : ConfigItem<number>;
	errorCssClass : ConfigItem<string>;
};

export class PPFormGroup extends PPFormGroupConfig
{
	public static defaultConfig : PPFormGroupConfig = new PPFormGroupConfig()

	public label : string;

	public preproc(element : HTMLElement) {
		element.className += " " + this.getConfigValue("containerCssClass");
		const input = element.firstElementChild;
		const id = MuUIDs.next("id");
		input.className += " " + this.getConfigValue("inputCssClass");
		input.id = id;
		// input.parentElement.removeChild(input);
		// this.input = input;
		const label = document.createElement("label");
		label.className = this.getConfigValue("labelCssClass");
		label.htmlFor = id;
		label.innerText = this.label || element.getAttribute("label");
		const inputContainer = document.createElement("div");
		inputContainer.className = this.getConfigValue("inputContainerCssClass");
		while(element.firstChild) {
			const subEl = element.firstChild;
			subEl.parentElement.removeChild(subEl);
			inputContainer.appendChild(subEl);
		}
		const errorMessage = document.createElement("div");
		errorMessage.className = this.getConfigValue("errorCssClass");
		errorMessage.innerText = "Test error";
		input["errorMessageElement"] = errorMessage;
		input["formGroupElement"] = element;
		inputContainer.appendChild(errorMessage);
		element.appendChild(label);
		element.appendChild(inputContainer);
	}

	public getConfigValue(k : keyof PPFormGroupConfig|string) : any
	{
		let v;
		if (k in this) v = this[k];
		else v = PPFormGroup.defaultConfig[k];

		if (typeof v == "function") v = v(this)

		return v;
	}
}

type ConfigItem<T> = T|((UiFormGroup) => T);

export function TwitterBootstrap4(config: PPFormGroupConfig, labelSize : number = 4)
{
	config.containerCssClass = "row mb-3";
	config.labelCssClass = (fg) => "col-sm-" + fg.getConfigValue("labelSize") + " col-form-label";
	config.inputContainerCssClass = (fg) => "col-sm-" + (12 - fg.getConfigValue("labelSize"));
	config.labelSize = labelSize;
	config.inputCssClass = "form-control";
	config.errorCssClass = "invalid-feedback";
}

export function TwitterBootstrap3(config: PPFormGroupConfig, labelSize : number = 4)
{
	config.containerCssClass = "row mb-3";
	config.labelCssClass = (fg) => "col-sm-" + fg.getConfigValue("labelSize") + " col-form-label";
	config.inputContainerCssClass = (fg) => "col-sm-" + (12 - fg.getConfigValue("labelSize"));
	config.labelSize = labelSize;
	config.inputCssClass = "form-control";
	config.errorCssClass = "invalid-feedback";
}