# Dừng sạch toàn bộ GameVault backend (app + dotnet launcher) và giải phóng port 5080
Write-Host "Dang tat GameVault backend..."

# 1. Kill instance app GameVault.Api
Get-Process -Name GameVault.Api -ErrorAction SilentlyContinue | Stop-Process -Force

# 2. Kill cac dotnet launcher lien quan den GameVault
Get-CimInstance Win32_Process -Filter "Name='dotnet.exe'" |
    Where-Object { $_.CommandLine -match "GameVault" } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }

Start-Sleep -Seconds 2

# 3. Kiem tra lai
$app = @(Get-Process -Name GameVault.Api -ErrorAction SilentlyContinue).Count
$launcher = @(Get-CimInstance Win32_Process -Filter "Name='dotnet.exe'" | Where-Object { $_.CommandLine -match "GameVault" }).Count
$port = Get-NetTCPConnection -State Listen -LocalPort 5080 -ErrorAction SilentlyContinue

Write-Host "GameVault.Api con lai: $app"
Write-Host "dotnet launcher con lai: $launcher"
if ($port) { Write-Host "Port 5080: VAN CON BI CHIEM (khong tot)" } else { Write-Host "Port 5080: da giai phong" }

try {
    $resp = Invoke-WebRequest -Uri "http://localhost:5080/swagger" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
    Write-Host "CANH BAO: backend van dang tra du lieu (web van nhan duoc). Hay tel la a la..."
} catch {
    Write-Host "Xac nhan: backend da tat, web KHONG con nhan du lieu."
}

Write-Host "Xong."
