import { Component } from "../components";

export const LoadHTML = Component('load-html', async ({ src, options={} }) => {
    if (typeof src !== 'string' || !src) {
        console.error('Invalid URL: ', src);
        return ``;
    }

    const res = await fetch(src, options)
        .catch(console.error);

    return await res?.text()
        .catch(console.error);
});