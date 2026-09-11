# 9JA AI Deployment Script
# This script builds and deploys your app to Firebase

Write-Host "🚀 Starting 9JA AI Deployment..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if Firebase CLI is available
Write-Host "📋 Checking Firebase CLI..." -ForegroundColor Yellow
$firebaseCmd = Get-Command firebase -ErrorAction SilentlyContinue
if (-not $firebaseCmd) {
    Write-Host "❌ Firebase CLI not found globally. Using npx..." -ForegroundColor Red
    $firebaseCmd = "npx firebase"
} else {
    $firebaseCmd = "firebase"
}

# Step 2: Build Frontend
Write-Host "🔨 Building frontend..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Frontend build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Frontend built successfully" -ForegroundColor Green
Write-Host ""

# Step 3: Build Functions
Write-Host "🔨 Building backend functions..." -ForegroundColor Yellow
Set-Location functions
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Functions build failed!" -ForegroundColor Red
    Set-Location ..
    exit 1
}
Set-Location ..
Write-Host "✅ Functions built successfully" -ForegroundColor Green
Write-Host ""

# Step 4: Check if secrets are configured
Write-Host "🔐 Checking Firebase secrets..." -ForegroundColor Yellow
Write-Host "⚠️  IMPORTANT: Make sure you've set your GROQ_KEY secret:" -ForegroundColor Yellow
Write-Host "   Run: firebase functions:secrets:set GROQ_KEY" -ForegroundColor Cyan
Write-Host ""
$response = Read-Host "Have you configured the GROQ_KEY secret? (y/n)"
if ($response -ne 'y') {
    Write-Host "❌ Please configure secrets before deploying" -ForegroundColor Red
    Write-Host "   Run: firebase functions:secrets:set GROQ_KEY" -ForegroundColor Cyan
    Write-Host "   Then paste your API key from the .env file" -ForegroundColor Cyan
    exit 1
}

# Step 5: Deploy
Write-Host "🚀 Deploying to Firebase..." -ForegroundColor Yellow
& $firebaseCmd deploy

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Deployment successful!" -ForegroundColor Green
    Write-Host "🌐 Your app is live at: https://9jai.web.app" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    exit 1
}
