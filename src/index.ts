import { waitForDocumentReady } from "./utils";
import * as globals from './globals';
import { get, loadFromLocalStorage, set, setDefaults, waitForLoaded, setFromObj, hydrate } from "./hydrate";
import { Component } from "./components";
import { preloadSVGs } from "./svgs";

export interface IInitConfig {
    rootPath?: string;
    localStorageKey?: string;
    svgs?: string[];
}

async function init({
    rootPath = '.',
    localStorageKey,
    svgs = []
}: IInitConfig = {}) {
    preloadSVGs(...svgs);
    await waitForDocumentReady();

    globals.setRootPath(rootPath);
    if (localStorageKey) {
        globals.setLocalStorageKey(localStorageKey);
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
    setLocalStorageKey: globals.setLocalStorageKey,
    reservoir: {},
    errors: globals.errors,
    performance: globals.perf,
    reload: hydrate
};

reservoir.reservoir = reservoir;

export {
    Component,
    init,
    setFromObj,
    setDefaults,
    set,
    get,
    reservoir,
    loadFromLocalStorage,
    waitForLoaded
};
export const setLocalStorageKey = globals.setLocalStorageKey;
export const errors = globals.errors;
export const performance = globals.perf;
export const reload = hydrate;

window.reservoir = reservoir;
export default reservoir;