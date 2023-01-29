
const config = require('./config')
const NODE_ENV = process.env.NODE_ENV as string
const path = require('path')
const nowPath = path.resolve('') // 返回cmd 路径
const fs = require('fs-extra')


type TCheckFn = (string: String) => Boolean
type TListItem = string | RegExp | TCheckFn

export default class CheckFragment {
    @needLength
    @LimitEnvironment(['development'])
    apply(compiler) {
        compiler.hooks.emit.callAsync('UndoChecker', async () => {
            return checkFiler(config)
        })
    }
}
async function checkFiler(config,) {
    const allFile = await loopFiler(item => item.includes('js'))
    return await Promise.all([allFile.map(async path => {
        const string = await fs.readFile(path).then(res => res.toString())
        const list = string.split('\n').map(item => item.trim())
        list.forEach((item, index) => {
            config.forEach(rule => {
                const has = targetRule(rule, item)
                if (has) {
                    throw { path, trim: item, index: index + 1, target: rule }
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
function needLength(target, name, descriptor) {
    if (config.length < 1) {
        return { ...descriptor, value: noop }
    }
    return descriptor
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


function targetRule(rule: TListItem, item: string): Boolean {
    if (typeof rule === 'function') {
        return rule(item)
    }
    if (typeof rule === 'string') {
        return rule.includes(item)
    }
    return rule.test(item)
}