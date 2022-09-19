import { waitForDocumentReady } from "./utils";
import * as globals from './globals';
import { get, loadFromLocalStorage, set, setDefaults, waitForLoaded, setFromObj, hydrate, update } from "./hydrate";
import { Component } from "./components";
import { preloadSVGs } from "./svgs";
import { addHook } from "./hooks";

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

export interface Reservoir {
    Component: typeof Component;
    init: typeof init;
    setFromObj: typeof setFromObj;
    setDefaults: typeof setDefaults;
    set: typeof set;
    get: typeof get;
    update: typeof update,
    loadFromLocalStorage: typeof loadFromLocalStorage;
    waitForLoaded: typeof waitForLoaded;
    setLocalStorageKey: typeof globals.setLocalStorageKey;
    errors: typeof globals.errors;
    performance: typeof globals.perf;
    reload: typeof hydrate;
    hydrate: typeof hydrate;
    hooks: typeof globals.hooks;
    hook: typeof addHook;
}

export {
    Component,
    init,
    setFromObj,
    setDefaults,
    set,
    get,
    loadFromLocalStorage,
    waitForLoaded,
    hydrate,
    update
};
export const setLocalStorageKey = globals.setLocalStorageKey;
export const errors = globals.errors;
export const performance = globals.perf;
export const reload = hydrate;
export const hooks = globals.hooks;
export const hook = addHook;


const reservoir: Reservoir = {
    Component,
    init,
    setFromObj,
    setDefaults,
    set,
    get,
    loadFromLocalStorage,
    waitForLoaded,
    setLocalStorageKey: globals.setLocalStorageKey,
    errors: globals.errors,
    performance: globals.perf,
    reload: hydrate,
    hydrate,
    hooks: globals.hooks,
    hook: addHook,
    update
};

window.reservoir = reservoir;
export default reservoir;