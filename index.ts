
/**
 * author ： mczhaozl
 * time ： 2023年2月22日 17:09:36
 * phone ： 17746614804
 * email ： 17746614804@163.com
 */
const NODE_ENV = process.env.NODE_ENV as string
const path = require('path')
const nowPath = path.resolve('') // 返回cmd 路径
const fs = require('fs-extra')
type TCheckFn = (string: String) => Boolean
/**
 * 如果填写字符串 则判断代码里面是否包含了该字符串
 * 如果填写正则，则判断代码里面是否有代码符合
 * 如果填写函数，则传入代码运行函数判断是否返回true 
 */
type TListItem = string | RegExp | TCheckFn
type TList = Array<TListItem>
type Tmodify = (prototype: Object, key: string, desc: PropertyDescriptor | undefined) => PropertyDescriptor
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
const DefaultConfig: IConfig = Object.freeze({
    ruleList: [],
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
    },
    checkEnvironment: ['development']
})
export default function CreateCheckFragment(setting) {
    const config = Object.assign(DefaultConfig, setting)
    class CheckFragment {
        @needLength(config.ruleList)
        @LimitEnvironment(config.checkEnvironment)
        apply(compiler) {
            compiler.hooks.emit.callAsync('UndoChecker', async () => {
                return checkFiler(config)
            })
        }
    }
    // 如果不支持装饰器 可以使用以下代码
    // decoratorsPollfill(CheckFragment.prototype,'apply',needLength(config.ruleList))
    // decoratorsPollfill(CheckFragment.prototype,'apply',LimitEnvironment(config.checkEnvironment))
    return CheckFragment
}

// ------------- utils ---------------- 
async function checkFiler({ ruleList, throwError }) {
    const allFile = await loopFiler(item => item.includes('js'))
    return await Promise.all([allFile.map(async path => {
        const string = await fs.readFile(path).then(res => res.toString())
        const list = string.split('\n').map(item => item.trim())
        list.forEach((item, index) => {
            ruleList.forEach(rule => {
                if (targetRule(rule, item)) {
                    throwError({ path, trim: item, index: index + 1, rule: rule })
                }
            })
        })
    })])
}
function LimitEnvironment(rules: Array<string>) {
    return function (target, name, descriptor) {
        if (rules.includes(NODE_ENV)) {
            return { ...descriptor, value: noop }
        }
        return descriptor
    }
}
function needLength(ruleList) {
    return function (target, name, descriptor) {
        if (ruleList.length < 1) {
            return { ...descriptor, value: noop }
        }
        return descriptor
    }
}
function noop() {
    return undefined
}
/**
 * 接受函数返回根文件夹下所有符合要求的文件路径组成的数组
 * @param isNeed 
 * @returns 
 */
async function loopFiler(isNeed: (path: string) => Boolean): Promise<Array<String>> {
    const result: Array<string> = []
    const base = path.resolve(nowPath, './src')
    async function dfs(path) {
        const list = await fs.readdir(path)
        return await Promise.all(
            list.map(async item => {
                if (item.includes('.')) {
                    if (isNeed(item)) {
                        result.push(path + '\\' + item)
                    }
                    return
                } else {
                    return await dfs(path + '\\' + item)
                }
            })
        )
    }
    await dfs(base)
    return result
}

/**
 * 兼容所有的 TListItem 写法
 * @returns  Boolean
 */
function targetRule(rule: TListItem, item: string): Boolean {
    if (typeof rule === 'function') {
        return rule(item)
    }
    if (typeof rule === 'string') {
        return rule.includes(item)
    }
    return rule.test(item)
}

/**
 * 不支持 装饰器可以使用本代码
 */
function decoratorsPollfill(prototype: Object, key: string, desc: PropertyDescriptor, modifyer: Tmodify) {
    Object.defineProperty(prototype, key, modifyer(prototype, key, Object.getOwnPropertyDescriptor(prototype, key)))
}