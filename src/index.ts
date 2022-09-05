export type El = (Element) & { reloadComponent?: Function };
export type ElRaw = Element | HTMLElement | Document | Window;

const svgCache: Record<string, string> = {};
let ROOT_PATH = '';

interface IPerfData {
    renders: string[]
}

/**
 * Returns a promise which resolves after a set amount of time
 */
export async function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Returns the string in HTML escaped form to prevent XSS attacks
 * and general horribleness
 */
export function escapeHTML(unsafe: any): string {
    return (unsafe ?? '')
        .toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Caches the SVG file content
 */
export function preloadSVGs(...uris: string[]) {
    for (const uri of uris) {
        if (svgCache[uri]) {
            continue;
        }
        // don't await, because we want to load them all at the same time
        getSVGFromURI(ROOT_PATH + '/assets/img/' + uri).then();
    }
}

/**
 * Loads the SVG file content into the element
 * Adds the SVG HTML before the rest of the contents
 * of the element.
 * @param {HTMLElement} $el
 * @returns {Promise<void>}
 */
export async function loadSVG($el: El) {
    // allow modules to finish loading... not a very nice solution :P
    await sleep(0);

    const svgPath = $el.getAttribute('svg');
    if (!svgPath) {
        throw new Error('No SVG path specified');
    }

    let content = $el.getAttribute('svg-less-content') ?? $el.innerHTML;

    // set before loading, so we don't load twice while waiting for the svg to load
    $el.setAttribute('svg-less-content', content);

    const uri = ROOT_PATH + '/assets/img/' + svgPath;

    let svgContent = await getSVGFromURI(uri);

    if (svgContent) {
        content = svgContent + content
    }

    $el.innerHTML = content;
}

/**
 * Gets the SVG file content as plain text by fetching it
 */
export async function getSVGFromURI(uri: string): Promise<string> {
    if (svgCache[uri]) {
        return svgCache[uri];
    }

    // if not cached, then go get it
    const raw = await fetch(uri);
    if (!raw.ok) {
        console.error(`Failed to load SVG at '${uri}' for `, self);
        return '';
    }
    let svg = await raw.text();

    svgCache[uri] = svg;
    return svg;
}

function attrsStartWith($el: El, start: string): string[] {
    const result = [];

    for (let attr of $el.attributes) {
        if (attr.name.startsWith(start)) {
            result.push(attr.name);
        }
    }
    return result;
}

class Reservoir {
    private data: Record<string, unknown> = {};
    private lsData: Record<string, unknown> = {};
    public localStorageKey = 'reservoir';
    public static executeError = Symbol('__reservoir_ExecuteError');
    private loaded = false;
    private loadedCBs: Function[] = [];
    public errors: [string, Error][] = [];
    public perf: IPerfData = {
        renders: []
    };

    loadFromLocalStorage(hydrate = true) {
        this.lsData = this.getFromLS();
        this.data = {
            ...this.data,
            ...this.lsData
        };

        if (hydrate) {
            this.hydrate();
        }
        this.loaded = true;
        for (let cb of this.loadedCBs) {
            cb();
        }
    }

    waitForLoaded (cb: Function) {
        if (this.loaded) return void cb();
        this.loadedCBs.push(cb);
    }

    saveToLocalStorage() {
        this.waitForLoaded(() => {
            localStorage.setItem(this.localStorageKey, JSON.stringify(this.lsData));
        });
    }

    setFromObj (obj: Record<string, unknown>, persist=false) {
        // only update the DOM if there are changes to the state
        let areChanges = false;
        for (const k in obj) {
            areChanges ||= this.data[k] !== obj[k];
            this.data[k] = obj[k];

            if (persist) {
                this.lsData[k] = obj[k];
            }
        }

        if (areChanges) {
            if (persist) this.saveToLocalStorage();
            this.hydrate();
        }
    }

    setDefaults (obj: Record<string, unknown>, persist=false) {
        let areChanges = false;
        for (const k in obj) {
            areChanges ||= this.data[k] !== obj[k];
            this.data[k] ??= obj[k];

            if (persist) {
                this.lsData[k] = this.data[k];
            }
        }

        if (areChanges) {
            if (persist) this.saveToLocalStorage();
            this.hydrate();
        }
    }

    set(key: string | Record<string, unknown>, item: unknown, persist = false) {
        if (typeof key === 'object') {
            this.setFromObj(key, !!item);
            return;
        }

        let areChanges = false;

        areChanges ||= this.data[key] !== item;
        this.data[key] = item;
        if (persist) {
            this.lsData[key] = item;
        }

        if (areChanges) {
            if (persist) {
                this.saveToLocalStorage();
            }
            this.hydrate();
        }
    }

    get(key: string) {
        const path = key.split('.');
        let current: any = this.data;
        for (let key of path) {
            if (!(key in current)) {
                this.errors.push([key, new Error('Key not found in reservoir')]);
                return undefined;
            }
            current = current[key];
        }
        return current;
    }

    execute(key: string, $el: El): any {
        const initialData = JSON.stringify(this.data);

        const parameters = {
            ...this.data,
        };

        let parent: El | null = $el;
        while (parent) {
            for (let attr of attrsStartWith(parent, 'pour.')) {
                const key = attr.split('.', 2)[1];
                const attrValue = parent.getAttribute(attr);
                if (attrValue === null) continue;
                const value = this.execute(attrValue, parent);
                if (value === Reservoir.executeError) continue;
                parameters[key] = value;
            }
            parent = parent.parentElement;
        }

        parameters['$el'] = $el;

        const envVarNames = Object.keys(parameters);
        const envVarValues = Object.keys(parameters).map(k => parameters[k]);
        const thisParam = this;
        const execBody = `
            return (${key});
        `;

        let res: any;
        try {
            res = new Function(...envVarNames, execBody).call(thisParam, ...envVarValues);
        } catch (e: any) {
            if (e instanceof ReferenceError || e instanceof TypeError) {
                this.errors.push([key, e]);
            } else if (e.toString() === 'SyntaxError: Arg string terminates parameters early') {
                console.error(`Error executing '${key}': ${e}`, envVarNames, envVarValues);
            } else {
                console.error(`Error executing '${key}': ${e}`);
            }
            res = Reservoir.executeError;
        }

        if (initialData !== JSON.stringify(this.data)) {
            this.hydrate();
        }

        return res;
    }

    has(key: string) {
        return this.get(key) !== undefined;
    }

    hydrate($el: ElRaw = document) {
        const start = performance.now();

        if ($el instanceof Element) {
            if ($el.hasAttribute('hidden') || $el.hasAttribute('hidden-dry')) {
                if (!this.hydrateIf($el)) {
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
                this.bind($el);
            }

            if ($el.hasAttribute('pump')) {
                this.hydrateDry($el);
            }

            for (let attr of $el.getAttributeNames() || []) {
                if (attr.startsWith('pump.')) {
                    this.hydrateAttribute($el, attr);
                } else if (attr.startsWith('bind.')) {
                    this.bindListener($el, attr.split('.', 2)[1]);
                }
            }

            if ($el.hasAttribute('foreach')) {
                this.hydrateFor($el);
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
            this.hydrate(child);
        }

        if ($el === document) {
            this.perf.renders.push(`Hydrated document in ${performance.now() - start}ms: ${new Error().stack}`);
        }
    }

    private hydrateDry($el: El) {
        const key = $el.getAttribute('pump');
        const to = $el.getAttribute('pump-to');
        let dry = $el.getAttribute('dry') ?? $el.innerHTML;
        if (!key) return;
        let value = this.execute(key, $el);
        if (value === Reservoir.executeError) return;

        if (typeof value === 'object') {
            value = JSON.stringify(value);
        }

        if (!$el.hasAttribute('pump-dirty')) {
            value = escapeHTML(value);
        }

        let html;

        if (to === 'end') {
            html = dry + value;
        } else if (to === 'replace') {
            html = value;
        } else {
            html = value + dry;
        }

        if (!$el.hasAttribute('dry')) {
            $el.setAttribute('dry', dry);
        }

        $el.innerHTML = html;
    }

    private hydrateIf($el: El) {
        let key = $el.getAttribute('hidden-dry');

        if (!key) {
            key = $el.getAttribute('hidden');
            if (!key) return;
            $el.setAttribute('hidden-dry', '');
        }

        const value = this.execute(key, $el);
        const isShown = !value && value !== Reservoir.executeError;

        if (isShown) {
            $el.removeAttribute('aria-hidden');
            $el.removeAttribute('hidden');
        } else {
            $el.setAttribute('aria-hidden', 'true');
            $el.setAttribute('hidden', '');
        }
        return isShown;
    }

    private bind($el: El | HTMLInputElement) {
        if (!('value' in $el)) {
            throw 'Cannot bind to element without value attribute';
        }

        const key = $el.getAttribute('bind');
        const persist = $el.hasAttribute('bind-persist');

        if (key === null || !key) return;
        if (persist === undefined) return;

        const self = this;

        if (!$el.getAttribute('bound')) {

            function update() {
                if (!key) return;
                if ($el instanceof HTMLInputElement) {
                    self.set(key, $el.value, persist);
                } else throw 'Cannot bind to element without value attribute';
            }

            $el.addEventListener('change', update);
            $el.addEventListener('keyup', update);
            $el.addEventListener('keydown', update);
            $el.addEventListener('click', update);
        }

        $el.setAttribute('bound', 'true');

        if (this.has(key)) {
            $el.value = this.get(key);
        } else {
            this.set(key, $el.value);
        }
    }

    private bindListener($el: El, name: string) {
        const onEvent = $el.getAttribute(`bind.${name}`);
        if (!onEvent) return;

        const self = this;

        if ($el.hasAttribute(`bound-${name}`)) {
            return;
        }

        $el.setAttribute(`bound-${name}`, 'true');

        $el.addEventListener(name, () => {
            self.execute(onEvent, $el);
        });
    }

    private hydrateAttribute($el: El, attrName: string) {
        const key = '`' + $el.getAttribute(attrName) + '`';
        let value = this.execute(key, $el);
        if (value === Reservoir.executeError) return;

        const attr = attrName.split('.', 2)[1];
        $el.setAttribute(attr, value);

        if (attr === 'args' && 'reloadComponent' in $el) {
            if (typeof $el.reloadComponent === 'function') {
                $el.reloadComponent();
            }
        }
    }

    private hydrateFor($el: El) {
        const key = $el.getAttribute('foreach');
        if (!key) return;

        let dry = $el.getAttribute('foreach-dry') ?? $el.innerHTML;

        const [ symbol, value ] = key.split(' in ');

        let iterator = this.execute(value, $el);

        if (iterator === Reservoir.executeError) {
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
                const value = this.execute(key, itemDiv);
                if (value === Reservoir.executeError) continue;
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

    private getFromLS (): Record<string, unknown> {
        const lsDataRaw = localStorage.getItem(this.localStorageKey) || '{}';
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

    public init (rootPath: string, localStorageKey: string) {
        // main function - don't put top-level code anywhere else
        if (document.readyState !== 'complete') {
            window.addEventListener('load', () =>{
                this.init(rootPath, localStorageKey);
            });
            return;
        }

        ROOT_PATH = rootPath;
        this.localStorageKey = localStorageKey;
        this.loadFromLocalStorage(true);
    }
}

declare global {
    interface Window {
        reservoir: Reservoir;
        children: HTMLCollection;
    }
}

const reservoir = new Reservoir();
window.reservoir = reservoir;
export default reservoir;
