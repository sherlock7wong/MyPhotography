# WonG 鼠标指针候选：非摄影风格

事项日期：2026-10-20（Asia/Shanghai） · 状态：用户已确认「细线尾迹」，已写入主方案，代码接入待实施

## 本轮范围

用户要求放弃摄影元素的鼠标指针，提供更多适合现有网站或同类作品集网站的效果，并以动画 UI 比较。保留网站暖纸、橄榄色与简洁排版作为测试背景；指针本身不采用取景框、光圈、对焦标识或胶片符号。

本轮提供 8 款可操作样片。使用预览底部的上一款、下一款或款式名称切换，每款可点“演示移动”；“记为候选”只记录比较意向，不会写入原方案或修改网站。移动鼠标可接管演示，系统减少动态时停止跟随；触屏可使用演示按钮观察。

## 候选与适配判断

| 款式 | 实际效果 | 对 WonG 的适配判断 | 参考性质 |
| --- | --- | --- | --- |
| 极简双层 | 即时小点与轻延迟细圆环 | 优先比较；清楚、安静，适合全站 | 公开设计先例的原生轻量变体 |
| 自适应反差 | 小型实心圆在深浅内容上显示反差 | 适合黑白画面与大字排版，需检查局部颜色变化 | blend-mode 指针的原生变体 |
| 磁吸胶囊 | 悬停时轮廓贴合按钮或内容区域 | 优先比较；强化导航与点击区域的操作感 | magnetic / sticky 先例的简化变体 |
| 语义标签 | 可操作内容旁显示“打开 / 阅读 / 浏览” | 优先比较；能帮助理解操作，适合作品列表 | 文字跟随指针先例的原生变体 |
| 弹性水滴 | 随移动速度轻微拉伸，停下收圆 | 适合少量首屏与作品区域；更活泼 | skewing 先例的简化变体 |
| 细线尾迹 | 一条短细线随鼠标移动，停止后消退 | 艺术感更强，建议控制长度与使用区域 | 本次创作，参考 trail / emitter 技术类别 |
| 柔雾玻璃 | 半透明圆形柔雾覆盖经过的内容 | 通透但更醒目；需另测实机渲染开销 | 本次创作的 CSS 玻璃变体，不宣称流行排行 |
| 旋转星芒 | 简单几何星芒随移动转动，悬停舒展 | 个性更强，适合轻松的创作者风格 | 本次创作的几何指针，不冒充具体网站原样效果 |

初选阶段曾建议比较“极简双层”“磁吸胶囊”“语义标签”，属于设计判断，不是流行度统计。用户现已明确选定“细线尾迹”；其余款式保留为选型参考。

## 可核验的公开参考

以下来源证明这些方向有公开设计先例与相关实验，不等于“2026 最流行排名”，也不保证参考网站今天仍保持相同线上实现。

1. [Codrops · Custom Cursor Effects，2019-01-31](https://tympanus.net/codrops/2019/01/31/custom-cursor-effects/)：小点、延迟圆环、磁性导航的原始教程；本样片不用其 Paper.js / 噪声依赖。
2. [Codrops · Magnetic Noisy Circle 原始演示](https://tympanus.net/Tutorials/CustomCursors/index4.html)：磁性吸附的直接参考，样片去除噪声抖动并采用简单几何轮廓。
3. [Codrops · Background Shift Animation with CSS Blend Modes，2022-01-26](https://tympanus.net/codrops/2022/01/26/background-shift-animation-with-css-blend-modes/)：混合模式指针实验；本样片只改变指针覆盖区域的呈现。
4. [Cuberto · Mouse Follower 官方源码与说明](https://github.com/Cuberto/mouse-follower)：text、sticky、skewing 等能力的公开先例；库为 MIT、依赖 GSAP，本次样片独立用原生代码实现。
5. [Awwwards · Marga Navarro 作品集展示记录](https://www.awwwards.com/inspiration/asymmetrical-layout-marga-navarro)：同一作品集的展示记录包含 Inline Tooltip Follow Mouse Interaction，可用于观察语义标签类别；属于展示版本记录，未冒充作者当前官网交互实测。
6. [Codrops · Custom SVG Cursors with an Interactive Emitter Effect，2022-08-24](https://tympanus.net/codrops/2022/08/24/custom-svg-cursors-with-an-interactive-emitter-effect/)：trail / tube 类别的原始教程；本次细线采用 Canvas 2D，是轻量原创变体。
7. [Codrops · Custom-Shaped Cursor Trail，2026-09-24](https://tympanus.net/codrops/2026/09/24/custom-shaped-cursor-trail/)：较新的 Three.js / WebGPU / TSL 自定义形状尾迹实验。保留为扩展参考，当前八款不依赖 WebGPU，未冒充实现该教程的全部效果。

检索时只核对了原始页面与公开说明，未对远端站逐个进行鼠标实测。参考站的图片、品牌与完整源码不因公开可浏览就自动获得复制授权；样片只使用当前项目已有素材。

## 免费实现与运行边界

八款均使用原生 CSS、Pointer Events、requestAnimationFrame、Canvas 2D 与少量触发式 Web Animations；无付费库、订阅、第三方 CDN 或外部网络请求。玻璃效果使用 `backdrop-filter`，不支持时保留半透明底色。

默认保留系统箭头作为精确指示，可在设计选项中比较隐藏系统箭头的呈现；隐藏仅限精细指针进入样片区域，移出、停用或减少动态时恢复。触屏保留原生操作，主要通过演示观察鼠标效果。尺寸与演示速度属于样片参数，不代表所有设备的性能保证。

## 已确认的选择与替换边界

原文档：[光影档案：WonG 网站动效方案](网站动效方案_website-motion-plan_2026-10-19_v1.0.0.md)。

用户于 2026-10-20 明确确认使用“细线尾迹”，并要求写入主方案。主方案现已替换旧取景框指针的表述与“鼠标移动”表格行，并补充线宽、采样点、消退、启用范围与后续验证要求；整套方案名称及照片悬停、点击、页面转场、滚动和整站氛围保留。

当前已完成方案中的指针部分替换；原站及上一轮完整动效样片尚未接入新指针。“记为候选”的控件行为仍只记录比较状态；本次定案依据是用户的明确文字确认。
