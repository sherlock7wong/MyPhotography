# 网站说明核验与改进评估

事项日期：2026-10-19（Asia/Shanghai）。范围：为 `F:\个人主页` 编写操作说明、核对技术栈并提出改进建议；不包含代码修复、部署或生产数据变更。

## 已完成与交付

- [操作说明 Markdown](../../30_可直接使用成品/个人摄影网站操作说明_photography-site-user-guide_2026-10-19.md)：启动、前台浏览、统一后台八个模块、保存／重置、备份、排障、技术栈与改进顺序。
- [操作说明 HTML 阅读版](../../30_可直接使用成品/个人摄影网站操作说明_photography-site-user-guide_2026-10-19.html)：同一内容，供双击打开和浏览器打印；不是新的业务站点。
- 更新现有导航 README；原网站、后端业务代码与线上数据未修改。

## 当前工程与 Git 边界

根 `git status --short` 返回 `fatal: not a git repository`。改用 `.git-upload` 只读查看，已有 `AGENT.MD`、`start-local.bat` 修改，以及归档目录和 README 等未跟踪内容；未重置、提交或清理。独立 `20_源码与运行工程/site-deployment` 仓库由子 Agent 在审查前后检查均干净。

原页面的 `shared/cms-data.js` 是 localStorage 模拟数据层。部署配置静态目录为 `dist/client`，Worker 源码为 `worker/index.js`；`.openai/hosting.json` 声明 D1 `DB`、R2 `BUCKET`，`dist/server/wrangler.json` 声明 `ASSETS` 与 `run_worker_first`。未检查远端账户、Secrets、资源绑定及数据库迁移。

## 实际执行的验证

| 检查 | 实际方法和结果 | 能证明的范围 |
| --- | --- | --- |
| 本地启动 | 根目录 `node start-server.js` 成功，监听 127.0.0.1:5173 | 当前环境可启动静态预览；未双击运行批处理 |
| 桌面页面 | 内置浏览器打开 Home、about、Project、photography、Contact、admin、AdminLogin；前六页 1280×720 横向溢出均 0，可见坏图均 0，旧登录页亦无可见坏图 | 当次主要页面可渲染；admin 仅登录页 |
| 手机宽度 | 390×844 检查 Home、about、Project、photography、Contact、admin；溢出均 0，可见坏图均 0；查看后台登录页截图后恢复默认视口 | 定向布局检查；非真机和完整后台验收 |
| 分类交互 | Photography 点击 Portrait，标题变为 Portrait Photography，URL 保持原路径 | 人像模式能切换，分享地址未同步改变 |
| 本地共享数据 | Node VM 加载实际 `shared/cms-data.js`，localStorage 用内存 Map；资料保存读取、留言未读数 +1、Draft 项目与 Hidden 图片过滤、空数组保留断言通过 | 数据层逻辑，未走完整后台 UI，未改用户数据 |
| 分类边界 | VM 将所有分类设为 Hidden，公开分类 0，公开照片仍为 6；`slugify('人像摄影')` 返回 `item` | 分类隐藏不级联照片，中文名称转换存在限制 |
| 默认数量 | 共享默认状态实际为照片 6、项目 4、分类 4、留言 1；分类显示数为 128／156／214／92 | 内置展示数与实际条目数不一致，不代表用户当前浏览器条目数 |
| 后端定向测试 | 子 Agent 执行 `node --test tests/worker.test.mjs`，2/2 通过；用 esbuild `write:false` 内存构建比对现有 `dist/server/index.js` 一致 | DB／BUCKET／ASSETS 均 fake，不证明真实云端可用 |
| 后端额外复现 | 子 Agent 用合成数据与 fake 绑定：公开响应含 Draft 项目、Hidden 照片、隐藏联系条目；留言不公开；管理员旧版本在新留言后保存返回 409；3 个非图片字节声明 image/png 上传返回 201 | 可复现的实现问题；无真实数据或外部写入 |
| 说明交付检查 | HTML 10 个章节、10 张表、10 个目录链接；锚点目标齐全，实际跳转 `#section-9` 后章节顶端 28px；桌面与 390px 阅读时文档横向溢出 0，宽表格使用各自滚动容器 | 已在浏览器检查阅读版；不是业务网站新功能 |
| 内容与链接一致性 | Markdown 与 HTML 285 个文字片段全部匹配（忽略排版空白）；本次五份 Markdown 的 12 个本地文件链接均存在 | 文档正文一致、相关导航可定位；外部链接内容另按正文来源核对 |

浏览器检查是文档核对中的定向观察，不能推导出全页面、所有交互、无障碍、性能、跨设备或生产验收全部通过。为保护现有内容，本次没有使用统一后台改写真实浏览器数据，也没有执行恢复。

