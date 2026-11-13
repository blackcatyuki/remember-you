# 记得你：Cloudflare Workers 上线交接

本次在已满意的蕾丝首页版本上追加部署目标，没有改 UI 或人物/分类/收藏/AI 业务流程。最新源码从原站点版本恢复，旧网址仍保留，尚未向任何 Cloudflare 账户部署。

## 已准备

- 原 React + Vite，新增 `npm run build:cloudflare`，输出 `dist/client`。
- 原 `server/worker.js` AI 路由与 D1 限流继续复用；`server/cloudflare.js` 只做独立 Worker 路由和不可信 Sites 身份头移除。
- 网页由 Static Assets 提供；`/api` 和 `/api/*` 优先进入同域 Worker，不会被 SPA 首页吞掉。公共网站不依赖 ChatGPT 登录。
- `wrangler.jsonc` 已通过 Wrangler 4.161.0 的实际 dry-run 配置/打包检查。Wrangler 以固定版本工具运行，没有加入应用依赖或修改 package-lock。
- 没有创建 D1、没有填虚构数据库 ID、没有 Secret、没有修改账户套餐、没有付费调用。AI 缺少开关/密钥/DB 时默认拒绝。

## 等待用户逐步完成

实际指导每次只执行一步；以下是维护说明，不要求新手一次照做。

1. 登录自己的 Cloudflare 账户，确认 Workers Free 计划。
2. 选择/创建专用 D1：`remember-you-rate-limit`。新增资源需要用户批准，不自动选择付费计划。
3. 将实际 UUID 写入本地 `wrangler.jsonc` 的 DB 绑定（`scripts/configure-d1.mjs` 只写配置，不创建远程资源）。数据库 UUID 不是 API Key。
4. 将源码放到用户指定 GitHub 私有仓库，授权 Cloudflare 仅访问这个仓库，连接 Workers Builds；不把现有 ChatGPT Sites 内部 Git 当作用户 GitHub 仓库。
5. 设置 Node.js 24、构建命令 `npm run build:cloudflare`、部署命令 `npm run deploy:cloudflare`、根目录为仓库根、生产分支 main。首次授权 Cloudflare GitHub App / 部署令牌需要用户确认；不自动授权其他仓库。
6. 部署命令先应用原有 `drizzle/0000_ai_quota.sql`，再发布。Wrangler 的迁移元数据会记录已执行文件，不复制或新增第二份业务建表 SQL。该 SQL 的 CREATE IF NOT EXISTS 不清空计数。D1 中出现 Wrangler 的 `d1_migrations` 属内部迁移记录，不是保存用户资料的第二张业务表。
7. 在 Worker → Settings → Variables and Secrets 配置运行时值；不要填进 Builds 的构建变量。Secret 类型填写 `AI_API_KEY` 和 `AI_RATE_SALT`，由用户自己在后台输入，不发送聊天。其余变量见 `.env.example` 与 AI-FREE-SETUP.md。旧密钥不使用。
8. 初始 AI_ENABLED=false，先完成公开网页及 D1 验收；配置并验证免费条件后再开启，真实文字和送礼调用成功且账单为零，才能标为 AI 上线。
9. 最后用未登录 ChatGPT 的独立环境验收公开 workers.dev URL，并记录实际网址；不要根据 Worker 名字猜网址。

Wrangler 的 `keep_vars:true` 且配置不声明 AI_ENABLED，避免 Git 更新覆盖后台的紧急关闭开关。默认缺少变量等于关闭。Secrets 不在源码中。不要在命令行参数粘贴密钥，不要放 GitHub/ZIP/浏览器存储。

## D1 与费用保护

仅 `ai_quota(key,used,expires_at)` 存哈希化来源计数与短期并发租约。普通 Worker 不信任用户传入的 oai 身份头，只依赖 Cloudflare 覆写的 CF-Connecting-IP。没有应用账号系统，所以是每 IP 限制，不承诺按真实人识别；共享网络可能互相影响。

原默认：每分钟 4、每 IP 每日 15、全站每日 50 次；每来源并发 1、全站并发 2，异常退出租约 90 秒过期。按北京时间每日重置；失败调用可能仍占次数。D1 不可用时不调用模型。分布式攻击仍可能耗尽全站名额，需根据实际公开流量决定是否增加验证码；本轮不擅自新增服务。

