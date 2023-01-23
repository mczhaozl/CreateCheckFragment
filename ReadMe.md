1. 这是个什么<br/>
   这是一个 webpack plugin (CreateCheckFragment 本质是一个返回一类的函数)
2. 有什么用<br/>
   可以在代码打包之前，检测你是否有脏代码在代码包内，如果有则会中断打包并告知你具体的信息，要求打包者修复之后，才能正常完成打包动作
3. 可以说一些具体的使用场景吗<br/>
   1. 检测代码中是否有console.log （虽然webpack 有其他插件可以帮助去除console, 但是多人开发的话，你可能会受不了其他人的console.log）
   2. 火狐浏览器，苹果浏览器不支持正则的前瞻校验，可以通过该插件提前检测出来帮助开发者尽早解决问题
   3. 检测代码中是否有undo字段，开发者可以在做的过程中添加undo 注释标记此处需求未做完，或者对代码进行了破坏性修改。
4. 如何进行自定义相关属性<br/>
   const config = {<br/>
      ruleList:['console.log','undo'],<br/>
   }<br/>
   其他具体 配置项可以看demo.ts<br/>
   const CheckFragment =  CreateCheckFragment(config)<br/>
5. 由于某种原因我想使用js而不是ts怎么办<br/>
   粘贴我的indexJs.js 在项目中使用即可<br/>
   
6. 是否还有其他类型的插件<br/>
   
