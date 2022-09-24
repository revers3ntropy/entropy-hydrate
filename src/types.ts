import type { Reservoir } from "./index";

declare global {
    interface Window {
        children: HTMLCollection;
        reservoir: Reservoir;
    }
}

export type IExtraElProperties = Partial<HTMLInputElement> & {
    reloadComponent?: Function;
    __Hydrate?: {
        trackedEvents: Record<string, any>
    };
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