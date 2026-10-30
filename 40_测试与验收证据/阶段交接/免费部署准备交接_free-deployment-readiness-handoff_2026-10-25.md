# 免费部署准备交接

事项日期：2026-10-25（Asia/Shanghai）。状态：独立免费 Worker/D1/Pages 验证已部署，Pages 中国移动页面/图形/数据库通过；B2私有桶及675字节真实生成样本上传/认证回读/匿名拒绝通过；Pages到B2样本代理11项真实云端检查通过，新增图片及原图保护的中国移动手机复测通过，正式迁移未完成。

## 最新约束

- 用户继续要求免费方案、公共访问地址、中国大陆普通网络可用、最多约 1,000 张照片，原图私有且展示图公开。
- JPEG 通常 5–15 MB，个别约 50 MB；目前实际原图数量、总大小和最大文件仍未知。
- 用户将自行下载原图到本地；明确不对接百度网盘、不研究或核实其官方接口。本轮未访问百度网盘或用户原图。
- 只有银联、微信、支付宝。Oracle 付款验证路线不匹配，不再要求用户注册。不充值、购买或订阅。

## 本轮已完成

1. 撤销方案中沿用网盘作为网站原图库的候选，恢复下载后本地只读容量盘点。
2. 新增 [照片容量盘点工具](../../20_源码与运行工程/云端迁移_cloud-migration/照片容量盘点_photo-capacity-audit.mjs)：Node 内置模块，无额外依赖；只读 JPEG 元数据，递归跳过目录联接/符号链接；独立报告拒绝覆盖或写进原图目录。
3. 在项目99目录合成文件中验证11组检查：递归/大小写、最大值及8/50MB边界、非JPEG排除、junction跳过、容量与无效参数、CLI报告、已有报告保留、源目录报告拒绝、空/缺失目录、相对路径拒绝、合成源文件SHA-256与大小不变。没有把合成文件当真实照片验收。
4. 用当前源码在独立临时目录完成与现有 build 等价的客户端构建及 esbuild 打包：81个客户端文件逐一SHA-256吻合构建清单。
5. 当前 Worker/SQLite 定向测试13项通过、0失败。其中CMS测试使用模拟绑定；统计等用例使用Node真实SQLite，仍不是真实Cloudflare运行验收。
6. 原嵌套部署仓库未修改；本轮没有改动正式网页或后台业务源代码。另增44行独立非隐私验证 Worker，已完成9类本地处理器检查和独立只读审查。
7. 独立研究复核DBByte官方docs后发现超额流量 $0.01/GB，未证实免费档硬停保护；不将其选为严格免费生产存储。Tebi未取得当前官方免卡长期25GB证据，不作已验证推荐。

