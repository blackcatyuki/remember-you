# 公开前源码检查（2026-11-27）

## 检查范围与结果

- 从 GitHub 读取实际 main 全部文件，并查看 main 的两条提交。首条为上传源码，后续提交只添加 D1 绑定；未用本地旧 README 代替代码检查。
- 对恢复的全部源码 / 文档（不含 node_modules 和构建产物）检查典型 API Key、GitHub Token、私钥、赋值式凭据和邮箱；唯一凭据模式命中为 `server/cloudflare.test.js` 的 `test-secret-placeholder` 测试假值，不是真实凭据。
- main 中无用户备份 JSON、聊天截图、.env、.dev.vars 或凭据文件。`src/data.js` 的人物为旧版虚构样例，未被初始化逻辑使用；新增示例需用户主动进入，存于内存。
- 原 GitHub 根目录缺失 .gitignore（网页上传可能遗漏点文件）。本次新增排除 node_modules、dist、.env*、.dev.vars*、Wrangler 本地状态及日志，只允许无密钥 .env.example。
- 检查默认 Worker 无人物列表 / 保存 API；人物保存在客户端。AI API 只在明确请求时转发必要字段。
- Wrangler 的 D1 UUID 是资源标识，不是认证凭据；没有 Cloudflare API Token / AI Key。
- 原视觉 WebP 的 Git blob SHA 与线上下载一致；本次新增截图为浏览器实拍，仅显示虚构测试人物。
- 原有提交的 Git author 元数据包含开发者学校邮箱（不是 GitHub noreply 邮箱）。公开仓库会公开该元数据；已向开发者报告，开发者明确同意保留邮箱并公开仓库；不改写历史。
- 未发现需撤销的真实凭据；这不消除上述邮箱公开风险。

## 不能由此推出的结论

该检查覆盖 main 两条可见提交与当前文件，不等同于专业渗透测试、服务商内部审计、全部悬空对象 / fork / 缓存排查。Cloudflare 运行时 Secrets、构建日志、账户授权及服务商账单没有账户访问权限，需开发者在后台核实。

若后续发现真密钥泄露，先撤销 / 轮换，再处理完整 Git 历史与缓存；仅删当前文件不够。不要把敏感值粘贴进 issue、聊天、截图或日志。

仓库开发者已授权并完成公开；GitHub 返回 private=false，匿名请求仓库页面 HTTP200。学校邮箱按开发者明确同意保留。
