import {MuWidget} from "../MuWidget";
import {playAnimation} from "../utils/utils";
import {Timer} from "mu-js-utils/lib/Timer";

export class UiFlashContainer extends MuWidget {

    public static cssClasses = {
        container: ['toast-container', 'p-3', 'flash-container'],
    };
    getCssClassesFor(component: string, asArray: boolean = true): string[]|string {
        return asArray
            ? UiFlashContainer.cssClasses[component]
            : UiFlashContainer.cssClasses[component].join(' ');
    }

    // @ts-ignore
    public static instance: UiFlashContainer;
    beforeIndex() {
        this.container.classList.add(...this.getCssClassesFor('container'));
        this.muAppendContent(`<div mu=":UiFlashItem@item"></div>`);
        UiFlashContainer.instance = this;
    }

    public static add(message: string, theme: 'error'|'ok'|string = ''): UiFlashItem {
        return UiFlashContainer.instance.add(message, theme);
    }

    private add(message: string, theme: string): UiFlashItem {
        const item = this.muWidgetFromTemplate(
            'item',
            this.container,
            {
                theme
            }
        ) as unknown as UiFlashItem;
        item.setMessage(message);
        return item;
    }
}

export class UiFlashItem extends MuWidget {

    public closeTimer: Timer;

    public static cssClasses = {
        container: ['toast', 'align-items-center', 'text-bg-primary', 'border-0', 'show'],
        content: ["d-flex"],
        message: ['toast-body'],
        closeButton: ['btn-close', 'btn-close-white', 'me-2', 'm-auto'],
        closeAnimation: null,
        openAnimation: null,
        themePrefix: 'flash-item-theme--',
    };
    public ttl: number = null;

    public static ttlDefault: number = null;

    public theme: string = '';

    protected tickOpen = (new Date()).getTime();

    getCssClassesFor(component: string, asArray: boolean = true): string[]|string {
        return asArray
            ? UiFlashItem.cssClasses[component]
            : UiFlashItem.cssClasses[component].join(' ');
    }

    public static animationClass: string;
    beforeIndex() {
        this.container.classList.add(...this.getCssClassesFor('container'));
        this.muAppendContent(`
            <div class="${this.getCssClassesFor('content', false)}">
                <div class="${this.getCssClassesFor('message', false)}" mu="message"></div>
                <button type="button" mu="close" class="${this.getCssClassesFor('closeButton', false)}" aria-label="Close"></button>
            </div>
        `);
    }

    setMessage(message: string) {
        this.ui.message.textContent = message;
    }

    async close_click() {
        if (UiFlashItem.animationClass || UiFlashItem.cssClasses.closeAnimation) {
            // @ts-ignore
            await playAnimation(this.container, UiFlashItem.animationClass || UiFlashItem.cssClasses.closeAnimation);
        }
        this.muRemoveSelf();
    }

    afterIndex() {
        if (UiFlashItem.cssClasses.openAnimation) { // @ts-ignore
            playAnimation(this.container, UiFlashItem.cssClasses.openAnimation)
        }
        if (UiFlashItem.cssClasses.themePrefix && this.theme) { // @ts-ignore
            this.container.classList.add(UiFlashItem.cssClasses.themePrefix + this.theme);
        }
        const ttl = this.ttl ?? UiFlashItem.ttlDefault;

        this.closeTimer = new Timer(ttl * 1000, !!ttl);
        this.closeTimer.wait().then(() => this.close_click());
        // setTimeout(() => this.close_click(), ttl * 1000);
    }
}