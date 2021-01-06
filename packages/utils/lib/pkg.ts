import fs from "fs-extra";
import path from "path";

import { camelize } from "./str";

const DEFAULT_WORKSPACE = "packages";

/**
 *
 * 获取当前工作目录下的所有有效package的目录名称
 *
 * @param cwd 当前工作目录 默认process.cwd()
 */
export async function getPackageDirs(cwd = process.cwd(), workspace = DEFAULT_WORKSPACE) {
	const pkgsRoot = path.resolve(cwd, workspace);
	const dirs = await fs.readdir(pkgsRoot);
	return dirs.filter(dir => fs.statSync(path.resolve(pkgsRoot, dir)).isDirectory());
}

/**
 *
 * 获取当前工作目录下的所有有效package的地址
 *
 * @param cwd 当前工作目录 默认process.cwd()
 */
export async function getPackagePaths(cwd = process.cwd(), workspace = DEFAULT_WORKSPACE) {
	const pkgsRoot = path.resolve(cwd, workspace);
	const dirs = await getPackageDirs(cwd);
	return dirs.map(dir => path.resolve(pkgsRoot, dir)).filter(p => fs.pathExistsSync(path.resolve(p, "package.json")));
}

/**
 *
 * 获取当前工作目录下的所有有效package的package.json数据内容
 *
 * @param cwd 当前工作目录 默认process.cwd()
 */
export async function getMetasOfPackages(cwd = process.cwd(), workspace = DEFAULT_WORKSPACE) {
	const pkgPaths = await getPackagePaths(cwd, workspace);

	const kv = {} as Record<string, Record<string, any>>;

	for (let l = pkgPaths.length; l--; ) {
		kv[path.basename(pkgPaths[l])] = await fs.readJSON(path.resolve(pkgPaths[l], "package.json"));
	}

	return kv;
}

/**
 * 通过pkgName来得到准确的pkg目录名称
 *
 * @param pkgName 客户端传入的pkg名称
 *
 * @returns 正确的pkg目录名称
 */
export function getPkgDirName(pkgName: string) {
	let dirName = pkgName;
	if (dirName.startsWith("@") && ~dirName.indexOf("/")) {
		dirName = dirName.split("/").pop();
	}
	return dirName;
}

/**
 *
 * 获取当前工作目录下的所有有效package的地址
 *
 * @param pkgName 客户端传入的pkg名称
 * @param cwd 当前工作目录 默认process.cwd()
 */
export function getPackagePath(pkgName: string, cwd = process.cwd(), workspace = DEFAULT_WORKSPACE) {
	const pkgsRoot = path.resolve(cwd, workspace);
	const dir = getPkgDirName(pkgName);
	return path.resolve(pkgsRoot, dir);
}

export interface PkgData {
	/**
	 * full name of package, equlas `name` in package.json
	 */
	name: string;
	/**
	 * directory name of package
	 */
	dirName: string;
	/**
	 * output name for umd format file
	 */
	umdName: string;
	/**
	 * absolute address of package
	 */
	path: string;
	/**
	 * absolute address of package's package.json
	 */
	metaPath: string;
	/**
	 * data of package's package.json
	 */
	meta?: Record<string, any>;
	/**
	 * absolute address of packages
	 */
	pkgsRoot: string;
	/**
	 * absolute address of current workspace
	 */
	root: string;
}

/**
 *
 * 获取当前package的完整数据结构
 *
 * @param pkgName 当前包的名称
 * @param cwd 当前工作目录 默认process.cwd()
 */
export function getPkgData(pkgName: string, cwd = process.cwd(), workspace = DEFAULT_WORKSPACE): PkgData {
	const dirName = getPkgDirName(pkgName);

	const pkgsRoot = path.resolve(cwd, workspace);

	const pkgPath = path.resolve(pkgsRoot, dirName);

	const metaPath = path.resolve(pkgPath, "./package.json");

	const meta = fs.pathExistsSync(metaPath) ? fs.readJSONSync(metaPath) : { name: pkgName };

	return {
		root: cwd,
		pkgsRoot,
		path: pkgPath,
		name: meta.name,
		dirName,
		umdName: camelize(dirName, true),
		metaPath,
		meta
	};
}

/**
 * 获取通过优先级排序的packag目录名称列表
 *
 *  priority: 主要是通过各个package被引用的计数大小倒排
 *
 * @param cwd current workspace directory
 */
export async function getSortedPkgByPriority(cwd = process.cwd(), workspace = DEFAULT_WORKSPACE) {
	const pkgPaths = await getPackagePaths(cwd, workspace);

	const kv = {} as Record<string, number>;

	const pkgMetaNames = [] as string[];

	for (let l = pkgPaths.length; l--; ) {
		const meta = await fs.readJSON(path.resolve(pkgPaths[l], "package.json"));
		pkgMetaNames.push(meta.name);
		if (!kv[meta.name]) {
			kv[meta.name] = 0;
		}
		if (meta.dependencies) {
			Object.keys(meta.dependencies).reduce((prev, cur) => {
				prev[cur] = kv[meta.name] + 1;
				return prev;
			}, kv);
		}
	}

	return Object.keys(kv)
		.filter(key => pkgMetaNames.includes(key))
		.reduce((prev, cur) => {
			prev[kv[cur]] = prev[kv[cur]] || [];
			prev[kv[cur]].push(getPkgDirName(cur));
			return prev;
		}, [] as string[][])
		.reverse()
		.flat();
}
/**
 *
 * Whether package is exists
 *
 * @param name package name
 * @param workspace [optional] current monorepo workspace name,default:packages
 */
export async function isPkgExists(name: string, workspace = DEFAULT_WORKSPACE) {
	const dirName = getPkgDirName(name);

	const pkgs = await fs.readdir(path.resolve(process.cwd(), workspace));

	return pkgs.includes(dirName);
}

/**
 *
 * Filter packages which isn't exists
 *
 * @param name packages name string
 */
export async function filterUnExistsPkgs(pkgs: string) {
	const unExistsPkgs = [] as string[];

	if (!pkgs) return unExistsPkgs;

	const arr = pkgs.split(",");
	let exists: boolean;

	for (let l = arr.length; l--; ) {
		exists = await isPkgExists(arr[l]);
		if (!exists) {
			unExistsPkgs.push(arr[l]);
		}
	}

	return unExistsPkgs;
}
