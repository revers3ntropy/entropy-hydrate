import { waitForDocumentReady } from "./utils";
import * as globals from './globals';
import { get, loadFromLocalStorage, set, setDefaults } from "./hydrate";
import { Component } from "./components";
import { setLocalStorageKey } from "./globals";

export interface IInitConfig {
    rootPath?: string;
    localStorageKey?: string;
}

async function init({
             rootPath = '.',
             localStorageKey
}: IInitConfig ={}) {
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
    setDefaults,
    set,
    get,
};

export {
    Component,
    init,
    setDefaults,
    set,
    get,
    reservoir
};

window.reservoir = reservoir;
export default reservoir;