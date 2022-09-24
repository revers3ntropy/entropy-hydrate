import { El } from "./types";

let currentComponentId = 0;
export function getComponentId() {
    return currentComponentId++;
}

export function waitForDocumentReady (): Promise<void> {
    return new Promise((resolve) => {
        if (document.readyState !== 'complete') {
            window.addEventListener('load', () => {
                resolve();
            });
            return;
        }
        resolve();
    })
}

/**
 * Returns the string in HTML escaped form to prevent XSS attacks
 * and general horribleness
 */
export function escapeHTML(unsafe: any): string {
    return (unsafe ?? '')
        .toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

export function attrsStartWith($el: El, start: string): string[] {
    const result = [];

    for (let attr of $el.attributes) {
        if (attr.name.startsWith(start)) {
            result.push(attr.name);
        }
    }
    return result;
}