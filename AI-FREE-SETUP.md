# 当前部署进度

已按用户选择准备其自有 Cloudflare Workers 方案。旧文中关于 Sites 无安全输入入口的阻塞仅为历史说明；现在将使用 Cloudflare 后台 Secret。实际创建、绑定与配置仍待用户逐步授权。当前部署操作以 [CLOUDFLARE-DEPLOY.md](CLOUDFLARE-DEPLOY.md) 为准。

# 免费 DeepSeek：已核实条件与安全配置

核对时间：2026-11-13（北京时间）。来源：官方文档、公开模型目录 `/api/pub/models`、公告 3 / 16。

## 准确配置

- Base URL：`https://www.ygxnhzy.cn/v1`
- POST 路径：`/chat/completions`，OpenAI 兼容 Bearer 鉴权。
- 免费模型准确 ID：**`DeepSeek-V4.1-Flash 小力孩AI`**，包含空格和中文。
- 不得替换为 `deepseek-v4.1-flash`、`deepseek-v4.1-flash-1017` 或 `auto`。公开目录中前两者有价格，auto 可能路由收费模型。
- 个人每天 500 万 tokens，北京零点重置；免费额度按供应商账号，多个 API Key 不会增加基础份额，网站所有用户消耗开发者同一份额度。
- 目录另列 1000 万共享额度，但公告 16 说明自 11 月 9 日起需购买当日激活卡开启，不是无条件免费。第一次 10 元、第二次 9 元、第三次 8 元，最多三次；本项目不购买、不激活、不自动充值。
- 公告 3 明确限时限量、用完即止、不保证持续供应。没有公布固定的免费截止日期，目录 eol_date=null；不能理解成永久免费。
- 官方文档默认 QPM 60；账号/API Key 可设更小的 QPM/QPD/到期时间/允许模型。实际账户权限、剩余额度需要新密钥后核实。
- 免费型号只明确标注推理与 Function Calling，未明确图像输入/图片理解，结构化 JSON 的实际稳定性也尚待真实调用；本站禁用截图识别，不把付费视觉型号当免费型号。

## 不依赖密钥的代码已完成

- 服务器固定唯一免费模型；无任何付费自动 fallback。
- 每个调用前重新读取公开价格目录，必须 available=true、is_free=true、输入/输出/总标价均严格为 0。目录失败、字段变化、模型下线或临近下线即拒绝调用。
- 鉴权 `/models` 必须只返回这个免费型号，否则提示限制新密钥模型权限，停止调用。
- `AI_FREE_REVIEW_UNTIL` 是开发者安全复核截止时间，必须晚于现在且不超过 24 小时；到时停止。它不是服务商公布的免费有效期。免费条件需每日复核后由管理员更新，不能自动无限续期。
- 免费条件无法确认、余额不足/限流/超时都显示错误，不切换模型、不自动重试计费请求。
- D1 单表：来源每分钟 4、每日 15、全站每日 50，用户和 IP 同时限流；每来源并发 1，全站并发 2；跨 Worker 原子租约、90 秒崩溃过期，正常请求结束释放。
- 公共目录校验与实际调用间存在时间差，客户端无法约束供应商临时更改结算规则。因此必须同时使用供应商侧**仅允许免费型号的专用密钥**，确认其免费到期拒绝策略，不给后台自动付费权限；未确认前保持关闭。不能承诺单靠查价格绝对不会收费。

## 开发者生成新密钥

1. 打开小力孩 AI 官方网站，登录你的开发者账号。
2. 按官方文档入口：**控制台 → API 密钥 → 创建密钥**。
3. “允许的模型”仅勾选上述含中文的免费模型；不要选择全部模型或 auto。设置合理 QPM/QPD 和到期时间。
4. 核对免费剩余额度及到期后拒绝调用规则。不要购买激活卡、加量包或充值来完成本项目验收。
5. 新密钥只显示一次，先保存在自己的密码管理器。**不要发聊天，不要截图密钥，不要提交 GitHub，不要放源码 ZIP。**旧密钥不使用；旧密钥如曾公开应由你在供应商控制台撤销。

## 当前生产环境的阻塞

当前部署是原 ChatGPT Sites 的 Cloudflare Worker，支持 D1 逻辑 DB 绑定，但清单仍是 d1:null，尚未创建数据库。Sites 可配置服务端 secret，但当前连接仅提供由工具提交变量的能力，**没有给出用户可直接输入第三方密钥的安全设置页/受保护输入框**。不能凭空让你去不存在的“设置 → 密钥”页面。

因此现在不要发给我新密钥。需要先明确可用的部署安全入口；如果使用你自己的 Cloudflare 账户，可以在其 Worker 的 Settings → Variables and Secrets 中以 Secret 添加 AI_API_KEY，但这属于更换/增加托管环境，必须单独确认后实施，不能悄悄迁移当前网站。

D1 官方 Free 每天包含 500 万行读、10 万行写、总 5GB，超额拒绝查询；Paid 超量计费，Workers 费用另计。**这些是 Cloudflare 自有账户规则，不能推断当前 Sites 托管账单免费**。Sites 工具未返回当前套餐/资源计费信息。需确认托管资源费用并批准新增 DB 后再绑定/应用已备迁移。暂不创建资源、不购买、不启用模型。

## 启用变量

见 `.env.example`；服务器必须有：

- AI_ENABLED=true
- AI_API_KEY（secret，新密钥）
- AI_BASE_URL=https://www.ygxnhzy.cn/v1
- AI_TEXT_MODEL=DeepSeek-V4.1-Flash 小力孩AI
- AI_FREE_ONLY=true
- AI_FREE_KEY_RESTRICTED=true（真实核对账号密钥权限后才能设置）
- AI_FREE_REVIEW_UNTIL（复核后填写明确 ISO 时间，最多 24h）
- AI_RATE_SALT（secret，随机长字符串）
- DB（D1 绑定对象，不是字符串）

可调 AI_PER_MINUTE=4、AI_PER_PERSON_DAY=15、AI_DAILY_LIMIT=50、AI_GLOBAL_CONCURRENCY=2、AI_TIMEOUT_MS=30000。截图固定不可用，即使误开环境标志也不允许该免费模型接图。

## 配置后的真实验收（尚未执行）

首先关闭 AI 验证 D1 原子计数/租约与生产数据库迁移，再经安全入口配置新密钥及专用允许范围。开启后先验证鉴权模型列表，再用不含私人信息的测试文字拆分三候选，确认前不保存；用自建测试人物生成三份礼物并核对引用、禁忌和收藏。核对供应商账单为 0，测试免费条件变化和频率限制。全部成功后才能写“真实 API 调用成功”。

公开目录核实成功不是实际模型调用成功。SQLite SQL 自动化通过也不是生产 D1 验收通过。

官方来源：
- https://www.ygxnhzy.cn/docs
- https://ygxnhzy.cn/api/pub/models
- https://www.ygxnhzy.cn/announcements/3
- https://www.ygxnhzy.cn/announcements/16
- https://developers.cloudflare.com/d1/platform/pricing/
