import * as globals from './globals';
import type { Hook, HookTypes } from "./globals";

export function addHook (type: HookTypes, hook: Hook) {
    globals.hooks[type]?.push(hook);
}