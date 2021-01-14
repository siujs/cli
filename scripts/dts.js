/* eslint-disable @typescript-eslint/no-var-requires */

const path = require("path");
const fs = require("fs-extra");
const chalk = require("chalk");
const exec = require("execa");

const packagesRoot = path.resolve(__dirname, "../packages/");

const pkgDirList = [
	"utils",
	"builtin-build",
	"builtin-deps",
	"builtin-githooks",
	"builtin-publish",
	"cli-init",
	"core",
	"cli"
];

async function runApiExtractor(pkgName) {
	const { Extractor, ExtractorConfig } = require("@microsoft/api-extractor");

	const extractorConfigPath = path.resolve(path.resolve(packagesRoot, pkgName), `api-extractor.json`);

	const exists = await fs.pathExists(extractorConfigPath);

	if (!exists) return;

	console.log(chalk.bold(chalk.yellow(`Building type definitions for ${pkgName}...`)));

	const extractorConfig = ExtractorConfig.loadFileAndPrepare(extractorConfigPath);
	const extractorResult = Extractor.invoke(extractorConfig, {
		localBuild: true,
		showVerboseMessages: true
	});

	if (extractorResult.succeeded) {
		const pkgPath = path.resolve(__dirname, "../packages/");

		// concat additional d.ts to rolled-up dts
		const typesDir = path.resolve(pkgPath, "types");
		if (fs.existsSync(typesDir)) {
			const dtsPath = path.resolve(pkgPath, `dist/${pkgName}.d.ts`);
			const existing = await fs.readFile(dtsPath, "utf-8");
			const typeFiles = await fs.readdir(typesDir);
			const toAdd = await Promise.all(typeFiles.map(file => fs.readFile(path.resolve(typesDir, file), "utf-8")));
			await fs.writeFile(dtsPath, toAdd.join("\n") + "\n" + existing);
		}
		console.log(chalk.bold(chalk.green(`API Extractor completed successfully.`)));
	} else {
		console.error(
			`API Extractor completed with ${extractorResult.errorCount} errors` +
				` and ${extractorResult.warningCount} warnings`
		);
		process.exitCode = 1;
	}
}

(async () => {
	for (let i = 0; i < pkgDirList.length; i++) {
		await exec("tsc", ["--emitDeclarationOnly"], {
			cwd: path.resolve(packagesRoot, pkgDirList[i])
		});
		await runApiExtractor(pkgDirList[i]);
	}
})();
