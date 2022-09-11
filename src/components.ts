import { El, IProps } from "./types";
import { getComponentId, waitForDocumentReady } from "./utils";
import { hydrate } from "./hydrate";

export function Component
<Props extends IProps>
(name: string, cb: (props: Readonly<Props>) => string):
    (props: Props) => Promise<string>
{
    type rawProps = { $el: string | El, id?: number, [k: string]: any };

    const addComponentToDOM = async (props: rawProps): Promise<string> => {
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

        const html = cb(Object.freeze(props as Props));
        props.$el.innerHTML = html;
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

        async reloadComponent() {
            const props: rawProps = {
                $el: this
            } as any;

            for (let attr of this.getAttributeNames()) {
                // convert kebab-case to camelCase
                const propName = attr.replace(/-./g, x => x[1].toUpperCase());
                props[propName] = this.getAttribute(attr);
            }

            await addComponentToDOM(props);
            this.classList.add('reservoir-container');
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