# HireSync AI - Supabase Edge Function Deployment Guide

## Issue: Node Offline Error

The error "Cannot reach Supabase Edge Function" means the Edge Function hasn't been deployed to your Supabase project yet.

## Quick Fix: Deploy the Edge Function

### Prerequisites
1. Install Supabase CLI (if not already installed):
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link your project (use your project reference: `isehlzzcgfrvwwdimybu`):
   ```bash
   supabase link --project-ref isehlzzcgfrvwwdimybu
   ```

### Step 1: Deploy the Edge Function

From the project root directory, run:

```bash
supabase functions deploy send-automated-email --no-verify-jwt
```

**Note:** The `--no-verify-jwt` flag allows the function to be called without JWT authentication, which is needed for the email service.

### Step 2: Set Required Secrets

The Edge Function needs SendGrid credentials to send emails:

```bash
# Set your SendGrid API Key
supabase secrets set SENDGRID_API_KEY=your_sendgrid_api_key_here

# Set the sender email address
supabase secrets set SENDGRID_FROM_EMAIL=dreammasterorigin@gmail.com
```

**To get your SendGrid API Key:**
1. Go to https://app.sendgrid.com/
2. Navigate to Settings > API Keys
3. Create a new API key with "Mail Send" permissions
4. Copy the API key value from your SendGrid dashboard

### Step 3: Verify Deployment

Test the Edge Function with a ping:

```bash
curl -X POST https://isehlzzcgfrvwwdimybu.supabase.co/functions/v1/send-automated-email \
  -H "Content-Type: application/json" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzZWhsenpjZ2Zydnd3ZGlteWJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5MDc1MzcsImV4cCI6MjA4NDQ4MzUzN30.gNptRWF38XDbiwGS1x1s1HpZZDzM4HgYnqe5OqmJaTU" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzZWhsenpjZ2Zydnd3ZGlteWJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5MDc1MzcsImV4cCI6MjA4NDQ4MzUzN30.gNptRWF38XDbiwGS1x1s1HpZZDzM4HgYnqe5OqmJaTU" \
  -d '{"type":"ping"}'
```

You should get a response like:
```json
{
  "success": true,
  "message": "HireSync AI Transactional Node is ONLINE",
  "timestamp": "2024-01-XX...",
  "node": "Supabase Edge"
}
```

### Step 4: Test in the Application

1. Open your application in the browser
2. Click the "Verify Node" button in the HR Console
3. The status should change from "error" to "connected" (green)

## Troubleshooting

### Error: "Edge function not found" (404)
- Make sure you deployed the function: `supabase functions deploy send-automated-email --no-verify-jwt`
- Verify the project reference is correct in the URL

### Error: "SendGrid credentials missing" (500)
- Set the secrets: `supabase secrets set SENDGRID_API_KEY=...` and `SENDGRID_FROM_EMAIL=...`
- Verify your SendGrid API key is valid

### Error: "Authentication failed" (401/403)
- Check that your `SUPABASE_ANON_KEY` in `services/emailService.ts` matches your project's anon key
- Get the correct key from: https://supabase.com/dashboard/project/isehlzzcgfrvwwdimybu/settings/api

### Error: "Cannot reach Supabase Edge Function"
- Check your internet connection
- Verify the URL is correct: `https://isehlzzcgfrvwwdimybu.supabase.co/functions/v1/send-automated-email`
- Make sure the function is deployed

## Alternative: Use Without Edge Function

If you don't want to deploy the Edge Function right now, the application will still work for local testing. The email functionality will just show as "offline" but all other features will work normally.

