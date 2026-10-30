# 登录入口统一修复

事项日期：2026-10-20（Asia/Shanghai）。本次沿用 `codex/wong-motion-effects` 分支；开始检查时根仓库及嵌套部署仓库均无未提交改动。

## 已确认原因

- 前台 Home、about、Project、photography、CityHuman、Contact 共用 `20_源码与运行工程/shared/effects.js` 注入的 CMS 入口，原链接指向 `../AdminLogin/index.html`。
- 旧 `AdminLogin/script.js` 仅有邮箱格式校验及固定失败提示，没有账户检查或成功跳转。用户名会触发邮箱格式错误，使用邮箱也不能完成登录。
- `/admin/index.html` 使用现有 `admin/script.js` 的模拟账户检查及 sessionStorage。隔离浏览器复现了该入口成功登录；这不是服务端认证或数据库验收。

## 第一阶段：统一入口

- 共享 CMS 入口指向 `/admin/index.html`，一次修复覆盖六个前台页面。
- 旧 `AdminLogin/index.html` 在页面头部执行兼容跳转；`script.js` 使用 `location.replace` 转到同源现有后台，并保留查询参数及 hash。禁用 JavaScript 时提供 meta refresh。
- 原登录设计的 DOM、样式、照片保留；现有后台界面、账户配置、认证逻辑、数据及部署配置未改动。
- 项目入口索引已登记本记录。只创建本地 Git 快照，不推送、不部署。本记录位于既有私有验收忽略目录，不强制加入 Git。

## 实际验证

- `node --check`：本次修改的 `AdminLogin/script.js` 和 `shared/effects.js` 通过。
- `git diff --check`：通过。
- 在现有 `http://127.0.0.1:5173` 服务上使用 Playwright 隔离会话，未使用用户已有浏览器会话，未在记录中保存凭据。
- 六个公共页面各只有一个 CMS 按钮，均链接至 `/admin/index.html`；实际点击可打开登录表单。
- 旧地址自动跳转成功，查询参数及 hash 保留；浏览器后退回到来源页，不回到旧登录中转页。
- 错误密码被拒绝；现有有效账户可从兼容入口进入后台，登录表单隐藏。
- 390×844 手机视口下，首页 CMS 按钮可进入同一登录页。
- 禁用 JavaScript 时，旧地址仍能跳转；未声称后台能在禁用 JavaScript 时完成登录。

## 原有问题与边界

浏览器在前台跳至未启用 View Transition 的登录页时，产生 `Transition was aborted because of invalid state. ViewTransition opt-in disabled`。已在隔离会话内用 Git 修改前内容复现；修改前后均出现，登录及导航断言通过，未出现其他页面异常。本次没有扩大范围修改转场系统。

没有修改后端、依赖或构建配置，未运行无关的后端构建。当前验收仅覆盖本机入口与浏览器模拟登录，不代表线上发布、安全认证或业务数据验收。

## 第一阶段恢复记录

修改前恢复点为根仓库提交 `7ff1e24`。本次已使用项目保存版本脚本创建提交 `54bf03a`，附注标签为 `local/2026-10-20.003`。需要恢复时先核对当前改动，再反向应用本次 commit，避免重置或覆盖其他工作。

用户刷新原前台页面后即可从 CMS 按钮登录；旧书签继续有效。转场报错及真实服务端认证属于独立后续事项，未在本次处理。

## 第二阶段：删除独立旧页面

用户确认不同页面后要求删除错误页。本阶段已移除 `20_源码与运行工程/AdminLogin/index.html`、`script.js`、`styles.css`，不再保留第二套登录网页。目录仅留下 `assets/archive-desk.png`，因为可用的 `admin/index.html` 仍直接引用该照片；素材及根目录兼容联接没有删除。

- 删除前已独立备份三个旧文件并逐一验证 SHA-256。[完整路径、备份时间和哈希清单](../../90_历史版本与恢复备份/旧登录页移除恢复_admin-login-removal-restore_2026-10-20/恢复清单_restore-manifest_2026-10-20.json)。恢复目录为 `F:\个人主页\90_历史版本与恢复备份\旧登录页移除恢复_admin-login-removal-restore_2026-10-20`。
- dashboard、gallery、categories、profile、settings 五个后台子页面的旧链接已改为 `/admin/index.html`。
- `start-server.js` 在本地预览服务中直接返回旧地址的 HTTP 302，不再通过旧 HTML 或 JS 中转。根入口与 `20_源码与运行工程/本地运行入口/start-server.js` 的既有硬链接关系及内容一致性已核验。
- 已仅重启 5173 端口的现有静态预览服务，兼容规则即时生效。未修改账户、认证逻辑、后台业务或部署配置。

### 本阶段实际验证

- 三个旧源码文件已不存在，恢复副本及清单保留；旧 JS/CSS 请求返回 404。
- `/AdminLogin`、`/AdminLogin/`、`/AdminLogin/index.html` 及大小写变体均返回 302 到正确入口。查询参数保留，浏览器实际跳转后 hash 保留；禁用 JavaScript 仍可跳转。
- 五个后台页面的 HTML 返回 200，旧链接均已替换。
- 正确后台共用照片返回 200，浏览器实际解码为 722×781，页面图片可见。
- 隔离浏览器中错误密码仍被拒绝，有效账户成功进入后台；390×844 手机视口下首页 CMS 按钮可打开正确登录页。没有新增页面异常。
- 启动脚本语法检查、差异检查和恢复副本哈希复核按本阶段完成记录保存；本阶段没有构建或部署操作。

### 本阶段恢复

本阶段已保存为提交 `71f70e5`，附注标签 `local/2026-10-20.004`；删除前恢复点为 `54bf03a`（`local/2026-10-20.003`）。需要恢复时先核对当前工作区，再反向应用本阶段本地提交；仅复制回旧三个文件不会移除服务器兼容跳转规则。备份和验收材料继续保存在既定忽略目录，不强制加入源码 Git。
