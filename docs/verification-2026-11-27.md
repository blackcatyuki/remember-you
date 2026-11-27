# 2026-11-27 本次验收

## 状态边界

| 类别 | 本次结果 |
| --- | --- |
| GitHub 实际来源 | main `18ac1f0b4a467751d2b2992fa2be0682c95868c4`，原仓库私有；两条 main 提交 |
| 线上网站 | 无登录 GET 首页和 `/api/ai-status` 成功 |
| 线上 AI 初检 | enabled=false, configured=false, limiterReady=false, ready=false |
| 真实 API / 费用 | 新 Key 已由开发者自行保存为运行时 Secret；ready=true。修复 Workers 不支持 redirect:error 后，文字解析返回 HTTP200 / 3条候选，送礼返回 HTTP200 / 3个方向及真实记录ID；账单未核对，完整免费验收仍未通过 |
| 生产 D1 | Cloudflare 设置已显示 DB → 既有数据库；控制台只读查询确认 ai_quota / d1_migrations 表和三列 schema 存在；实际并发测试得到 CONCURRENCY_LIMIT / QUOTA_EXCEEDED 两种 HTTP429，且另一请求 HTTP200；全站每日额度的生产耗尽场景未测试 |
| 新代码 | JSON 导入、冲突处理、独立示例、隐私说明和 AI 不可用原因 |
| 自动化 | 28 项通过：备份 3，实际 SQLite 限流 2，重定向安全1，AI / 免费保护 / Cloudflare 相关22；传输使用模拟响应，非服务商实调 |
| 构建 | Cloudflare Static Assets 生产构建成功；未增加依赖，npm ci 沿用 lock |
| 浏览器（本地） | 示例进入 / 退出、文字演示三候选、确认保存、三方向规则推荐、收藏；退出刷新回到空档案 |
| 浏览器（本地） | 虚构数据 JSON 导出 → 导入预览 → 勾选确认 → 刷新保留；再次导入提示冲突，选择跳过后仍为一份档案 |
| 响应式（本地） | iframe 外层 390 / 768 / 1440px：首页内容宽等于可用宽，无横向溢出；390px 导入弹窗可操作；并非真实手机设备测试 |
| UI 保持 | src/styles.css 和原首页四张 WebP 素材与 main 对应 blob SHA 一致；仅把新工具放入既有导航弹窗 |
| 未重复的历史测试 | 人物头像、CRUD、生日和分类历史测试结果不冒充本次新浏览器验收；本次修改未触及这些实现 |

截图位于 `docs/screenshots/`，只包含虚构示例。新提交 af99a57 已经 Cloudflare 自动构建部署成功（Build 0502552c）。匿名 HTTP 已返回新版 index-C8pwu6vX.js，样式 index-ElIC67hU.css 保持一致；独立云浏览器首次访问为空，线上示例入口可进入虚构人物。后续真实文字及送礼调用已成功（均只用虚构偏好），D1 实际拦截亦已成功；GitHub 公开、服务商账单核对及全站开关实操仍待后续步骤。

## 免费模型复核

直接读取官方 `/api/pub/models`：准确 ID `DeepSeek-V4.1-Flash 小力孩AI`，available=true, is_free=true, 三个输入 / 输出 / 总价字段均为0，free_daily_tokens=5000000，eol_date=null。无已验证的图片输入能力。

当前文档存在不一致：公开模型目录保留「每日共享池、需要激活」字段，而文档文字又描述每周共享池。故不把共享池当作已确认免费可用资源，也不激活或充值。个人基础额度说明为每日500万 tokens、北京时间零点重置；所有 Key 共享账号额度。实际调用和账单仍是必要验收。

应用保留最多24小时的人工 `AI_FREE_REVIEW_UNTIL`、每请求目录检查、唯一模型 Key 范围检查、D1 限流和全站开关。没有自动续期或收费降级。

## 实际修复与请求结果

原 redirect:error 在 Workers 构造 Request 时抛 TypeError，造成502。改为 redirect:manual 后仍拒绝3xx，不跟随重定向，也不向跳转域名转发密钥。首个送礼响应因复述禁忌词被拦截；补充模型输出约束后通过同一校验，未取消禁忌保护。

文字成功：不喜欢香菜 / 喜欢抹茶 / 想买拍立得，分类与类型正确，未写入浏览器档案。
送礼成功：桌面小绿植（r2植物）、双人陶艺体验（r4陶艺愿望）、手写寄语书签（r1阅读），排除已送陶瓷杯，预算均不超过200元，估算非售价。

开发者已明确同意保留历史学校邮箱并公开仓库。尚需完成 GitHub 可见性操作与匿名验证。
