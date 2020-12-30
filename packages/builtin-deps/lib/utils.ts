import fs from "fs-extra";
import path from "path";
import shell from "shelljs";

import { getPackagePath, isWindows } from "@siujs/utils";

/* istanbul ignore next */
export function detectYarn() {
	if (!shell.which("yarn")) {
		shell.exec(isWindows ? `npm i -g yarn` : `sudo npm i -g yarn`);
	}
}

export function transformDepStr(str: string) {
	let normalStr = str.replace(":D", "");

	const isScoped = normalStr[0] === "@";

	if (isScoped) {
		normalStr = normalStr.substring(1);
	}
	const arr = normalStr.split("@");

	if (!arr[0]) return;

	return {
		name: isScoped ? `@${arr[0]}` : arr[0],
		[`version`]: arr.length > 1 ? arr[1] : "latest"
	};
}

/**
 *
 * Analysis user input deps string
 *
 *  e.g. "foo,bar:D,bar2@1.1.0,foo2@1.2.2:D"  will be like this:
 *
 *    {
 *         "deps": ["foo","bar2@1.0.0"],
 * 		  "devDeps": ["bar","foo2@1.2.2"]
 *    }
 *
 * @param deps deps string
 */
export function normalizeDepStr(deps: string) {
	return deps.split(",").reduce(
		(prev, cur) => {
			const depInfo = transformDepStr(cur);

			const propName = cur.endsWith(":D") ? "devDeps" : "deps";

			depInfo && (prev[propName] = prev[propName] || []).push(depInfo);

			return prev;
		},
		{} as {
			deps?: { name: string; version: string }[];
			devDeps?: { name: string; version: string }[];
		}
	);
}

export async function getPkgMeta(pkgName: string) {
	const meta = await fs.readJSON(path.resolve(getPackagePath(pkgName), "package.json"));

	meta.dependencies = meta.dependencies || {};
	meta.devDependencies = meta.devDependencies || {};

	return meta;
}

let pkgMetas: Record<string, any>[];

/**
 *
 * Whether is local package
 *
 * @param depName target dependency package name
 */
export async function isLocalPackage(depName: string) {
	if (!pkgMetas) {
		const pkgsRoots = path.resolve(process.cwd(), "./packages");

		pkgMetas = await fs
			.readdir(pkgsRoots)
			.then(dirs => Promise.all(dirs.map(dir => fs.readJSON(path.resolve(pkgsRoots, dir, "package.json")))))
			.then(data => data.flat());
	}

	const item = pkgMetas.filter(meta => meta.name === depName).pop();

	return item ? item.version : "";
}

/* istanbul ignore next */
export async function addDeps(deps: { name: string; version: string }[], cwd: string, isDev = false) {
	for (let l = deps.length; l--; ) {
		const version = await isLocalPackage(deps[l].name);
		if (version) {
			deps[l].version = version;
		}
	}

	shell.exec(`yarn -W${isDev ? "D" : ""} add ${deps.map(dep => `${dep.name}@${dep.version}`).join(" ")}`, { cwd });
}
