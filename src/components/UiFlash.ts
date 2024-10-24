import {MuWidget} from "../MuWidget";
import {playAnimation} from "../utils/utils";

export class UiFlashContainer extends MuWidget {

    // @ts-ignore
    public static instance: UiFlashContainer;
    beforeIndex() {
        this.container.classList.add('toast-container', 'p-3', 'flash-container');
        this.muAppendContent(`<div mu=":UiFlashItem@item"></div>`);
        UiFlashContainer.instance = this;
    }

    public static add(message: string, style: 'error'|'ok'): UiFlashItem {
        return UiFlashContainer.instance.add(message);
    }

    private add(message: string): UiFlashItem {
        const item = this.muWidgetFromTemplate('item', this.container) as unknown as UiFlashItem;
        item.setMessage(message);
        return item;
    }
}

export class UiFlashItem extends MuWidget {
    public static animationClass: string;
    beforeIndex() {
        this.container.classList.add('toast', 'align-items-center', 'text-bg-primary', 'border-0', 'show');
        this.muAppendContent(`
            <div class="d-flex">
                <div class="toast-body" mu="message"></div>
                <button type="button" mu="close" class="btn-close btn-close-white me-2 m-auto" aria-label="Close"></button>
            </div>
        `);
    }

    setMessage(message: string) {
        this.ui.message.textContent = message;
    }

    async close_click() {
        if (UiFlashItem.animationClass)
            // @ts-ignore
            await playAnimation(this.container, UiFlashItem.animationClass);
        this.muRemoveSelf();
    }
}