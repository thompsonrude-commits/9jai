# Deploy functions with discovery timeout fix
# Run this script instead of firebase deploy --only functions

$env:FUNCTIONS_DISCOVERY_TIMEOUT = "60"
Write-Host "Deploying functions with 60s discovery timeout..." -ForegroundColor Green

& "C:\Users\Caterpilla\AppData\Roaming\npm\firebase.cmd" deploy --only functions

Write-Host "Functions deploy complete!" -ForegroundColor Green
