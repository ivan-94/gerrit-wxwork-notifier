# Gerrit 企业微信群机器人通知

需要配合 Jenkins 使用，利用 Gerrit Trigger 插件实现事件的监听.

添加群机器人请编辑 config.json 文件, 支持配置参数如下:

- webhook 企业微信群群机器人地址
- project 监听的项目, 支持正则表达式, 例如 `^frontend`
- branch 监听的分支，支持正则表达式，默认监听所有
- eventType 监听的事件类型
  - patchset-created 开发者提交变更
  - draft-published
  - change-merged 变更被合并到最终分支
