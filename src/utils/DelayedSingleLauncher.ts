export class DelayedSingleLauncher {
	private timeout: number;
	private callback: () => void;
	private lastSend: Date;

	constructor(timeout: number, callback: () => void) {
		this.timeout = timeout;
		this.callback = callback;
	}

	public send(...args) {
		this.lastSend = new Date();
		setTimeout(() => {
			const diff = (new Date().getTime() - this.lastSend.getTime()) / 1000;
			if (diff >= this.timeout) {
				// @ts-ignore
				this.callback(...args);
			}
		}, this.timeout * 1000 + 1)
	}
}
