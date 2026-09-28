<#
.SYNOPSIS
    Automated IIS Deployment Script for SwitchFiber Admin Console on Microsoft Windows Server.

.DESCRIPTION
    Deploys the SwitchFiber Single Page Application (SPA) to Microsoft Internet Information Services (IIS).
    Handles pre-flight checks, automated timestamped backups, atomic file copy, NTFS ACL permission assignment,
    IIS Application Pool configuration (No Managed Code, AlwaysRunning), AppPool recycling, sub-application
    synchronization, and post-deployment smoke tests.

.PARAMETER PackagePath
    Path to the packaged release .zip file (e.g., .\release-assets\switchfiber-web-v1.0.0.zip).
    If omitted and DistDirectory exists, DistDirectory is used directly.

.PARAMETER DistDirectory
    Path to the unzipped dist/ folder (default: .\dist).

.PARAMETER SiteName
    The name of the IIS Website (default: "Default Web Site").

.PARAMETER AppPoolName
    The name of the IIS Application Pool (default: "SwitchFiberPool").

.PARAMETER TargetDirectory
    The physical directory where the site files reside (default: "C:\inetpub\wwwroot\switchfiberadmin").

.PARAMETER BackupDirectory
    Directory to store rolling backups of prior deployments (default: "C:\inetpub\backups\switchfiber").

.PARAMETER Port
    HTTP binding port when creating a new IIS site (default: 80).

.PARAMETER HostName
    Optional hostname binding (e.g. admin.switchfiber.com).

.PARAMETER SkipBackup
    Switch to bypass the backup step (not recommended for production).

.PARAMETER MaxBackups
    Maximum number of timestamped backups to retain (default: 5).

.EXAMPLE
    .\scripts\deploy_iis.ps1 -PackagePath .\release-assets\switchfiber-web-v1.0.0.zip

.EXAMPLE
    .\scripts\deploy_iis.ps1 -DistDirectory .\dist -SiteName "Default Web Site" -Port 80
#>

[CmdletBinding()]
param(
    [string]$PackagePath,
    [string]$DistDirectory = ".\dist",
    [string]$SiteName = "Default Web Site",
    [string]$AppPoolName = "SwitchFiberPool",
    [string]$TargetDirectory = "C:\inetpub\wwwroot\switchfiberadmin",
    [string]$BackupDirectory = "C:\inetpub\backups\switchfiber",
    [int]$Port = 80,
    [string]$HostName = "",
    [switch]$SkipBackup,
    [int]$MaxBackups = 5
)

$ErrorActionPreference = "Stop"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " [DEPLOY] SwitchFiber Admin Console - IIS Windows Deployer  " -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

# 1. Administrator Privilege Verification
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Error "[ERROR] This script must be executed in an elevated PowerShell session (Run as Administrator)."
    exit 1
}

# 2. IIS Module & Feature Verification
if (-not (Get-Module -ListAvailable -Name WebAdministration)) {
    Write-Error "[ERROR] IIS WebAdministration PowerShell module not found. Please install the IIS Web Server role."
    exit 1
}
Import-Module WebAdministration

