import * as globals from "./globals";
import { hydrate, waitForLoaded } from "./hydrate";

export function loadFromLocalStorage(shouldHydrate = true) {
    const data = getFromLS();
    for (const key in data) {
        globals.lsData[key] = data[key];
    }
    for (const key in globals.lsData) {
        globals.data[key] = globals.lsData[key];
    }

    if (shouldHydrate) {
        hydrate();
    }
    globals.isLoaded();
}


export function saveToLocalStorage() {
    waitForLoaded().then(() => {
        localStorage.setItem(globals.localStorageKey, JSON.stringify(globals.lsData));
    });
}

export function setFromObj (obj: Record<string, unknown>, persist=false) {
    // only update the DOM if there are changes to the state
    let areChanges = false;
    for (const k in obj) {
        areChanges ||= globals.data[k] !== obj[k];
        globals.data[k] = obj[k];

        if (persist) {
            globals.lsData[k] = obj[k];
        }
    }

    if (areChanges) {
        if (persist) saveToLocalStorage();
        hydrate();
    }
}

export function setDefaults (obj: Record<string, unknown>, persist=false) {
    let areChanges = false;
    for (const k in obj) {
        areChanges ||= globals.data[k] !== obj[k];
        globals.data[k] ??= obj[k];

        if (persist) {
            globals.lsData[k] = globals.data[k];
        }
    }

    if (areChanges) {
        if (persist) saveToLocalStorage();
        hydrate();
    }
}

export function update(value: string, updater: (value: unknown) => unknown, persist=false) {
    set(value, updater(get(value)), persist);
}

export function set(key: string | Record<string, unknown>, item?: unknown, persist = false) {
    if (typeof key === 'object') {
        setFromObj(key, !!item);
        return;
    }

    let areChanges = false;

    areChanges ||= globals.data[key] !== item;
    globals.data[key] = item;
    if (persist) {
        globals.lsData[key] = item;
    }

    if (areChanges) {
        if (persist) {
            saveToLocalStorage();
        }
        hydrate();
    }
}

export function get(key: string) {
    const path = key.split('.');
    let current: any = globals.data;
    for (let key of path) {
        if (!(key in current)) {
            globals.errors.push([key, new Error('Key not found in reservoir')]);
            return undefined;
        }
        current = current[key];
    }
    return current;
}

export function has(key: string) {
    return get(key) !== undefined;
}


function getFromLS (): Record<string, unknown> {
    const lsDataRaw = localStorage.getItem(globals.localStorageKey) ?? '{}';
    let lsData;

    try {
        lsData = JSON.parse(lsDataRaw);
    } catch (E) {
        console.error('Error parsing reservoir data from local storage: ', lsDataRaw, ' | threw: ', E);
        lsData = {};
    }

    if (typeof lsData !== 'object' || Array.isArray(lsData) || lsData === null) {
        console.error('Error parsing reservoir data from local storage - must be object');
        lsData = {};
    }
    return lsData;
}