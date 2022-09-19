import { El, IProps } from "./types";
import { getComponentId, waitForDocumentReady } from "./utils";
import { execute, hydrate } from "./hydrate";
import * as globals from './globals';

export function Component
<Props extends IProps>
(name: string, cb: (props: Readonly<Props>) => unknown):
    (props: Props) => Promise<unknown>
{
    type rawProps = { $el: string | El, id?: number, [k: string]: any };

    const addComponentToDOM = async (props: rawProps): Promise<unknown> => {
        await waitForDocumentReady();

        if (typeof props.$el === 'string') {
            const el = document.querySelector(props.$el);
            if (!el) throw `Cannot find element to register component: '${props.$el}'`;
            props.$el = el;
        }
        if (!(props.$el instanceof Element)) {
            console.error(`Cannot add component to non-element: `, props.$el);
            return '';
        }

        props.id = getComponentId();

        const html = await cb(Object.freeze(props as Props));
        if (typeof html === 'string') {
            props.$el.innerHTML = html;
        } else if (typeof html !== 'undefined') {
            console.error(`Component '${name}' returned invalid value: `, html);
        }
        hydrate(props.$el);
        return html;
    };

    class Component extends HTMLElement {
        constructor() {
            super();
        }

        connectedCallback() {
            this.reloadComponent();
        }

        reloadComponent() {
            const start = performance.now();

            const props: rawProps = {
                $el: this
            } as any;

            for (let attr of this.getAttributeNames()) {
                // convert kebab-case to camelCase
                const propName = attr.replace(/-./g, x => x[1].toUpperCase());
                props[propName] = execute(this.getAttribute(attr) || 'undefined', this);
            }

            this.classList.add('reservoir-container');
            addComponentToDOM(props);

            globals.perf.renders.push(`'${name}' rendered in ${performance.now() - start}ms`);
        }
    }

    // abide by naming requirements for custom elements
    let componentName = name
        .replace(/([a-z0–9])([A-Z])/g, '$1-$2')
        .toLowerCase();
    if (!componentName.includes('-')) {
        componentName += '-';
    }

    customElements.define(componentName, Component);

    return addComponentToDOM;
}