# Claude 用量小组件 · Scriptable

用于 iPhone 的 2×2 主屏幕小组件，显示 Claude 订阅（Pro、Max 等）的 **5 小时**和**每周**已用额度。脚本文件为 `Claude Usage.js`。

点击整块小组件后，Scriptable 会运行脚本、重新请求用量并显示最新预览。右下角是 Claude 官方 Clay 色的半透明 Logo，登录凭据保存在 Scriptable 的钥匙串中。

## 使用前须知：条款风险

Anthropic 没有为 Claude 个人订阅提供公开的用量 API。本脚本的做法是：

- 复用 **Claude Code 的公开 OAuth 客户端**（client ID `9d1c250a-e61b-44d9-88ed-5944d1962f5e`），在 Anthropic 官方授权页完成登录，采用 PKCE，只申请 `user:profile` 权限。
- 登录后读取 Claude Code 自己显示用量时调用的未公开接口 `https://api.anthropic.com/api/oauth/usage`，以及读取套餐的 `https://api.anthropic.com/api/oauth/profile`。

这种用法与 Anthropic 当前的条款冲突：

- Claude Code 的 [Legal and compliance](https://code.claude.com/docs/en/legal-and-compliance) 页面写明：OAuth 认证只用于 Claude Code 及其他 Anthropic 原生应用的正常使用；不允许第三方开发者在自己的应用里提供 Claude.ai 登录；开发者不得收集、存储或中转 Claude.ai 的凭据或会话令牌。Anthropic 可以不预先通知就采取限制措施。
- [Consumer Terms](https://www.anthropic.com/legal/consumer-terms) 规定：除通过 Anthropic API Key 或获得明确许可外，不得以机器人、脚本等自动化方式访问服务。
- 2026 年 2 月，Anthropic 公开澄清禁止第三方工具使用订阅账号的 OAuth 登录（[The Register 报道](https://www.theregister.com/2026/02/20/anthropic_clarifies_ban_third_party_claude_access/)）。

可能的后果包括：接口改版或停用导致组件失效；Claude Code 的客户端被限制在其他场景使用；Anthropic 对账号采取限制措施。**是否使用由使用者自行判断并承担风险。**

本脚本的实际范围：令牌只有 `user:profile` 权限，能读取账号资料和用量，不能调用模型或发送对话；令牌保存在 Scriptable 的钥匙串中，默认只发送到 Anthropic 的服务器；按下文填写代理地址后，令牌会随请求经过该代理，按上述条款也属于中转；后台约 15 分钟申请刷新一次，实际频率由 iOS 决定。

其他开源项目也采用同样的实现方式：

| 项目 | 许可 | 实现方式 |
| --- | --- | --- |
| [stavrop/ai-usage-limits](https://github.com/stavrop/ai-usage-limits) | Apache 2.0 | iPhone App 与主屏幕、锁屏小组件。复用 Claude CLI 的公开 OAuth 客户端做 PKCE 登录，实际只授予 `user:profile`；读取 `api.anthropic.com/api/oauth/usage`。README 写明访问令牌约 8 小时、续期链约 29 天后需重新登录，并声明读取的是未公开接口，可能随时失效并与服务条款冲突。 |
| [gabreho/claude-usage-widget](https://github.com/gabreho/claude-usage-widget) | MIT | macOS 菜单栏与小组件、iOS App 与主屏幕小组件。README 写明因 Anthropic 尚未开放第三方客户端注册，使用 Claude Code 的公开 OAuth client ID 做 PKCE 登录，令牌存入独立的钥匙串项；读取 `api.anthropic.com/api/oauth/usage`。 |

App Store 上也有同类的 Claude 用量小组件，如 [Usage for Claude](https://apps.apple.com/us/app/usage-for-claude/id6755173244)，其实现方式未经核实。以上项目的存在不代表 Anthropic 许可这种用法。

## 安装与首次登录

1. 在 iPhone 安装或更新 **Scriptable**。
2. 打开 `Claude Usage.js`，复制全部代码。
3. 在 Scriptable 点击右上角 **＋**，粘贴代码，把脚本命名为 **Claude Usage**，保存后运行。
4. 首次运行会弹出登录说明。点击 **打开授权页**，脚本会打开 Claude 官方授权页。
5. 登录 Claude 账号并点击授权。页面会显示一段授权码，点击复制按钮复制完整内容。
6. 点击浏览器的 **完成** 回到 Scriptable，在弹出的输入框中粘贴授权码，点击 **完成登录**。脚本会保存登录凭据、获取用量，并显示小尺寸预览。

授权码的格式是 `授权码#校验值`，请完整粘贴。粘贴内容不完整或不属于本次登录时，对话框会提示原因，可以点击 **重新打开授权页** 获取新的授权码。

如果授权期间脚本被 iOS 结束，复制授权码后重新运行脚本，会直接显示粘贴授权码的对话框。点击 **稍后登录** 会放弃本次授权，下次运行重新开始。

## 约 30 天重新登录一次

访问令牌约 8 小时有效，脚本会在过期前自动续期。续期令牌从登录起约 30 天后失效，续期不会延长这个期限，这与 Claude Code 在电脑上的行为相同。到期后组件显示红色的「登录已过期」，点击组件重新授权即可。

本脚本的登录与电脑上的 Claude Code 相互独立，重新登录或续期不会让电脑上的 Claude Code 退出。

## 添加到主屏幕

1. 长按 iPhone 主屏幕空白处，选择添加小组件。
2. 搜索 **Scriptable**，选择小尺寸 **2×2** 并添加。
3. 长按新组件 → **编辑小组件**，在 **Script** 中选择 **Claude Usage**。
4. **When Interacting** 选择 **Run Script**；**Parameter** 留空。脚本本身也设置了运行当前脚本的点击链接。

脚本包含图标，无须另外下载图片或填写 API Key。

## 点击刷新怎么用

直接点击主屏幕上的整块组件：

**进入 Scriptable → 自动请求最新用量 → 显示更新后的预览 → 手动返回桌面。**

每次运行都会请求用量接口和账号资料接口。两者都成功后保存新数据，并调用 `Script.setWidget()` 提交组件内容；前台运行时还会把 `refreshAfterDate` 设为当前时间，申请尽早更新。

**桌面小组件是否立即重绘由 iOS 决定。** 前台预览已更新、桌面仍显示旧时间时，说明新数据已经取得，桌面还在等待刷新。

登录有效时点击刷新；尚未登录或登录过期时，点击进入登录流程。底部的更新时间显示到分钟，同一分钟内连续刷新，显示的时间可能相同。后台正常申请约 15 分钟后刷新，实际间隔由 iOS 决定。登录页面和预览只会在前台运行时打开。

## 外观与显示规则

脚本开头保留可修改的外观常量：

```js
const LOGO_OPACITY_LIGHT = 0.04;
const LOGO_OPACITY_DARK = 0.075;
const LOGO_COLOR = '#D97757';
const LOGO_RATIO = 0.85;
const LOGO_OFFSET = -0.11;
const BACKGROUND_LIGHT = '#FFFFFF';
const BACKGROUND_DARK = '#14211B';
const PADDING_VERTICAL = 12;
const PADDING_HORIZONTAL = 14;
```

- 第一行左侧是 18 点粗体 Claude 标题，右侧是套餐：`Pro`、`Max 5x`、`Max 20x`、`Team`、`Enterprise`。无法识别的套餐留空。
- 每个限额周期一行：左侧是周期名称（`5h`、`Weekly`），右侧是已用百分比；下方是 20 格进度条和重置时间。
- 接口只返回 5 小时和每周两个通用窗口时显示两行；未返回的窗口不显示，不推断为 0%。按模型区分的每周额度（如 Opus、Sonnet）不显示。
- 5 小时窗口内还没有用量时，接口不返回重置时间，这一行显示「尚未开始计时」；计时从下一次使用开始。
- 底部一行：左侧是最后成功更新时间，右侧是状态，如 `未登录`、`登录已过期`、`网络异常`。正常时右侧留空。
- 背景 Logo 使用 Claude 官方 Clay 色 `#D97757`，边长为组件边长的 85%，右／下偏移均为 -11%，超出部分裁切。浅色模式不透明度 0.04，深色模式 0.075。
- 背景色按每次运行时的系统深浅色生成。切换系统外观后，背景需等待脚本重新运行，桌面更新时间由 iOS 决定。
- 数字与进度条低于 95% 为蓝色，达到或超过 95% 变为橙色，「登录已过期」为红色。完整规则见 [样式规则](../../docs/STYLE.md)。
- 所有时间均为 **Asia/Taipei（GMT+8），24 小时制**。

[`previews/claude.html`](../../previews/claude.html) 使用示例数据，可查看双周期、深浅色、95% 阈值、尚未开始计时和登录／错误状态；页面上方的滑块可临时调整浅色、深色 Logo 的不透明度。浏览器近似呈现脚本布局，实际字体与尺寸以 iPhone 为准。

## 登录过期与故障排查

访问令牌将要过期或接口返回 401 时，脚本会续期一次。只有续期被拒绝（401 或 `invalid_grant`），或续期后接口仍返回 401，才显示「登录已过期」。网络异常、403 访问受限、429 请求过多、服务器错误和响应格式异常会显示不同提示，并保留最后一次成功的用量及原更新时间。

| 现象 | 检查方式 |
| --- | --- |
| 点击后只有 Scriptable 首页 | 确认组件选择了此脚本，并把 When Interacting 设为 Run Script；在 App 内手动运行一次确认脚本已保存完整。 |
| 粘贴后提示授权码不完整 | 使用授权页上的复制按钮，确认粘贴的内容包含 `#`。 |
| 显示「请重新发起登录」 | 授权码已失效或已使用过。再次运行脚本，重新打开授权页获取新的授权码。 |
| 显示「请求过于频繁 · 429」 | 用量接口有频率限制。等待一段时间后再点击，不要连续刷新。 |
| 预览更新、桌面没有变化 | 新数据已经获取，桌面可能仍在等待 iOS 调度。观察桌面底部成功更新时间。 |
| 显示网络异常 | 检查手机当前网络能否访问 Claude。填写了代理地址时，确认手机能访问该代理，且它转发到 `https://api.anthropic.com`。 |
| 显示「访问受限」或长期无法获取 | 接口可能已被 Anthropic 调整或限制，参见上文的条款风险。 |
| 显示脚本运行异常 | 在 Scriptable App 内运行脚本。错误弹窗会显示阶段、具体报错和可用的引擎行号；点击「复制错误信息」可复制排查信息。 |

需要查看保存的诊断记录时，可临时新建另一个 Scriptable 脚本，运行以下代码：

```js
const key = 'claude.usage.v1.status';
console.log(Keychain.contains(key) ? Keychain.get(key) : '暂无请求记录');
```

其中 `checkedAt` 是最近一次尝试的 Unix 毫秒时间戳，`stage` 是执行阶段，`kind` 是结果，`httpStatus` 是 HTTP 状态码，`detail` 是脚本运行异常的具体原因。此记录不包含令牌或钥匙串原文。

## 可选：经反向代理转发请求

脚本默认直接请求 Anthropic 官方接口。自己部署了反向代理（例如 [api-proxy](https://github.com/lainbo/api-proxy)）时，可以让令牌换取与续期、用量和账号资料请求经代理发出。访问令牌会随请求经过代理，只应使用自己控制的代理。授权网页仍在 Safari 中直接打开 Claude 官方地址。

在 Scriptable 中打开本脚本，把开头的 `PROXY_ANTHROPIC_URL` 改为代理上转发到 `https://api.anthropic.com` 的完整地址（包含路径）并保存。脚本只在其后拼接接口路径，末尾的斜杠会被去掉。以 api-proxy 的 `/anthropic` 路由为例：

```js
const PROXY_ANTHROPIC_URL = 'https://proxy.example.com/anthropic';  // 代替 https://api.anthropic.com
```

这时用量请求发往 `https://proxy.example.com/anthropic/api/oauth/usage`。直连时，令牌请求与 Claude Code 一样发到 `https://platform.claude.com/v1/oauth/token`；填写代理地址后改发到代理地址加 `/v1/oauth/token`，即 `api.anthropic.com` 的同一路径，因此代理只需转发这一个官方地址。两个官方地址对无效授权码和无效续期令牌的返回相同，经代理的真实登录与续期尚待实机确认。

改回 `''` 即恢复直连官方接口。重新粘贴新版脚本时这一行会恢复为空，需要再次填写。

## 代码维护

脚本保持单文件，结构与 ChatGPT 组件一致：数据转换与显示计算使用纯函数，登录、请求、存储和界面操作由流程函数串联。PKCE 所需的 SHA-256 与 base64url 在脚本内以纯 JavaScript 实现，随机值取自系统 UUID。

## 验证范围

在电脑上用 Node 模拟 Scriptable 接口运行脚本，已完成：

- JavaScript 语法检查；SHA-256 与 base64url 结果和 Node `crypto` 逐一比对（0–300 字节输入）。
- 授权地址的参数与 PKCE challenge 校验；授权地址能正常打开 Claude 登录页。
- 使用电脑上 Claude Code 现有的访问令牌，只读请求用量和账号资料接口，均返回 200，解析出套餐与两个窗口并正确渲染；此项未触发续期。
- 用无效授权码换取令牌返回 400，显示「请重新发起登录」并删除本次登录记录；用无效续期令牌续期返回 400 `invalid_grant`，显示「登录已过期」并保留原用量。
- 以上接口请求在不填写代理地址、按线上 api-proxy 节点填写，以及按本机自定义路径前缀（如 `/relay/v2/claude-api`）的转发器填写三种情况下结果相同；不填写时请求全部发往官方地址，填写后全部发往所填地址的路径之下，末尾带斜杠的地址同样正确。
- 模拟登录对话：授权码不完整、不属于本次登录、重新打开授权页、稍后登录后清除本次授权信息。
- 浏览器预览在 158 与 170 点尺寸核对布局、深浅色和 Logo。

**尚未经过真实授权码登录和真实续期，也未在 iPhone 上运行。** 需要实机确认：授权页显示并复制授权码的流程、换取令牌、约 8 小时后的自动续期、约 30 天后的重新登录、钥匙串持久化、背景 Logo 的原生显示与裁切、主题切换和后台刷新时机。Team、Enterprise 账号的接口返回也未验证。交付文件不包含账号凭据。

## 来源

- [Scriptable 小组件与刷新时间](https://docs.scriptable.app/listwidget/)
- [Alert 输入框](https://docs.scriptable.app/alert/)、[Safari 授权页面](https://docs.scriptable.app/safari/)、[钥匙串](https://docs.scriptable.app/keychain/)、[UUID](https://docs.scriptable.app/uuid/)
- 登录参数、授权码格式（`授权码#state`）与续期请求依据 Claude Code 2.1.282 的实现。
- [Claude Code Legal and compliance](https://code.claude.com/docs/en/legal-and-compliance)、[Anthropic Consumer Terms](https://www.anthropic.com/legal/consumer-terms)
- [Anthropic 媒体资源包](https://www.anthropic.com/press-kit)：右下角背景使用官方 Claude Spark 图标的矢量路径，由 Scriptable 绘制。标志归 Anthropic 所有，使用须遵守其[商标使用规范](https://www.anthropic.com/legal/trademark-guidelines)。
