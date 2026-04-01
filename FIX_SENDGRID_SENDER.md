# Fix SendGrid Sender Identity Error

## Problem
The error: "The from address does not match a verified Sender Identity" means the email address `dreammasterorigin@gmail.com` is not verified in SendGrid.

## Solution: Verify Your Sender Identity

### Option 1: Verify Single Sender (Quick - for testing)

1. Go to SendGrid Dashboard: https://app.sendgrid.com/
2. Navigate to **Settings** → **Sender Authentication**
3. Click **Verify a Single Sender**
4. Fill in the form:
   - **From Email Address**: `dreammasterorigin@gmail.com`
   - **From Name**: `HireSync AI`
   - **Reply To**: `dreammasterorigin@gmail.com`
   - **Company Address**: Your address
   - **City**: Your city
   - **State**: Your state
   - **Country**: Your country
   - **Zip Code**: Your zip code
5. Click **Create**
6. **Check your email** (`dreammasterorigin@gmail.com`) for a verification email from SendGrid
7. Click the verification link in the email

**Note**: Single Sender verification is instant but has limitations (100 emails/day on free tier).

### Option 2: Domain Authentication (Recommended for production)

1. Go to SendGrid Dashboard: https://app.sendgrid.com/
2. Navigate to **Settings** → **Sender Authentication**
3. Click **Authenticate Your Domain**
4. Follow the DNS setup instructions
5. Add the required DNS records to your domain
6. Wait for verification (can take a few minutes to 48 hours)

**Note**: Domain authentication allows unlimited emails and better deliverability.

### Option 3: Use a Different Verified Email

If you already have a verified email in SendGrid, update the secret:

```powershell
$env:SUPABASE_ACCESS_TOKEN = "sbp_39777c59e426d1efb60b1ddbc43bd54effb76f9c"
npx supabase secrets set SENDGRID_FROM_EMAIL=your_verified_email@example.com
```

## After Verification

Once you've verified the sender identity:

1. The error should disappear automatically
2. Try sending an email again from the application
3. The status should change from "error" to "connected"

## Check Current Secrets

To see what email is currently configured:

```powershell
$env:SUPABASE_ACCESS_TOKEN = "sbp_39777c59e426d1efb60b1ddbc43bd54effb76f9c"
npx supabase secrets list
```

## Quick Fix Command

If you want to update to a different verified email:

```powershell
$env:SUPABASE_ACCESS_TOKEN = "sbp_39777c59e426d1efb60b1ddbc43bd54effb76f9c"
npx supabase secrets set SENDGRID_FROM_EMAIL=your_verified_email@example.com
```

