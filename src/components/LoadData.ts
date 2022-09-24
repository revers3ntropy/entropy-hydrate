import { Component } from "../components";
import { El } from "../types";
import { set } from "../reservoir";

export type ResponseType = 'text' | 'json';

export const LoadData = Component<{
    src: string,
    options?: Record<string, any>,
    response?: ResponseType,
    id: number,
    $el: El,
    to: string,
    content: string
}>('load-data', async ({
    src, options={}, to, response = 'text', content, $el
}) => {
    if (typeof src !== 'string' || !src) {
        console.error('Invalid URL: ', src);
        return ``;
    }

    if (typeof to !== 'string') {
        console.error('Invalid target');
        return;
    }

    const res = await fetch(src, options)
        .catch(console.error);

    let value;

    switch (response) {
        case 'text':
            value = await res?.text()
                .catch(console.error);
            if (!value) {
                console.error('No response from converting to text');
                return;
            }
            // escape text and insert to props as string
            break;
        case 'json':
            value = await res?.json()
                .catch(console.error);
            break;
        default:
            return console.error('Invalid response type');
    }

    if (!content.trim()) {
        set(to, value);
    } else {
        $el.setAttribute(`pour.${to}`, JSON.stringify(value));
        return content;
    }
});