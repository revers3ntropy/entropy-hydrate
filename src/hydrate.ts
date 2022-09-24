import * as globals from "./globals";
import { El, ElRaw } from "./types";
import { attrsStartWith, escapeHTML } from "./utils";
import { loadSVG } from "./svgs";
import reservoir from "./index";
import { get, has, set } from "./reservoir";

export async function waitForLoaded () {
    return await new Promise<void>(resolve => {
        if (globals.loaded) return resolve();
        globals.loadedCBs.push(resolve);
    });
}

export function execute(key: string, $el: El | null, parameters: Record<string, any> = {}): any {
    const initialData = JSON.stringify(globals.data);

    parameters = {
        ...reservoir,
        ...globals.data,
        ...parameters
    };

    let parent: El | null = $el;
    while (parent) {
        for (let attr of attrsStartWith(parent, 'pour.')) {
            const key = attr.split('.', 2)[1];
            const attrValue = parent.getAttribute(attr);
            if (attrValue === null) continue;
            const value = execute(attrValue, parent.parentElement, parameters);
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

export function hydrate($el: ElRaw = document) {
    const start = performance.now();

    for (let hook of globals.hooks['preHydrate']) {
        hook($el);
    }

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

        if ($el.hasAttribute('pump') || $el.hasAttribute('$')) {
            hydrateDry($el);
        }

        for (let attr of $el.getAttributeNames() || []) {
            if (attr.startsWith('pump.')) {
                hydrateAttribute($el, attr);
            } else if (attr.startsWith('bind.')) {
                bindListener($el, attr);
            } else if (attr.startsWith('$')) {
                hydrateAttribute($el, attr.split('$', 2)[1]);
            } else if (attr.startsWith('@')) {
                bindListener($el, attr);
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

    for (let hook of globals.hooks['postHydrate']) {
        hook($el);
    }
}

function hydrateDry($el: El) {
    const key = $el.getAttribute('pump') || $el.getAttribute('$');
    let dry = $el.getAttribute('__dry') ?? $el.innerHTML;
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

    if ($el.hasAttribute('pump-end') || $el.hasAttribute('$end')) {
        html = dry + value;
    } else if ($el.hasAttribute('pump-replace') || $el.hasAttribute('$replace')) {
        html = value;
    } else {
        html = value + dry;
    }

    if (!$el.hasAttribute('__dry')) {
        $el.setAttribute('__dry', dry);
    }

    $el.innerHTML = html;
}

function hydrateIf($el: El) {
    let key = $el.getAttribute('__hidden-dry');

    if (!key) {
        key = $el.getAttribute('hidden');
        if (!key) return;
        $el.setAttribute('__hidden-dry', '');
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

function bind($el: El) {

    if (!$el.__Hydrate) {
        $el.__Hydrate = { trackedEvents: {} };
    }

    if ($el.value === undefined) {
        throw 'Cannot bind to element without value attribute';
    }

    const key = $el.getAttribute('bind');
    const persist = $el.hasAttribute('bind-persist') || $el.hasAttribute('persist');

    if (key === null || !key) return;
    if (persist === undefined) return;


    function update() {
        if (!key) return;
        if (!('value' in $el)) {
            throw 'Cannot bind to element without value attribute';
        }
        set(key, $el.value, persist);
    }

    const bindUpdateEvents = ['input', 'change', 'blur', 'keyup', 'keydown', 'keypress',
        'click', 'touchstart', 'touchend', 'touchmove', 'touchcancel'];

    for (let event of bindUpdateEvents) {
        if ($el.__Hydrate.trackedEvents[event]) continue;

        $el.__Hydrate.trackedEvents[event] = update;
        $el.addEventListener(event, update, {
            passive: true,
            capture: false
        });
    }

    if (has(key)) {
        $el.value = get(key);
    } else {
        set(key, $el.value);
    }
}

function bindListener($el: El, attr: string) {
    if (attr === '@') {
        return;
    }

    if (!$el.hasAttribute(attr)) {
        console.error(`Cannot find executor for ${attr}`);
        return;
    }

    const onEvent = $el.getAttribute(attr);
    if (onEvent === '') return;
    if (onEvent === null) {
        throw `Cannot find executor for ${attr}`;
    }

    if (!$el.__Hydrate) {
        $el.__Hydrate = { trackedEvents: {} };
    }

    // if we've already bound this event, don't bind it again
    if ($el.__Hydrate.trackedEvents[attr]) {
        return;
    }

    function handler () {
        if (!onEvent) return;
        execute(onEvent, $el);
    }

    let name;
    if (attr.startsWith('bind.')) {
        name = attr.substring(5);
    } else if (attr.startsWith('@')) {
        name = attr.substring(1);
    } else {
        throw `Invalid listener attribute '${attr}'`;
    }

    $el.addEventListener(name, handler);

    // can be any truthy value
    $el.__Hydrate.trackedEvents[attr] = handler;
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
