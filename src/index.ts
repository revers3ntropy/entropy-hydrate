import { waitForDocumentReady } from "./utils";
import * as globals from './globals';
import { get, loadFromLocalStorage, set, setDefaults, waitForLoaded, setFromObj } from "./hydrate";
import { Component } from "./components";
import { setLocalStorageKey } from "./globals";
import { preloadSVGs } from "./svgs";

export interface IInitConfig {
    rootPath?: string;
    localStorageKey?: string;
    svgs?: string[];
}

async function init({
    rootPath = '.',
    localStorageKey,
    svgs = [],
}: IInitConfig ={}) {
    preloadSVGs(...svgs);
    await waitForDocumentReady();

    globals.setRootPath(rootPath);
    if (localStorageKey) {
        setLocalStorageKey(localStorageKey);
    }
    loadFromLocalStorage(true);
}

const reservoir = {
    Component,
    init,
    setFromObj,
    setDefaults,
    set,
    get,
    loadFromLocalStorage,
    waitForLoaded,
    setLocalStorageKey
};

export {
    Component,
    init,
    setFromObj,
    setDefaults,
    set,
    get,
    reservoir,
    loadFromLocalStorage,
    waitForLoaded,
    setLocalStorageKey
};

window.reservoir = reservoir;
export default reservoir;