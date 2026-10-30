param(
    [Parameter(Mandatory=$true)][string]$Message,
    [Parameter(Mandatory=$true)][string[]]$Paths,
    [string]$Validation = '未声明业务验证；仅保存本地修改快照'
)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$gitArgs = @('--literal-pathspecs','-c',"safe.directory=$projectRoot",'-c','core.quotepath=false','-C',$projectRoot)
function Invoke-ProjectGit([string[]]$CommandArgs) {
    $result = & git @gitArgs @CommandArgs
    if ($LASTEXITCODE -ne 0) {throw ('Git 命令失败：' + $CommandArgs[0])}
    $result
}
$top = Invoke-ProjectGit -CommandArgs @('rev-parse','--show-toplevel')
if ([IO.Path]::GetFullPath($top) -ne [IO.Path]::GetFullPath($projectRoot)) {throw '脚本必须位于项目自身仓库中。'}
if (@(Invoke-ProjectGit -CommandArgs @('diff','--cached','--name-only')).Count) {throw '暂存区已有内容，请先核对并独立保存，避免混入其他修改。'}
$safePaths = @()
foreach ($relative in $Paths) {
    if ([IO.Path]::IsPathRooted($relative) -or $relative -match '(^|[\\/])\.\.([\\/]|$)' -or $relative -match '(^|[\\/])\.git(?:-new|-upload)?([\\/]|$)') {throw "路径不允许：$relative"}
    $full = [IO.Path]::GetFullPath((Join-Path $projectRoot $relative))
    if (-not $full.StartsWith($projectRoot.TrimEnd('\')+'\',[StringComparison]::OrdinalIgnoreCase)) {throw "路径超出项目：$relative"}
    if (Test-Path -LiteralPath $full -PathType Container) {throw '请逐文件指定 Paths，不接受整个目录。'}
    $parent = Split-Path $full -Parent
    while ($parent -and $parent -ne $projectRoot) {
        if (Test-Path -LiteralPath $parent) {
            if ((Get-Item -LiteralPath $parent -Force).LinkType -in @('Junction','SymbolicLink')) {throw "请使用真实源码路径，避免目录联接：$relative"}
        }
        $parent = Split-Path $parent -Parent
    }
    & git @gitArgs --no-literal-pathspecs check-ignore --no-index --quiet -- $relative
    if ($LASTEXITCODE -eq 0) {throw "路径已被保护性忽略，不纳入提交：$relative"}
    if ($LASTEXITCODE -gt 1) {throw '忽略规则检查失败。'}
    if (-not (Test-Path -LiteralPath $full)) {
        & git @gitArgs ls-files --error-unmatch -- $relative 2>$null | Out-Null
        if ($LASTEXITCODE -ne 0) {throw "文件不存在且不属于已跟踪文件：$relative"}
    }
    $safePaths += $full.Substring($projectRoot.TrimEnd('\').Length + 1).Replace('\','/')
}
$gitDir = Invoke-ProjectGit -CommandArgs @('rev-parse','--absolute-git-dir')
$pathspec = Join-Path $gitDir ('version-paths-'+[Guid]::NewGuid().ToString('N')+'.tmp')
try {
    [IO.File]::WriteAllBytes($pathspec,[Text.Encoding]::UTF8.GetBytes(($safePaths -join [char]0)+[char]0))
    Invoke-ProjectGit -CommandArgs @('add',"--pathspec-from-file=$pathspec",'--pathspec-file-nul') | Out-Null
} finally {if (Test-Path -LiteralPath $pathspec) {Remove-Item -LiteralPath $pathspec -Force}}
& git @gitArgs diff --cached --quiet
if ($LASTEXITCODE -eq 0) {Write-Output '没有可保存的修改；未创建空提交或标签。'; exit 0}
if ($LASTEXITCODE -ne 1) {throw '暂存区比较失败。'}
$stagedPaths = @(Invoke-ProjectGit -CommandArgs @('diff','--cached','--name-only'))
foreach ($stagedPath in $stagedPaths) {
    if ($stagedPath -notin $safePaths) {throw "出现未指定的暂存文件，请核对并停止同仓库并行保存：$stagedPath"}
}
$date = [DateTimeOffset]::UtcNow.ToOffset([TimeSpan]::FromHours(8)).ToString('yyyy-MM-dd')
$prefix = "local/$date."
$numbers = @(Invoke-ProjectGit -CommandArgs @('tag','--list',"$prefix*") | Where-Object {$_ -match ('^'+[regex]::Escape($prefix)+'\d+$')} | ForEach-Object {[int]$_.Substring($prefix.Length)})
$next = if ($numbers.Count) {($numbers | Measure-Object -Maximum).Maximum + 1} else {1}
$tag = $prefix + ('{0:D3}' -f [int]$next)
Invoke-ProjectGit -CommandArgs @('commit','-m',$Message,'-m',("验证："+$Validation))
Invoke-ProjectGit -CommandArgs @('tag','-a',$tag,'-m',("本地修改快照："+$Message+"`n验证："+$Validation+"`n本标签不代表发布或业务验收。"))
Write-Output ("已保存本地版本：$tag")
Invoke-ProjectGit -CommandArgs @('show','--no-patch','--format=%h %cs %s','HEAD')
