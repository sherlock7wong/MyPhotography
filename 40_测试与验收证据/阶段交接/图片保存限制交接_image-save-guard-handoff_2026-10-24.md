# 前台图片保存限制交接

事项日期：2026-10-24（Asia/Shanghai）。在现有工程继续实施，未更改图片内容或网站数据，未推送或上线。

## 已实施

- 新增 shared/image-protection.js/css，仅接入 Home、about、Project 列表及 detail、photography、CityHuman、Contact 共七个前台入口。后台不加载，脚本另有后台与重复初始化守卫。构建清单同步新增两项共享资产，并检查公共模板引用。
- 图片及原片对比画面右键默认菜单取消；图片原生拖拽取消并为新增图片设 draggable=false；点击或中键打开图片资源链接受限。链接以 URL pathname 判断，不把页面查询参数中的 .jpg 等误判为图片；PDF／正常页面链接保留。
- Ctrl／Command＋S 保存网页快捷键取消；选中图片复制时剔除图片，只保留选中文字。普通文字、微信号、输入框复制保持；未拦截 touchstart、pointerdown、普通照片点击或所有右键。
- MutationObserver 覆盖 CMS 重绘、轮播克隆、动态大图和转场图片；CSS仅限制图片选择／拖拽与长按呼出菜单，不叠加遮挡层或隐藏图片。首页图片上方 range 控件依然能拖动，但其图片区域右键被取消。
- 前台原本没有“下载原图”按钮或实际图片下载链接，未删除素材或其他下载功能。Contact 二维码继续展示、微信号文本复制保留；后台 JSON 备份与上传保留。现有 HTML／Markdown 操作说明和导航同步。

## 实际验证

独立测试 Agent 新增 shared/测试_tests/图片保存限制_image-protection.cjs。11 个唯一检查最新全部通过，未改产品或真实5173数据，未拦截API。

- 7路由×1440/390布局，无横向溢出、404或pageErrors；静态／动态图片、轮播克隆及两种大图受到限制。
- 原生鼠标右键、图片资源链接点击／中键、正常页面带 file=test.jpg 参数导航、普通及混合图文原生复制、首页range右键和真实鼠标拖动、Contact微信号复制、后台真实图片上传201与JSON下载已验证。
- 事件级检查用于图片dragstart和保存快捷键；PDF为合成事件默认行为检查，不是实际PDF文件下载；Project触摸为PointerEvent模拟，不是真机。CSS长按规则已交付，Safari／iOS系统保存菜单未验证。
- 首次networkidle等待导致断言前超时，已保留失败后换CMS ready与前台两次rAF；随后9项通过、2项测试预期（选区空白字符、分类同页切换不改URL）修正并定向通过，产品无须为此修改。原失败证据保留。只复制先构造的公开测试文字，再读取该次结果，未读取或记录原系统剪贴板。
- 产品模块SHA256：9F3E6388DA5337BE5DFEE3E88CB983B32C20D1D7A5CD6E2A14505D983D29E3DB；CSS SHA256：54E9BF20E64A62CE59C68E49F982BEBF495C2D8CB1CC23C096A95DD4128D5EAF。
- npm.cmd run build 通过：81文件、10写入、71不变；Worker默认数据和SEO模块未变。构建输入隔离原有 photography/styles.css、shared/effects.css/js 草稿。
- 真实构建 Worker＋内存SQLite＋独立Chromium上下文12组联调通过，errors=[]，未拦截API，未请求生产；额外检查七入口和根首页保护脚本及样式加载、动态图片右键，以及后台未加载。

## 保护边界

网页显示图片就需要发送展示图到浏览器。上述限制只能减少直接保存入口，无法完全防止截图、浏览器菜单保存、关闭脚本或通过网络请求取图；不属于图片内容加密或访问权限隔离。所有原图和素材保持原样，没有对当前网站数据做迁移。Safari／iOS原生长按、真实手机未验收；不可将触控模拟描述为真机保护。

## 证据与源码

- 40_测试与验收证据/图片保存限制_image-protection_2026-10-24/图片保护验证汇总_image-protection-summary.json（11项汇总、各次失败与定向通过来源）。
- 40_测试与验收证据/图片保存限制_image-save-guard_2026-10-24/部署准备包_prepared-package/部署包联调_prepared-worker-results.json（12组真实接口）。
- 20_源码与运行工程/shared/image-protection.js、image-protection.css；7个模板；shared/测试_tests/图片保存限制_image-protection.cjs；admin/测试_tests/部署包真实接口联调_prepared-worker-browser.cjs。
- 独立部署工程：scripts/build-client.mjs 与 dist/client 的模板、共享模块和构建清单。
- 99_临时文件、缓存和构建中间产物/图片保存限制_image-save-guard_2026-10-24 保存修改前源码、真实数据哈希、原有草稿指纹与隔离构建输入，不包含真实媒体复制。

## 版本与恢复

本轮根版本：7c83e737085bb29decab17781164d89cf61339eb（local/2026-10-24.005）；独立部署工程版本：9d1dd53107559601550d4b6637aa7771fae54f20（local/2026-10-24.003）。修改前根版本为69761b3，部署工程为a0df87e。标签仅代表本地文件快照，不代表发布或生产验收。恢复按这次文件差异逐项比较，保留其余未提交动效／边框资料，不使用reset --hard。真实数据最终完整性检查：本机共享保存 version 44，内容SHA256与修改前一致；五项既有草稿指纹均保留，模块与已验收SHA及准备包一致，两个暂存区为空，独立部署仓库干净。

本轮可实施的限制与回归已完成；完全阻止浏览器外部取图不具备前端实现条件，不将其列为已实现。
