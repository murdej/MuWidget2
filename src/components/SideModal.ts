import {AnyElement, MuWidget} from "../MuWidget";
import {waitForRemove} from "../utils/utils";

export class SideModal extends MuWidget {
    // @ts-ignore
    private contentContainer: HTMLElement;
    muAppendContent(html: string) {
        this.contentContainer.innerHTML += html;
    }

    close_click() {
        if (this.beforeClose()) {
            this.muDispatchEvent('close');
            this.muRemoveSelf();
            SideModal.updateMainScroolbars();
        }
    }

    public static updateMainScroolbars() {
        // @ts-ignore
        document.querySelector('html').style.overflow =
            !!document.querySelector('.side-modal') ? 'hidden' : 'auto';
    }

    public static container: HTMLElement;

    public static open<T extends MuWidget = SideModal>(
        widgetName: string,
        label: string,
        params = {},
    ): T {
        const container = document.createElement('div') as AnyElement;
        container.setAttribute("mu-widget", widgetName);
        container.classList.add("side-modal");
        container.innerHTML = `
            <div class="side-modal__container">
                <div class="side-modal__head">
                    <h2 mu-id="modalLabel" class="flex-grow-1"></h2>
                    <span class="flex-grow-0 close" mu="close">&times;</span>
                </div>
                <div class="side-modal__content" mu-id="content"></div>
            </div>`;
        const content = container.querySelector('[mu-id="content"]');
        // @ts-ignore
        container.querySelector('[mu-id="modalLabel"]').textContent = label;

		SideModal.container.appendChild(container);
        // @ts-ignore
        const cWidget = new MuWidget(SideModal.container);
        const widget = cWidget.muActivateWidget(
            // @ts-ignore
            container,
            {
                widget: widgetName,
		    },
            {
                ...params,
                contentContainer: content,
            },
            params
        ) as unknown as T;
        widget.muRegisterEvent('close');

        this.updateMainScroolbars();
        waitForRemove(container as unknown as HTMLElement).then(() => this.updateMainScroolbars())

        return widget;
    }

    protected beforeClose() {
        return true;
    }
}