import * as globals from "./globals";
import { El, ElRaw } from "./types";
import { attrsStartWith, escapeHTML } from "./utils";
import { loadSVG } from "./svgs";
import reservoir from "./index";
import { get, has, set } from "./reservoir";
import {
    BIND_PERSIST_ATTR,
    BIND_PREFIX,
    BIND_UPDATE_EVENTS,
    DRY_CONTENT_ATTR,
    DRY_CONTENT_FOR_ATTR,
    DRY_CONTENT_HIDDEN_ATTR, EACH_DELIMITER,
    EXEC_PREFIX,
    FOR_ATTR,
    FOR_EACH_PREFIX,
    FOR_IN_DELIMITER,
    HIDDEN_ATTR,
    NO_RECURSE_ATTR,
    POUR_PREFIX, POUR_PREFIX_DELIMITER,
    PUMP_END_ATTR,
    PUMP_RAW_ATTR,
    PUMP_START_ATTR,
    SVG_ATTR
} from "./globals";

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
        for (let attr of attrsStartWith(parent, POUR_PREFIX)) {
            const key = attr.split(POUR_PREFIX_DELIMITER, 2)[1];
            const attrValue = parent.getAttribute(attr);
            if (attrValue === null) continue;
            const value = execute(attrValue, parent.parentElement, parameters);
            if (value === globals.executeError) continue;
            parameters[key] = value;
        }
        parent = parent.parentElement;
    }

    parameters.$el = $el;

    for (let param of Object.keys(parameters)) {
        if (!param.match(/^[a-zA-z_]+[a-zA-z0-9_]*$/)) {
            delete parameters[param];
        }
    }

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

    for (let hook of globals.hooks.preHydrate) {
        hook($el);
    }

    if ($el instanceof Element) {
        if ($el.hasAttribute(HIDDEN_ATTR) || $el.hasAttribute(DRY_CONTENT_HIDDEN_ATTR)) {
            if (!hydrateIf($el)) {
                return;
            }
        }

        if ($el.hasAttribute(EXEC_PREFIX)) {
            hydrateDry($el);
        }

        if ($el.hasAttribute(BIND_PREFIX)) {
            bind($el);
        }

        for (let attr of $el.getAttributeNames() || []) {
            if (attr.startsWith(EXEC_PREFIX)) {
                hydrateAttribute($el, attr);
            } else if (attr.startsWith(BIND_PREFIX)) {
                bindListener($el, attr);
            }
        }

        if ($el.hasAttribute(FOR_ATTR)) {
            hydrateFor($el);
        }

        if ($el.hasAttribute(SVG_ATTR)) {
            loadSVG($el).then();
        }
    }

    if (!($el instanceof Element) || !$el.hasAttribute(NO_RECURSE_ATTR)) {
        for (const child of $el.children) {
            hydrate(child);
        }
    }

    if ($el === document) {
        globals.perf.renders.push(`Hydrated document in ${performance.now() - start}ms: ${new Error().stack}`);
    }

    for (let hook of globals.hooks.postHydrate) {
        hook($el);
    }
}

function hydrateDry($el: El) {
    const key = $el.getAttribute(EXEC_PREFIX);
    let dry = $el.getAttribute(DRY_CONTENT_ATTR) ?? $el.innerHTML;
    if (!key) return;

    let value = execute(key, $el);
    if (value === globals.executeError) return;

    if (typeof value === 'object') {
        value = JSON.stringify(value);
    }

    if (!$el.hasAttribute(PUMP_RAW_ATTR)) {
        value = escapeHTML(value);
    }

    let html;

    if ($el.hasAttribute(PUMP_END_ATTR)) {
        html = dry + value;
    } else if ($el.hasAttribute(PUMP_START_ATTR)) {
        html = value + dry;
    } else {
        html = value;
    }

    if (!$el.hasAttribute(DRY_CONTENT_ATTR)) {
        $el.setAttribute(DRY_CONTENT_ATTR, dry);
    }

    $el.innerHTML = html;
}

function hydrateIf($el: El) {
    let key = $el.getAttribute(DRY_CONTENT_HIDDEN_ATTR);

    if (!key) {
        key = $el.getAttribute(HIDDEN_ATTR);
        if (!key) return;
        $el.setAttribute(DRY_CONTENT_HIDDEN_ATTR, '');
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

    const key = $el.getAttribute(BIND_PREFIX);
    const persist = $el.hasAttribute(BIND_PERSIST_ATTR);

    if (key === null || !key) return;

    function update() {
        if (!key) return;
        if (!('value' in $el)) {
            throw 'Cannot bind to element without value attribute';
        }
        set(key, $el.value, persist);
    }

    for (let event of BIND_UPDATE_EVENTS) {
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
    if (attr === BIND_PREFIX) {
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
    if (attr.startsWith(BIND_PREFIX)) {
        name = attr.substring(1);
    } else {
        throw `Invalid listener attribute '${attr}'`;
    }

    $el.addEventListener(name, handler);

    // can be any truthy value
    $el.__Hydrate.trackedEvents[attr] = handler;
}

function hydrateAttribute($el: El, attrName: string) {
    if (attrName === EXEC_PREFIX) return;
    const key = $el.getAttribute(attrName);
    if (!key) throw `Cannot find key for ${attrName}`;
    let value = execute(key, $el);
    if (value === globals.executeError) return;
    $el.setAttribute(attrName.substring(1), value);
}

function hydrateFor($el: El) {
    const key = $el.getAttribute(FOR_ATTR);
    if (!key) return;

    let dry = $el.getAttribute(DRY_CONTENT_FOR_ATTR) ?? $el.innerHTML;

    if (key.split(FOR_IN_DELIMITER).length !== 2) {
        throw new SyntaxError('Invalid foreach syntax: must be `<identifier> in <expression>`');
    }
    const [ symbol, value ] = key.split(FOR_IN_DELIMITER);

    let iterator = execute(value, $el);

    if (iterator === globals.executeError) {
        $el.innerHTML = '';
        if (!$el.hasAttribute(DRY_CONTENT_FOR_ATTR)) {
            $el.setAttribute(DRY_CONTENT_FOR_ATTR, dry);
        }
        return;
    }

    if (!Array.isArray(iterator)) {
        console.error(`foreach '${key}' value is not an array: `, iterator);
        return;
    }

    const eachAttrs = [];

    for (let attr of $el?.getAttributeNames?.() || []) {
        if (attr.startsWith(FOR_EACH_PREFIX)) {
            eachAttrs.push(attr);
        }
    }

    $el.innerHTML = '';

    for (let item of iterator) {
        const itemDiv = document.createElement('div');
        itemDiv.innerHTML = dry;
        itemDiv.setAttribute(`${POUR_PREFIX}${symbol}`, JSON.stringify(item));

        for (let attr of eachAttrs) {
            const key = $el.getAttribute(attr);
            if (!key) throw `Cannot find key for ${attr}`;
            const value = execute(key, itemDiv);
            if (value === globals.executeError) continue;
            itemDiv.setAttribute(attr.split(EACH_DELIMITER, 2)[1], value);
        }

        $el.classList.add('reservoir-container');
        $el.appendChild(itemDiv);
    }

    // do at end so that the element stays hidden until it has been
    // fully initialised.
    if (!$el.hasAttribute(DRY_CONTENT_FOR_ATTR)) {
        $el.setAttribute(DRY_CONTENT_FOR_ATTR, dry);
    }
}
