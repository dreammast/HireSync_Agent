# Quick Deploy Guide

## Option 1: Use the PowerShell Script (Easiest)

1. Run the deployment script:
   ```powershell
   .\deploy-function.ps1
   ```

2. When prompted, enter your Supabase Access Token (get it from: https://supabase.com/dashboard/account/tokens)

3. The script will automatically:
   - Link your project
   - Deploy the Edge Function

## Option 2: Manual Deployment

### Step 1: Get Your Access Token

1. Go to: https://supabase.com/dashboard/account/tokens
2. Click "Generate new token"
3. Copy the token

### Step 2: Set the Token and Deploy

Open PowerShell and run:

```powershell
# Set your access token
$env:SUPABASE_ACCESS_TOKEN = "your_token_here"

# Link the project
npx supabase link --project-ref isehlzzcgfrvwwdimybu

# Deploy the function
npx supabase functions deploy send-automated-email --no-verify-jwt
```

### Step 3: Set SendGrid Secrets (Optional)

If you have SendGrid credentials for email sending:

```powershell
npx supabase secrets set SENDGRID_API_KEY=your_sendgrid_api_key_here
npx supabase secrets set SENDGRID_FROM_EMAIL=dreammasterorigin@gmail.com
```

## Verify Deployment

After deployment, test the function:

```powershell
curl -X POST https://isehlzzcgfrvwwdimybu.supabase.co/functions/v1/send-automated-email `
  -H "Content-Type: application/json" `
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzZWhsenpjZ2Zydnd3ZGlteWJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5MDc1MzcsImV4cCI6MjA4NDQ4MzUzN30.gNptRWF38XDbiwGS1x1s1HpZZDzM4HgYnqe5OqmJaTU" `
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzZWhsenpjZ2Zydnd3ZGlteWJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5MDc1MzcsImV4cCI6MjA4NDQ4MzUzN30.gNptRWF38XDbiwGS1x1s1HpZZDzM4HgYnqe5OqmJaTU" `
  -d '{\"type\":\"ping\"}'
```

You should see: `{"success":true,"message":"HireSync AI Transactional Node is ONLINE",...}`

## Troubleshooting

- **"Token invalid"**: Make sure you copied the full token from the dashboard
- **"Project not found"**: Verify the project reference `isehlzzcgfrvwwdimybu` is correct
- **"Function deploy failed"**: Check that you're in the project root directory

