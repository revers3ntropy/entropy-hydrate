declare global {
    interface Window {
        reservoir: Reservoir;
        children: HTMLCollection;
    }

    interface Reservoir {
        [key: string]: any;
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
    [key: string]: any;
}