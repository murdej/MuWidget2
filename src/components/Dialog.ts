import { AnyElement, MuWidget } from '../MuWidget';

export class Dialog extends MuWidget
{
	public waitForResponse(emptyResponse = null): Promise<any>
	{
		this.emptyResponse = emptyResponse;
		return new Promise<any>((resolve, reject) => {
			this.resolveCallback = resolve;
			this.rejectCallback = reject;
		})
	}

	public static defaultContainer: (()=>HTMLElement)|HTMLElement = () => document.getElementsByTagName('body')[0];

	protected emptyResponse: any = null;

	private resolveCallback: ((value: any)=>void)|null = null;
	
	private rejectCallback: (value: any)=>void = ()=>null;

	protected resolve(value: any) {
		if (this.resolveCallback) this.resolveCallback(value);
		this.resolveCallback = null;
		this.container.remove();

	}

	afterIndex(): void {
		new MutationObserver((mutations) => {
			mutations.forEach((mutation) => {
				if (mutation.type === 'childList' && Array.from(mutation.removedNodes).includes(this.container)) {
					this.resolve(this.emptyResponse);
				}
			});
		});
	}

	public static open<T = Dialog>(widgetName: string, params = {}, tagName: string = 'dialog', container: HTMLElement|null = null): T {
		const el = document.createElement(tagName) as AnyElement;
		if (!container) {
			if (typeof this.defaultContainer === 'function') container = this.defaultContainer();
			else container = this.defaultContainer;
		}
		container = (container ?? document.documentElement);
		container.appendChild(el);
		(el as unknown as HTMLDialogElement).showModal();
		el.setAttribute("mu-widget", widgetName);
		const w = (container['widget'] ?? new MuWidget(container as AnyElement)).muActivateWidget(el, {
			widget: widgetName,
			params: params,
		}, params) as unknown as T;
		//@ts-ignore
		el.widget = w;

		return w;
	}
}