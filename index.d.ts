// Generated by dts-bundle v0.7.3

declare module 'hydrate-web' {
    import * as globals from 'hydrate-web/src/globals';
    import { get, loadFromLocalStorage, set, setDefaults, waitForLoaded, setFromObj, hydrate, update } from "hydrate-web/src/hydrate";
    import { Component } from "hydrate-web/src/components";
    import { addHook } from "hydrate-web/src/hooks";
    export interface IInitConfig {
        rootPath?: string;
        localStorageKey?: string;
        svgs?: string[];
    }
    function init({ rootPath, localStorageKey, svgs }?: IInitConfig): Promise<void>;
    export interface Reservoir {
        Component: typeof Component;
        init: typeof init;
        setFromObj: typeof setFromObj;
        setDefaults: typeof setDefaults;
        set: typeof set;
        get: typeof get;
        update: typeof update;
        loadFromLocalStorage: typeof loadFromLocalStorage;
        waitForLoaded: typeof waitForLoaded;
        setLocalStorageKey: typeof globals.setLocalStorageKey;
        errors: typeof globals.errors;
        performance: typeof globals.perf;
        reload: typeof hydrate;
        hydrate: typeof hydrate;
        hooks: typeof globals.hooks;
        hook: typeof addHook;
    }
    export { Component, init, setFromObj, setDefaults, set, get, loadFromLocalStorage, waitForLoaded, hydrate, update };
    export const setLocalStorageKey: (key: string) => string;
    export const errors: [string, Error][];
    export interface IPerfData {
        renders: string[]
    }
    export const performance: IPerfData;
    export const reload: typeof hydrate;
    export const hooks: Record<globals.HookTypes, globals.Hook[]>;
    export const hook: typeof addHook;
    const reservoir: Reservoir;
    export default reservoir;
}

declare module 'hydrate-web/src/globals' {
    import { IPerfData } from "hydrate-web/src/types";
    import { ElRaw } from "hydrate-web/src/types";
    export let ROOT_PATH: string;
    export const setRootPath: (path: string) => string;
    export let data: Record<string, unknown>;
    export let lsData: Record<string, unknown>;
    export let localStorageKey: string;
    export const setLocalStorageKey: (key: string) => string;
    export const executeError: unique symbol;
    export let loaded: boolean;
    export let loadedCBs: Function[];
    export const isLoaded: () => void;
    export let errors: [string, Error][];
    export const perf: IPerfData;
    export type Hook = ($el: ElRaw) => void;
    export type HookTypes = 'preHydrate' | 'postHydrate';
    export const hooks: Record<HookTypes, Hook[]>;
}

declare module 'hydrate-web/src/hydrate' {
    import { El, ElRaw } from "hydrate-web/src/types";
    export function loadFromLocalStorage(shouldHydrate?: boolean): void;
    export function waitForLoaded(): Promise<void>;
    export function saveToLocalStorage(): void;
    export function setFromObj(obj: Record<string, unknown>, persist?: boolean): void;
    export function setDefaults(obj: Record<string, unknown>, persist?: boolean): void;
    export function update(value: string, updater: (value: unknown) => unknown): void;
    export function set(key: string | Record<string, unknown>, item?: unknown, persist?: boolean): void;
    export function get(key: string): any;
    export function execute(key: string, $el: El | null, parameters?: Record<string, any>): any;
    export function has(key: string): boolean;
    export function hydrate($el?: ElRaw): void;
}

declare module 'hydrate-web/src/components' {
    import { IProps } from "hydrate-web/src/types";
    export function Component<Props extends IProps>(name: string, cb: (props: Readonly<Props>) => unknown): (props: Props) => Promise<unknown>;
}

declare module 'hydrate-web/src/hooks' {
    import type { Hook, HookTypes } from "hydrate-web/src/globals";
    export function addHook(type: HookTypes, hook: Hook): void;
}

declare module 'hydrate-web/src/types' {
    import type { Reservoir } from "hydrate-web";
    global {
        interface Window {
            children: HTMLCollection;
            reservoir: Reservoir;
        }
    }
    export type El = (Element) & {
        reloadComponent?: Function;
    };
    export type ElRaw = Element | HTMLElement | Document | Window;
    export interface IPerfData {
        renders: string[];
    }
    export interface IProps {
        id: number;
        $el: El;
        [key: string]: any;
    }
}

