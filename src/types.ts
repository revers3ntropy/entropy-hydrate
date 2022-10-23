import type { Hydrate } from "./index";

declare global {
    interface Window {
        children: HTMLCollection;
        hydrate: Hydrate;
    }
}

export interface IHydrateInternals {
    trackedEvents: Record<string, any>;
    mutationObserver?: MutationObserver;
    attributesJSON?: string;
    puddle: Record<string, any>;
}

export type IExtraElProperties = Partial<HTMLInputElement> & {
    reloadComponent?: () => void;
    __Hydrate?: IHydrateInternals
};

export type El = Element & IExtraElProperties;
export type ElRaw = El | HTMLElement | Document | Window;

export interface IPerfData {
    renders: string[];
    execs: number[];
}

export interface IProps {
    id: number;
    $el: El;
    content: string;
    [key: string]: any;
}