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
    return $el.getAttributeNames()
        .filter(attr => attr.startsWith(start));
}

export function attrsAsJson($el: El): string {
    const result: Record<string, string | null> = {};
    for (let attr of $el.attributes) {
        result[attr.name] = attr.value;
    }
    return JSON.stringify(result);
}