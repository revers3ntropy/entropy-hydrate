import { El } from "./types";
import { sleep } from "./utils";
import { ROOT_PATH } from "./globals";

const svgCache: Record<string, string> = {};

/**
 * Caches the SVG file content
 */
function preloadSVGs(...uris: string[]) {
    for (const uri of uris) {
        if (svgCache[uri]) {
            continue;
        }
        // don't await, because we want to load them all at the same time
        getSVGFromURI(ROOT_PATH + '/assets/img/' + uri).then();
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
    const svgPath = $el.getAttribute('svg');
    if (!svgPath) {
        throw new Error('No SVG path specified');
    }

    let content = $el.getAttribute('svg-less-content') ?? $el.innerHTML;

    // set before loading, so we don't load twice while waiting for the svg to load
    $el.setAttribute('svg-less-content', content);

    const uri = ROOT_PATH + '/assets/img/' + svgPath;

    let svgContent = await getSVGFromURI(uri);

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
        console.error(`Failed to load SVG at '${uri}' for `, self);
        return '';
    }
    let svg = await raw.text();

    svgCache[uri] = svg;
    return svg;
}