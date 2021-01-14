import { detectGlobalCommand, exec } from "../lib/exec";

describe(" detectGlobalCommand ", () => {
	it("should return true when detect node", async done => {
		const rslt = await detectGlobalCommand("node");

		expect(rslt).toBeTruthy();

		done();
	});

	it("should return false when detect xxxx", async done => {
		const rslt = await detectGlobalCommand("xxx");

		expect(rslt).toBeFalsy();

		done();
	});
});

describe(" exec ", () => {
	it("should return https://github.com/siujs/cli when `exec('git',['ls-remote','--get-url'])`", async done => {
		const version = await exec("git", ["ls-remote", "--get-url"]);

		expect(version).toBe("https://github.com/siujs/cli");

		done();
	});
});