说明初稿已由未参与文档编写的后端审查 Agent 独立复核。最终明确区分了本地旧登录页与部署 Worker 重定向，并补充选择图片即上传的副作用提醒；本次没有重跑输入未变的后端测试。

Playwright CLI 曾遇到默认 npm 缓存和 daemon 目录写权限问题；缓存改置项目临时目录后 CLI 帮助可运行，但浏览器 daemon 启动没有返回，随后中断该 CLI 调用，改用内置浏览器完成页面检查。没有把 CLI 启动尝试记为成功。缓存与临时核验目录位于 `99_临时文件、缓存和构建中间产物`，未改工程依赖。

## 关键发现与源码位置

以下路径除注明外均相对 `20_源码与运行工程`；行号为本次阅读时的一次性定位。

| 主题 | 证据位置 | 判断 |
| --- | --- | --- |
| 本地模拟边界 | `shared/cms-data.js:617–674`；`admin/script.js:584–645`；`Contact/script.js:255–274` | 保存／发布／留言是浏览器内写入；mock 登录不是真认证 |
| 本地错误登录入口 | `shared/effects.js:646–647`；`AdminLogin/script.js` 的 submit 逻辑；统一入口 `admin/index.html`；`site-deployment/worker/index.js:281–282` | 根目录本地角落入口指向未接通的旧表单；部署 Worker 已用 308 重定向至 `/admin/`，远端效果未验收 |
| 全状态保存与 Reset | `admin/script.js:626–645`；`site-deployment/dist/client/admin/script.js:563–601` | Save 保存整份状态；Reset 恢复内置默认，部署版未 await 就提示成功 |
| 草稿／隐藏公开 | `site-deployment/worker/index.js:222–226`；发布共享层 `:550–581` | 服务端公开输出原数组，前端才过滤，已用合成数据复现 |
| 留言与编辑冲突 | `site-deployment/worker/index.js:100–124、169–193` | 内容与留言共用状态与版本，409 已复现；整体状态上限 1,000,000 bytes |
| 表单防滥用 | `site-deployment/worker/index.js:80–85、169–193、257–260` | 有同源检查但无该接口应用层限流，不能靠 Origin 阻止直接 HTTP 客户端 |
| 图片校验与公开缓存 | `site-deployment/worker/index.js:195–218` | 限 MIME 和 8,000,000 bytes，未校验真实图像；公开媒体缓存一年；伪图上传已复现 |
| 上传时机 | `site-deployment/dist/client/admin/script.js:2130–2143` | 选择图片即上传；尚未保存内容或取消编辑，不代表没有远端图片副作用，也无自动清理实现 |
| 空数据兜底 | `Project/script.js:27–31`；`photography/script.js:884–889`；`Contact/script.js:52` 起的卡片渲染条件 | 空数组时可能保留静态示例内容；本次为代码确认，未通过真实浏览器隐藏全量作品复现 |
| 分类与数量 | `shared/cms-data.js:508–518、564–582`；`photography/script.js:896`；`Home/script.js:87` 附近 | 关联依赖名称转标识、数量优先手填、分类隐藏不联动图片 |
| 项目内容闭环 | `Project/script.js:67` 附近的 `href="#..."`；`Home/script.js` 分类链接 | 项目链接是本页锚点，首页分类都进图库总页 |
| 设置消费 | `admin/script.js:1312–1331`；`shared/cms-data.js:696–758`；五个前台脚本对配置字段的引用 | 未发现 Canonical 输出、完整组件显隐／维护开关消费；不把所有设置一概宣称已生效 |
| 假定统计 | `admin/script.js:112–117` 与共享默认分类 | Online／备份／容量含演示值，不能作为监控或恢复证据 |
| 构建与副本 | `site-deployment/package.json:5–12`；`site-deployment/scripts/original-sync.mjs:51–74` | build 只打包 Worker；sync 脚本记录／核对快照，不自动复制资源 |
| 数据结构 | `site-deployment/db/schema.ts:1–19` | 三张表；无独立作品／留言／媒体表及已验证版本历史 |

建议优先解决公开数据过滤与留言独立存储，再验证真实云端链路；之后处理入口、空状态、配置接通、可重复发布与备份。项目故事、可分享路由、统一语言和图片派生流程是产品建议，不是已经测得的全部故障。无线上访问性能和真实受攻击结论。

## 恢复与后续

导航原件已先备份到 `90_历史版本与恢复备份/操作说明导航恢复点_guide-navigation-backup_2026-10-19/`，其中 `导航恢复清单_navigation-recovery-manifest_2026-10-19.json` 记录原路径、备份路径、时间和 SHA-256。需要恢复导航时，仅核对并还原对应三个 README；不要覆盖其他项目改动。

本次新增说明与核验文件可以独立保留，不承担网站运行依赖。后续修改网站应从当前代码与真实部署状态继续核验；不能仅根据本报告宣布修复、部署或业务验收完成。
