import type { Reservoir } from "./index";

declare global {
    interface Window {
        children: HTMLCollection;
        reservoir: Reservoir;
    }
}

export type El = (Element) & { reloadComponent?: Function };
export type ElRaw = Element | HTMLElement | Document | Window;

export interface IPerfData {
    renders: string[]
}

export interface IProps {
    id: number;
    $el: El;
    content: string;
    [key: string]: any;
}