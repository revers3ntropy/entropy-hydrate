// Generated by dts-bundle-generator v6.13.0

export declare type IExtraElProperties = Partial<HTMLInputElement> & {
	reloadComponent?: Function;
	__Hydrate?: {
		trackedEvents: Record<string, any>;
	};
};
export declare type El = Element & IExtraElProperties;
export declare type ElRaw = El | HTMLElement | Document | Window;
export interface IPerfData {
	renders: string[];
}
export interface IProps {
	id: number;
	$el: El;
	content: string;
	[key: string]: any;
}
export declare function waitForLoaded(): Promise<void>;
export declare function hydrate($el?: ElRaw): void;
export declare function Component<Props>(name: string, cb: (props: Readonly<Props & IProps>) => unknown): (props: Props & IProps) => Promise<unknown>;
export declare const setLocalStorageKey: (key: string) => string;
export declare let errors: [
	string,
	Error
][];
declare const perf: IPerfData;
export declare type Hook = ($el: ElRaw) => void;
export declare type HookTypes = "preHydrate" | "postHydrate";
export declare const hooks: Record<HookTypes, Hook[]>;
declare function addHook(type: HookTypes, hook: Hook): void;
export declare type ResponseType = "text" | "json";
export declare const components: {
	LoadHTML: (props: IProps) => Promise<unknown>;
	LoadData: (props: {
		src: string;
		options?: Record<string, any> | undefined;
		response?: ResponseType | undefined;
		id: number;
		$el: El;
		to: string;
		content: string;
	} & IProps) => Promise<unknown>;
};
export declare function loadFromLocalStorage(shouldHydrate?: boolean): void;
export declare function setFromObj(obj: Record<string, unknown>, persist?: boolean): void;
export declare function setDefaults(obj: Record<string, unknown>, persist?: boolean): void;
export declare function update(value: string, updater: (value: unknown) => unknown, persist?: boolean): void;
export declare function set(key: string | Record<string, unknown>, item?: unknown, persist?: boolean): void;
export declare function get(key: string): any;
export declare function has(key: string): boolean;
export interface IInitConfig {
	rootPath?: string;
	localStorageKey?: string;
	svgs?: string[];
}
export declare function init({ rootPath, localStorageKey, svgs }?: IInitConfig): Promise<void>;
export interface Reservoir {
	Component: typeof Component;
	init: typeof init;
	setFromObj: typeof setFromObj;
	setDefaults: typeof setDefaults;
	set: typeof set;
	get: typeof get;
	has: typeof has;
	update: typeof update;
	loadFromLocalStorage: typeof loadFromLocalStorage;
	waitForLoaded: typeof waitForLoaded;
	setLocalStorageKey: typeof setLocalStorageKey;
	errors: typeof errors;
	performance: typeof perf;
	reload: typeof hydrate;
	hydrate: typeof hydrate;
	hooks: typeof hooks;
	hook: typeof addHook;
	components: typeof components;
}
export declare const reload: typeof hydrate;
export declare const hook: typeof addHook;
declare const reservoir: Reservoir;

export {
	reservoir as default,
};

export {};
