import type { Reservoir } from "./index";

declare global {
    interface Window {
        children: HTMLCollection;
        reservoir: Reservoir;
    }
}

export interface IHydrateInternals {
    trackedEvents: Record<string, any>;
    mutationObserver?: MutationObserver;
    attributesJSON?: string;
}

export type IExtraElProperties = Partial<HTMLInputElement> & {
    reloadComponent?: Function;
    __Hydrate?: IHydrateInternals
};

export type El = Element & IExtraElProperties ;
export type ElRaw = El | HTMLElement | Document | Window;

export interface IPerfData {
    renders: string[]
}

export interface IProps {
    id: number;
    $el: El;
    content: string;
    [key: string]: any;
}