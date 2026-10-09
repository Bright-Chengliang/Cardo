# D:\D_disk\Code\Focus\scripts\start-background.ps1
# Cardo 深度工作与精力管理系统后台静默启动脚本

param(
    [int]$Port = 3025,
    [switch]$Restart
)

$ErrorActionPreference = 'Continue'
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$LogsDir = Join-Path $ProjectRoot ".logs"
$RunDir = Join-Path $ProjectRoot ".run"

if (-not (Test-Path -LiteralPath $LogsDir)) {
    New-Item -ItemType Directory -Force -Path $LogsDir | Out-Null
}
if (-not (Test-Path -LiteralPath $RunDir)) {
    New-Item -ItemType Directory -Force -Path $RunDir | Out-Null
}

$StdLog = Join-Path $LogsDir "cardo.log"
$ErrLog = Join-Path $LogsDir "cardo.err.log"
$PidFile = Join-Path $RunDir "cardo.pid"

# 如果指定了 -Restart 或端口被占用，先清理现有进程
if ($Restart) {
    $conns = @(Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue)
    foreach ($c in $conns) {
        try {
            Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue
        } catch {}
    }
    if (Test-Path -LiteralPath $PidFile) {
        try {
            $savedPid = Get-Content -LiteralPath $PidFile -ErrorAction SilentlyContinue
            if ($savedPid) { Stop-Process -Id $savedPid -Force -ErrorAction SilentlyContinue }
        } catch {}
        Remove-Item -LiteralPath $PidFile -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Milliseconds 800
}

# 幂等性检查：如果端口已经在监听，直接退出
$activeConns = @(Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue)
if ($activeConns.Count -gt 0) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    try {
        Add-Content -LiteralPath $StdLog -Value "[$timestamp] Cardo already listening on port $Port (PID: $($activeConns[0].OwningProcess)), skipping start." -Encoding UTF8 -ErrorAction SilentlyContinue
    } catch {}
    exit 0
}

# 确保已经构建过
$BuildDir = Join-Path $ProjectRoot ".next"
if (-not (Test-Path -LiteralPath $BuildDir)) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    try {
        Add-Content -LiteralPath $StdLog -Value "[$timestamp] .next build not found, building project..." -Encoding UTF8 -ErrorAction SilentlyContinue
    } catch {}
    Set-Location -LiteralPath $ProjectRoot
    & cmd.exe /c "npm run build"
}

# 启动 Next.js 生产服务
$nodeExe = (Get-Command node.exe -ErrorAction SilentlyContinue).Source
if (-not $nodeExe) { $nodeExe = "node.exe" }
$nextBin = Join-Path $ProjectRoot "node_modules\next\dist\bin\next"

$proc = Start-Process -FilePath $nodeExe `
    -ArgumentList @($nextBin, "start", "-p", "$Port") `
    -WorkingDirectory $ProjectRoot `
    -WindowStyle Hidden `
    -RedirectStandardOutput $StdLog `
    -RedirectStandardError $ErrLog `
    -PassThru

if ($proc -and $proc.Id) {
    Set-Content -LiteralPath $PidFile -Value $proc.Id -Encoding ASCII -ErrorAction SilentlyContinue
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    try {
        Add-Content -LiteralPath $StdLog -Value "[$timestamp] Cardo background service started with PID $($proc.Id) on port $Port." -Encoding UTF8 -ErrorAction SilentlyContinue
    } catch {}
}
