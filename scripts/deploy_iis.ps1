<#
.SYNOPSIS
    Automated IIS Deployment Script for SwitchFiber Admin Console on Microsoft Windows Server.

.DESCRIPTION
    Deploys the SwitchFiber Single Page Application (SPA) to Microsoft Internet Information Services (IIS).
    Handles pre-flight checks, automated timestamped backups, atomic file copy, NTFS ACL permission assignment,
    IIS Application Pool configuration (No Managed Code), AppPool recycling, and post-deployment health check.

.PARAMETER PackagePath
    Path to the packaged release .zip file (e.g., .\release-assets\switchfiber-web-v1.0.0.zip).
    If omitted and DistDirectory exists, DistDirectory is used directly.

.PARAMETER DistDirectory
    Path to the unzipped dist/ folder (default: .\dist).

.PARAMETER SiteName
    The name of the IIS Website (default: "SwitchFiber").

.PARAMETER AppPoolName
    The name of the IIS Application Pool (default: "SwitchFiber").

.PARAMETER TargetDirectory
    The physical directory where the site files reside (default: "C:\inetpub\wwwroot\switchfiber").

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
    .\scripts\deploy_iis.ps1 -DistDirectory .\dist -SiteName "SwitchFiber" -Port 80
#>

[CmdletBinding()]
param(
    [string]$PackagePath,
    [string]$DistDirectory = ".\dist",
    [string]$SiteName = "SwitchFiber",
    [string]$AppPoolName = "SwitchFiber",
    [string]$TargetDirectory = "C:\inetpub\wwwroot\switchfiber",
    [string]$BackupDirectory = "C:\inetpub\backups\switchfiber",
    [int]$Port = 80,
    [string]$HostName = "",
    [switch]$SkipBackup,
    [int]$MaxBackups = 5
)

$ErrorActionPreference = "Stop"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " 🚀 SwitchFiber Admin Console - IIS Windows Server Deployer " -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

# 1. Administrator Privilege Verification
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Error "❌ This script must be executed in an elevated PowerShell session (Run as Administrator)."
    exit 1
}

# 2. IIS Module & Feature Verification
if (-not (Get-Module -ListAvailable -Name WebAdministration)) {
    Write-Error "❌ IIS WebAdministration PowerShell module not found. Please install the IIS Web Server role."
    exit 1
}
Import-Module WebAdministration

