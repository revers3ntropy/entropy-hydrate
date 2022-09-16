import * as globals from "./globals";
import { El, ElRaw } from "./types";
import { attrsStartWith, escapeHTML } from "./utils";
import { loadSVG } from "./svgs";

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

export async function waitForLoaded () {
    return await new Promise<void>(resolve => {
        if (globals.loaded) return resolve();
        globals.loadedCBs.push(resolve);
    });
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

export function execute(key: string, $el: El): any {
    const initialData = JSON.stringify(globals.data);

    const parameters = {
        ...globals.data,
    };

    let parent: El | null = $el;
    while (parent) {
        for (let attr of attrsStartWith(parent, 'pour.')) {
            const key = attr.split('.', 2)[1];
            const attrValue = parent.getAttribute(attr);
            if (attrValue === null) continue;
            const value = execute(attrValue, parent);
            if (value === globals.executeError) continue;
            parameters[key] = value;
        }
        parent = parent.parentElement;
    }

    parameters['$el'] = $el;

    const envVarNames = Object.keys(parameters);
    const envVarValues = Object.keys(parameters).map(k => parameters[k]);
    const execBody = `
        return (${key});
    `;

    let res: any;
    try {
        res = new Function(...envVarNames, execBody).call(window.reservoir, ...envVarValues);
    } catch (e: any) {
        if (e instanceof ReferenceError || e instanceof TypeError) {
            globals.errors.push([key, e]);
        } else if (e.toString() === 'SyntaxError: Arg string terminates parameters early') {
            console.error(`Error executing '${key}': ${e}`, envVarNames, envVarValues);
        } else {
            console.error(`Error executing '${key}': ${e}`);
        }
        res = globals.executeError;
    }

    if (initialData !== JSON.stringify(globals.data)) {
        hydrate();
    }

    return res;
}

export function has(key: string) {
    return get(key) !== undefined;
}

export function hydrate($el: ElRaw = document) {
    const start = performance.now();

    if ($el instanceof Element) {
        if ($el.hasAttribute('hidden') || $el.hasAttribute('hidden-dry')) {
            if (!hydrateIf($el)) {
                return;
            }
        }

        if ($el.getAttribute('aria-hidden') === 'true') {
            return;
        }

        if ($el.hasAttribute('waterproof')) {
            return;
        }

        if ($el.hasAttribute('bind')) {
            bind($el);
        }

        if ($el.hasAttribute('pump')) {
            hydrateDry($el);
        }

        for (let attr of $el.getAttributeNames() || []) {
            if (attr.startsWith('pump.')) {
                hydrateAttribute($el, attr);
            } else if (attr.startsWith('bind.')) {
                bindListener($el, attr.split('.', 2)[1]);
            }
        }

        if ($el.hasAttribute('foreach')) {
            hydrateFor($el);
        }

        if ($el?.hasAttribute?.('args') && 'reloadComponent' in $el) {
            ($el as any).reloadComponent();
        }

        if ($el.hasAttribute('svg')) {
            loadSVG($el).then();
        }
    }

    for (const child of $el.children) {
        // don't await, because we don't want to block the page load
        hydrate(child);
    }

    if ($el === document) {
        globals.perf.renders.push(`Hydrated document in ${performance.now() - start}ms: ${new Error().stack}`);
    }
}

function hydrateDry($el: El) {
    const key = $el.getAttribute('pump');
    let dry = $el.getAttribute('dry') ?? $el.innerHTML;
    if (!key) return;
    let value = execute(key, $el);
    if (value === globals.executeError) return;

    if (typeof value === 'object') {
        value = JSON.stringify(value);
    }

    if (!$el.hasAttribute('pump-dirty')) {
        value = escapeHTML(value);
    }

    let html;

    if ($el.hasAttribute('pump-end')) {
        html = dry + value;
    } else if ($el.hasAttribute('pump-replace')) {
        html = value;
    } else {
        html = value + dry;
    }

    if (!$el.hasAttribute('dry')) {
        $el.setAttribute('dry', dry);
    }

    $el.innerHTML = html;
}

function hydrateIf($el: El) {
    let key = $el.getAttribute('hidden-dry');

    if (!key) {
        key = $el.getAttribute('hidden');
        if (!key) return;
        $el.setAttribute('hidden-dry', '');
    }

    const value = execute(key, $el);
    const isShown = !value && value !== globals.executeError;

    if (isShown) {
        $el.removeAttribute('aria-hidden');
        $el.removeAttribute('hidden');
    } else {
        $el.setAttribute('aria-hidden', 'true');
        $el.setAttribute('hidden', '');
    }
    return isShown;
}

function bind($el: El | HTMLInputElement) {
    if (!('value' in $el)) {
        throw 'Cannot bind to element without value attribute';
    }

    const key = $el.getAttribute('bind');
    const persist = $el.hasAttribute('bind-persist');

    if (key === null || !key) return;
    if (persist === undefined) return;

    if (!$el.getAttribute('bound')) {

        function update() {
            if (!key) return;
            if ($el instanceof HTMLInputElement) {
                set(key, $el.value, persist);
            } else throw 'Cannot bind to element without value attribute';
        }

        $el.addEventListener('change', update);
        $el.addEventListener('keyup', update);
        $el.addEventListener('keydown', update);
        $el.addEventListener('click', update);
    }

    $el.setAttribute('bound', 'true');

    if (has(key)) {
        $el.value = get(key);
    } else {
        set(key, $el.value);
    }
}

function bindListener($el: El, name: string) {
    const onEvent = $el.getAttribute(`bind.${name}`);
    if (!onEvent) return;

    if ($el.hasAttribute(`bound-${name}`)) {
        return;
    }

    $el.setAttribute(`bound-${name}`, 'true');

    $el.addEventListener(name, () => {
        execute(onEvent, $el);
    });
}

function hydrateAttribute($el: El, attrName: string) {
    const key = '`' + $el.getAttribute(attrName) + '`';
    let value = execute(key, $el);
    if (value === globals.executeError) return;

    const attr = attrName.split('.', 2)[1];
    $el.setAttribute(attr, value);

    if (attr === 'args' && 'reloadComponent' in $el) {
        if (typeof $el.reloadComponent === 'function') {
            $el.reloadComponent();
        }
    }
}

function hydrateFor($el: El) {
    const key = $el.getAttribute('foreach');
    if (!key) return;

    let dry = $el.getAttribute('foreach-dry') ?? $el.innerHTML;

    const [ symbol, value ] = key.split(' in ');

    let iterator = execute(value, $el);

    if (iterator === globals.executeError) {
        $el.innerHTML = '';
        if (!$el.hasAttribute('foreach-dry')) {
            $el.setAttribute('foreach-dry', dry);
        }
        return;
    }

    if (!Array.isArray(iterator)) {
        console.error(`foreach '${key}' value is not an array: `, iterator);
        return;
    }

    const eachAttrs = [];

    for (let attr of $el?.getAttributeNames?.() || []) {
        if (attr.startsWith('each.')) {
            eachAttrs.push(attr);
        }
    }

    $el.innerHTML = '';

    for (let item of iterator) {
        const itemDiv = document.createElement('div');
        itemDiv.innerHTML = dry;
        itemDiv.setAttribute(`pour.${symbol}`, JSON.stringify(item));

        for (let attr of eachAttrs) {
            const key = '`' + $el.getAttribute(attr) + '`';
            const value = execute(key, itemDiv);
            if (value === globals.executeError) continue;
            itemDiv.setAttribute(attr.split('.', 2)[1], value);
        }

        $el.classList.add('reservoir-container');
        $el.appendChild(itemDiv);
    }

    // do at end so that the element stays hidden until it has been
    // fully initialised.
    if (!$el.hasAttribute('foreach-dry')) {
        $el.setAttribute('foreach-dry', dry);
    }
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