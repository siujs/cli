import { CLIOptionHandlerParams, PluginApi, PluginCommand } from "@siujs/core";

import { asBuildFallback } from "./build";
import { asCreationFallback } from "./create";
import { asDepsFallback } from "./deps";
import { asGLintFallback } from "./glint";
import { asPublishFallback } from "./publish";

export function cliFallback(api: PluginApi) {
	api.create.cli((option: CLIOptionHandlerParams) => {
		option("-d, --deps <deps>", "name of siblings package, e.g. `pkg1` or `pkg1,pkg2`");
	});

	api.publish.cli((option: CLIOptionHandlerParams) => {
		option("-s, --skip <skip>", "Will skip steps, e.g: 'lint'、'lint,build'、'lint,build,push'");
	});
}

export function cmdFallback(cmd: PluginCommand) {
	switch (cmd) {
		case "create":
			return asCreationFallback;
		case "deps":
			return asDepsFallback;
		case "glint":
			return asGLintFallback;
		case "build":
			return asBuildFallback;
		case "publish":
			return asPublishFallback;
	}
}
