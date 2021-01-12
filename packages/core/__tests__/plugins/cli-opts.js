module.exports = api => {
	api.create.cli(option => {
		option("-f, --foo <foo>", "Foo", "1");

		option(
			"-s, --skip <skip>",
			"Will skip steps: lint | build | publish | commit | push , support comma join"
		)({
			questions: {
				type: "checkbox",
				name: "skip",
				message: "Select skip steps:",
				choices: ["lint", "build", "publish", "commit", "push"]
			},
			answerTransform(answer) {
				return answer && answer.join(",");
			}
		});
	});
};
