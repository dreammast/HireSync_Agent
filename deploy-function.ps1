# HireSync AI - Edge Function Deployment Script
# Run this script to deploy the send-automated-email function

Write-Host "🚀 Deploying HireSync AI Edge Function..." -ForegroundColor Cyan

# Step 1: Get Access Token
Write-Host "`n📝 Step 1: Get your Supabase Access Token" -ForegroundColor Yellow
Write-Host "1. Go to: https://supabase.com/dashboard/account/tokens" -ForegroundColor White
Write-Host "2. Click 'Generate new token'" -ForegroundColor White
Write-Host "3. Copy the token" -ForegroundColor White
Write-Host "`nEnter your Supabase Access Token:" -ForegroundColor Yellow
$token = Read-Host

if ([string]::IsNullOrWhiteSpace($token)) {
    Write-Host "❌ Token is required. Exiting." -ForegroundColor Red
    exit 1
}

# Set the token as environment variable
$env:SUPABASE_ACCESS_TOKEN = $token

# Step 2: Link Project
Write-Host "`n🔗 Step 2: Linking project..." -ForegroundColor Yellow
npx supabase link --project-ref isehlzzcgfrvwwdimybu

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to link project. Please check your token and project reference." -ForegroundColor Red
    exit 1
}

# Step 3: Deploy Function
Write-Host "`n📦 Step 3: Deploying Edge Function..." -ForegroundColor Yellow
npx supabase functions deploy send-automated-email --no-verify-jwt

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to deploy function." -ForegroundColor Red
    exit 1
}

Write-Host "`n✅ Edge Function deployed successfully!" -ForegroundColor Green
Write-Host "`n📧 Next: Set SendGrid secrets (optional, for email functionality):" -ForegroundColor Yellow
Write-Host "   npx supabase secrets set SENDGRID_API_KEY=your_sendgrid_api_key_here" -ForegroundColor White
Write-Host "   npx supabase secrets set SENDGRID_FROM_EMAIL=your@email.com" -ForegroundColor White

