import { escapeHTML, randomString } from "./utils";
import { internals } from "./globals";

/**
 * Tag function to generate clean html from a template string
 * @example
 * html`<div class="foo">${'bar'}</div>`
 * // => '<div class="foo">bar</div>'
 *
 * html`<div class="foo">${'<script>alert("xss")</script>'}</div>`
 * // => '<div class="foo">&lt;script&gt;alert("xss")&lt;/script&gt;</div>'
 *
 * html`<button onclick="${() => alert('xss')}">click me</button>`
 * // => '<button onclick="hydrate.internals.funcs['someHash123']()">click me</button>'
 */
export function html(strings: TemplateStringsArray, ...values: any[]): string {
    let result = strings[0];
    for (let i = 0; i < values.length; i++) {

        const val = values[i];

        if (typeof val === 'function') {
            // generate unique hash for this function
            let key = randomString(20);
            while (key in internals.funcs) {
                key = randomString(20);
            }

            internals.funcs[key] = val;
            result += `window.hydrate.internals.funcs['${ key }']`;
        } else if (val instanceof EscapedHTML) {
            result += val.value;
        } else {
            result += escapeHTML(val);
        }

        result += strings[i + 1] || '';
    }
    return result;
}

export class EscapedHTML <T> {
    constructor(public value: T) {}
}

export function raw (value: any) {
    return new EscapedHTML(value);
}