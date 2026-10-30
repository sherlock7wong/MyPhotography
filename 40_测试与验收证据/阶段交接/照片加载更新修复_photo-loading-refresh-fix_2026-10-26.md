# 照片加载与前台更新修复

事项日期：2026-10-26（Asia/Shanghai）。状态：前端修订已部署 98ed5d74（含About封面补丁），定向验收与正式站读回完成。存储链路偶发503的上游根因仍未确认。

## 当前成果

- 云端启用轮询时每10秒检查内容版本，切回可见时立即检查；0仍关闭定时检查。
- 检测新版后先显示暖纸加载层，再刷新；填写及提交中的留言不被自动刷新打断。
- 首页、摄影页与关于页等待云端数据、页面渲染及首屏可见照片加载/解码；屏幕外lazy图片不阻塞。云端内容数据失败仍阻止默认示例显示。
- 单张照片失败或超过15秒未就绪时，只隐藏该图片并保留空间，其余内容继续显示；右下角提供可关闭的重试提示。原请求迟到成功并完成解码后自动恢复，不自动重新下载。
- 用户所见旧照片的已核实机制是已打开页面保留上一版云端内容，等待版本检查后刷新；没有在云端请求失败后读取用户电脑本地照片的回退逻辑。

## 已验证与实际边界

- 首版17项隔离API/照片模拟的真实Chromium检查通过，覆盖两种宽度、延迟/超时/重试、版本遮罩、留言及local/server。局部降级修订后，5个受影响场景通过（含复用的两项API失败证据），其余输入未变的检查复用；不把这些数字相加为独立场景总数。原夹具及CSS优先级失败记录保留。
- 源码语法、构建、3项Pages路由及独立代码审查通过。未修改Worker源代码，发布Worker哈希保持9702664b7497df7e816b95fc40981733dcfc9e825a889fb93b400625cac639d3。
- 首次780930aa正式站首页在1280×900和390×844正常，真实B2图完成解码。
- 前轮d4605195正式摄影页仅导航一次：桌面1280×900有8个可见图片元素解码成功，同页切换390×844有5个；观察到13个媒体响应全部200，移动切换新增媒体请求0，无页面错误或横向溢出。本次没有触发真实局部错误提示，其异常分支由模拟验收覆盖。移动尺寸验证不代表中国大陆手机流量实测。
- 前轮d4605195生产cms-data.js与effects.css均HTTP200，SHA-256与本地发布包完全一致；读回记录内有完整指纹。
- 准备及发布期间用户持续编辑CMS。前轮最终旧部署65bcf70f与新生产站均读到版本30，内容SHA-256同为eac74f9e1e74523967db0338005923c226d3ce4758bd701cda0bf4b7bb6e8d8e。未恢复旧快照，未向D1/CMS/B2写入数据。

## 保留的生产故障证据

- 首轮摄影页出现334a9041图片503，一次受限复核又出现另一张f373123d图片503；后者北京时间2026-10-26 00:54:42，CF-Ray a502be9b6b037379-NRT，通用存储503正文。未证明限额、限流、超时或其他具体上游原因。
- 仅一次B2原生HEAD元数据核对显示334a9041对象200、3342303字节及SHA1；一次桶元数据核对正常。没有下载对象正文、修改caps、付费设置或密钥。这些元数据结果不能证明原503根因。
- 最终真实读回全部200仅证明本次访问成功；此次修复避免偶发单图失败阻塞整页，不宣称消除了上游503。

## 入口、版本与恢复

- 正式首页：https://wong-photography-4a45fb46.pages.dev/Home/?v=98ed5d74
- 正式摄影页：https://wong-photography-4a45fb46.pages.dev/photography/?v=98ed5d74
- 正式关于页：https://wong-photography-4a45fb46.pages.dev/about/?v=98ed5d74
- 固定部署：https://98ed5d74.wong-photography-4a45fb46.pages.dev
- 已打开的旧页面需手动刷新一次以加载新前端代码；本次发布未修改CMS版本。
- 根源码当前快照386d1950f44da88f8579d1db312acdeec8488802，标签local/2026-10-26.004；前轮6ff9f36（.003）及更早版本保留。
- 嵌套发布工程当前快照bd70b1a77218d35d3d916bf9111796468885ddff，标签local/2026-10-26.003；前轮d9aff05（.002）及更早版本保留。均为本地commit，未push。
- 原生产部署65bcf70f-3d2e-49c7-9a9c-ad8bb0562090保留，可作为代码恢复点；代码恢复不覆盖当前D1或删除B2对象。
- 原文件恢复清单：90_历史版本与恢复备份/照片加载更新修复前_photo-loading-refresh-before_2026-10-25/恢复清单_recovery-manifest.json。
- 业务源码：20_源码与运行工程内的shared/cms-data.js、shared/effects.css、Home/index.html和script.js、photography/index.html和script.js、Contact/script.js。操作说明的Markdown与HTML已同步。

