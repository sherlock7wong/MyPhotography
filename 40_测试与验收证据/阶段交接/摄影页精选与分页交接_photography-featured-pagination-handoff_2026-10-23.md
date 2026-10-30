# 摄影页精选与分页交接

事项日期：2026-10-23（Asia/Shanghai）
入口：http://127.0.0.1:5173/photography/index.html
范围：本机摄影总览、同一摄影页内的分类／风格筛选、关联后台字段和现有操作说明。

## 已完成

- 原固定 MAY 2025 改为日期与时分秒，基于访客设备时间按 Asia/Shanghai 显示；每秒更新，重新显示页面时校准。所有摄影模式统一生效，旧 CMS 手填日期不覆盖时钟；历史数据值仍保留。
- 总览右上角改为 Split Showcase 四个竖向多边形切片变形，沿用网站纸色和取景框。照片与同页 FEATURED 横条使用同一公开总览作品名单，保留排序、发布及分类可见性处理，不混入分类专属作品。
- 当前真实总览 11 件，其中 FEATURED 9 件；轮播支持全部条目循环、点击下一张、暂停、悬停／聚焦／后台暂停、减少动态的完整静态画面、空／单张及坏图恢复。没有新增第三方依赖。
- 网格按实际列数与 wide/tall 占用量分配三行容量；人像／个人分类按原标准卡片布局计算。所有 Filter、分类入口、分类内风格筛选共用分页；不足一页或空数据时按钮正确禁用。
- 列表桌面每页 6 张，680px 及以下每页 4 张。排序和筛选回到第一页；详情前后浏览和 FEATURED 缩略图选片会定位到对应页。
- 保留 CMS 默认选中照片，切换视图与跨断点重排后可继续键盘浏览；聚焦未选中卡片、FEATURED 缩略图及页码时也恢复焦点。
- 手机 Filter 自动换行并保留点击尺寸，避免原有文字挤压。轮播标题最多两行，说明区最小高度固定，切片换图不带动首屏跳动。
- 删除已失效的摄影手填日期与总览印章编辑入口；图库模块显隐同时控制分页。旧日期和印章数据未迁移／删除。现有 Markdown、HTML 操作说明和入口索引已同步。

## 文件

- 20_源码与运行工程/photography/index.html
- 20_源码与运行工程/photography/script.js
- 20_源码与运行工程/photography/styles.css
- 20_源码与运行工程/shared/cms-pages.js（仅摄影页定义）
- 20_源码与运行工程/admin/script.js（仅移除分类手填日期字段）
- 30_可直接使用成品/个人摄影网站操作说明_photography-site-user-guide_2026-10-19.md
- 30_可直接使用成品/个人摄影网站操作说明_photography-site-user-guide_2026-10-19.html
- 00_入口与导航/README.md

## 实际验证

使用现有 Playwright CLI 的真实 Chromium 浏览器，不使用模拟结果代替真实页面回归。共 19 组定向检查：

| 检查 | 实际结果 |
| --- | --- |
| 真实页面 6 组 | 11 张总览网格 10+1、列表 6+5；六个 Filter 的网格／列表全量翻页无丢失和重复；四个分类及全部风格筛选范围不串；跨页详情／键盘／FEATURED 联动；9 张精选自动切换、完整循环、暂停、四片图坐标一致；按秒时钟；七档布局 |
| 隔离边界 8 组 | 0／1 张图、非空图库但 0 精选、91 张混合尺寸、后页 CMS 默认照片、分类默认照片、坏图后恢复、美国浏览器时区下北京时间跨午夜、CMS 显隐与旧日期免覆盖 |
| 手机筛选及完整动效 3 组 | 980／768／680／390／320px 按钮无重叠且文字不被挤压；手机全部 Filter 与截图；完整 View Transition 下列表翻页及选中／精选高亮一致 |
| 重排焦点 2 组 | 聚焦未选中卡片后跨桌面／手机断点，焦点、选中及方向键连续；FEATURED 聚焦项重排后保留 |
| 静态检查 | 摄影、CMS schema、后台 3 个 JavaScript 文件 node --check；git diff --check；说明对应段落、导航及证据链接检查 |
| 本机状态 | 开始与结束 /api/cms-status 均为 storage: local-server，version: 7；本任务未写业务数据 |

- 七档主布局宽度：1395、1280、1024、980、768、680、390px；补充 320px 手机边界。
- 真实页面浏览器 pageErrors 和 failedRequests 均为空。隔离坏图用例主动构造 404，只用于验证错误恢复，不属于真实照片失效。
- 隔离用例在独立 BrowserContext 内拦截公开数据响应，使用明确的 fixture 标题和 ID；没有修改真实网站 JSON、媒体、账号或生产数据。
- 独立只读审查提出并关闭默认照片被分页覆盖、精选高亮不同步、重排焦点丢失；最终补充未选中卡片及精选焦点复验通过。
- 焦点定向测试首次在 resize 事件处理前过早断言选中项，原失败日志保留。改为等待实际动画帧完成并同时核验焦点和选中状态后，真实复验通过；未通过删除断言掩盖错误。

证据目录：[摄影图库分页与精选](../摄影图库分页与精选_photography-pagination-featured_2026-10-23/)。
脚本目录：99_临时文件、缓存和构建中间产物/摄影图库分页与精选_photography-pagination-featured_2026-10-23/。

主要截图：
- [桌面首屏](../摄影图库分页与精选_photography-pagination-featured_2026-10-23/桌面首屏_desktop-hero.png)
- [桌面网格分页](../摄影图库分页与精选_photography-pagination-featured_2026-10-23/桌面网格分页_desktop-grid-pagination.png)
- [桌面列表分页](../摄影图库分页与精选_photography-pagination-featured_2026-10-23/桌面列表分页_desktop-list-pagination.png)
- [手机网格分页](../摄影图库分页与精选_photography-pagination-featured_2026-10-23/手机网格分页_mobile-grid-pagination.png)
- [手机列表分页](../摄影图库分页与精选_photography-pagination-featured_2026-10-23/手机列表分页_mobile-list-pagination.png)

参考：[CodeMyUI Gist](https://gist.github.com/CodeMyUI/e6b84396107d42f8e2ee453f5f236b71)，[原作者 Split Showcase](https://codepen.io/ARS/pen/JogjRq)。使用站内已有原生分片实现进行摄影数据适配；不加载参考站图片或 jQuery。

## 版本与恢复

本次按项目保存脚本创建本地提交 bd807be，附注标签 local/2026-10-23.003；八个文件仅包含本次摄影差异。本标签是文件快照，不代表上线或生产验收。

执行中检测到另一个“Home页面二次处理”会话同时修改首页、共用后台及说明的首页段落。该会话已独立保存 33fddb2／9ed448c，本次只保存其后剩余的摄影差异，保留对方修改；不操作首页源码，也不重置暂存区。

需要撤回时，先检查当前 git status，使用 git revert bd807be；不要 reset --hard，不要恢复整份旧共用后台／说明覆盖后续工作。源码恢复不涉及业务数据；本任务没有数据库迁移。
本次未改嵌套 site-deployment 工程，不创建它的空版本。没有 push 或公开部署；没有把浏览器触屏模拟当作实体手机验收。
