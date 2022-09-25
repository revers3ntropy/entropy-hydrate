import { waitForDocumentReady } from "./utils";
import { waitForLoaded, hydrate } from "./hydrate";
import { Component } from "./components";
import { preloadSVGs } from "./svgs";
import { addHook } from "./hooks";
import { components } from './components/index';
import { perf, setLocalStorageKey, errors, hooks } from "./globals";
import { loadFromLocalStorage, set, setDefaults, setFromObj, update, get, has } from "./reservoir";

export interface IInitConfig {
    localStorageKey?: string;
    svgs?: string[];
}

async function init({
    localStorageKey,
    svgs = []
}: IInitConfig = {}) {
    preloadSVGs(...svgs);
    await waitForDocumentReady();

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
    has: typeof has;
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
    has,
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
    has,
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