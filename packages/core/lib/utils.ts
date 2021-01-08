import fs from "fs-extra";
import path from "path";

import { getPackageDirs, getPkgDirName, getSortedPkgByPriority } from "@siujs/utils";

import { PluginCommand, PluginCommandLifecycle, PluginHookKey } from "./types";

const allowConfigList = ["siu.config.js", "siu.config.ts"];

/**
 *
 * Find up working directory of `siu.config.(ts|js) `
 *
 * @param cwd current workspace directory
 * @param deep search deep
 */
export async function lookupSiu(cwd: string, deep = 3): Promise<string> {
	if (deep === 0) return "";

	const hasSiuConfig = await Promise.all(
		allowConfigList.map(config => fs.pathExists(path.resolve(cwd, config)))
	).then(result => result.reduce((prev, cur) => prev || cur, false));

	if (!hasSiuConfig) {
		const hasPkgJSON = await fs.pathExists(path.resolve(cwd, "package.json"));
		if (hasPkgJSON) {
			const meta = await fs.readJSON(path.resolve(cwd, "package.json"));
			if (meta.siu) return cwd;
		}
		return await lookupSiu(path.resolve(cwd, "../"), deep - 1);
	}

	return cwd;
}

/**
 *
 * 调整当前工作区间目录
 *
 */
export async function adjustSiuConfigCWD() {
	const siuConfigCWD = await lookupSiu(process.cwd());
	if (!siuConfigCWD) {
		throw new Error(`[siu] ERROR: Cant't find root workspace directory of \`siu.config.js\``);
	}
	process.chdir(siuConfigCWD);
}

/**
 *
 * 生成当前hook的标识
 *
 * @param action 操作名称
 * @param lifeCycle 操作周期
 */
/* istanbul ignore next */
export function getHookId(action: PluginCommand, lifeCycle: PluginCommandLifecycle) {
	return `${action}.${lifeCycle}` as PluginHookKey;
}

/**
 *
 * sort target pkg
 *
 * @param sortFlag - how to sort : "auto" | "priority" | string[]
 * @param sourcePkg - target pkg string
 */
export async function sortPkgs(sortFlag: "auto" | "priority" | string[], sourcePkg: string) {
	let dirs: string[] = [];

	switch (sortFlag) {
		case "auto":
			dirs = await getPackageDirs();
			break;
		case "priority":
			dirs = await getSortedPkgByPriority();
			break;
		default:
			dirs = sortFlag as string[];
			break;
	}
	if (sourcePkg) {
		const pkgs = sourcePkg.split(",").map(getPkgDirName);
		dirs = dirs.filter(dir => pkgs.includes(dir));
	}

	return dirs;
}
