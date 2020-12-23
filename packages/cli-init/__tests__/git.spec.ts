import fs from "fs-extra";
import path from "path";
import sh from "shelljs";

import { downloadTpl } from "../lib/utils";

const dest = path.resolve(__dirname, "./tpls");

afterEach(() => {
	sh.rm("-rf", dest);
});

test(" downloadTpl ", async done => {
	await downloadTpl({
		skipInstall: true,
		source: "gitee",
		template: "siujs/tpls#master",
		cwd: __dirname,
		appName: "tpls"
	});

	let exists = fs.pathExistsSync(path.resolve(dest, "siu.config.js"));
	expect(exists).toBe(true);

	exists = fs.pathExistsSync(path.resolve(dest, ".git"));
	expect(exists).toBe(true);

	done();
}, 600000);
