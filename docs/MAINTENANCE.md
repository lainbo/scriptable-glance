# 维护说明

## 源码与运行方式

每个服务以一个完整的 Scriptable 脚本交付。当前源文件为 `widgets/chatgpt/ChatGPT Usage.js` 和 `widgets/claude/Claude Usage.js`，各自包含原生界面、认证、请求、缓存和错误处理。顶层 `await main()` 是 Scriptable 入口。

两个脚本默认直接请求官方接口。脚本开头的代理常量用于填写可选的反向代理地址，每个常量对应一个官方地址前缀，值是代理上转发到该前缀的完整地址（包含路径），脚本不假定代理的路径结构：ChatGPT 的 `PROXY_AUTH_URL` 对应 `https://auth.openai.com`，`PROXY_CHATGPT_URL` 对应 `https://chatgpt.com/backend-api`；Claude 的 `PROXY_ANTHROPIC_URL` 对应 `https://api.anthropic.com`。常量非空时，`AUTH_API`、`USAGE_URL`、`API_BASE` 等接口地址改用该值作为前缀，去掉末尾斜杠后拼接接口路径，其余逻辑不变。请求中的访问令牌会经过代理。在 Safari 中打开的授权网页和 OAuth 参数里的 `redirect_uri` 始终使用官方地址。新增接口时从对应的接口前缀常量拼接地址，否则填写代理后该请求仍会直连。仓库中的代理常量保持为空，文档示例以 [api-proxy](https://github.com/lainbo/api-proxy) 的路由写成 `https://proxy.example.com/openai-auth` 等形式，不写入具体节点地址。

业务逻辑使用普通函数，错误由 `usageError()` 创建并携带分类、阶段与 HTTP 状态。`parseCredentials()`、`parseUsage()` 显式接收当前时间，负责凭据与用量转换；`statusLabel()`、`nextRefreshAt()` 根据传入状态计算底部状态文案与刷新时刻。这些函数不读写钥匙串、不发起请求，也不修改输入。网络、存储与 Scriptable 界面操作集中在流程与渲染函数中，原生对象按 Scriptable API 要求创建。

预览工具读取源文件，去掉执行入口后调用 `renderWidget()`，通过轻量的界面记录对象生成 HTML。背景记录实际 `DrawContext` 的矩形与路径填充，转换为 SVG 字符串写入预览数据；进度条各格按容器的尺寸、圆角和动态背景色输出；页面据此生成背景，滑块改写其中 Logo 路径的 `fill-opacity`。深浅色分别解析动态颜色。每个服务在 `render-preview.cjs` 中有自己的示例数据，由 `buildPreview()` 生成 `previews/<service>.html`。它只近似表示布局，不模拟完整手机运行环境。若调整渲染函数签名或添加新的原生界面 API，同步维护预览工具。

## ChatGPT 数据流程

1. `loadState()` 读取 Keychain 中的缓存和凭据。
2. 未登录时，前台调用 `deviceLogin()` 申请设备码。后台仅查询尚在有效期内的授权，不持续生成新设备码。
3. `presentLogin()` 显示设备码，按用户选择复制设备码并通过 `Safari.openInApp()` 打开官方授权页。
4. 页面关闭后查询授权结果，交换访问令牌和续期令牌，立即保存到 Keychain。
5. `fetchUsage()` 获取实际用量。访问令牌将过期或遇到 401 时尝试续期。
6. 成功获取且字段正确后写入缓存和 `fetchedAt`，再渲染组件。
7. 前台调用 `Script.setWidget()` 并显示 `presentSmall()`；后台直接提交组件内容。

当前协议依据 Codex `rust-v0.155.0`，不是稳定的公开用量 API：

| 用途 | 官方地址 | 填写代理后 |
| --- | --- | --- |
| 设备码申请 | `POST https://auth.openai.com/api/accounts/deviceauth/usercode` | `POST {PROXY_AUTH_URL}/api/accounts/deviceauth/usercode` |
| 网页授权 | `https://auth.openai.com/codex/device` | Safari 直接打开官方地址 |
| 授权状态查询 | `POST https://auth.openai.com/api/accounts/deviceauth/token` | `POST {PROXY_AUTH_URL}/api/accounts/deviceauth/token` |
| 令牌交换／续期 | `POST https://auth.openai.com/oauth/token` | `POST {PROXY_AUTH_URL}/oauth/token` |
| Codex 用量 | `GET https://chatgpt.com/backend-api/wham/usage` | `GET {PROXY_CHATGPT_URL}/wham/usage` |

脚本中的 OAuth client ID 是客户端公开标识。真实令牌仅从当前用户的授权取得。不要用 API Key 用量或 ChatGPT 普通聊天额度替代 Codex 订阅额度。

授权状态查询接口的 403／404 表示等待授权；`PROXY_AUTH_URL` 没有正确转发时，代理返回的 404 同样会被当成等待授权。用量接口的 403 是访问受限。修改错误分类时保留这个区别。服务端响应变化时查官方 Codex 源码和真实响应字段，勿把所有失败都判断成登录过期。

## Claude 数据流程

1. `loadState()` 读取 Keychain 中的缓存和凭据。
2. 未登录时，前台 `presentLogin()` 先说明步骤，再由 `openAuthorization()` 生成 PKCE verifier 与 state、保存到 Keychain，并通过 `Safari.openInApp()` 打开官方授权页。后台运行只显示未登录状态。
3. 用户在授权页复制 `授权码#state`，回到 Scriptable 粘贴。脚本按 `#` 拆分并核对 state，不一致时要求重新打开授权页。
4. `completeLogin()` 用授权码、verifier 与 state 换取访问令牌和续期令牌，立即保存。登录账号与缓存账号不同时清除旧缓存。
5. `fetchUsage()` 同时请求用量和账号资料。访问令牌 1 分钟内将过期时先续期；未续期而任一接口返回 401 时，续期一次后重试。
6. `parseUsage()` 从资料接口取套餐，从用量接口取 `five_hour` 与 `seven_day` 两个窗口；两者都成功且字段正确后写入缓存和 `fetchedAt`。
7. 前台调用 `Script.setWidget()` 并显示 `presentSmall()`；后台直接提交组件内容。

登录参数与请求依据 Claude Code 2.1.282 的实现，用量与资料接口均未公开，不是稳定 API：

| 用途 | 地址／请求 |
| --- | --- |
| 网页授权 | `https://claude.com/cai/oauth/authorize`（会跳转到 claude.ai），Safari 直接打开，参数含 `code=true`、PKCE S256 challenge 与 state |
| 授权码回调页 | `https://platform.claude.com/oauth/code/callback`，页面显示供复制的 `授权码#state` |
| 令牌交换／续期 | `POST https://platform.claude.com/v1/oauth/token`，JSON 请求体 |
| 用量 | `GET https://api.anthropic.com/api/oauth/usage` |
| 账号与套餐 | `GET https://api.anthropic.com/api/oauth/profile` |

填写 `PROXY_ANTHROPIC_URL` 后，用量与资料请求改发到 `{PROXY_ANTHROPIC_URL}/api/oauth/...`。令牌请求改发到 `{PROXY_ANTHROPIC_URL}/v1/oauth/token`，即 `api.anthropic.com` 的同一路径，使代理只需转发这一个官方地址：两者对无效授权码返回相同的 400 `Invalid 'code' in request.`，对无效续期令牌返回相同的 400 `invalid_grant`。经代理的真实授权码登录与续期尚未验证，填写代理后登录失败时先核对这一项。

用量与资料请求带 `Authorization: Bearer` 和 `anthropic-beta: oauth-2025-04-20`。client ID 是 Claude Code 的公开标识，scope 只申请 `user:profile`。verifier 与 state 各为 32 字节随机值的 base64url（43 个字符），state 过短会被授权页拒绝。JavaScriptCore 没有 `crypto`，SHA-256 与 base64url 在脚本内实现，随机值取自两个 `UUID.string()`。

用量接口的 `utilization` 已是百分比，`resets_at` 为带 6 位小数秒的 ISO 时间；5 小时窗口尚无用量时 `resets_at` 为 `null`，显示「尚未开始计时」。接口还返回按模型区分的窗口和额外用量等字段，当前不展示。套餐由资料接口的 `organization.organization_type`（`claude_pro`、`claude_max` 等）与 `organization.rate_limit_tier`（区分 Max 5x／20x）得出。

错误分类：换取令牌返回 400／401 表示授权码无效或已用过，删除本次登录记录并显示「请重新发起登录」；续期返回 401 或 400 `invalid_grant` 才判定登录过期。访问令牌约 8 小时，续期令牌从登录起约 30 天失效，续期不会延长，因此约每月需要重新登录一次。403、429、服务器错误按通用规则处理。

条款风险：Claude Code 的 [Legal and compliance](https://code.claude.com/docs/en/legal-and-compliance) 规定 OAuth 只用于 Claude Code 及 Anthropic 原生应用，不允许第三方在自己的应用中提供 Claude.ai 登录或存储其令牌，Anthropic 可不预先通知即采取措施。用户已知晓并接受这一风险。使用说明中写明了条款原意、可能的后果和采用相同做法的开源项目；修改登录流程或文档时保留这些说明，不要把本脚本描述为官方许可的用法。

## 存储与错误处理

ChatGPT 的 Keychain 命名空间为 `chatgpt.usage.v1`：

| 后缀 | 内容 |
| --- | --- |
| `auth` | 访问令牌、续期令牌、有效期、账号标识与套餐类型 |
| `device` | 等待中的设备码、设备标识、到期时间与查询间隔 |
| `cache` | 上次成功的额度窗口、套餐、账号标识与 `fetchedAt` |
| `status` | 最近一次尝试的时间、阶段、分类、HTTP 状态和脱敏错误原因 |
| `expired` | 已确认凭据失效的标记 |

Claude 的 Keychain 命名空间为 `claude.usage.v1`：

| 后缀 | 内容 |
| --- | --- |
| `auth` | 访问令牌、续期令牌、有效期与账号标识 |
| `login` | 正在进行的登录的 PKCE verifier 与 state，登录完成、放弃或授权码无效时删除 |
| `cache` | 上次成功的额度窗口、套餐、速率档位、账号标识与 `fetchedAt` |
| `status` | 最近一次尝试的时间、阶段、分类、HTTP 状态和脱敏错误原因 |
| `expired` | 已确认凭据失效的标记 |

续期会轮换续期令牌，取得后立即写回 `auth`；漏存会导致下一次续期失败。

**Scriptable 保留以 `scriptable` 开头的键名，`contains()` 也会拒绝此类键。** 新键必须使用服务自己的前缀。现有键名不要为整理代码而更换；若存储结构需要升级，应明确设计迁移。

每个额度窗口的内部字段是 `usedPercent`、`duration`（秒）、`resetsAt`（Unix 毫秒，Claude 可为 `null`）。`fetchedAt` 也使用 Unix 毫秒。ChatGPT API 返回的 `reset_at` 是秒，Claude 返回 ISO 时间，不能遗漏单位转换。

只有成功的数据请求推进 `fetchedAt`。异常保留原数据、原时间和可见状态。未知原生异常由 `runtimeError()` 记录阶段与脱敏原因；前台弹窗支持复制，方便定位实机问题。不要恢复成只显示「脚本运行异常」而丢失底层原因。

解析钥匙串 JSON 失败时，报错只包含键名，不包含原文。不得记录完整请求头、接口响应、设备授权信息、PKCE verifier、授权码或令牌。Claude 脚本的 `runtimeError()` 另外隐藏 `sk-ant-` 开头的令牌与 verifier 字段。

## 刷新边界

- 当前点击链接由 `URLScheme.forRunningScript()` 生成，会打开 Scriptable 并运行当前脚本。
- 正常后台设置约 15 分钟的 `refreshAfterDate`；ChatGPT 待授权时申请约 1 分钟后刷新。
- 距离重置进入 24 小时范围或跨过重置时刻时，提前申请重新运行以更新文案与数据。
- 前台运行后将最早刷新时间设为当前时间，具体桌面重绘由系统决定。
- 用户已确认前台点击后用量会更新。不要把这一反馈扩大成自动续期、后台定时或原地交互按钮已经验证。
- 如要改变点击行为，先核对 App 当前版本的公开能力，再更新实现和说明；URL 跳转与后台按钮回调属于不同能力。

## 新增其他服务

1. 确认用户要展示的具体订阅或 coding plan，查明合法可用的登录方式、用量字段和重置语义。
2. 新建 `widgets/<service>/`，添加独立单文件脚本及使用说明。不要先创建尚无实际需求的占位服务。
3. 使用独立 Keychain 前缀。每个服务自行处理续期、退出或失效，不共享认证状态。
4. 沿用 `docs/STYLE.md` 的排版和已用量规则，周期与套餐按该服务实际字段适配。未知字段保持明确的缺失状态。
5. 只有真实重复需求出现时才讨论提取共享实现；仍须保证最终安装文件可以独立运行。

## 验证与发布

常规命令在项目根目录执行：

```sh
node --input-type=module --check < "widgets/chatgpt/ChatGPT Usage.js"
node --input-type=module --check < "widgets/claude/Claude Usage.js"
node tools/render-preview.cjs
```

`render-preview.cjs` 只读取本地脚本和模板，使用 Node 标准库，不读取凭据。

图标源文件为 `assets/openai-blossom.svg`，取自 [OpenAI 品牌页](https://openai.com/brand/)下载的 `OAI_OpenAI-Blossom_Black.svg`。脚本中的 `LOGO_PATH` 是该文件 `path` 元素的 `d` 属性原文，`LOGO_BOUNDS` 是图形在 716×716 原画布中的边界（180.5 起，边长 354.67）。`logoPath()` 只解析绝对坐标的 `M`、`L`、`H`、`V`、`C`、`Z` 指令，对应 Scriptable `Path` 的 `move`、`addLine`、`addCurve` 与 `closeSubpath`；更换图标时先确认路径不含圆弧、二次曲线或相对坐标指令，并重新计算图形边界。官方路径不设 `fill-rule`，与 iOS 默认的非零环绕填充一致。

Claude 图标源文件为 `assets/claude-spark.svg`，取自 [Anthropic 媒体资源包](https://www.anthropic.com/press-kit)中 Clay 色的 Claude Spark，原填充色 `#D97757`。`LOGO_PATH` 同样是 `path` 的 `d` 属性原文，只含 `M`、`L`、`H`、`V`、`C`、`Z` 绝对坐标指令；`LOGO_BOUNDS` 是图形在 94×94 原画布中的边界（(0.3999, 0.2002) 起，边长 93.6）。

`widgetBackground()` 在 512×512 画布上填充背景色，再按 `LOGO_RATIO` 和 `LOGO_OFFSET` 把图形边界缩放到对应位置，填充路径：ChatGPT 按主题用黑色或白色，带 `LOGO_OPACITY` 透明度；Claude 两种主题都用 `LOGO_COLOR`，透明度按主题取 `LOGO_OPACITY_LIGHT` 或 `LOGO_OPACITY_DARK`。动态颜色的 `red` 分量用于解析当前主题；`DrawContext` 接收确定颜色。背景位图在运行时生成，主题切换后的原生刷新效果仍需实机核对。

ChatGPT 已验证范围：语法检查；通过电脑请求适配的真实用量 200、设备码申请、待授权查询；通过模拟验证前台调用顺序、网络失败保留缓存和保留前缀限制；158／170 点浏览器布局；用户确认的 iPhone 前台用量更新。代理地址：在电脑上加载组件源码，分别在代理常量留空、按线上 api-proxy 节点填写、按本机自定义路径前缀的转发器填写时，用 Codex 现有访问令牌只读请求用量 200 并正确解析，设备码申请 200、未授权查询 403，无效续期令牌 401 判定为登录过期，表单编码的授权码换取请求三种方式返回一致；留空时请求全部发往官方地址，填写后全部发往所填地址的路径之下，末尾带斜杠的地址同样正确。

Claude 已验证范围：语法检查；SHA-256 与 base64url 和 Node `crypto` 的比对；授权地址能打开 Claude 登录页；用电脑上 Claude Code 现有的访问令牌只读请求真实用量与资料接口（200，解析与渲染正确，未触发续期）；无效授权码（400，删除本次登录记录）与无效续期令牌（400 `invalid_grant`）的错误分类；模拟的登录对话分支；158／170 点浏览器布局。代理地址：以上接口请求在 `PROXY_ANTHROPIC_URL` 留空、按线上 api-proxy 节点填写、按本机自定义路径前缀的转发器填写时结果相同，留空时请求全部发往官方地址，填写后全部发往所填地址的路径之下。

验证 Claude 接口时不要用电脑上 Claude Code 的续期令牌做续期：续期会轮换令牌，可能让电脑上的 Claude Code 退出登录。真实授权码登录与续期应在 iPhone 上通过脚本自己的登录完成。

仍需实机分别验证：Claude 的授权码登录、换取令牌、约 8 小时后的续期和约 30 天后的重新登录；填写代理地址后两个组件在 iPhone 上的请求；两个组件重启后的凭据持久化、自动续期、主题切换、后台刷新时机、双周期的纵向空间和底部行长文字是否正常缩小。只做结构或文档变更时不必重复真实授权请求。修改相关逻辑后再安排对应验证，报告时区分静态、模拟、真实接口和手机结果。

## 参考

- [Scriptable 官方文档](https://docs.scriptable.app/)
- [设备码登录源码](https://github.com/openai/codex/blob/rust-v0.155.0/codex-rs/login/src/device_code_auth.rs)
- [续期实现源码](https://github.com/openai/codex/blob/rust-v0.155.0/codex-rs/login/src/auth/manager.rs)
- [OpenAI 品牌资源](https://openai.com/brand/)
- [Claude Code Legal and compliance](https://code.claude.com/docs/en/legal-and-compliance)
- [Anthropic Consumer Terms](https://www.anthropic.com/legal/consumer-terms)
- [Anthropic 媒体资源包](https://www.anthropic.com/press-kit)与[商标使用规范](https://www.anthropic.com/legal/trademark-guidelines)
