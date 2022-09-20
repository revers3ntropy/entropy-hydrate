import { waitForDocumentReady } from "./utils";
import { get, loadFromLocalStorage, set, setDefaults, waitForLoaded, setFromObj, hydrate, update } from "./hydrate";
import { Component } from "./components";
import { preloadSVGs } from "./svgs";
import { addHook } from "./hooks";
import { components } from './components/index';
import { perf, setRootPath, setLocalStorageKey, errors, hooks } from "./globals";

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

    setRootPath(rootPath);
    if (localStorageKey) {
        setLocalStorageKey(localStorageKey);
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
    setLocalStorageKey: typeof setLocalStorageKey;
    errors: typeof errors;
    performance: typeof perf;
    reload: typeof hydrate;
    hydrate: typeof hydrate;
    hooks: typeof hooks;
    hook: typeof addHook;
    components: typeof components;
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
    update,
    components,
    setLocalStorageKey,
    errors,
    hooks
};
export const reload = hydrate;
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
    setLocalStorageKey,
    errors,
    performance: perf,
    reload: hydrate,
    hydrate,
    hooks,
    hook: addHook,
    update,
    components
};

window.reservoir = reservoir;
export default reservoir;