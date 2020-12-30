/* istanbul ignore next */
module.exports = api => {
	api.create.process(() => {});

	api.create.complete(async () => {
		throw new Error("next process=>complete");
	});

	api.create.error(ctx => {
		throw ctx.ex();
	});
};