8. 官方浏览器 OAuth 登录已成功；用户控制台确认 Workers Free。Pages 权限扩张先被自动审批拒绝，用户随后明确同意 pages:write 后，按授权重新登录并成功。没有添加付款方式、付费或订阅。
9. 新增独立测试 Worker、D1 各一个和独立 Pages 项目；Pages 复用同一 D1，账号原有 Pages 项目未修改。两种入口均只含生成页面/图形和一条无隐私测试标记。
10. 当前电脑对 Worker 页面/资源/API/数据库及 HEAD/404/405 检查通过；用户中国移动普通流量实测打不开。因此不能把 workers.dev 用作已验收入口。
11. 新 Pages 稳定地址 [https://photo-cloud-preflight-20261025-bc4407.pages.dev/](https://photo-cloud-preflight-20261025-bc4407.pages.dev/) 已部署；8类电脑侧检查通过，D1原始标记和时间字符串一致。用户已确认相同中国移动流量网络、关闭Wi-Fi及代理，页面/图形/数据库ok:true均正常。电信/联通和正式后台仍未实测。

## 证据位置与版本

- 复核前根版本：`9639a028c7031e350f0bf2f4dba4cf5de19ca34a`。
- 独立部署仓库版本：`b5ce70d535d3b39cdd0b4be4885af77740bda94f`。
- [容量工具合成文件验证结果](../../99_临时文件、缓存和构建中间产物/照片盘点验证_photo-audit-verification_2026-10-25_995980d8/验证结果_verification-result.json)。
- [构建、哈希及后端测试结果](../../99_临时文件、缓存和构建中间产物/免费部署复核_free-deployment-recheck_2026-10-25_e3094a2a/部署复核结果_deployment-recheck-result.json)；同目录保留独立构建包。
- [前一阶段预检与本地CMS备份](../免费云端部署预检_free-cloud-preflight_2026-10-24_待验证-unverified.md)。这份备份仅覆盖当时网站数据与已上传媒体，不包含尚未下载的网盘原图。

## 未完成与具体阻塞

- 旧 Cloudflare 登录/设备码阻塞已经解除，不再生成设备码。浏览器自动控制仍无法启动，但 Wrangler 正常浏览器 OAuth 已成功，后续使用 CLI。
- Worker 的 workers.dev 地址在用户中国移动网络失败；Pages 的 pages.dev 地址已通过用户相同移动网络的页面/图形/数据库验证。电信/联通未测；当前电脑网络路径未确证，不作为普通大陆网络证据。
- 用户最新确认原图尚未下载完，尚无已确认的本地路径，不能运行真实容量盘点。不反复询问网盘数据或研究其接口。
- B2实际私有桶、单桶密钥及小PNG样本预检已通过；10GB仍不能保证容纳最多1,000张5–15MB原图。正式Worker依赖R2，独立B2样本代理已通过电脑侧云端读回，正式B2业务适配与50MB上传仍待实现。
- 20–25GB长期免国际卡、零费用、私有原图与大陆访问的完整组合仍未证实；不能把容量估算或资料宣称当部署完成。
- 当前公开上传仍为8,000,000字节，私有原图与50MB上传尚未实现/验收；本轮没有借现有小文件上传测试声称已支持。

## 接下来的执行顺序

1. 原Pages页面/SVG/D1移动验证、B2实际小样、Pages/B2代理电脑侧11项及新增PNG/原图保护的中国移动手机实测均通过。继续定位正式后台B2适配、长期认证和上传边界，准备可恢复的业务迁移；24h限定下载token不代表正式长期接入，约10月26日13:03失效。
2. 原图下载完成后读取用户指定本地目录，统计空间，并将所选存储的账号已有占用、派生图与备份余量加入预算。免费额度不够时如实说明，不改图或悄然减少云端原图要求。
3. 免费域名与存储可行后，补齐50MB原图上传与私有下载、额度行为和恢复验证；通过后按既有免费迁移授权迁移真实数据。
4. 正式后台需独立生产凭据与真实数据备份，检查发布/草稿过滤、会话、版本冲突、跨设备保存、关闭本机后的访问和原图下载哈希；非隐私样本站不替代这些验收。

## 恢复方式

本轮源码增加容量工具、独立验证Worker、B2私有预检CLI与固定样本代理，并调整方案/导航；正式站源码与本地数据不变。它不改动原图。需要恢复源码时逐文件比较本地commit与标签，不运行reset --hard。云端验证资源只含非隐私测试内容；恢复或停止测试时可解除流量入口，永久删除资源仍须依用户规则确认。资源标识与部署配置只在99目录保存，不输出账号ID/令牌；40交接与99证据未强制加入Git。

来源：[DBByte超额与功能状态](https://dbbyte.com/docs)、[Workers免费额度](https://developers.cloudflare.com/workers/platform/pricing/)、[workers.dev域名](https://developers.cloudflare.com/workers/configuration/routing/workers-dev/)、[Cloudflare大陆网络边界](https://developers.cloudflare.com/china-network/)。

独立只读审查未发现阻断问题；依据审查意见补充Windows带盘符/UNC完整路径校验，新增路径边界检查通过，合成源文件哈希仍一致。complete仅表示无读取错误，跳过链接中的照片不计入统计。补充证据：99目录同一容量验证文件夹内的路径边界复核_path-boundary-recheck.json。

## 云端实测证据与环境问题

- 非隐私程序：[源码](../../20_源码与运行工程/云端迁移_cloud-migration/云端连通预检_cloud-connectivity-preflight.mjs)，SHA-256：482A107E696F0495995772E16C677D559B4D047189160BF4F55D90682E0B03D9。最初Pages的_worker.js与它逐字节相同；当前Pages已换为导入它的B2样本代理打包文件，最新哈希与地址见文末。
- 资源和配置：99_临时文件、缓存和构建中间产物/云端核验工具_cloud-verification-tools 下的 非隐私验证站_nonprivate-preflight_2026-10-25 与 非隐私Pages验证_nonprivate-pages-preflight_2026-10-25。包含测试资源ID但无令牌，不作为公开交付。
- Worker 当前部署版本：88210284-48eb-4ca7-b5a6-f331441c177b；[公网接口复测](../../99_临时文件、缓存和构建中间产物/云端核验工具_cloud-verification-tools/非隐私验证站_nonprivate-preflight_2026-10-25/公网接口复测_public-endpoint-recheck.json)与[真实D1回读](../../99_临时文件、缓存和构建中间产物/云端核验工具_cloud-verification-tools/非隐私验证站_nonprivate-preflight_2026-10-25/云数据库读回_d1-remote-readback.json)。
- Pages 部署地址：https://e8c5f4c5.photo-cloud-preflight-20261025-bc4407.pages.dev；用户测试使用稳定项目地址。
- [Pages首次8类检查](../../99_临时文件、缓存和构建中间产物/云端核验工具_cloud-verification-tools/非隐私Pages验证_nonprivate-pages-preflight_2026-10-25/接口检查_endpoint-check_2026-10-24T17-55-39-953Z/Pages公网检查_pages-public-check.json)保留了本地时间字符串断言失败；[修正预期后的数据库复核](../../99_临时文件、缓存和构建中间产物/云端核验工具_cloud-verification-tools/非隐私Pages验证_nonprivate-pages-preflight_2026-10-25/Pages云数据库复核_pages-database-recheck.json)表明初次与再次响应均与原始D1标记完全相同。仅校正测试元数据，未改数据库或重部署。
- Worker首次compatibility_date按本地日期填为2026-10-25，被平台拒绝未来UTC日期；改为2026-10-24后成功。Pages配置首次含不支持的account_id，移除后通过进程局部账号环境变量选择同一账号成功。
- Wrangler对新Pages项目的agent分支默认转为Worker；仅在创建全新Pages时用CLI force选择原生Pages，未覆盖、删除其他项目，正常部署未用force。
- Node首次TLS失败后Windows curl/PowerShell及Node复测成功，原因未证实，原失败报告保留；系统DNS/代理未改。电脑DNS曾返回198.18测试网段，故其网络位置不作为大陆直连证据。
- 本轮记录更新前的三份文档及SHA-256位于：F:/个人主页/99_临时文件、缓存和构建中间产物/云端记录更新前_before-cloud-record-update_2026-10-25_683cbb74。
- 已有本地准备版本：1ae6b76 / local/2026-10-25.001；本轮验证源码与方案/导航已保存为 ced9514 / local/2026-10-25.002，未push。语法、部署文件哈希、17个相关本地链接与diff空白检查通过；正式部署仓库仍为b5ce70d535d3b39cdd0b4be4885af77740bda94f且无修改。

## 本次用户验收与存储准入更新（B2注册前历史）

- 用户先反馈网站显示“云端连通验证”，随后明确确认：中国移动手机流量、Wi-Fi及代理关闭，图形和数据库均正常；因此 Pages 该次移动连通验收通过。未扩展为全国、长期稳定或正式后台验收。
- 用户确认原图尚未下载完成，不具备真实容量盘点条件。
- 已请求用户在 https://www.backblaze.com/sign-up/cloud-storage 进行免卡空账号注册；未取得B2登录、密钥或创建桶/对象。
- B2独立官方资料复核：前10GB免费，未付款账户有操作cap；实际新账号默认存储/下载/调用cap尚未公开确定，需账户界面核实零费用保护。Native普通上传支持50MB，但需准确Content-Length且无chunked；每个旧版本/重复对象/未完成分片都会占空间。当前网站8,000,000字节与私有原图能力尚未改动。
- IBM Cloud当前官方账户FAQ要求银行卡，COS Lite已退役；旧25GB免卡介绍不作为新路线。这里只做公开资料排除，无注册或账号操作。
- 免费与私有存储条件验证、生成样本上传/匿名拒绝/授权回读哈希通过后，再适配正式业务。未经真实统计，不能承诺10GB可装下全部1000张。

- 本次移动验收及存储准入方案已保存本地版本：b38517b / local/2026-10-25.003；17个本地链接、状态一致性与diff空白检查通过，未push。

## B2 注册阻塞补充（2026-10-25，现已解除的历史记录）

- 用户提供的注册页面截图显示：Too many requests, please try again later.。只确认注册端提示请求过多；未取得HTTP状态、Retry-After或请求ID，不能断定是邮箱、IP或账户限制，也不能声称账号已注册。
- 本轮未再次提交注册、未切换IP/邮箱规避限制、未调用注册接口、未创建桶或上传对象。账号免费限额与私有存储验证仍待注册恢复后进行。
- 官方公开检索未找到该注册表单明确的固定解除时间。建议停止提交一段时间后仅重试一次；一小时是保守操作建议，不是官方承诺。若持续出现，使用 https://www.backblaze.com/help 的 Submit Request 联系官方支持，用户自行发送；未代发工单或邮件。
- https://status.backblaze.com/ 的实时页面依赖JavaScript，搜索摘要显示正常不足以确认当前注册功能正常，不把缓存摘要当实时状态。
- 已通过的Pages/D1中国移动页面、图形、数据库验证保留；原图仍未下载完成，正式网站和真实照片未迁移。本次仅补充私有交接记录，无源码或受跟踪文件差异，不创建空Git版本。
## B2 注册完成与实际限额（凭据接入前历史）

- 用户已明确回复“已注册”，前述注册请求过多阻塞已解除；账号本身尚未由API认证读回。
- 用户随后提供Caps & Alerts实际截图：Daily Storage Caps为$0.00（10 GB），Today $0.00（0 bytes）；Daily Download Bandwidth Caps为$0.00（1 GB），Today 0 bytes；Class B为0/2500次每天，Class C为1/2500次每天。截图未显示Class A或付款方式，不据此编造相关状态，也不更改caps。
- 当前样本准入依据为用户截图；费用记录明确paymentMethodStatus unknown、capsNotVerifiedByApi。拟仅进行两个极小生成对象的私有桶上传/哈希回读/匿名拒绝验证，无通知、无删除、不修改额度；不作为50MB上传或真实照片迁移验收。
- 已在被Git忽略的99目录准备本地JSON空配置与人工费用限额记录。拟新私有桶为wong-photos-4a45fb46，尚未API确认创建；用户须将仅限该桶的短期读写key填入本机文件，不发聊天或截图。待用户确认保存后才读取其字段，不输出凭据。
- CLI预检工具由独立Agent在单一新源码文件中准备，默认只读，显式exercise与近期人工cap记录才能写少量生成样本。工具与mock测试未完成前不执行真实B2操作。
- 本轮Git状态存在其他来源的Project/about/admin/shared未提交修改及后台业务去重测试，不纳入本次提交、不覆盖。原图下载状态仍未更新为完成。
## B2真实预检通过与代理准备

- 用户确认新私有桶及本地配置保存完成，主Agent只读取并核验必要字段，未输出applicationKeyId/applicationKey。API只读检查通过：listBuckets/readFiles/writeFiles有效、指定桶allPrivate、key仅目标桶；只查询该桶，没有列取其他桶内容。
- [只读账户核验](../../99_临时文件、缓存和构建中间产物/云端核验工具_cloud-verification-tools/B2私有验证_b2-private-preflight_2026-10-25/只读账户核验_readonly-account-inspection_2026-10-25.json)。
- [首次样本失败](../../99_临时文件、缓存和构建中间产物/云端核验工具_cloud-verification-tools/B2私有验证_b2-private-preflight_2026-10-25/生成样本实测_generated-sample-live-check_2026-10-25.json)：授权/指定桶/上传URL均200，首个上传400，第二个未尝试；保留路径供云状态核对，不自动删除。
- 根据官方Native字符串编码规范修复X-Bz-Info-b2-cache-control为encodeURIComponent；成功路径mock1项通过，语法通过。[修正后真实样本](../../99_临时文件、缓存和构建中间产物/云端核验工具_cloud-verification-tools/B2私有验证_b2-private-preflight_2026-10-25/编码修正后样本实测_sample-live-recheck-after-encoding-fix_2026-10-25.json)证明两张PNG共675B上传和认证下载200、全部哈希一致、匿名401；均为生成样本。
- 预检CLI早期20项mock通过，独立审查后7项相关复核通过（含2项新增，不能简单相加成27个独立用例）；编码单行修复后只重跑受影响成功路径。独立审查发现的失败报告保留和响应cancel/abort问题已修复关闭。CLI当前hash97977C826947AC4C962D34C464932A9290523F6F5931289C42C2FFE60BD73925。
- 已从B2发行两份各限生成文件名前缀的24小时只读下载token，并确认shareFiles权限；3次API均200。下载token/HMAC测试密钥仅以Secrets形式写入当前独立Pages项目，B2应用密钥从未上传Cloudflare。只读下载授权约于2026-10-26 13:03（Asia/Shanghai）失效；正式长期照片存储尚未接入。
- 新代理暂存目录：99_临时文件、缓存和构建中间产物/云端核验工具_cloud-verification-tools/非隐私存储代理_pages-storage-proxy_2026-10-25；旧验证包保留，真实配置生成Wrangler Env成功，Workers最新官方类型5.20261025.1另存99。该段为代理部署前记录；后续源码、mock及云端部署已完成，结果见下节。

## B2样本代理实际部署与故障关闭

- 当前部署 https://0656faaf.photo-cloud-preflight-20261025-bc4407.pages.dev ，稳定项目地址不变；只更新已有独立验证Pages，复用原测试D1，未修改正式网站、其他项目或付费配置。
- 代理源码SHA-256：740ACF5E30FF4AC2D722984FF132D23467F66009E7E98AF7E8F34487AC759715；打包文件13,584B，SHA-256：0867483C8D05A5971F3654BA191BFA413567FCEE6F20F935C76FF53F09E1D350；打包内容未含3个Secret值或B2应用密钥值。
- 最初样本代理503：两个限定token直连B2均200，部署的8项公开变量和3个Secret存在性/匹配检查通过；固定白名单诊断定位upstream-fetch。实际Miniflare/workerd复现redirect:error构造即TypeError，manual可用，无上游网络调用。Worker改manual并拒绝所有非200；Node CLI的error模式未改。
- [运行时复现](../../99_临时文件、缓存和构建中间产物/云端核验工具_cloud-verification-tools/非隐私存储代理_pages-storage-proxy_2026-10-25/重定向模式运行时复现_redirect-mode-workerd-reproduction.json)、[本次部署](../../99_临时文件、缓存和构建中间产物/云端核验工具_cloud-verification-tools/非隐私存储代理_pages-storage-proxy_2026-10-25/兼容性修正版部署结果_redirect-fix-deployment-result.json)、[修复后11项真实云端结果](../../99_临时文件、缓存和构建中间产物/云端核验工具_cloud-verification-tools/非隐私存储代理_pages-storage-proxy_2026-10-25/兼容性修正后云端链路实测_cloud-chain-after-redirect-fix.json)。初次503与诊断结果未覆盖或删除。
- 11项全部通过：页面/health/D1原标记、展示251B完整哈希/HEAD、原图角色未授权401/错Bearer401/正确授权424B完整哈希和private-no-store附件/HEAD、POST405、缺失路由404；所有响应未发现所用秘密值。电脑网络位置仍未证实，用户已反馈同一中国移动手机流量、关闭Wi-Fi和代理后新增图显示且原图保护为authentication-required，验收通过。
- 作者代理基础20项、诊断7项、manual修复6项mock分阶段通过（有重叠，不能合计为独立总数），独立审查确认manual拒绝302、原图鉴权在上游前、诊断无敏感回显。mock脚本为[代理合成测试](../../99_临时文件、缓存和构建中间产物/B2样本代理模拟验证_b2-sample-proxy-mock-validation_2026-10-25/B2样本代理模拟测试_b2-sample-proxy-mock.test.mjs)与[CLI合成测试](../../99_临时文件、缓存和构建中间产物/B2预检模拟验证_b2-preflight-mock-validation_2026-10-25/B2预检模拟测试_b2-preflight-mock.test.mjs)，早期计数取Agent实际工具输出，未伪造独立日志。
- 恢复：99同一代理目录的恢复与部署记录保留初始e8c5f4c5部署及旧44行发布目录，代码可逐文件恢复后部署该旧包，保留D1和样本对象；不永久删除云端数据。此次3项短期Secrets可保留到自然过期，旧代码不引用它们。
- 本轮未读取/上传真实原图、正式CMS或新个人数据；未做50MB边界、正式管理员认证、全量容量或免费限额极限测试。原图仍待下载完成，免费空间不足时不进行全量迁移。

## 中国移动新增存储链路验收与当前工程状态

- 用户实际回复“新增图能显示，原图保护返回 authentication-required”，对应此前问题明确要求中国移动手机流量、关闭Wi-Fi及代理。该结果只代表本次该网络，不承诺全国或持续可用；[用户验收记录](../../99_临时文件、缓存和构建中间产物/云端核验工具_cloud-verification-tools/非隐私存储代理_pages-storage-proxy_2026-10-25/中国移动新增存储链路用户验收_china-mobile-b2-user-acceptance_2026-10-25.json)。
- 收尾时根仓库已有其他会话提交010df365908c0d52cc3eae37dc2b5b53f52a6973，独立正式部署仓库已由其他工作更新至134873742bc3264455f58a34d055522f71c8aa56且当前无未提交改动。前文b5ce70d为早期历史状态，本轮没有更改该嵌套工程，也不把它回退。
- 交付文本68个本地链接检查通过，2个新源码哈希与独立审查版本一致、语法通过、秘密值未出现在源码/导航/方案/交接，diff空白检查通过。新增用户验收记录链接在同一目录创建并单独检查。

- B2预检CLI、样本代理与方案/导航已保存根仓库本地版本8bb3c9e / local/2026-10-25.006，未push。此标签为本地源码快照，实际样本云端部署/手机验收由独立证据支撑，不代表正式迁移完成。继续工作将以当前文件和134873742bc3264455f58a34d055522f71c8aa56独立工程为起点。

## 正式后台接入前的定向定位（只读，尚未实施）

- 独立Agent只读当前正式工程；主Agent复核worker上传及media关键代码。未修改嵌套仓库、正式业务代码或数据，也未把本阶段样本测试当作正式业务测试。
- [现有上传与公开媒体](../../20_源码与运行工程/site-deployment/worker/index.js)：upload硬限8,000,000字节并写R2，media不要求登录且公开缓存一年，未区分原图/派生图或按发布关系校验。因此不能直接把真实原始JPEG交给现有公开接口。
- [管理员前端](../../20_源码与运行工程/admin/script.js)的beforeImage是公开网页对照图；应保留其公开派生图用途，不能替换成私有原始文件。当前云端前端同样8MB上限，上传与CMS保存分两步，需记录失败/未引用对象，防重复占满空间。
- 现有D1管理员会话、PBKDF2、同源写入、版本冲突409可保留。CMS_state仍为单JSON、1,000,000字节；version是乐观锁计数。公开投影存在对象整体透传，原图定位、版本ID、摘要、字节及角色应使用独立媒体表，不能直接塞进公开photo对象。
- [构建脚本](../../20_源码与运行工程/site-deployment/scripts/build-client.mjs)会复制页面图片并保留输出；原始JPEG不得放入公开页面素材目录，正式发布用新输出目录和清单检查，防旧文件混入。
- 容量确定后的最小改动次序：独立媒体表与B2适配→公开派生图/管理员原图权限分离→JPEG50,000,000字节与派生图流程→失败恢复/容量预算→现有会话、发布过滤、409等定向测试和实际workerd集成→正式迁移。严守免费caps，不研究百度网盘，不降低原图云端保存要求。
- 用户原图本地目录/总容量仍待提供；已发出下载状态和完整路径问题。10GB足够与否会影响选型，当前不实施可能因容量结论失效的全量迁移；原图、正式CMS及50MB上传均未向云端迁移。
