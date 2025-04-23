import {AnyElement} from "../MuWidget";
import {addCssClass} from "mu-js-utils/lib/cssClass";

/**
 * Add class with animation and returns the promise that is resolved after the animation ends
 * @param el
 * @param name
 * @param opts
 */
export function playAnimation(el: HTMLElement, name: string, opts: Record<string, any> = {}): Promise<void> {
    return new Promise((resolve) => {
        const animationEnd = () => {
            el.classList.remove(name);
            el.removeEventListener("animationend", animationEnd);
            for (const key in opts) {
                el.style.removeProperty('--' + key);
            }
            resolve();
        }
        el.classList.add(name);
        for (const key in opts) {
            el.style.setProperty('--' + key, opts[key]);
        }
        el.addEventListener("animationend", animationEnd);
    });
}

/**
 * Make HTML element
 * @param tagName
 * @param attributes
 * @param content
 */
export function makeHtmlElement<K extends keyof HTMLElementTagNameMap>(
    tagName: K,
    attributes: { class?:string|null|string[] } & { [key: string]: string|null } = {},
    content: null|string|HTMLElement|(string|HTMLElement)[] = null,
): HTMLElementTagNameMap[K] {
    const element = document.createElement(tagName);
    for (const key in attributes) {
        if (key === 'class')
            addCssClass(element, attributes[key]);
        else if (attributes[key] !== null)
            element.setAttribute(key, attributes[key]);
    }
    if (content) {
        if (!Array.isArray(content)) content = [ content ];
        for(const c of content) {
            element.append(c);
        }
    }
    return element;
}

export function makeSelectOptionsData(src: any[], valueField: string = 'id', textFiled: string = 'name', emptyText: string|null = "Vyberte")
{
    let data = src.map(item => ({ value: item[valueField], text: item[textFiled] }));
    if (emptyText) data = [{ value: '', text: emptyText}, ...data];
    return data;
}

export function bindSelectOptions(element: HTMLSelectElement|HTMLDataListElement, src: any[], valueField: string = 'id', textFiled: string = 'name', emptyText: string|null = "Vyberte")
{
    let data = src.map(item => ({ value: item[valueField], text: item[textFiled] }));
    if (emptyText) data = [{ value: '', text: emptyText}, ...data];
    for (const item of data) {
        let newOption = document.createElement('option');
        newOption.value = item.value;
        newOption.text = item.text;
        element.appendChild(newOption);
    }
}

const loadedScripts: Record<string, Promise<void>> = {}

/**
 * Adds external javascript to the page and returns a promise that is waiting to be loaded, if the script with the url is already loaded it returns a resolved promise.
 * @param src
 */
export function loadScript(src: string): Promise<void> {
    if (loadedScripts[src] === undefined) {
        loadedScripts[src] = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = src;
            script.async = true;
            script.onload = () => resolve();
            script.onerror = () => reject();
            document.head.appendChild(script);
        });
    }
    return loadedScripts[src];
}

export function arrayDiff<T>(a: T[], b: T[]): T[] {
    return a.filter(x => !b.includes(x));
}

export const selectPromptItem = { value: '', text: '-' };

/**
 * Returns the promise that will be resolved when the element is removed.
 * @param target
 */
export function waitForRemove(target: HTMLElement): Promise<void> {
    return new Promise(resolve => {
        (new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (Array.from(mutation.removedNodes).includes(target))
                    resolve();
            });
            // @ts-ignore
        })).observe(target.parentElement, { childList: true });
    });
}

export async function withLoader(element: HTMLElement|AnyElement, callback: () => Promise<void>)
{
    try {
        element.classList.add('overlay-loader');
        await callback();
    } finally {
        element.classList.remove('overlay-loader');
    }
}

export async function dataUrlFromFile(file: File): Promise<string> {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            // @ts-ignore
            resolve(e.target.result);
        };
        reader.readAsDataURL(file);
    });
}

export function orderElementsBy(parent: AnyElement, getNumOrder: (child:AnyElement|Node)=>number) {
    return sortElementsBy(parent, (childA, childB) => {
        const a = getNumOrder(childA);
        const b = getNumOrder(childB);
        if (a === b) return 0;
        return a > b ? 1 : -1;
    });
}

export function sortElementsBy(parent: AnyElement, compare: (childA:AnyElement|Node, childB:AnyElement|Node)=>number) {
    const childs = Array.from(parent.children);
    childs.sort(compare);
    for (const child of childs) {
        parent.append(child);
    }
}