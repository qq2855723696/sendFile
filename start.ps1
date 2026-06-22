# SendFile 启动脚本 - 自动设置 UTF-8 编码避免中文乱码
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "[*] Starting SendFile Service..." -ForegroundColor Cyan
node server.js
