import { waitForDocumentReady } from "./utils";
import { waitForLoaded, hydrate } from "./hydrate";
import { Component } from "./components";
import { addHook } from "./hooks";
import { components } from './components/index';
import { perf, setLocalStorageKey, errors, hooks } from "./globals";
import { loadFromLocalStorage, set, setDefaults, setFromObj, update, get, has } from "./reservoir";
import { ElRaw } from "./types";

export interface IInitConfig {
    localStorageKey?: string;
}

async function init({
    localStorageKey
}: IInitConfig = {}) {
    await waitForDocumentReady();

    if (localStorageKey) {
        setLocalStorageKey(localStorageKey);
    }
    loadFromLocalStorage(true);
}

export interface Hydrate {
    ($el?: ElRaw): void;
    [key: string]: any;
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
    hooks,
    perf as performance,
    hydrate as reload,
    addHook as hook
};

Object.defineProperties(hydrate, {
    Component: { value: Component },
    init: { value: init },
    setFromObj: { value: setFromObj },
    setDefaults: { value: setDefaults },
    set: { value: set },
    get: { value: get },
    has: { value: has },
    loadFromLocalStorage: { value: loadFromLocalStorage },
    waitForLoaded: { value: waitForLoaded },
    setLocalStorageKey: { value: setLocalStorageKey },
    errors: { value: errors },
    performance: { value:  perf },
    hooks: { value: hooks },
    addHook: { value: addHook },
    update: { value: update },
    components: { value: components },
});

window.hydrate = hydrate as Hydrate;
export default hydrate;