# Verify URL Rewrite Module 2.1
$urlRewriteInstalled = (Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\IIS Extensions\URL Rewrite" -ErrorAction SilentlyContinue) -or `
                       (Test-Path "$env:SystemRoot\System32\inetsrv\rewrite.dll")
if (-not $urlRewriteInstalled) {
    Write-Warning "⚠️ IIS URL Rewrite Module 2.1 is NOT detected!"
    Write-Warning "   Single Page Application client routing (/customers, etc.) requires URL Rewrite."
    Write-Warning "   Download & Install: https://www.iis.net/downloads/microsoft/url-rewrite"
} else {
    Write-Host "✅ IIS URL Rewrite Module is installed." -ForegroundColor Green
}

# 3. Source Payload Resolution
$tempExtractDir = $null
$sourceDir = $null

if ($PackagePath -and (Test-Path $PackagePath)) {
    Write-Host "📦 Extracting package: $PackagePath" -ForegroundColor Cyan
    $tempExtractDir = Join-Path $env:TEMP ("switchfiber_deploy_" + [System.Guid]::NewGuid().ToString("N"))
    New-Item -Path $tempExtractDir -ItemType Directory -Force | Out-Null
    Expand-Archive -Path $PackagePath -DestinationPath $tempExtractDir -Force
    $sourceDir = $tempExtractDir
} elseif (Test-Path $DistDirectory) {
    $sourceDir = (Resolve-Path $DistDirectory).Path
    Write-Host "📂 Deploying directly from directory: $sourceDir" -ForegroundColor Cyan
} else {
    Write-Error "❌ Neither valid PackagePath nor DistDirectory ($DistDirectory) was found."
    exit 1
}

# Verify web.config presence in source payload
if (-not (Test-Path (Join-Path $sourceDir "web.config"))) {
    Write-Warning "⚠️ Warning: web.config not found in build output. Client-side routing may fail without it."
}

# 4. Backup Existing Target Directory
if ((-not $SkipBackup) -and (Test-Path $TargetDirectory)) {
    $timestamp = (Get-Date).ToString("yyyyMMdd_HHmmss")
    $backupPath = Join-Path $BackupDirectory "backup_$timestamp"
    Write-Host "💾 Backing up current deployment to: $backupPath" -ForegroundColor Yellow

    if (-not (Test-Path $BackupDirectory)) {
        New-Item -Path $BackupDirectory -ItemType Directory -Force | Out-Null
    }
    Copy-Item -Path "$TargetDirectory\*" -Destination $backupPath -Recurse -Force

    # Prune old backups, retaining newest $MaxBackups
    $existingBackups = Get-ChildItem -Path $BackupDirectory -Directory | Sort-Object CreationTime -Descending
    if ($existingBackups.Count -gt $MaxBackups) {
        $existingBackups | Select-Object -Skip $MaxBackups | ForEach-Object {
            Write-Host "  🧹 Pruning obsolete backup: $($_.FullName)" -ForegroundColor DarkGray
            Remove-Item -Path $_.FullName -Recurse -Force
        }
    }
}

# 5. Create Target Directory & Deploy Payload
if (-not (Test-Path $TargetDirectory)) {
    Write-Host "📁 Creating target directory: $TargetDirectory" -ForegroundColor Cyan
    New-Item -Path $TargetDirectory -ItemType Directory -Force | Out-Null
}

Write-Host "🚚 Copying distribution files to $TargetDirectory..." -ForegroundColor Cyan
Copy-Item -Path "$sourceDir\*" -Destination $TargetDirectory -Recurse -Force
Write-Host "✅ Files deployed successfully." -ForegroundColor Green

# Clean up temp folder if used
if ($tempExtractDir -and (Test-Path $tempExtractDir)) {
    Remove-Item -Path $tempExtractDir -Recurse -Force
}

# 6. Apply Strict NTFS Access Control Lists (ACLs)
Write-Host "🔒 Setting NTFS permissions for IIS identities (IIS_IUSRS, IUSR)..." -ForegroundColor Cyan
icacls "$TargetDirectory" /grant "IIS_IUSRS:(OI)(CI)RX" /grant "IUSR:(OI)(CI)RX" /T /Q | Out-Null
Write-Host "✅ NTFS permissions configured." -ForegroundColor Green

# 7. Configure / Validate IIS Application Pool & Website
Write-Host "⚙️ Configuring IIS Site and Application Pool..." -ForegroundColor Cyan

# Application Pool
if (-not (Test-Path "IIS:\AppPools\$AppPoolName")) {
    Write-Host "  ➕ Creating Application Pool: $AppPoolName" -ForegroundColor Cyan
    New-Item "IIS:\AppPools\$AppPoolName" | Out-Null
}
# Set AppPool to No Managed Code (optimal for static web SPA)
Set-ItemProperty "IIS:\AppPools\$AppPoolName" -Name "managedRuntimeVersion" -Value ""
Set-ItemProperty "IIS:\AppPools\$AppPoolName" -Name "processModel.idleTimeout" -Value "00:00:00"

# Website
$siteExists = Test-Path "IIS:\Sites\$SiteName"
if (-not $siteExists) {
    Write-Host "  ➕ Creating IIS Website: $SiteName on port $Port" -ForegroundColor Cyan
    $binding = "*:${Port}:${HostName}"
    New-Item "IIS:\Sites\$SiteName" -bindings @{protocol="http";bindingInformation=$binding} -physicalPath $TargetDirectory | Out-Null
    Set-ItemProperty "IIS:\Sites\$SiteName" -Name "applicationPool" -Value $AppPoolName
} else {
    # Ensure physical path and AppPool are mapped correctly
    Set-ItemProperty "IIS:\Sites\$SiteName" -Name "physicalPath" -Value $TargetDirectory
    Set-ItemProperty "IIS:\Sites\$SiteName" -Name "applicationPool" -Value $AppPoolName
}

# Ensure site is started
if ((Get-WebsiteState -Name $SiteName).Value -ne "Started") {
    Start-Website -Name $SiteName
}

# 8. Recycle Application Pool
Write-Host "🔄 Recycling Application Pool: $AppPoolName..." -ForegroundColor Cyan
Restart-WebAppPool -Name $AppPoolName
Start-Sleep -Seconds 2

# 9. Post-Deployment Verification
Write-Host "🩺 Performing post-deployment health check..." -ForegroundColor Cyan
$testUrl = "http://localhost:$Port/"
try {
    $response = Invoke-WebRequest -Uri $testUrl -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Deployment successful! Site returned HTTP 200 OK from $testUrl" -ForegroundColor Green
    } else {
        Write-Warning "⚠️ Site returned unexpected HTTP status code: $($response.StatusCode)"
    }
} catch {
    Write-Warning "⚠️ Health check query to $testUrl timed out or failed: $($_.Exception.Message)"
    Write-Warning "   Please verify IIS bindings, firewall, and DNS."
}

Write-Host "============================================================" -ForegroundColor Green
Write-Host " 🎉 SwitchFiber Admin Console Deployment Complete!          " -ForegroundColor Green
Write-Host "    Physical Path: $TargetDirectory                         " -ForegroundColor Green
Write-Host "    IIS Site:      $SiteName (Port $Port)                   " -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
