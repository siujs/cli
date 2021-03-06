import { QuestionCollection } from "inquirer";

import { PkgData } from "@siujs/utils";

export type ValueOf<T> = T extends Record<any, infer P> ? P : T;

export type ParamTypeOf<T> = T extends (fn: infer P) => void ? P : T;

export type PluginCommand = "create" | "doc" | "demo" | "serve" | "test" | "build" | "publish" | "glint" | "deps";

export type PluginCommandLifecycle = "cli" | "start" | "process" | "complete" | "error" | "clean";

export type PluginHookKey = `${PluginCommand}.${PluginCommandLifecycle}`;

export type HookHandlerOpts = <T extends any>(key: string) => T;

export interface HookHandlerContext {
	/**
	 *
	 * 当前插件在当前生命周期钩子下的配置获取
	 *
	 * @param key 配置key
	 * @param defaultValue 自定义默认值，只有当为null| undefined的时候
	 */
	opts<T extends any>(key: string, defaultValue?: T): T;
	/**
	 *
	 * 当前插件在当前生命周期钩子下的配置项获取
	 *
	 */
	opts<T extends Record<string, any>>(): T;
	/**
	 *
	 * 当前插件全局临时缓存设置/获取
	 *
	 * @param key 目标键
	 * @param value 如果设置则表示存入临时值,反之获取临时值
	 */
	keys(key: string, value: any): void;
	/**
	 *
	 * 当前插件全局临时缓存获取
	 *
	 * @param key 目标键
	 */
	keys<T extends any>(key: string): T;
	/**
	 *
	 * 当前插件在当前生命周期/当前pkg下的缓存设置
	 *
	 * @param key 目标键
	 * @param value 如果设置则表示存入临时值,反之获取临时值
	 */
	scopedKeys(key: string, value: any): void;
	/**
	 *
	 * 当前插件在当前生命周期/当前pkg下的缓存获取
	 *
	 * @param key 目标键
	 */
	scopedKeys<T extends any>(key: string): T;
	/**
	 *
	 * 当前插件在当前生命周期/当前pkg下的异常设置
	 *
	 * @param value 表示存入临时值
	 */
	ex(value: Error | string): void;
	/**
	 *
	 * 当前插件在当前生命周期/当前pkg下的异常获取
	 *
	 */
	ex(): string | Error;
	/**
	 *
	 * 当前插件运行时对应的正在处理的package对象获取
	 *
	 */
	pkg(): PkgData | undefined;
	/**
	 *
	 * 刷新当前pkg的meta信息
	 *
	 * @param meta 新的package.json的值
	 */
	pkg(meta: Record<string, any>): void;
}

export type HookHandler = (ctx: HookHandlerContext) => Promise<void> | void;

export type CLIOptionHandler = (
	option: (
		flags: string,
		description?: string,
		defaultValue?: any,
		fn?: ((arg1: any, arg2: any) => void) | RegExp
	) => <T>(prompt: {
		questions: QuestionCollection<T>;
		initialAnswers?: Partial<T>;
		answerTransform?: (answer: any) => any;
	}) => void
) => Promise<void> | void;

export interface CLIOption {
	flags: string;
	description?: string;
	defaultValue?: any;
	fn?: ((arg1: any, arg2: any) => void) | RegExp;
	prompt?: ParamTypeOf<ReturnType<ParamTypeOf<CLIOptionHandler>>>;
}

export type CLIOptionHandlerParams = ParamTypeOf<CLIOptionHandler>;

export type HookHandlerFunc = (fn: HookHandler | CLIOptionHandler) => void;

export type PluginApi = Record<PluginCommand, Record<PluginCommandLifecycle, HookHandlerFunc>>;

export type SiuConfigExcludePkgs = string[] | Partial<Record<PluginCommand, string[]>>;

export interface SiuConfig {
	/**
	 *
	 *  指定pkgs(目录名称)排序来控制插件的执行顺序
	 *
	 * 	选项: "auto" | "priority" | custom stirng array
	 *
	 *  默认值: "priority"
	 *
	 *  提示:
	 *    auto: 默认按照package的目录名称排序
	 *    priority: 通过分析当前packages之间依赖关系形成的优先级数组(从高到低)
	 *    string[]: 自定义排序
	 *
	 *  使用场景:
	 *    想通过esbuild来快速打包ts项目, 但是这个时候又需要dts声明的情况下，可以利用这个优先级使用(ts --emitDeclarationOnly + @microsoft/api-extractor)
	 */
	pkgsOrder?: "auto" | "priority" | string[];
	/**
	 * 排除某些pkg参与plugin中的流程处理
	 */
	excludePkgs?: SiuConfigExcludePkgs;
	/**
	 * siujs的相关插件配置,必填
	 */
	plugins: (
		| string
		| [
				string,
				{
					excludePkgs?: SiuConfigExcludePkgs;
					custom?: Partial<Record<PluginCommand, Record<string, any>>>;
				}
		  ]
	)[];
}
