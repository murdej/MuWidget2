import { MuEvent, MuWidget } from "../../src/MuWidget";

export class RadioListDemo extends MuWidget {
	public beforeIndex(): void {
        this.muAppendContent(
            /*html*/`<div mu-widget="UiRadioList" mu-id="radiols">`
            + ["foo", "bar", "eee"].map(n => /*html*/`<input type="radio" mu-id="${n}" mu-name="fooo"><label mu-for="${n}">${n}</label>`).join('\n')
            + `</div>`
        );
    }

    protected n = 0;

    radiols_change() {
        const v = this.muNamedWidget.radiols.muFetchData();
        this.n++;
        console.log(`${this.n}. ${v}`);
    }
}

export class UiRadioList extends MuWidget {
    allRadios: NodeListOf<HTMLInputElement>;
    
    afterIndex() {
        this.muRegisterEvent("change");
        this.allRadios = this.container.querySelectorAll('input[type="radio"]') as NodeListOf<HTMLInputElement>;
        for(const r of this.allRadios)
            r.addEventListener("change", (ev) => this.muDispatchEvent("change", this.muFetchData()))
    }
    
    override muFetchData() : string|null {
        for(const r of this.allRadios) if (r.checked) return r.value;
        return null;
    }

    override muBindData(value : string|null) : void {
        for(const r of this.allRadios) r.checked = r.value === value;
    }
}
