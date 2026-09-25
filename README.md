# Scriptable Glance

用 Scriptable 在 iPhone 主屏幕显示 AI 订阅用量的 2×2 小组件。当前提供 **ChatGPT / Codex** 和 **Claude**，显示套餐、已用百分比、分段进度条、额度重置时间、最后成功更新时间和登录／网络状态。

## 使用

| 组件 | 单文件脚本 | 安装说明 |
| --- | --- | --- |
| ChatGPT / Codex | [ChatGPT Usage.js](<widgets/chatgpt/ChatGPT Usage.js>) | [ChatGPT 使用说明](widgets/chatgpt/README.md) |
| Claude | [Claude Usage.js](<widgets/claude/Claude Usage.js>) | [Claude 使用说明](widgets/claude/README.md) |

1. 打开脚本，把全部内容复制到 iPhone 的 Scriptable，脚本按文件名命名，如 **ChatGPT Usage**、**Claude Usage**。
2. 在 App 内运行，按提示打开官方授权页，完成登录。
3. 添加 Scriptable 小尺寸组件，Script 选对应脚本，When Interacting 选 **Run Script**，Parameter 留空。

**Claude 组件复用 Claude Code 的登录方式读取用量，与 Anthropic 当前条款冲突，存在接口失效或账号受限的风险。** 使用前请阅读 [Claude 使用说明](widgets/claude/README.md) 中的条款风险。

两个组件默认直接请求官方接口。自己部署了反向代理（例如 [api-proxy](https://github.com/lainbo/api-proxy)）时，可以在脚本开头填写代理上对应官方接口的完整地址（包含路径），让接口请求经代理转发，方法见各组件使用说明的「可选：经反向代理转发请求」。

点击组件会进入 Scriptable，获取最新用量并显示预览。后台正常申请约 15 分钟后刷新，实际时间由 iOS 调度。

## 目录

```text
AGENTS.md                        维护代理必须遵守的约定
widgets/chatgpt/
  ChatGPT Usage.js               单文件安装脚本
  README.md                      安装、登录、刷新、故障排查
widgets/claude/
  Claude Usage.js                单文件安装脚本
  README.md                      条款风险、安装、登录、刷新、故障排查
docs/
  STYLE.md                       已确定的样式与文案规则
  MAINTENANCE.md                 接口、存储、验证、扩展与发布
assets/
  openai-blossom.svg             OpenAI 官网品牌页的 Blossom 图标，脚本中的路径取自此文件
  claude-spark.svg               Anthropic 媒体资源包的 Claude Spark（Clay 色）图标
tools/
  render-preview.cjs             根据脚本布局生成浏览器预览
  preview-template.html          预览页面模板
previews/<service>.html          生成的布局预览
```

## 本地维护

需要 Node.js 18+，无需安装 npm 依赖。手机运行脚本只需要 Scriptable。

```sh
node --input-type=module --check < "widgets/chatgpt/ChatGPT Usage.js"
node --input-type=module --check < "widgets/claude/Claude Usage.js"
node tools/render-preview.cjs
```

用浏览器打开 `previews/chatgpt.html` 或 `previews/claude.html` 查看示例数据。页面上方的滑块可临时调整浅色、深色背景 Logo 的不透明度，确定数值后改脚本顶部的常量并重新生成。也可启动本地预览：

```sh
python3 -m http.server 8768 --bind 127.0.0.1 --directory previews
```

打开 `http://127.0.0.1:8768/chatgpt.html` 或 `claude.html`，加上 `?size=170` 查看 Pro Max 尺寸。浏览器预览不运行登录或读取真实凭据，字体与系统行为以 iPhone 为准。

## 当前验证状态

- ChatGPT：已进行语法检查、真实用量请求、设备码申请与待授权查询，直连官方接口、经线上 api-proxy 节点和经自定义路径的本机转发器转发，结果一致。用户已在 iPhone 上确认直连时组件点击后能更新用量，填写代理地址后的 iPhone 运行尚待确认。
- Claude：已在电脑上用 Claude Code 现有的访问令牌只读请求用量和账号资料接口，直连官方接口、经线上 api-proxy 节点和经自定义路径的本机转发器转发均成功解析；无效授权码与无效续期令牌的错误分类已实际验证。真实授权码登录、真实续期和 iPhone 实机运行尚未验证。
- 两个组件的布局（标题与套餐同行、20 格进度条、底部状态）和右下角背景 Logo 已通过 158／170 点浏览器预览检查；尚未在 iPhone 上确认新布局的原生显示。原生裁切、背景主题切换、桌面重绘、自动后台刷新和手机端续期仍需观察实机表现。

## 后续组件

新增服务放在 `widgets/<service>/`，保留独立单文件脚本和使用说明，沿用 [样式规则](docs/STYLE.md)。先查证该服务的登录方式和用量接口，再决定能展示哪些周期与数据。当前维护约定见 [AGENTS.md](AGENTS.md) 和 [维护说明](docs/MAINTENANCE.md)。
