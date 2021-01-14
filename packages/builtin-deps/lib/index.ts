import { createDebugger, exec, getPackagePath } from "@siujs/utils";

import { addDeps, normalizeDepStr } from "./utils";

const debug = createDebugger("siu:deps");

/**
 *
 * add/remove dependencies/devDependencies
 *
 * @param pkg target package name e.g. foo or @scope/foo
 *
 * @param depStr dependencies string
 * 		 e.g. "foo,bar:D,bar2@1.1.0,foo2@1.2.2:D"  will be like this:
 *
 *    {
 *         "deps": ["foo","bar2@1.0.0"],
 * 		  "devDeps": ["bar","foo2@1.2.2"]
 *    }
 *
 * @param action `add` or `rm`
 */
export async function changeDeps(pkg: string, depStr: string, action: "add" | "rm" = "add", workspace = "packages") {
	const depsMap = normalizeDepStr(depStr);

	debug("transformed dep:", depsMap);

	if (!depsMap || ((!depsMap.deps || !depsMap.deps.length) && (!depsMap.devDeps || !depsMap.devDeps.length))) return;

	debug(`start "${action}" deps on "${pkg}" `);

	const cwd = pkg ? getPackagePath(pkg, workspace) : process.cwd();

	const { deps = [], devDeps = [] } = depsMap;

	if (action === "rm") {
		await exec(
			"yarn",
			[
				"-W",
				"remove",
				...deps
					.concat(devDeps)
					.map(it => it.name)
					.join(" ")
			],
			{ cwd }
		);
	} else {
		deps.length && (await addDeps(deps, cwd, false, workspace));
		devDeps.length && (await addDeps(devDeps, cwd, true, workspace));
	}
}
