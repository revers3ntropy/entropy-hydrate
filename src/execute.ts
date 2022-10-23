import { El } from "./types";
import * as globals from "./globals";
import { hydrate, Hydrate } from "./index";
import { attrsStartWith } from "./utils";
import { POUR_PREFIX, POUR_PREFIX_DELIMITER } from "./globals";

export interface IExecuteOptions {
    silent?: boolean;
}

export function execute(key: string, $el: El | null, parameters: Record<string, any> = {}, options: IExecuteOptions = {}): any {
    const initialData = JSON.stringify(globals.data);

    parameters = {
        ...Object.getOwnPropertyNames(hydrate)
            .reduce<Record<string, any>>((acc, key) => {
                acc[key] = (hydrate as Hydrate)[key];
                return acc;
            }, {}),
        ...globals.data,
        ...parameters
    };

    let parents = [];
    let parent: El | null = $el;
    while (parent) {
        parents.push(parent);
        parent = parent.parentElement;
    }

    for (const parent of parents) {
        parameters = {
            ...parameters,
            ...parent.__Hydrate?.puddle,
        };
        for (let attr of attrsStartWith(parent, POUR_PREFIX)) {
            const key = attr.split(POUR_PREFIX_DELIMITER, 2)[1];
            const attrValue = parent.getAttribute(attr);
            if (attrValue === null) continue;
            const value = execute(attrValue, parent.parentElement, parameters, { silent: true });
            if (value === globals.executeError) continue;
            parameters[key] = value;
        }
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

    const start = performance.now();
    let res: any;
    try {
        res = new Function(...envVarNames, execBody).call(window.hydrate, ...envVarValues);
    } catch (e: any) {
        if (e instanceof ReferenceError || e instanceof TypeError) {
            globals.errors.push([key, e]);
        } else if (e.toString() === 'SyntaxError: Arg string terminates parameters early') {
            if (!options.silent) {
                console.error(`Error executing '${key}': ${e}`, envVarNames, envVarValues);
            }
        } else {
            if (!options.silent) {
                console.error(`Error executing '${key}': ${e}`);
            }
        }
        res = globals.executeError;
    }
    const end = performance.now();
    globals.perf.execs.push(end - start);

    if (initialData !== JSON.stringify(globals.data)) {
        hydrate();
    }

    return res;
}
