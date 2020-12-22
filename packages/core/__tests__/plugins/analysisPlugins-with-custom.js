const assert = require("assert");

/* istanbul ignore next */
module.exports = api => {
	api.create.start(ctx => {
		assert(ctx.opts("bar") === "1", `Cant't get "bar" from config.js options`);
	});
};