2026-11-13 官方规则：
- Workers Free：动态 Worker 每日 10 万请求、每次 10ms CPU；等待外部网络不等于持续消耗 CPU，但实际执行仍需生产测试。静态 Assets 不按动态请求计费；具体最新限制以官方页和账户为准。
- D1 Free：每天 500 万行读、10 万行写、总 5GB；超免费额度拒绝查询，不自动升级。Paid 可能另收读写/存储费。
- Workers Builds 的免费构建分钟额度和并发亦有限，超出时不要开启付费扩容；等账户页确认后再记录实际剩余额度。
- 不购买域名，不开 R2/KV/付费 Workers；用账户提供的 workers.dev 域名。若账户已有付费方案，不能保证新增资源仍按 Free 规则，需先核对。

## 免费 DeepSeek 当前核实结果

公开目录于 2026-11-13 再次显示准确 ID `DeepSeek-V4.1-Flash 小力孩AI`：available=true、is_free=true、输入/输出标价均为0、个人日额500万 tokens、共享1000万需激活、eol_date=null。

Base URL `https://www.ygxnhzy.cn/v1`，POST `/chat/completions`。个人额度同一供应商账号下的全部 Key/全部网站用户共享。官方限时限量，未公布固定免费截止日。共享额度按最新公告需购买激活卡（首张10元），本项目不买、不充值、不自动切付费型号或 auto。

官方兼容文档支持 JSON 输出；此免费型号能力栏只明确“深度思考、Function Calling”，没有明确结构化 JSON 或视觉能力的逐模型承诺。请求将要求 JSON 并经服务器字段校验；是否实际稳定支持必须用新密钥测试。目前**未完成真实模型调用**。截图保持禁用，不尝试收费视觉型号。

保留原安全策略：每次调用前检查公开零价/可用状态，检查专用 Key 的允许模型范围，管理员设置最长24小时的 `AI_FREE_REVIEW_UNTIL`；复核时间到或不能确认免费状态则停止。复核需要维护，不会无期限自动续期。这是本站风险控制期限，不是服务商公布的免费结束时间。

## 日常维护

- 更新：向已连接 GitHub 仓库 main 推送，Cloudflare Builds 构建并部署同一 Worker。不得提交真实 .env/.dev.vars 或密钥。
- API 用量：小力孩控制台账单/用量按专用 API Key 筛选；Cloudflare Worker Metrics 查动态请求/错误；D1 Metrics 查读写。本站日额只能限制次数，不能代替供应商账单。
- 紧急关闭：Worker → Settings → Variables and Secrets → AI_ENABLED 改为 false → Deploy。关闭只阻止后续请求，不能撤销供应商已开始的请求；必要时在小力孩撤销专用 Key。
- 免费结束：保持关闭，显示明确错误，继续允许手动记录；不自动切收费。只有用户另行批准后才讨论替代模型。

## 数据与域名

静态网页不包含开发者私人人物数据，首次访问为空。当前资料仍在同一浏览器、同一域名 localStorage，不在 D1；公开部署不会把本地资料广播给其他人。同一浏览器配置文件共用的网站资料不能按不同登录账号隔离。

新 workers.dev 域名不会自动读取原 ChatGPT Sites 域名的数据。原网址与原资料不删除；正式切换前先导出旧站备份。当前没有导入恢复界面，不能声称已完成旧资料跨域迁移。不要清空浏览器排查。

## 验证状态

- 本轮新增自动化5项通过：API/SPA 路由、去除伪造身份、关闭及错误安全、原迁移幂等、不含密钥的发布配置。
- Vite Cloudflare 构建通过，客户端 JS/CSS 文件哈希与已验收首页版本相同。
- 固定 Wrangler dry-run 通过，Worker约31.45KiB（压缩10.06KiB）、静态资源13个；未创建资源/发布。
- 历史 UI/业务测试不重复宣称本轮重跑。生产 D1、真实API、公开匿名访问与最终浏览器复核均待账号授权及新密钥配置后执行。

官方文档：
- https://developers.cloudflare.com/workers/static-assets/binding/
- https://developers.cloudflare.com/workers/static-assets/routing/worker-script/
- https://developers.cloudflare.com/workers/ci-cd/builds/configuration/
- https://developers.cloudflare.com/workers/configuration/secrets/
- https://developers.cloudflare.com/workers/platform/pricing/
- https://developers.cloudflare.com/d1/platform/pricing/
- https://www.ygxnhzy.cn/docs
- https://ygxnhzy.cn/api/pub/models
- https://www.ygxnhzy.cn/announcements/16
