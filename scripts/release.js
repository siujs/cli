const minimist = require("minimist");
const { release, runWhetherDry } = require("../packages/builtin-publish/dist/index");

const cmd = minimist(process.argv);

const skips = cmd.skip ? cmd.skip.split(",") : [];

release({
	dryRun: !!(cmd.dryRun || cmd["dry-run"]),
	skipPush: skips.length && skips.includes("push"),
	skipLint: false,
	skipBuild: skips.length && skips.includes("build"),
	repo: cmd.repo,
	hooks: {
		async lint({ cwd, dryRun }) {
			await runWhetherDry(dryRun)("yarn", ["test"], { cwd });
		}
	}
});
