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
	it("should return v14.15.4 when `exec('node',['-v'])`", async done => {
		const version = await exec("node", ["-v"]);

		expect(version).toBe("v14.15.4");

		done();
	});
});
