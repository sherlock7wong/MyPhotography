# 光影档案：WonG 网站动效方案

事项日期：2026-10-19（Asia/Shanghai） · 方案版本：v1.0.0

鼠标指针决策（2026-10-20）：**用户已确认使用「细线尾迹」**，替代取景框／图片区光圈指针。2026-10-20 已接入公共网站的独立分支 `codex/wong-motion-effects`，当前为本地效果审阅，尚未并入 `main`、推送或发布。首轮独立样片继续保留历史版本。

## 交付与体验入口

当前交付已从独立样片推进到公共网站接入：Home、About、Projects、Photography、Contact、CityHuman 复用共享动效；页面内容、素材与技术栈沿用原站。

- [打开网站动效分支预览](http://127.0.0.1:5184/Home/index.html)：当前工作区检出 `codex/wong-motion-effects`，独立本机端口 5184，保留默认端口的浏览器数据。
- [图库与大图体验](http://127.0.0.1:5184/photography/index.html)：缩略图仍更新详情，通过「查看大图」展开，Esc 返回。
- 页面右下角「动效设置」可比较安静／标准／沉浸，以及照片连续／光圈展开／幕布揭示；默认标准与照片连续。后台仍沿用原有八项开关。
- [分支实施与验收交接](../40_测试与验收证据/阶段交接/网站动效分支实施交接_motion-branch-handoff_2026-10-20.md)：实际检查、已知原有问题、恢复与合并边界。

以下为 2026-10-19 的独立样片入口，保留供历史比较；它们与本次真实页面接入分别记录，线上发布不属于本次交付。

- 项目根目录沿用 `node start-server.js`；若服务已运行，直接使用。
- [打开完整交互预览](http://127.0.0.1:5173/20_%E6%BA%90%E7%A0%81%E4%B8%8E%E8%BF%90%E8%A1%8C%E5%B7%A5%E7%A8%8B/%E5%8A%A8%E6%95%88%E9%A2%84%E8%A7%88_motion-preview/index.html)。
- [真实跨文档跳转样片](http://127.0.0.1:5173/20_%E6%BA%90%E7%A0%81%E4%B8%8E%E8%BF%90%E8%A1%8C%E5%B7%A5%E7%A8%8B/%E5%8A%A8%E6%95%88%E9%A2%84%E8%A7%88_motion-preview/detail.html)。
- 源文件：[index.html](../20_源码与运行工程/动效预览_motion-preview/index.html)、[styles.css](../20_源码与运行工程/动效预览_motion-preview/styles.css)、[script.js](../20_源码与运行工程/动效预览_motion-preview/script.js)、[偏好初始化](../20_源码与运行工程/动效预览_motion-preview/motion-preferences.js)、[detail.html](../20_源码与运行工程/动效预览_motion-preview/detail.html)。

先用“完整体验 → 演示一次”观看节奏，再亲自停留、点击照片。左侧可逐项体验鼠标、悬停、点击、跳转、滚动和氛围。跳转场景提供照片连续展开、镜头光圈、胶片推幕三种选择；其中 Home / Photography / About 为样片内状态，`detail.html` 是真实第二个文档。

上述首轮完整动效样片仍展示旧指针；鼠标指针以本文“已确认：细线尾迹”的执行规格及[指针选型记录](鼠标指针候选_cursor-options_2026-10-20.md)为准，不能将首轮样片视为已接入新指针的结果。

## 视觉方向

保留原有暖纸、橄榄色、衬线字、留白和摄影素材。鼠标指针采用非摄影风格的细线尾迹；照片悬停、点击与跳转继续沿用对焦、快门和下一张照片的表达。主图和内容优先，动态仅在操作、入场和滚动时触发。

原站已经存在胶片颗粒、光标、卡片倾斜、磁吸、视差、滚动显现和约 260 ms 的跳转遮罩。本方案的主要更新是将这些效果统一节奏，并加入原生共享照片转场、三种可比较的页面揭幕、滚动时间轴和跨文档连续性。原站已有能力不计为本次新接入成果。

## 动效分配

| 场景 | 采用效果 | 标准节奏 | 应用位置与边界 |
| --- | --- | --- | --- |
| 鼠标移动（已确认） | 细线尾迹：保留系统箭头，附加橄榄色小点与短细线，停下后自然消退 | 按需 requestAnimationFrame；约 650 ms 消退、700 ms 内停止尾迹绘制 | 桌面公共展示页；触屏、减少动态及表单编辑区域停用装饰尾迹 |
| 按钮停留 | 小幅磁吸、箭头提示、导航细线延展 | 200–250 ms | 主要 CTA 与导航；磁吸不扩大点击误差 |
| 照片停留 | 1.045 倍微放大、约 120 ms 后出现对焦角标、轻倾斜 | 220–650 ms | 照片卡片；无悬停设备常显查看入口 |
| 点击 | 局部细光圈扩散、按钮轻压回弹 | 240 / 440 ms | 对操作给即时反馈，避免整屏白闪 |
| 作品展开 | 详情照片与大图共享几何位置，关闭回到原照片 | 620 ms | 原生 dialog + WAAPI 连续几何动画，避免顶层弹窗的快照冲突；图库状态切换另用 View Transitions；Esc 与关闭按钮返回 |
| 页面切换 | 匹配到同一素材时连续展开；普通导航淡入，光圈、推幕供比较 | 480 / 620 / 820 ms 三档 | 真实公共页面及图库状态；普通链接保留浏览器语义，不延迟导航 |
| 滚动 | 图片逐渐显影、小幅位移与阅读进度 | 跟随滚动位置 | CSS scroll()/view()；不接管滚轮、不锁定页面滚动 |
| 首屏与章节 | 标题和图片按阅读顺序分组显现 | 每组错开 55 ms，上限 275 ms | 已接入公共页面，避免父子层重复显现；关闭开关或减少动态时直接显示 |
| 整站氛围 | 静态纸纹、细颗粒、指针驱动的柔光与阴影 | 静态或按操作变化 | 无持续粒子循环；后续需实机评估开销 |

默认推荐“标准”。“克制”约为一半位移；“沉浸”扩大局部位移并放慢转场。系统减少动态优先，手动“减少动态”在当前会话跳转和刷新后保留。减少动态时停止跟随、倾斜、缩放和过渡，保留内容与操作。

## 已确认：细线尾迹

确认日期：2026-10-20。后续实现以用户选中的“细线尾迹”标准档为基准，替换旧的取景框／图片区光圈指针；不同时叠加其他候选指针。

| 执行项 | 初始规格 |
| --- | --- |
| 指针与颜色 | 保留系统箭头及原生链接／文本指针；前端小点约 5 CSS px，尾迹使用当前主题的橄榄色 |
| 线条 | 约 1.7 CSS px，圆形端点与连接，单条短细线；不增加取景框、光圈、摄影符号或长尾粒子 |
| 跟随 | 以 12 个采样点构成短尾；标准档相邻点插值系数约 0.35，移动时按需更新 |
| 收尾 | 停止移动后约 650 ms 内淡出；约 700 ms 内清空尾迹并停止其动画帧；无其他动态任务时不保留空转循环 |
| 悬停与点击 | 尾迹不因进入作品或按钮变成取景框、光圈、磁吸胶囊或文字标签；按钮、照片的独立悬停与点击效果仍按上表执行 |
| 输入与降级 | 仅在 `(hover: hover) and (pointer: fine)` 且允许动态时启用；触屏、系统或手动减少动态、表单输入编辑和后台管理界面使用原生指针 |
| 生命周期 | 鼠标移出、页面隐藏、页面切换、窗口尺寸变化或关闭效果时，清空尾迹并停止对应动画；Canvas 始终 `pointer-events: none`，不阻挡点击、选字或滚动 |
| 免费实现 | 使用原生 Pointer Events、Canvas 2D 与 requestAnimationFrame；复用现有 CMS 指针开关，无付费库、WebGL 或外部服务依赖 |

这些参数是选中样片的实施起点，不代表已完成原站性能或跨设备验收。实施时应定向验证移动／停止／移出／切页后的收尾、链接与文本输入、动态偏好切换，以及不同刷新率下的跟随观感；以短、细、不遮挡内容为调整原则。

本次已在独立分支替换旧取景框指针，并整合共享初始化、后台开关与生命周期；原生箭头保留，未叠加其他候选指针。桌面移动／停止、表单输入、跨页和动态偏好切换已作本机 Chrome 检查；触屏为浏览器模拟，仍需真机与不同刷新率的观感确认。

## 免费技术与当前兼容性

方案仅使用浏览器原生 HTML / CSS / JavaScript 与既有素材；没有 npm 运行依赖、第三方 CDN、付费模板、商业插件、订阅或账户要求。效果实现技术的费用为零；托管、域名和图片流量属于站点原有运营范围，不在此处承诺永久免费。

资料核验日期为 2026-10-19。新技术以已发布的浏览器能力为基础，预览按实际能力检测增强。下列是官方兼容资料，不能替代本机、真机和跨浏览器验收。

| 技术 | 用途 | 兼容与降级 |
| --- | --- | --- |
| `document.startViewTransition()` | 同页状态切换、共享照片开合 | Baseline 2025；不可用时直接更新并用轻量 opacity/transform 过渡 |
| `@view-transition { navigation: auto }` | 同源真实 HTML 跳转 | Chrome / Edge 126+、Safari 18.2+；Firefox 跨文档尚不按已支持处理；不支持时正常导航 |
| `animation-timeline: scroll()/view()` | 滚动画卷、进度 | Chrome 115+、Safari 26；截至本次日期 Firefox 159 仍为 Beta，不把未来稳定版当作今日支持。降级为 IntersectionObserver / 滚动进度更新 |
| `Element.animate()` / WAAPI | 点击、回弹、一次性演示 | 基础能力广泛可用；本方案不依赖新扩展时间轴 |
| `@starting-style` 与 `allow-discrete` | 原生 dialog 的显隐入场 | Baseline 2024；子特性分别判断，基础 dialog 显隐始终可用 |
| Pointer Events / `hover` / `pointer` / `prefers-reduced-motion` | 输入差异与动态偏好 | 只在精细指针启用跟随和倾斜；触屏与键盘保留主要操作 |

官方与原始来源：

- [MDN：startViewTransition](https://developer.mozilla.org/en-US/docs/Web/API/Document/startViewTransition)
- [WebKit：跨文档 View Transitions](https://webkit.org/blog/16967/two-lines-of-cross-document-view-transitions-code-you-can-use-on-every-website-today/)
- [MDN：@view-transition](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@view-transition)
- [WebKit：Safari 26 的 scroll()/view()](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/)
- [MDN：Firefox 159 发布状态](https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Releases/159)
- [MDN：Element.animate](https://developer.mozilla.org/en-US/docs/Web/API/Element/animate)
- [MDN：@starting-style](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@starting-style)
- [MDN：减少动态](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@media/prefers-reduced-motion)

GSAP、Motion、Three.js 等可作为将来确有需要时的备选；当前方案无需引入它们。WebGL 液化、持续粒子、强制平滑滚动和大面积动态模糊不作为默认效果，这属于摄影内容与性能的设计取舍，未冒充实测性能结论。

## 本次接入与后续确认

2026-10-20 已围绕 `shared/effects.js` / `effects.css` 完成公共页面接入，并增加头部同步加载的 `shared/motion-preferences.js`，在首帧前恢复偏好及原生导航开关。移除旧跳转遮罩与隐藏系统指针的规则；动态图库采用委托／增量处理，缩略图选择、收藏、筛选、排序和表单业务仍沿用原逻辑。

真实跨文档照片连续性在 `pagereveal` 阶段匹配同一素材；未匹配到时用整页淡入，不伪造另一张照片。不支持 View Transitions 的浏览器直接更新／导航，IO 提供滚动显现降级。大图用原生 dialog 管理焦点与 Esc，以 WAAPI 连接展开和关闭的图片位置。

各公共页面都应保留真实链接、下载、外链、Ctrl/Command 点击与浏览器后退；不以动画延迟导航。About / Contact / 管理页面以阅读和操作反馈为主，沉浸动效集中在作品页。真实部署后的首次加载、历史导航、图片尺寸、布局稳定和触屏表现需在接入阶段单独验证。

当前主线基线仍为 `main@a1d23bde508e87474cb2294a0f502eadd16bda34`。本次修改通过项目保存脚本创建本地 commit 与 `local/YYYY-MM-DD.NNN` 附注标签，只保存在 `codex/wong-motion-effects`；需用户确认效果后才能并入 main。未 push、未部署。

当前本地服务器读取当前检出分支的文件。工作区干净时可用 `git switch main` 查看原主线，再用 `git switch codex/wong-motion-effects` 返回本次效果；不要使用破坏性的 reset 覆盖其他工作。保留全部方案与样片。
