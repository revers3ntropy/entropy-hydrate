import type { Reservoir } from "./index";

declare global {
    interface Window {
        children: HTMLCollection;
        reservoir: Reservoir;
    }
}

export interface IExtraElProperties {
    reloadComponent?: Function;
    __Hydrate_trackedEvents?: Record< string, () => any>;
}

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