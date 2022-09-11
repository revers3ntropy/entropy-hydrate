import { waitForDocumentReady } from "./utils";
import * as globals from './globals';
import { get, loadFromLocalStorage, set, setDefaults } from "./hydrate";
import { Component } from "./components";
import { setLocalStorageKey } from "./globals";

async function init (rootPath: string = '.', localStorageKey?: string) {
    await waitForDocumentReady();

    globals.setRootPath(rootPath);
    if (localStorageKey) {
        setLocalStorageKey(localStorageKey);
    }
    loadFromLocalStorage(true);
}

window.reservoir = {
    Component,
    init,
    setDefaults,
    set,
    get,
};