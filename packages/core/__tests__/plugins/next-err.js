const assert = require("assert");

/* istanbul ignore next */
module.exports = api => {
	api.create.start(async () => {
		throw new Error("next-err");
	});

	api.create.error(ctx => {
		const ex = ctx.ex();
		assert.strictEqual(ex.message, "next-err");
	});
};
