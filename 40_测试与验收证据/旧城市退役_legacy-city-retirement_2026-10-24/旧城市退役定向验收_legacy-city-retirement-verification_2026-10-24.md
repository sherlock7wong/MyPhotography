# 旧城市专题退役：源码定向验收

已完成限定实现，可交由主线整合构建。此记录只代表下列隔离测试与源码检查，不代表部署验收。

- `/CityHuman`、`/CityHuman/`、`/CityHuman/index.html` 的 GET/HEAD 在本地服务和 Worker 返回 302、no-store，目标为 `/photography/index.html?category=city-humanity`；裸静态页面保留 meta refresh、location.replace 和可点击链接。
- 旧渲染 JS/CSS 已改为兼容壳，旧页面不再加载 CMS/统计；CityHuman/assets 原素材仍保留。
- 浏览器适配、本地 publicProjection、Worker publicProjection 不再公开 cityContent、pageContent.city、pageSeo.city、componentVisibility.city 或旧 city 别名；当前 gallery/categories 的 city-humanity 不受该剥离影响。
- 默认静态 seed 与 Worker default 只保留空 cityContent 兼容壳；39 条初始化 gallery 内容与修改前逐项相同。真实持久化旧 cityContent 仍有 9 张照片，管理端状态载入/保存兼容保留。
- 统计活动页改为 home/about/projects/photography/contact。新 city 事件拒绝为 400，旧记录仍合法读取且不计活动页汇总；原记录和统计容量占用保留。未修改数据库 schema 或迁移。
- 构建活动页名单为 5 页，另验旧兼容入口；取消后台旧 city 编辑器硬依赖，检查默认种子不重新引入旧城市字段。生成器仅改逻辑，未执行全站 seed 重建。

通过：本地内容/跳转 4、本地统计 4、Worker 内存 SQLite/跳转 8、Worker 源码公开投影 1、SEO 10，共 27 项独立 Node tests。另有 19 个 JS/CJS/ESM 语法检查、21 份备份哈希、CMS 适配、静态 JS 跳转和真实文件不变量检查通过。

真实 wong-cms.json 与 wong-analytics.json 的 SHA256 与本子项开始时一致；11 个旧照片/详情/封面引用文件仍存在。未写真实 DB、媒体或原照片。

失败证据保留：首次不变量脚本的正则误将跳转目标 city-humanity 文字判为旧页面标记；修正的是验证脚本，源码未因该项失败改变。r2/r3 均通过。

21 个源文件的完整路径、备份路径、改前/当前 SHA256 见同目录 JSON 清单；原始逐文件备份及完整持久化旧城市子集位于：
F:\个人主页\90_历史版本与恢复备份\旧城市退役_legacy-city-retirement_2026-10-24\源码快照_source-snapshot_2026-10-24_201353

来源与恢复备份没有加密；原公开素材没有变为私有。恢复时先协调主线并依据清单逐文件恢复，不应覆盖其他会话已合并的改动。

未执行：完整 build、内容生成器运行、真实服务重启、真实浏览器整合、部署、push、Git add/commit/tag。主线负责当前视觉、后台/摄影改动合并后的 build 与版本保存。

本子项开始前嵌套仓库已有 4 个 dist M（photography/styles.css、shared/effects.css、effects.js、网站构建清单），diff raw/stat 为空，来源未证实。本子项未写这些生成文件。

可复用验证脚本位于 99 同主题目录，均已核对为完整非空文件。

修改文件：
- 20_源码与运行工程\CityHuman\index.html
- 20_源码与运行工程\CityHuman\script.js
- 20_源码与运行工程\CityHuman\styles.css
- 20_源码与运行工程\shared\city-content.js
- 20_源码与运行工程\shared\site-content.js
- 20_源码与运行工程\shared\cms-data.js
- 20_源码与运行工程\shared\seo-meta.js
- 20_源码与运行工程\site-deployment\worker\seo-meta.js
- 20_源码与运行工程\shared\site-analytics.js
- 20_源码与运行工程\本地服务_local-server\公开投影_public-projection.cjs
- 20_源码与运行工程\本地服务_local-server\访问统计_analytics-store.cjs
- 20_源码与运行工程\本地服务_local-server\内容服务_content-server.cjs
- 20_源码与运行工程\site-deployment\worker\index.js
- 20_源码与运行工程\site-deployment\worker\default-state.js
- 20_源码与运行工程\site-deployment\scripts\build-client.mjs
- 20_源码与运行工程\内容同步_content-sync\生成初始内容_generate-site-content.cjs
- 20_源码与运行工程\本地服务_local-server\本地服务回归_local-server.test.cjs
- 20_源码与运行工程\本地服务_local-server\访问统计回归_analytics.test.cjs
- 20_源码与运行工程\site-deployment\tests\worker.test.mjs
- 20_源码与运行工程\site-deployment\tests\访问统计_worker-analytics.test.mjs
- 20_源码与运行工程\admin\测试_tests\搜索与分享元数据_seo-meta.test.cjs
