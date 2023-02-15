
type TCheckFn = (string: String) => Boolean
/**
 * 如果填写字符串 则判断代码里面是否包含了该字符串
 * 如果填写正则，则判断代码里面是否有代码符合
 * 如果填写函数，则传入代码运行函数判断是否返回true 
 */
type TListItem = string | RegExp | TCheckFn
type TList = Array<TListItem>
interface ErrorInfo {
    path: string, // 文件位置
    trim: string, // 危险代码所在行内容
    index: number, // 危险代码所在行号 
    rule: TListItem // 未通过原因
}
interface IConfig {
    ruleList?: TList, 
    needCheckFile?: (path: String) => Boolean,
    throwError?: (errorInfo: ErrorInfo) => never,
    checkEnvironment?: Array<string>
}

const config: IConfig = {
    ruleList: [
        '// undo',
        /\/?/,
        function hasLog(string) {
            return string.includes('console.log')
        }
    ],
    needCheckFile(path) {
        return path.includes('.js')
    },
    throwError(errorInfo) {
        throw new Error(`
        自定义校验未通过
        在${errorInfo.path} 文件夹下发现了
        ${errorInfo.trim}中包含了
        ${errorInfo.rule}字段 
        打包被强制中断,请处理之后重新打包
        `)
    }
}
export default config