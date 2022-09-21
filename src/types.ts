import type { Reservoir } from "./index";

declare global {
    interface Window {
        children: HTMLCollection;
        reservoir: Reservoir;
    }
}

export type El = (Element) & { reloadComponent?: Function, trackedEvents?: Record< string, () => any> };
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