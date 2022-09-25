import { El } from "./types";
import { DRY_CONTENT_SVG_ATTR, SVG_ATTR } from "./globals";

const svgCache: Record<string, string> = {};

/**
 * Caches the SVG file content
 */
export function preloadSVGs(...uris: string[]) {
    for (const uri of uris) {
        if (svgCache[uri]) {
            continue;
        }
        // don't await, because we want to load them all at the same time
        getSVGFromURI(uri).then();
    }
}

/**
 * Loads the SVG file content into the element
 * Adds the SVG HTML before the rest of the contents
 * of the element.
 * @param {HTMLElement} $el
 * @returns {Promise<void>}
 */
export  async function loadSVG($el: El) {
    const svgPath = $el.getAttribute(SVG_ATTR);
    if (!svgPath) {
        throw new Error('No SVG path specified');
    }

    let content = $el.getAttribute(DRY_CONTENT_SVG_ATTR) ?? $el.innerHTML;

    // set before loading, so we don't load twice while waiting for the svg to load
    $el.setAttribute(DRY_CONTENT_SVG_ATTR, content);

    let svgContent = await getSVGFromURI(svgPath);

    if (svgContent) {
        content = svgContent + content
    }

    $el.innerHTML = content;
}

/**
 * Gets the SVG file content as plain text by fetching it
 */
export async function getSVGFromURI(uri: string): Promise<string> {
    if (svgCache[uri]) {
        return svgCache[uri];
    }

    // if not cached, then go get it
    const raw = await fetch(uri);
    if (!raw.ok) {
        console.error(`Failed to load SVG at '${uri}'`);
        return '';
    }
    let svg = await raw.text();

    svgCache[uri] = svg;
    return svg;
}