import { PkgData } from "@siujs/utils";

import { PluginCommand, PluginCommandLifecycle } from "./types";

export const pluginCommands = [
	"create",
	"glint",
	"deps",
	"doc",
	"demo",
	"serve",
	"test",
	"build",
	"publish"
] as PluginCommand[];

export const lifecycles = ["cli", "start", "process", "complete", "error", "clean"] as PluginCommandLifecycle[];

export const GlobalKeyValues = {} as Record<string, any>;

export const PkgCaches = {} as Record<string, PkgData>;

export const noop = () => {};

export const DEFAULT_PLUGIN_ID = "__SIU_PLUGIN__";
