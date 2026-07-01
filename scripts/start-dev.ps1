param(
    [switch]$Check,
    [switch]$Restart
)

# 冻品批发系统一键启动脚本
# 默认使用开发模式：
# - 后端：Django runserver，代码变更后自动重载
# - 前端：Vite dev server，页面热更新
# 用法：双击 start-dev.bat，或在 PowerShell 中执行 .\start-dev.ps1
# 检查模式：.\start-dev.ps1 -Check
# 强制重启：.\start-dev.ps1 -Restart

$ErrorActionPreference = 'Stop'

try {
    [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
} catch {
    # 某些终端不支持修改编码，忽略即可
}

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Root = Split-Path -Parent $ScriptDir
$BackendDir = Join-Path $Root 'src\backend\InvenTree'
$FrontendDir = Join-Path $Root 'src\frontend'
$BackendPort = 8000
$FrontendPort = 5173
$BackendUrl = "http://127.0.0.1:$BackendPort"
$FrontendUrl = "http://127.0.0.1:$FrontendPort/web/"

function Write-Info($Message) {
    Write-Host "[启动] $Message" -ForegroundColor Cyan
}

function Write-Warn($Message) {
    Write-Host "[注意] $Message" -ForegroundColor Yellow
}

function Write-Fail($Message) {
    Write-Host "[错误] $Message" -ForegroundColor Red
}

function Get-Listener($Port) {
    Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue |
        Select-Object -First 1
}

function Get-ProcessCommandLine($ProcessId) {
    if (-not $ProcessId) {
        return ''
    }

    $ProcessInfo = Get-CimInstance Win32_Process -Filter "ProcessId = $ProcessId" -ErrorAction SilentlyContinue
    if ($ProcessInfo) {
        return [string]$ProcessInfo.CommandLine
    }

    return ''
}

function Stop-Listener($Listener, $Name) {
    if (-not $Listener) {
        return
    }

    $ProcessId = $Listener.OwningProcess
    $CommandLine = Get-ProcessCommandLine $ProcessId

    $IsProjectService = $false
    if ($Name -eq '后端') {
        $IsProjectService = $CommandLine -match 'manage.py' -and $CommandLine -match 'runserver'
    } elseif ($Name -eq '前端') {
        $IsProjectService = $CommandLine -match [regex]::Escape($FrontendDir) -and $CommandLine -match 'vite'
    }

    if (-not $IsProjectService) {
        Write-Warn "$Name 端口被 PID：$ProcessId 占用，但它不像本项目开发服务，本脚本不会自动关闭它。"
        return
    }

    Write-Warn "$Name 端口被占用，正在关闭旧进程 PID：$ProcessId。"
    Stop-Process -Id $ProcessId -Force
    Start-Sleep -Seconds 1
}

function Resolve-Python {
    $Candidates = @(
        (Join-Path $Root '.venv312\Scripts\python.exe'),
        (Join-Path $Root '.venv\Scripts\python.exe')
    )

    foreach ($Candidate in $Candidates) {
        if (Test-Path $Candidate) {
            return $Candidate
        }
    }

    $Command = Get-Command python -ErrorAction SilentlyContinue
    if ($Command) {
        return $Command.Source
    }

    return $null
}

function Resolve-Yarn {
    $Command = Get-Command yarn.cmd -ErrorAction SilentlyContinue
    if ($Command) {
        return @{
            Display = $Command.Source
            Invoke = "& '$($Command.Source)'"
        }
    }

    $Command = Get-Command yarn -ErrorAction SilentlyContinue
    if ($Command) {
        return @{
            Display = $Command.Source
            Invoke = "& '$($Command.Source)'"
        }
    }

    $Command = Get-Command corepack.cmd -ErrorAction SilentlyContinue
    if ($Command) {
        return @{
            Display = "$($Command.Source) yarn"
            Invoke = "& '$($Command.Source)' yarn"
        }
    }

    $Command = Get-Command corepack -ErrorAction SilentlyContinue
    if ($Command) {
        return @{
            Display = "$($Command.Source) yarn"
            Invoke = "& '$($Command.Source)' yarn"
        }
    }

    return $null
}

function Assert-Path($Path, $Name) {
    if (-not (Test-Path $Path)) {
        throw "$Name 不存在：$Path"
    }
}

function Start-ServiceWindow($Title, $WorkingDirectory, $Command) {
    $EscapedTitle = $Title.Replace("'", "''")
    $EscapedCommand = $Command.Replace("'", "''")
    $WindowCommand = @"
`$Host.UI.RawUI.WindowTitle = '$EscapedTitle'
try {
    [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
} catch {}
Write-Host '=== $EscapedTitle ===' -ForegroundColor Cyan
Write-Host '$EscapedCommand' -ForegroundColor DarkGray
$Command
"@

    Start-Process powershell.exe `
        -WorkingDirectory $WorkingDirectory `
        -WindowStyle Normal `
        -ArgumentList @(
            '-NoExit',
            '-ExecutionPolicy', 'Bypass',
            '-Command', $WindowCommand
        )
}

try {
    Write-Info "项目目录：$Root"

    Assert-Path $BackendDir '后端目录'
    Assert-Path $FrontendDir '前端目录'

    $Python = Resolve-Python
    if (-not $Python) {
        throw '没有找到 Python。请先确认 .venv312 或 .venv 存在，或者系统 PATH 中有 python。'
    }

    $Yarn = Resolve-Yarn
    if (-not $Yarn) {
        throw '没有找到 yarn 或 corepack。请先安装 Node.js，并执行 corepack enable。'
    }

    $ManagePy = Join-Path $BackendDir 'manage.py'
    $PackageJson = Join-Path $FrontendDir 'package.json'
    Assert-Path $ManagePy 'manage.py'
    Assert-Path $PackageJson '前端 package.json'

    $BackendListener = Get-Listener $BackendPort
    $FrontendListener = Get-Listener $FrontendPort

    if ($Restart -and -not $Check) {
        Stop-Listener $BackendListener '后端'
        Stop-Listener $FrontendListener '前端'
        $BackendListener = Get-Listener $BackendPort
        $FrontendListener = Get-Listener $FrontendPort
    }

    if ($Check) {
        Write-Info '检查模式：不会启动服务，只检查路径、依赖和端口。'
        if ($BackendListener) {
            Write-Warn "后端端口 $BackendPort 已被占用，PID：$($BackendListener.OwningProcess)。"
        } else {
            Write-Info "后端端口 $BackendPort 可用。"
        }

        if ($FrontendListener) {
            Write-Warn "前端端口 $FrontendPort 已被占用，PID：$($FrontendListener.OwningProcess)。"
        } else {
            Write-Info "前端端口 $FrontendPort 可用。"
        }

        Write-Info "Python：$Python"
        Write-Info "Yarn：$($Yarn.Display)"
        Write-Host ''
        Write-Host '检查完成。' -ForegroundColor Green
        exit 0
    }

    if ($BackendListener) {
        Write-Warn "后端端口 $BackendPort 已被占用，PID：$($BackendListener.OwningProcess)。本次不重复启动后端。"
        $BackendCommandLine = Get-ProcessCommandLine $BackendListener.OwningProcess
        if ($BackendCommandLine -match 'manage.py' -and $BackendCommandLine -match 'runserver') {
            Write-Info "后端已经在运行：$BackendUrl"
        } else {
            Write-Warn '占用后端端口的不是当前开发后端。需要强制重启时请运行：scripts\start-dev.ps1 -Restart'
        }
    } else {
        $BackendCommand = "`$env:INVENTREE_DEBUG='True'; & '$Python' manage.py runserver 127.0.0.1:$BackendPort"
        Start-ServiceWindow 'InvenTree 后端 8000（热更新）' $BackendDir $BackendCommand
        Write-Info "后端热更新启动中：$BackendUrl"
    }

    if ($FrontendListener) {
        Write-Warn "前端端口 $FrontendPort 已被占用，PID：$($FrontendListener.OwningProcess)。本次不重复启动前端。"
        $FrontendCommandLine = Get-ProcessCommandLine $FrontendListener.OwningProcess
        if ($FrontendCommandLine -match [regex]::Escape($FrontendDir) -and $FrontendCommandLine -match 'vite') {
            Write-Info "前端热更新已经在运行：$FrontendUrl"
        } else {
            Write-Warn '占用前端端口的不是当前项目 Vite 服务。需要强制重启时请运行：scripts\start-dev.ps1 -Restart'
        }
    } else {
        $NodeModules = Join-Path $FrontendDir 'node_modules'
        if (-not (Test-Path $NodeModules)) {
            Write-Warn '前端 node_modules 不存在，先在前端窗口中执行 yarn install。'
            $FrontendCommand = "$($Yarn.Invoke) install; if (`$LASTEXITCODE -eq 0) { $($Yarn.Invoke) run dev --host 127.0.0.1 --port $FrontendPort }"
        } else {
            $FrontendCommand = "$($Yarn.Invoke) run dev --host 127.0.0.1 --port $FrontendPort"
        }

        Start-ServiceWindow 'InvenTree 前端 5173（热更新）' $FrontendDir $FrontendCommand
        Write-Info "前端热更新启动中：$FrontendUrl"
    }

    Write-Host ''
    Write-Host '热更新启动命令已发出。请等待两个窗口都显示服务启动完成。' -ForegroundColor Green
    Write-Host "访问地址：$FrontendUrl" -ForegroundColor Green
    Write-Host '改前端代码会自动刷新页面；改后端 Python 代码会自动重启后端服务。' -ForegroundColor Green
    Write-Host '关闭服务：直接关闭弹出的前端/后端窗口即可。' -ForegroundColor Green
} catch {
    Write-Fail $_.Exception.Message
    exit 1
}
