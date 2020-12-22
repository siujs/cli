/* istanbul ignore next */
module.exports = api => {
	api.create.start(async (ctx, next) => {
		await next(new Error("next-err"));
	});

	api.create.error(ctx => {
		throw ctx.ex();
	});
};
