import path from "path";

import {
	filterUnExistsPkgs,
	getMetasOfPackages,
	getPackageDirs,
	getPackagePath,
	getPackagePaths,
	getPkgData,
	getPkgDirName,
	getSortedPkgByPriority,
	isPkgExists
} from "../lib/pkg";

const cwd = process.cwd();

const autoSortedPkgDirNames = [
	"builtin-build",
	"builtin-deps",
	"builtin-githooks",
	"builtin-publish",
	"cli",
	"cli-init",
	"core",
	"utils"
];

test("getPackageDirs", async done => {
	const dirs = await getPackageDirs(cwd);

	expect(JSON.stringify(dirs)).toBe(JSON.stringify(autoSortedPkgDirNames));

	done();
});

test("getPackagePaths", async done => {
	const dirs = await getPackagePaths(cwd);

	expect(JSON.stringify(dirs)).toBe(JSON.stringify(autoSortedPkgDirNames.map(it => path.resolve(cwd, "packages", it))));

	done();
});

test("getPackagePath", async done => {
	let pkgPath = await getPackagePath("test", cwd);
	expect(pkgPath).toBe(path.resolve(__dirname, "../../test"));

	pkgPath = await getPackagePath("@foo/bar", cwd);
	expect(pkgPath).toBe(path.resolve(__dirname, "../../bar"));

	done();
});

test("getPkgDirName", () => {
	expect(getPkgDirName("foo")).toBe("foo");
	expect(getPkgDirName("@siujs/foo")).toBe("foo");
	expect(getPkgDirName("/foo")).toBe("/foo");
});

test("getMetasOfPackages", async done => {
	const metas = await getMetasOfPackages(cwd);

	expect(!!metas).toBe(true);

	expect(metas).toHaveProperty("builtin-build");
	expect(metas).toHaveProperty("builtin-deps");
	expect(metas).toHaveProperty("builtin-githooks");
	expect(metas).toHaveProperty("cli-init");
	expect(metas).toHaveProperty("builtin-publish");
	expect(metas).toHaveProperty("core");
	expect(metas).toHaveProperty("cli");
	expect(metas).toHaveProperty("utils");

	done();
});

test("getPkgData", () => {
	const pkgData = getPkgData("utils", cwd);

	expect(pkgData).toHaveProperty("root");
	expect(pkgData.root).toBe(cwd);
	expect(pkgData).toHaveProperty("pkgsRoot");
	expect(pkgData.pkgsRoot).toBe(path.resolve(cwd, "packages"));
	expect(pkgData).toHaveProperty("path");
	expect(pkgData.path).toBe(path.resolve(cwd, "packages", "utils"));
	expect(pkgData).toHaveProperty("name");
	expect(pkgData.name).toBe("@siujs/utils");
	expect(pkgData).toHaveProperty("dirName");
	expect(pkgData.dirName).toBe("utils");
	expect(pkgData).toHaveProperty("umdName");
	expect(pkgData.umdName).toBe("Utils");
	expect(pkgData).toHaveProperty("metaPath");
	expect(pkgData.metaPath).toBe(path.resolve(cwd, "packages", "utils", "package.json"));
	expect(pkgData).toHaveProperty("meta");

	expect(pkgData.meta).toHaveProperty("name");
	expect(pkgData.meta.name).toBe("@siujs/utils");
});

test("getSortedPkgByPriority", async done => {
	const sortedPkgs = await getSortedPkgByPriority(cwd);

	expect(JSON.stringify(sortedPkgs)).toBe(
		JSON.stringify([
			"utils",
			"builtin-build",
			"builtin-deps",
			"builtin-githooks",
			"builtin-publish",
			"cli-init",
			"core",
			"cli"
		])
	);

	done();
});

test(" isPkgExists ", async done => {
	let exists = await isPkgExists("test");
	expect(exists).toBe(false);

	exists = await isPkgExists("utils");
	expect(exists).toBe(true);

	exists = await isPkgExists("@siujs/utils");
	expect(exists).toBe(true);

	done();
});

test(" filterUnExistsPkgs ", async done => {
	let pkgs = await filterUnExistsPkgs("");
	expect(pkgs.join(",")).toBe("");

	pkgs = await filterUnExistsPkgs("foo,bar");
	expect(pkgs.join(",")).toBe("bar,foo");

	pkgs = await filterUnExistsPkgs("foo,utils");
	expect(pkgs.join(",")).toBe("foo");

	pkgs = await filterUnExistsPkgs("core,utils");
	expect(pkgs.join(",")).toBe("");

	done();
});
