import { getGitInfo } from "../lib/utils";

test(" getGitInfo ", () => {
	let gitInfo = getGitInfo("@siujs/tpl#dev");
	expect(gitInfo.branch).toBe("dev");
	expect(gitInfo.gitPath).toBe("https://github.com/siujs/tpl");

	gitInfo = getGitInfo("@siujs/tpl");
	expect(gitInfo.branch).toBe("main");
	expect(gitInfo.gitPath).toBe("https://github.com/siujs/tpl");

	gitInfo = getGitInfo("@siujs/tpl", "gitee");
	expect(gitInfo.branch).toBe("master");
	expect(gitInfo.gitPath).toBe("https://gitee.com/siujs/tpl");

	gitInfo = getGitInfo("git@xxx");
	expect(gitInfo.branch).toBe("main");
	expect(gitInfo.gitPath).toBe("git@xxx");

	gitInfo = getGitInfo("git@xxx#master");
	expect(gitInfo.branch).toBe("master");
	expect(gitInfo.gitPath).toBe("git@xxx");

	gitInfo = getGitInfo("https://github.com/tpl#dev");
	expect(gitInfo.branch).toBe("dev");
	expect(gitInfo.gitPath).toBe("https://github.com/tpl");
});
