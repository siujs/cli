import fs from "fs-extra";
import path from "path";
import sh from "shelljs";

export function createSiuConfigJs() {
	fs.writeFileSync(
		path.resolve(__dirname, "siu.config.js"),
		`module.exports = {
	pkgsOrder: "auto",
	plugins: ["./plugins/local-npm-package", "./plugins/cli-opts"]
}`
	);

	return () => {
		sh.rm("-rf", path.resolve(__dirname, "siu.config.js"));
	};
}

export function createSiuConfigTs() {
	fs.writeFileSync(
		path.resolve(__dirname, "siu.config.ts"),
		`export default {
	pkgsOrder: "auto",
	plugins: ["./plugins/local-npm-package", "./plugins/cli-opts"]
}`
	);

	return () => {
		sh.rm("-rf", path.resolve(__dirname, "siu.config.ts"));
	};
}

export function createSiuPackageJSON() {
	fs.writeJSONSync(path.resolve(__dirname, "package.json"), {
		name: "xxx",
		siu: {
			pkgsOrder: "auto",
			plugins: ["./plugins/local-npm-package", "./plugins/cli-opts"]
		}
	});

	return () => {
		sh.rm("-rf", path.resolve(__dirname, "package.json"));
	};
}

export function createFooPackage() {
	sh.mkdir(path.resolve(__dirname, "packages"));
	sh.mkdir(path.resolve(__dirname, "packages", "foo"));
	fs.writeJSONSync(path.resolve(__dirname, "packages/foo/package.json"), {
		name: "@xxx/foo"
	});

	return (rmAll = false) => {
		sh.rm("-rf", path.resolve(__dirname, rmAll ? "packages" : "packages/foo"));
	};
}
