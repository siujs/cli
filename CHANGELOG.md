# siu ChangeLog

## [v1.0.0-beta.2](https://github.com/siujs/cli/compare/289e90072966ebc2c549a01aab426ffd8b0940b3...v1.0.0-beta.2) (2020-12-28)

### BREAKING CHANGES

-  **builtin-publish**: adjust changelog logic ([1796889](https://github.com/siujs/cli/commit/17968890d034b26af13dee1c1e3e14116af303ca))
-  **utils**: change `getGroupedCommits` output ([f22af3d](https://github.com/siujs/cli/commit/f22af3de636dfa33dacde252001f88bd39dcb34d))

### Bug Fixes

-  **cli**: can't get `version` from `publish` opts ([80535b3](https://github.com/siujs/cli/commit/80535b3630a9d50f197da3a9d3a50752af2f9dca))
-  **builtin-publish**: in `independent` version mode, ([fdd3177](https://github.com/siujs/cli/commit/fdd31773f51c02fd14c3890102ff6d6ce57b2399))
-  **builtin-publish**: not update deps version ([4008148](https://github.com/siujs/cli/commit/400814824c57807e23106d80b597d0219c47b79f))
-  **builtin-publish**: tag name missing `v` prefix ([41cf131](https://github.com/siujs/cli/commit/41cf131d7dbae78a3a32bec83f919c7babeecc81))
-  **builtin-publish**: changelog unfiltered `pkg` ([1391f6a](https://github.com/siujs/cli/commit/1391f6ab92342eb7cb4c60dc29f699d5abfe59dc))
-  **builtin-publish**: miss `hooks` in `releasePackage` ([9827675](https://github.com/siujs/cli/commit/9827675ad9364bb81816303756f31b8680d2b8f1))
-  **builtin-publish**: `EPERM Error` of `npm publish` ([f06933a](https://github.com/siujs/cli/commit/f06933a911cae22303e166ecb82f6c1bd96bd7cc))
-  **builtin-publish**: undefined error of `updateCrossDeps` ([22f82dc](https://github.com/siujs/cli/commit/22f82dc1b5b82fb26d5c0bfa26ad2b66e75523c2))
-  **builtin-publish**: get wrong changelog str ([5e65389](https://github.com/siujs/cli/commit/5e65389e451bbd68834d28f6bc9fb6725b8194f3))
-  **cli-init**: downloaded tpl's dest error ([efbe8a5](https://github.com/siujs/cli/commit/efbe8a5c5758419123b574341fde01ba6ef95798))
-  **core**: `dirs` is undefined when apply `create` cmd ([676025f](https://github.com/siujs/cli/commit/676025f4198c6f825e52c9a1d5f8db6242611a88))
-  **core**: adjust `analysisPlugins` to support loading local plugin ([744503e](https://github.com/siujs/cli/commit/744503e642c836a70d0a6ead05dbc00950d0d02f))
-  **core**: missing "deps" in PluginCommands ([852daca](https://github.com/siujs/cli/commit/852daca2df5c2b3ffd5fc64ae224ce9eab898184))
-  **builtin-githooks**: `getCommitedFilePaths`=>`getCommittedFiles` ([dfdec2c](https://github.com/siujs/cli/commit/dfdec2c659b38837c8a00c22cc1c0bc2424cde99))
-  **cli**: option defaultValue not support number ([c8c4f72](https://github.com/siujs/cli/commit/c8c4f72c9d4bdf05b2b5c23dfdd0cafcdd4a3993))
-  **cli-init**: resolve scoped template error ([06c223a](https://github.com/siujs/cli/commit/06c223aefc36781f8bcec77784a08b378e85d867))
-  **core**: `xxx.cli` hook can't be used in apply logic ([1e45434](https://github.com/siujs/cli/commit/1e454346d0d9796e5cfeae96a40b7f5cb0dde128))
-  **core**: require `siu.config.ts` error ([1e58be3](https://github.com/siujs/cli/commit/1e58be3d2fdad69d58bd76215b789f9aac3d8ab7))
-  **core**: `config` undefined error ([3696b6e](https://github.com/siujs/cli/commit/3696b6e6800ab2c7d75cf4355a0c790ff3b4bc70))

### Performance Improvements

-  **builtin-publish**: set `skipLint` to be true, ([329d699](https://github.com/siujs/cli/commit/329d6994caefbe2cd4563375dc358ccb3f48c2c4))
-  **builtin-publish**: sort pkg by dependent level ([076e244](https://github.com/siujs/cli/commit/076e24409ce6922214ddddebcdb8d4a454cce195))
-  **core**: use `__esModule` condition ([c09f658](https://github.com/siujs/cli/commit/c09f65898ab29dd07c3b967388e5a0b06501da1c))

### Features

-  **builtin-publish**: export fns in `utils` ([6dfe2ec](https://github.com/siujs/cli/commit/6dfe2ec3a44134f7b9de3e76f342fe50556bb7f7))
-  **utils**: add `getGitRemoteUrl` util func ([7332d81](https://github.com/siujs/cli/commit/7332d81f132f72076f344689b14c1ce77ebec8cb))
-  **core**: get config in `package.json`.`siu` ([86ab0e0](https://github.com/siujs/cli/commit/86ab0e0ab5cf86b4cd078ac99270361aa6b8f1a5))
-  **core**: add `package.json`.`siu` to determine project root ([969974e](https://github.com/siujs/cli/commit/969974e09942265aec8d3cdcb989dde4a3e3a331))
-  **cli**: Improve the builtin plugins ([74f2379](https://github.com/siujs/cli/commit/74f23793ca795aa2c5cece6f2d9685101a66aca0))
-  **builtin-publish**: add `pkg` option for custom ([294b334](https://github.com/siujs/cli/commit/294b334e2df1aa3d9e5e9b73a331734539d330ad))
-  **builtin-publish**: add `skipPush` logic ([61f385f](https://github.com/siujs/cli/commit/61f385fa842801a5baac5a73b81ae3cddf9853f1))
-  **builtin-publish**: improving logic of release ([2a74c6d](https://github.com/siujs/cli/commit/2a74c6d9c833e47957420b6c314c7d2799da8099))
-  **utils**: add `getCommitsMsgInfos` for changelog.md ([0d44ff7](https://github.com/siujs/cli/commit/0d44ff7fb64dbd7960da34521aa3e387f3e67509))

### Code Refactoring

-  **builtin-publish**: extract `get newlog` logic to `getNewChangedLog` ([25b9f62](https://github.com/siujs/cli/commit/25b9f629ac7cc628131ae5955accce3e1450045e))
-  **builtin-publish**: add `[dryrun]` prefix for console ([5764c29](https://github.com/siujs/cli/commit/5764c2979fd9193b00bf863f0ac07a98de1c5a6f))
-  **utils**: add `silent:true` to avoid console ([8cb37b8](https://github.com/siujs/cli/commit/8cb37b800d809e2eaef17ce3868ecb8bb7858a8c))
-  **core**: make arg:`config` as required ([50ea927](https://github.com/siujs/cli/commit/50ea92737ad548201ae1a6006f73c951d4ae36e6))
-  **core**: make arg:`cwd` required ([18b7824](https://github.com/siujs/cli/commit/18b78249113be5d9e477eac891f8b897b2db97c2))
-  **utils**: adjust type-def of `getPreTag` ([a720214](https://github.com/siujs/cli/commit/a72021487b776a9bacf844811c38826e31f7de5f))
-  **utils**: `getCommitsMsgInfos`=>`getGroupedCommits` ([43f3467](https://github.com/siujs/cli/commit/43f3467bec361ddf0454adc092df60b00dad1844))
-  **utils**: rename fn name,and adjust args ([3c18d61](https://github.com/siujs/cli/commit/3c18d618310dc563071b5b3248364e9d239518f0))
- mv git utils into `@siujs/utils` ([b36689c](https://github.com/siujs/cli/commit/b36689c0636531a9c0fb091064f748e87715a970))
-  **utils**: rm `async` of `downloadGit` ([1f0366e](https://github.com/siujs/cli/commit/1f0366e7fa55a8c77a1385e7b5d3726be02acc5e))
-  **core**: adjust option description ([bc28dce](https://github.com/siujs/cli/commit/bc28dcee80a65f2725b257b587f46c9aae41bb78))
-  **cli**: adjust description of command ([85acbec](https://github.com/siujs/cli/commit/85acbecb1129bf1f32a279da7b3dacc9be190e3b))
-  **core**: adjust `option` args position and define ([0da7d96](https://github.com/siujs/cli/commit/0da7d9661d84a022da613c34212edac899fb99da))

## [v1.0.0-beta.1](https://github.com/siujs/cli/compare/289e90072966ebc2c549a01aab426ffd8b0940b3...v1.0.0-beta.1) (2020-12-25)

### BREAKING CHANGES

-  **builtin-publish**: adjust changelog logic ([1796889](https://github.com/siujs/cli/commit/17968890d034b26af13dee1c1e3e14116af303ca))
-  **utils**: change `getGroupedCommits` output ([f22af3d](https://github.com/siujs/cli/commit/f22af3de636dfa33dacde252001f88bd39dcb34d))

### Performance Improvements

-  **builtin-publish**: sort pkg by dependent level ([076e244](https://github.com/siujs/cli/commit/076e24409ce6922214ddddebcdb8d4a454cce195))
-  **core**: use `__esModule` condition ([c09f658](https://github.com/siujs/cli/commit/c09f65898ab29dd07c3b967388e5a0b06501da1c))

### Features

-  **builtin-publish**: export fns in `utils` ([6dfe2ec](https://github.com/siujs/cli/commit/6dfe2ec3a44134f7b9de3e76f342fe50556bb7f7))
-  **utils**: add `getGitRemoteUrl` util func ([7332d81](https://github.com/siujs/cli/commit/7332d81f132f72076f344689b14c1ce77ebec8cb))
-  **core**: get config in `package.json`.`siu` ([86ab0e0](https://github.com/siujs/cli/commit/86ab0e0ab5cf86b4cd078ac99270361aa6b8f1a5))
-  **core**: add `package.json`.`siu` to determine project root ([969974e](https://github.com/siujs/cli/commit/969974e09942265aec8d3cdcb989dde4a3e3a331))
-  **cli**: Improve the builtin plugins ([74f2379](https://github.com/siujs/cli/commit/74f23793ca795aa2c5cece6f2d9685101a66aca0))
-  **builtin-publish**: add `pkg` option for custom ([294b334](https://github.com/siujs/cli/commit/294b334e2df1aa3d9e5e9b73a331734539d330ad))
-  **builtin-publish**: add `skipPush` logic ([61f385f](https://github.com/siujs/cli/commit/61f385fa842801a5baac5a73b81ae3cddf9853f1))
-  **builtin-publish**: improving logic of release ([2a74c6d](https://github.com/siujs/cli/commit/2a74c6d9c833e47957420b6c314c7d2799da8099))
-  **utils**: add `getCommitsMsgInfos` for changelog.md ([0d44ff7](https://github.com/siujs/cli/commit/0d44ff7fb64dbd7960da34521aa3e387f3e67509))

### Bug Fixes

-  **builtin-publish**: not update deps version ([4008148](https://github.com/siujs/cli/commit/400814824c57807e23106d80b597d0219c47b79f))
-  **builtin-publish**: tag name missing `v` prefix ([41cf131](https://github.com/siujs/cli/commit/41cf131d7dbae78a3a32bec83f919c7babeecc81))
-  **builtin-publish**: changelog unfiltered `pkg` ([1391f6a](https://github.com/siujs/cli/commit/1391f6ab92342eb7cb4c60dc29f699d5abfe59dc))
-  **builtin-publish**: miss `hooks` in `releasePackage` ([9827675](https://github.com/siujs/cli/commit/9827675ad9364bb81816303756f31b8680d2b8f1))
-  **builtin-publish**: `EPERM Error` of `npm publish` ([f06933a](https://github.com/siujs/cli/commit/f06933a911cae22303e166ecb82f6c1bd96bd7cc))
-  **builtin-publish**: undefined error of `updateCrossDeps` ([22f82dc](https://github.com/siujs/cli/commit/22f82dc1b5b82fb26d5c0bfa26ad2b66e75523c2))
-  **builtin-publish**: get wrong changelog str ([5e65389](https://github.com/siujs/cli/commit/5e65389e451bbd68834d28f6bc9fb6725b8194f3))
-  **cli-init**: downloaded tpl's dest error ([efbe8a5](https://github.com/siujs/cli/commit/efbe8a5c5758419123b574341fde01ba6ef95798))
-  **core**: `dirs` is undefined when apply `create` cmd ([676025f](https://github.com/siujs/cli/commit/676025f4198c6f825e52c9a1d5f8db6242611a88))
-  **core**: adjust `analysisPlugins` to support loading local plugin ([744503e](https://github.com/siujs/cli/commit/744503e642c836a70d0a6ead05dbc00950d0d02f))
-  **core**: missing "deps" in PluginCommands ([852daca](https://github.com/siujs/cli/commit/852daca2df5c2b3ffd5fc64ae224ce9eab898184))
-  **builtin-githooks**: `getCommitedFilePaths`=>`getCommittedFiles` ([dfdec2c](https://github.com/siujs/cli/commit/dfdec2c659b38837c8a00c22cc1c0bc2424cde99))
-  **cli**: option defaultValue not support number ([c8c4f72](https://github.com/siujs/cli/commit/c8c4f72c9d4bdf05b2b5c23dfdd0cafcdd4a3993))
-  **cli-init**: resolve scoped template error ([06c223a](https://github.com/siujs/cli/commit/06c223aefc36781f8bcec77784a08b378e85d867))
-  **core**: `xxx.cli` hook can't be used in apply logic ([1e45434](https://github.com/siujs/cli/commit/1e454346d0d9796e5cfeae96a40b7f5cb0dde128))
-  **core**: require `siu.config.ts` error ([1e58be3](https://github.com/siujs/cli/commit/1e58be3d2fdad69d58bd76215b789f9aac3d8ab7))
-  **core**: `config` undefined error ([3696b6e](https://github.com/siujs/cli/commit/3696b6e6800ab2c7d75cf4355a0c790ff3b4bc70))

### Code Refactoring

-  **builtin-publish**: extract `get newlog` logic to `getNewChangedLog` ([25b9f62](https://github.com/siujs/cli/commit/25b9f629ac7cc628131ae5955accce3e1450045e))
-  **builtin-publish**: add `[dryrun]` prefix for console ([5764c29](https://github.com/siujs/cli/commit/5764c2979fd9193b00bf863f0ac07a98de1c5a6f))
-  **utils**: add `silent:true` to avoid console ([8cb37b8](https://github.com/siujs/cli/commit/8cb37b800d809e2eaef17ce3868ecb8bb7858a8c))
-  **core**: make arg:`config` as required ([50ea927](https://github.com/siujs/cli/commit/50ea92737ad548201ae1a6006f73c951d4ae36e6))
-  **core**: make arg:`cwd` required ([18b7824](https://github.com/siujs/cli/commit/18b78249113be5d9e477eac891f8b897b2db97c2))
-  **utils**: adjust type-def of `getPreTag` ([a720214](https://github.com/siujs/cli/commit/a72021487b776a9bacf844811c38826e31f7de5f))
-  **utils**: `getCommitsMsgInfos`=>`getGroupedCommits` ([43f3467](https://github.com/siujs/cli/commit/43f3467bec361ddf0454adc092df60b00dad1844))
-  **utils**: rename fn name,and adjust args ([3c18d61](https://github.com/siujs/cli/commit/3c18d618310dc563071b5b3248364e9d239518f0))
- mv git utils into `@siujs/utils` ([b36689c](https://github.com/siujs/cli/commit/b36689c0636531a9c0fb091064f748e87715a970))
-  **utils**: rm `async` of `downloadGit` ([1f0366e](https://github.com/siujs/cli/commit/1f0366e7fa55a8c77a1385e7b5d3726be02acc5e))
-  **core**: adjust option description ([bc28dce](https://github.com/siujs/cli/commit/bc28dcee80a65f2725b257b587f46c9aae41bb78))
-  **cli**: adjust description of command ([85acbec](https://github.com/siujs/cli/commit/85acbecb1129bf1f32a279da7b3dacc9be190e3b))
-  **core**: adjust `option` args position and define ([0da7d96](https://github.com/siujs/cli/commit/0da7d9661d84a022da613c34212edac899fb99da))