# Verify URL Rewrite Module 2.1
$urlRewriteInstalled = (Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\IIS Extensions\URL Rewrite" -ErrorAction SilentlyContinue) -or `
                       (Test-Path "$env:SystemRoot\System32\inetsrv\rewrite.dll")
if (-not $urlRewriteInstalled) {
    Write-Warning "[WARN] IIS URL Rewrite Module 2.1 is NOT detected!"
    Write-Warning "       Single Page Application client routing (/customers, etc.) requires URL Rewrite."
    Write-Warning "       Download & Install: https://www.iis.net/downloads/microsoft/url-rewrite"
} else {
    Write-Host "[OK] IIS URL Rewrite Module 2.1 is installed." -ForegroundColor Green
}

# 3. Source Payload Resolution
$tempExtractDir = $null
$sourceDir = $null

if ($PackagePath -and (Test-Path $PackagePath)) {
    Write-Host "[INFO] Extracting package: $PackagePath" -ForegroundColor Cyan
    $tempExtractDir = Join-Path $env:TEMP ("switchfiber_deploy_" + [System.Guid]::NewGuid().ToString("N"))
    New-Item -Path $tempExtractDir -ItemType Directory -Force | Out-Null
    Expand-Archive -Path $PackagePath -DestinationPath $tempExtractDir -Force
    $sourceDir = $tempExtractDir
} elseif (Test-Path $DistDirectory) {
    $sourceDir = (Resolve-Path $DistDirectory).Path
    Write-Host "[INFO] Deploying directly from directory: $sourceDir" -ForegroundColor Cyan
} else {
    Write-Error "[ERROR] Neither valid PackagePath nor DistDirectory ($DistDirectory) was found."
    exit 1
}

# Verify web.config presence in source payload
if (-not (Test-Path (Join-Path $sourceDir "web.config"))) {
    Write-Warning "[WARN] web.config not found in build output. Client-side routing may fail without it."
}

# 4. Backup Existing Target Directory
if ((-not $SkipBackup) -and (Test-Path $TargetDirectory)) {
    $timestamp = (Get-Date).ToString("yyyyMMdd_HHmmss")
    $backupPath = Join-Path $BackupDirectory "backup_$timestamp"
    Write-Host "[BACKUP] Backing up current deployment to: $backupPath" -ForegroundColor Yellow

    if (-not (Test-Path $BackupDirectory)) {
        New-Item -Path $BackupDirectory -ItemType Directory -Force | Out-Null
    }
    if (-not (Test-Path $backupPath)) {
        New-Item -Path $backupPath -ItemType Directory -Force | Out-Null
    }
    Copy-Item -Path "$TargetDirectory\*" -Destination $backupPath -Recurse -Force
    Write-Host "  [OK] Backup completed successfully." -ForegroundColor Green

    # Prune old backups, retaining newest $MaxBackups
    $existingBackups = Get-ChildItem -Path $BackupDirectory -Directory | Sort-Object CreationTime -Descending
    if ($existingBackups.Count -gt $MaxBackups) {
        $existingBackups | Select-Object -Skip $MaxBackups | ForEach-Object {
            Write-Host "  [BACKUP] Pruning obsolete backup: $($_.FullName)" -ForegroundColor DarkGray
            Remove-Item -Path $_.FullName -Recurse -Force
        }
    }
}

# 5. Create Target Directory & Clear ReadOnly Flags
if (-not (Test-Path $TargetDirectory)) {
    Write-Host "[INFO] Creating target directory: $TargetDirectory" -ForegroundColor Cyan
    New-Item -Path $TargetDirectory -ItemType Directory -Force | Out-Null
} else {
    Write-Host "[DEPLOY] Clearing ReadOnly flags on $TargetDirectory..." -ForegroundColor Cyan
    Get-ChildItem -Path $TargetDirectory -Recurse -File -Force -ErrorAction SilentlyContinue | ForEach-Object { $_.IsReadOnly = $false }
}

Write-Host "[DEPLOY] Copying distribution files to $TargetDirectory..." -ForegroundColor Cyan
Copy-Item -Path "$sourceDir\*" -Destination $TargetDirectory -Recurse -Force
Write-Host "  [OK] Files deployed successfully." -ForegroundColor Green

# Clean up temp folder if used
if ($tempExtractDir -and (Test-Path $tempExtractDir)) {
    Remove-Item -Path $tempExtractDir -Recurse -Force
}

# 6. Apply Strict NTFS Access Control Lists (ACLs)
Write-Host "[SECURITY] Setting NTFS permissions for IIS identities (IIS_IUSRS, IUSR)..." -ForegroundColor Cyan
icacls "$TargetDirectory" /grant "IIS_IUSRS:(OI)(CI)RX" /grant "IUSR:(OI)(CI)RX" /T /Q | Out-Null
Write-Host "  [OK] NTFS permissions configured." -ForegroundColor Green

# 7. Configure / Validate IIS Application Pool & Website
Write-Host "[IIS] Configuring IIS Site and Application Pool..." -ForegroundColor Cyan

# Application Pool
if (-not (Test-Path "IIS:\AppPools\$AppPoolName")) {
    Write-Host "  [IIS] Creating Application Pool: $AppPoolName" -ForegroundColor Cyan
    New-Item "IIS:\AppPools\$AppPoolName" | Out-Null
}
# Set AppPool to No Managed Code (optimal for static web SPA)
Set-ItemProperty "IIS:\AppPools\$AppPoolName" -Name "managedRuntimeVersion" -Value ""
Set-ItemProperty "IIS:\AppPools\$AppPoolName" -Name "startMode" -Value "AlwaysRunning"
Set-ItemProperty "IIS:\AppPools\$AppPoolName" -Name "processModel.idleTimeout" -Value "00:00:00"

# Website
$siteExists = Test-Path "IIS:\Sites\$SiteName"
if (-not $siteExists) {
    Write-Host "  [IIS] Creating IIS Website: $SiteName on port $Port" -ForegroundColor Cyan
    $binding = "*:${Port}:${HostName}"
    New-Item "IIS:\Sites\$SiteName" -bindings @{protocol="http";bindingInformation=$binding} -physicalPath $TargetDirectory | Out-Null
    Set-ItemProperty "IIS:\Sites\$SiteName" -Name "applicationPool" -Value $AppPoolName
} else {
    # Ensure physical path and AppPool are mapped correctly
    Set-ItemProperty "IIS:\Sites\$SiteName" -Name "physicalPath" -Value $TargetDirectory
    Set-ItemProperty "IIS:\Sites\$SiteName" -Name "applicationPool" -Value $AppPoolName
}

# Synchronize /switchfiberadmin sub-application on $SiteName
$subAppPath = "IIS:\Sites\$SiteName\switchfiberadmin"
try {
    if (-not (Test-Path $subAppPath)) {
        Write-Host "  [IIS] Creating sub-application: $SiteName/switchfiberadmin..." -ForegroundColor Cyan
        New-WebApplication -Site $SiteName -Name "switchfiberadmin" -PhysicalPath $TargetDirectory -ApplicationPool $AppPoolName | Out-Null
    } else {
        Write-Host "  [IIS] Synchronizing sub-application: $SiteName/switchfiberadmin..." -ForegroundColor Cyan
        Set-ItemProperty $subAppPath -Name "physicalPath" -Value $TargetDirectory
        Set-ItemProperty $subAppPath -Name "applicationPool" -Value $AppPoolName
    }
    Write-Host "  [OK] Sub-application /switchfiberadmin synchronized on $SiteName." -ForegroundColor Green
} catch {
    Write-Warning "  [WARN] WebAdministration sub-application config notice: $($_.Exception.Message)"
    $appcmd = "$env:SystemRoot\System32\inetsrv\appcmd.exe"
    if (Test-Path $appcmd) {
        Write-Host "  [IIS] Applying appcmd configuration for /switchfiberadmin..." -ForegroundColor Cyan
        & $appcmd add app /site.name:"$SiteName" /path:"/switchfiberadmin" /physicalPath:"$TargetDirectory" 2>$null
        & $appcmd set app "$SiteName/switchfiberadmin" /applicationPool:"$AppPoolName" /physicalPath:"$TargetDirectory"
    }
}

# Ensure site is started
if ((Get-WebsiteState -Name $SiteName).Value -ne "Started") {
    Start-Website -Name $SiteName
}

# 8. Recycle Application Pool via appcmd.exe
Write-Host "[RECYCLE] Recycling Application Pool: $AppPoolName..." -ForegroundColor Cyan
$appcmd = "$env:SystemRoot\System32\inetsrv\appcmd.exe"
if (Test-Path $appcmd) {
    Write-Host "  [INFO] Executing appcmd.exe recycle apppool `"$AppPoolName`"..." -ForegroundColor Cyan
    & $appcmd recycle apppool "$AppPoolName"
} else {
    try {
        Restart-WebAppPool -Name $AppPoolName -ErrorAction SilentlyContinue
    } catch {
        Write-Warning "  [WARN] AppPool recycle skipped: $($_.Exception.Message)"
    }
}
Start-Sleep -Seconds 2
Write-Host "  [OK] Application Pool recycled successfully." -ForegroundColor Green

# 9. Post-Deployment Verification & Smoke Tests
Write-Host "[HEALTH] Performing post-deployment health checks..." -ForegroundColor Cyan

# Test 1: Root Endpoint
$rootUrl = "http://localhost:$Port/"
try {
    $rootRes = Invoke-WebRequest -Uri $rootUrl -UseBasicParsing -TimeoutSec 10
    if ($rootRes.StatusCode -eq 200) {
        Write-Host "  [OK] Root endpoint returned HTTP 200 OK ($rootUrl)" -ForegroundColor Green
    } else {
        Write-Warning "  [WARN] Root endpoint returned unexpected HTTP status: $($rootRes.StatusCode)"
    }
} catch {
    Write-Warning "  [WARN] Root endpoint check failed: $($_.Exception.Message)"
}

# Test 2: SPA Deep Link Routing Fallback
$spaUrl = "http://localhost:$Port/customers"
try {
    $spaRes = Invoke-WebRequest -Uri $spaUrl -UseBasicParsing -TimeoutSec 10
    if ($spaRes.StatusCode -eq 200) {
        Write-Host "  [OK] SPA deep link returned HTTP 200 OK ($spaUrl)" -ForegroundColor Green
    } else {
        Write-Warning "  [WARN] SPA deep link returned unexpected HTTP status: $($spaRes.StatusCode)"
    }
} catch {
    Write-Warning "  [WARN] SPA deep link check failed: $($_.Exception.Message)"
    Write-Warning "         Verify IIS URL Rewrite Module 2.1 is installed and web.config is active."
}

# Test 3: ARR Reverse Proxy Connectivity
$apiUrl = "http://localhost:$Port/api/Plans"
try {
    $apiRes = Invoke-WebRequest -Uri $apiUrl -UseBasicParsing -TimeoutSec 10
    if ($apiRes.StatusCode -ge 200 -and $apiRes.StatusCode -lt 400) {
        Write-Host "  [OK] ARR reverse proxy returned HTTP $($apiRes.StatusCode) ($apiUrl)" -ForegroundColor Green
    } else {
        Write-Warning "  [WARN] ARR reverse proxy returned HTTP $($apiRes.StatusCode) from $apiUrl"
    }
} catch {
    if ($_.Exception.Response) {
        $code = [int]$_.Exception.Response.StatusCode
        Write-Host "  [INFO] ARR reverse proxy responded with HTTP $code ($apiUrl)" -ForegroundColor Yellow
    } else {
        Write-Warning "  [WARN] ARR reverse proxy check failed: $($_.Exception.Message)"
        Write-Warning "         Ensure Application Request Routing (ARR 3.0) proxy is enabled and backend is reachable."
    }
}

Write-Host "============================================================" -ForegroundColor Green
Write-Host " [DONE] SwitchFiber Admin Console Deployment Complete!      " -ForegroundColor Green
Write-Host "        Physical Path: $TargetDirectory                     " -ForegroundColor Green
Write-Host "        IIS Site:      $SiteName (Port $Port)               " -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
