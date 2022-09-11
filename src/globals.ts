import type { IPerfData } from "./types";

export let ROOT_PATH = '';
export const setRootPath = (path: string) => ROOT_PATH = path;

export let data: Record<string, unknown> = {};
export let lsData: Record<string, unknown> = {};

export let localStorageKey = '__HydrateWebAppLSData__';
export const setLocalStorageKey = (key: string) => localStorageKey = key;

export const executeError = Symbol('__reservoir_ExecuteError');

export let loaded = false;
export let loadedCBs: Function[] = [];
export const isLoaded = () => {
    loaded = true;
    loadedCBs.forEach(cb => cb());
}

export let errors: [string, Error][] = [];

export const perf: IPerfData = {
    renders: []
};