## 证据路径与后续事项

证据目录：99_临时文件、缓存和构建中间产物/照片加载更新修复_photo-loading-refresh-fix_2026-10-25/。

- 最终正式浏览器读回：生产局部降级读回_production-partial-degrade-readback.json；同目录有真实桌面、移动截图。
- 最终HTTP及内容保持：修订发布HTTP读回_partial-release-http-readback.json。
- 局部失败补验：照片局部降级补验_photo-partial-degrade-recheck_recheck.json及照片局部降级验收_photo-partial-degrade-acceptance.json。
- 构建与发布：局部降级正式发布日志_partial-degrade-production-deployment.log；原失败JSON、首版17项汇总、两次生产503与原生HEAD核对均保留。

本次授权的前端修改、部署与必要验证已完成。仍需另行定位存储链路偶发503根因；未重新进行中国大陆运营商手机流量验收。后台数据、原始照片、存储配额及计费配置未改动。

## 关于页封面补充（2026-10-26）

- 原因：旧生产About HTML写死并预载Image/about-portrait-crop.png，页面脚本随后才替换为profile.avatar；About又未纳入显式照片就绪流程。保存的旧生产代码在人工延迟浏览器夹具中可先绘制旧模板，支持该原因链，不代表用户当次网络耗时。
- 修复：删除About模板img的旧src及preload，添加cloud早期加载标志，将About纳入当前封面解码等待；正常与空时间线出口均结束加载。cloud空头像不补旧模板；local/server兜底保留。两份操作说明已同步。
- About定向8项真实Chromium模拟通过：桌面与移动慢数据/慢封面、封面失败局部降级、15秒超时后迟到恢复、API失败、空头像与空时间线、local及server兼容。迟到恢复仍为原1次请求，无主动重发；无pageerror。夹具修正前的失败记录保留，未重复未变的既有17项。
- 最终98ed5d74生产About仅1次主导航：CMS版本35，只请求当前profile.avatar，旧portrait请求0；1280×900及同页390×844真实封面均解码成功，移动切换新增图片请求0，媒体均200、无pageerror或横向溢出。尺寸测试不等于大陆运营商流量实测。
- 关于页HTML语义、about/script.js及shared/cms-data.js新指纹已读回。生产HTML由既有Worker注入动态SEO，不按静态文件字节哈希判断；Worker bundle仍为9702664b7497df7e816b95fc40981733dcfc9e825a889fb93b400625cac639d3，未修改。
- 发布后旧部署d4605195与当前生产同时读取版本35，内容SHA-256均c86a8afa552449af3d17b219e4507bd60b2104dd0a58b05f2b7625f3293bcbfe。本次未写D1/CMS/B2内容、迁移或修改账户计费。
- 本轮独立只读代码审查无阻断；JS语法、两仓库差异检查与build:pages通过。当前本地commit/标签见上方，补丁前代码恢复点为根6ff9f36、嵌套d9aff05及固定部署https://d4605195.wong-photography-4a45fb46.pages.dev；恢复代码不回滚当前云端内容。
- 关于页证据目录：99_临时文件、缓存和构建中间产物/关于封面加载修复_about-cover-loading-fix_2026-10-26/；核心记录为关于封面验收汇总_about-cover-acceptance-summary.json、生产关于封面读回复核_production-about-cover-readback-verified.json、关于封面正式HTTP读回_about-cover-production-http-readback.json，含原始时序与生产桌面/移动截图。
- 发布日志：99_临时文件、缓存和构建中间产物/照片加载更新修复_photo-loading-refresh-fix_2026-10-25/关于页封面发布日志_about-cover-deployment_2026-10-26.log。

About补丁已完成修改、部署与读回。已打开旧页面需手动刷新一次，以载入新前端代码。
