# Test script for Cinematic Director
# Usage: .\test-cinematic.ps1 "path/to/video.mp4"

param(
    [Parameter(Mandatory=$true)]
    [string]$VideoPath
)

Write-Host "🎬 Testing Cinematic Director..." -ForegroundColor Cyan
Write-Host "📹 Video: $VideoPath" -ForegroundColor Yellow

if (-not (Test-Path $VideoPath)) {
    Write-Host "❌ Video file not found!" -ForegroundColor Red
    exit 1
}

Write-Host "📤 Uploading and analyzing..." -ForegroundColor Yellow

$response = curl.exe -X POST http://localhost:3001/api/analyze-full `
    -F "file=@$VideoPath" `
    -H "Accept: application/json"

Write-Host ""
Write-Host "📊 Response:" -ForegroundColor Green
Write-Host $response

# Parse and display key info
$json = $response | ConvertFrom-Json

if ($json.success) {
    Write-Host ""
    Write-Host "✅ Analysis Complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎥 CAMERA:" -ForegroundColor Cyan
    Write-Host "  Type: $($json.data.cinematic.camera_analysis.type)"
    Write-Host "  🚁 Drone: $($json.data.cinematic.camera_analysis.drone_detected)"
    Write-Host "  Stability: $($json.data.cinematic.camera_analysis.stability_score)/100"
    Write-Host ""
    Write-Host "💡 LIGHTING:" -ForegroundColor Cyan
    Write-Host "  Quality: $($json.data.cinematic.lighting_analysis.quality)"
    Write-Host "  Brightness: $($json.data.cinematic.lighting_analysis.brightness_score)/100"
    Write-Host ""
    Write-Host "📊 OVERALL SCORE: $($json.data.cinematic.overall_score)/100" -ForegroundColor Yellow
} else {
    Write-Host "❌ Error: $($json.error)" -ForegroundColor Red
}
