const assert = require("assert");

/* istanbul ignore next */
module.exports = api => {
	api.deps.process(ctx => {
		ctx.scopedKeys("foo", 1);
	});

	api.deps.complete(ctx => {
		assert.strictEqual(ctx.scopedKeys("foo"), 1, "foo!==1");
	});
};
