import { El, IExtraElProperties, IHydrateInternals, IProps } from "./types";
import { attrsAsJson, getComponentId, waitForDocumentReady } from "./utils";
import { execute, hydrate } from "./hydrate";
import * as globals from './globals';
import { DRY_CONTENT_ATTR, EXEC_PREFIX } from "./globals";

export function Component
<Props>
(name: string, cb: (props: Readonly<Props & IProps>) => unknown):
    (props: Props & IProps) => Promise<unknown>
{
    type rawProps = { $el: string | El, id?: number, content?: string } & Record<string, any>;

    if (!name.includes('-')) {
        throw 'Component name must contain a dash';
    }
    if (customElements.get(name)) {
        throw `Component '${name}' already exists`;
    }

    const addComponentToDOM = async (props: rawProps): Promise<unknown> => {
        await waitForDocumentReady();

        if (!('$el' in props) || typeof props.$el === 'undefined') {
            props.$el = document.body.appendChild(document.createElement('div'));
        }

        if (typeof props.$el === 'string') {
            const el = document.querySelector(props.$el);
            if (!el) throw `Cannot find element to register component: '${props.$el}'`;
            props.$el = el;
        }
        if (!(props.$el instanceof Element)) {
            console.error(`Cannot add component to non-element: `, props.$el);
            return '';
        }

        for (let attr of props.$el.getAttributeNames()) {
            // convert kebab-case to camelCase
            const propName = attr.replace(/-./g, x => x[1].toUpperCase());
            if (propName.startsWith(EXEC_PREFIX)) {
                const code = props.$el.getAttribute(attr);
                if (!code) throw `Invalid value for attribute '${attr}'`;
                props[propName.substring(1)] = execute(code, props.$el);
            } else {
                props[propName] = props.$el.getAttribute(attr);
            }
        }

        const dryContent = props.$el.getAttribute(DRY_CONTENT_ATTR) ?? props.$el.innerHTML
        props.content = dryContent;
        props.id = getComponentId();

        const html = await cb(Object.freeze(props as (Props & IProps)));
        if (typeof html === 'string') {
            props.$el.innerHTML = html;
        } else if (typeof html !== 'undefined') {
            console.error(`Component '${name}' returned invalid value: `, html);
        }
        for (const child of props.$el.children) {
            hydrate(child);
        }

        if (!props.$el.hasAttribute(DRY_CONTENT_ATTR)) {
            props.$el.setAttribute(DRY_CONTENT_ATTR, dryContent);
        }
        return props.$el;
    };

    class CustomComponent extends HTMLElement implements IExtraElProperties {

        __Hydrate: IHydrateInternals;

        constructor() {
            super();

            this.__Hydrate = {
                trackedEvents: {}
            };
        }
        /** @override */
        connectedCallback() {
            this.reloadComponent();
        }
        /** @override */
        adoptedCallback () {
            this.reloadComponent();
        }
        /** @override */
        disconnectedCallback () {
            if (this.__Hydrate.mutationObserver) {
                this.__Hydrate.mutationObserver.disconnect();
            }
        }

        reloadComponent() {
            const start = performance.now();

            if (!this.isConnected) return;

            if (!this.__Hydrate) {
                this.__Hydrate = {
                    trackedEvents: {}
                };
            }

            this.classList.add('reservoir-container');
            addComponentToDOM({
                $el: this
            });

            this.__Hydrate.attributesJSON = attrsAsJson(this);

            if (!this.__Hydrate.mutationObserver) {
                const component = this;
                this.__Hydrate.mutationObserver = new MutationObserver(() => {
                    if (attrsAsJson(component) === component.__Hydrate.attributesJSON) {
                        return;
                    }
                    component.reloadComponent();
                });

                this.__Hydrate.mutationObserver.observe(this, {
                    attributes: true,
                    childList: false,
                    subtree: false
                });
            }

            const time = performance.now() - start;
            globals.perf.renders.push(`'${name}' rendered in ${time}ms`);
        }
    }

    customElements.define(name, CustomComponent);

    return addComponentToDOM;
}