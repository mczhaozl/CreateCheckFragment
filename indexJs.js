
/**
 * author ： mczhaozl
 * time ： 2023年2月22日 17:09:36
 * phone ： 17746614804
 * email ： 17746614804@163.com
 */
const NODE_ENV = process.env.NODE_ENV
const path = require("path")
const nowPath = path.resolve("") // 返回cmd 路径
const fs = require("fs-extra")
const DefaultConfig = Object.freeze({
  ruleList: [],
  needCheckFile(path) {
    return path.includes(".js")
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
  checkEnvironment: ["development"]
})
export default function CreateCheckFragment(setting) {
  const config = Object.assign(DefaultConfig, setting)
  class CheckFragment {
    // @needLength(config.ruleList)
    // @LimitEnvironment(config.checkEnvironment)
    apply(compiler) {
      compiler.hooks.emit.callAsync("UndoChecker", async () => {
        return checkFiler(config)
      })
    }
  }
  // 如果不支持装饰器 可以使用以下代码
  decoratorsPollfill(CheckFragment.prototype,'apply',needLength(config.ruleList))
  decoratorsPollfill(CheckFragment.prototype,'apply',LimitEnvironment(config.checkEnvironment))
  return CheckFragment
}

// ------------- utils ----------------
async function checkFiler({ ruleList, throwError }) {
  const allFile = await loopFiler(item => item.includes("js"))
  return await Promise.all([
    allFile.map(async path => {
      const string = await fs.readFile(path).then(res => res.toString())
      const list = string.split("\n").map(item => item.trim())
      list.forEach((item, index) => {
        ruleList.forEach(rule => {
          if (targetRule(rule, item)) {
            throwError({ path, trim: item, index: index + 1, rule: rule })
          }
        })
      })
    })
  ])
}
function LimitEnvironment(rules) {
  return function(target, name, descriptor) {
    if (rules.includes(NODE_ENV)) {
      return { ...descriptor, value: noop }
    }
    return descriptor
  }
}
function needLength(ruleList) {
  return function(target, name, descriptor) {
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
async function loopFiler(isNeed) {
  const result = []
  const base = path.resolve(nowPath, "./src")
  async function dfs(path) {
    const list = await fs.readdir(path)
    return await Promise.all(
      list.map(async item => {
        if (item.includes(".")) {
          if (isNeed(item)) {
            result.push(path + "\\" + item)
          }
          return
        } else {
          return await dfs(path + "\\" + item)
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
function targetRule(rule, item) {
  if (typeof rule === "function") {
    return rule(item)
  }
  if (typeof rule === "string") {
    return rule.includes(item)
  }
  return rule.test(item)
}

/**
 * 不支持 装饰器可以使用本代码
 */
function decoratorsPollfill(prototype, key, desc, modifyer) {
  Object.defineProperty(
    prototype,
    key,
    modifyer(prototype, key, Object.getOwnPropertyDescriptor(prototype, key))
  )
}
