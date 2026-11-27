# 免费 Pages 部署（原 Worker 保留）

2026-11-27：独立静态测试页已在一位中国大陆、关闭代理的朋友网络中打开。这只证明该网络当时可达，尚不证明完整产品、AI 或所有运营商可用。

同一仓库的 access-probe 分支现包含完整 Pages 适配。React、CSS 和原 Worker 配置不变；Pages Functions 直接调用现有后端，浏览器无需连接 workers.dev。没有新增依赖。

Pages 项目 remember-you-access：生产分支 access-probe；根目录留空（仓库根）；框架 None；构建命令 `node scripts/build-pages.mjs`；输出目录 `dist/client`。根 wrangler.jsonc 继续专用于原 Worker，没有 pages_build_output_dir；Pages 的运行时配置在控制台维护。

生产环境绑定已有 D1 数据库 remember-you-rate-limit，变量名称 DB。不要创建数据库或重复迁移。原 Worker 与 Pages 共享全局日额度；要共享每 IP 额度还须复用同一个 AI_RATE_SALT。

通过控制台 Secret 配置 AI_API_KEY 和 AI_RATE_SALT，绝不添加 VITE_ 密钥或提交密钥。其余 AI_* 运行时设置须与原 Worker 的费用保护一致。默认 AI 关闭；仅在免费模型状态、专用密钥范围和复核期限重新核实后启用。AI_FREE_REVIEW_UNTIL 不得超过未来 24 小时，不自动延长。测试页成功不代表 AI 已接入。

新域名拥有独立本地存储。旧域名人物资料仍保留；需要时先从旧站导出 JSON，再在新站导入。不要清除浏览器资料。

上线验收：页面与静态资源、/api/ai-status、跨站拒绝、真实文字和送礼调用、D1 限流、费用为零、大陆直连完整功能。未逐项通过前不得宣称国内全功能可用。
