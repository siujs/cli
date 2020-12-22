const assert = require("assert");

/* istanbul ignore next */
module.exports = api => {
	api.deps.start(async (ctx, next) => {
		await next(new Error("deps called"));
	});

	api.deps.error(ctx => {
		throw ctx.ex();
	});
};
