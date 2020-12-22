import fs from "fs-extra";
import path from "path";
import sh from "shelljs";

import { downloadGit } from "../lib/git";

test("download Git", async done => {
	const dest = path.resolve(__dirname, "./tpls");
	await downloadGit("https://github.com/siujs/tpls", "master", dest);

	let exists = fs.pathExistsSync(path.resolve(dest, "siu.config.js"));
	expect(exists).toBe(true);

	exists = fs.pathExistsSync(path.resolve(dest, ".git"));
	expect(exists).toBe(false);

	sh.rm("-rf", dest);

	done();
}, 600000);
