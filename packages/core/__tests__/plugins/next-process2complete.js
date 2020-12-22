/* istanbul ignore next */
module.exports = api => {
	api.create.process(async (ctx, next) => {
		await next();
	});

	api.create.complete(async () => {
		throw new Error("next process=>complete");
	});

	api.create.error(ctx => {
		throw ctx.ex();
	});
};
