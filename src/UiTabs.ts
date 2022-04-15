import {MuWidget} from "./MuWidget";

export class UiTabs extends MuWidget
{
	// public tabIds : string[];

	public labelAtributeName : string = "tab-label";

	protected tabLabels : Record<string, HTMLElement> = {};

	private liClassName: string = "nav-item";

	private aClassName: string = "nav-link";

	private aActiveClassName: string = "nav-link active";

	public onSelectTab : ((muId : string) => void)|null = null;

	public selectedTabId : string|null = null;

	public afterIndex()
	{
		this.container.classList.add("nav nav-tabs");
		this.muParent?.muOnAfterIndex.push(() => this.makeTabs());
	}

	private makeTabs()
	{
		this.container.innerHTML = "";
		let firstMuId = null;

		if (this.muParent)
		{
			for(let muId in this.muParent.ui)
			{
				const tabContent = this.muParent.ui[muId];
				let label = tabContent.getAttribute(this.labelAtributeName);
				if (label === null) continue;
				if (firstMuId == null) firstMuId = muId;
				const hLi = document.createElement("li");
				hLi.className = this.liClassName;
				const hA = document.createElement("span");
				hA.addEventListener("click", () => {
					this.selectTab(muId);
					if (this.onSelectTab) this.onSelectTab(muId);
				});
				hA.innerText = label;
				hLi.appendChild(hA);
				this.tabLabels[muId] = hA;
				this.container.appendChild(hLi);
			}
			if (firstMuId) this.selectTab(firstMuId);
		}
	}

	public selectTab(selectedMuId: string) {
		for(let muId in this.tabLabels) {
			const tabLabel = this.tabLabels[muId];
			let isActive = selectedMuId === muId;
			tabLabel.className = isActive ? this.aActiveClassName : this.aClassName;
			this.muParent?.muVisible(isActive, muId);
			if (isActive) this.selectedTabId = muId;
		}
	}
}