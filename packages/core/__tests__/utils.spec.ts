import { findUpSiuConfigCwd } from "../lib/utils";

test("findUpSiuConfigCwd", async done => {
	const targetCWD = await findUpSiuConfigCwd(__dirname);

	expect(targetCWD).toBe(__dirname);

	done();
});
