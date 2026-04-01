# Email Troubleshooting Guide

## Issue: Not Receiving Emails

If you're not receiving emails at `naledushyanth@gmail.com`, check the following:

### 1. Check What Email Address Was Used

When you update a candidate status, check the browser console (F12 → Console tab). You should see:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 EMAIL WILL BE SENT TO: [email address]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

This shows which email address the system is using.

### 2. Update Your Candidate Profile Email

The email is sent to the address stored in your candidate profile. To update it:

1. **Log in as a Candidate** (not HR)
2. Go to **"PROFILE SETTINGS"** tab
3. Click **"Edit Profile"**
4. Update the **Email** field to: `naledushyanth@gmail.com`
5. Click **"Save Profile"**

### 3. Check Spam/Junk Folder

- Emails from SendGrid sometimes go to spam
- Check your spam/junk folder at `naledushyanth@gmail.com`
- Mark as "Not Spam" if found

### 4. Verify Email Was Actually Sent

After updating a candidate status, check the console for:

```
✅ EMAIL SENT SUCCESSFULLY
📧 Recipient: [email address]
```

If you see this, the email was sent successfully.

### 5. Email Sources (Priority Order)

The system uses email addresses in this order:

1. **Candidate Profile Email** (`user.email`) - **HIGHEST PRIORITY**
2. Resume extracted email (`candidate.analysis.candidateEmail`)
3. Fallback email (`candidate.analysis.email`)

**Solution**: Make sure your candidate profile has `naledushyanth@gmail.com` set.

### 6. Test Email Delivery

1. Log in as a candidate with email `naledushyanth@gmail.com`
2. Apply to a job (or use existing application)
3. Log in as HR
4. Update the candidate's status to "APPROVED" or "REJECTED"
5. Check console for email delivery confirmation
6. Check inbox and spam folder

### 7. Check SendGrid Activity

If you have SendGrid access:
1. Go to: https://app.sendgrid.com/
2. Navigate to **Activity** → **Email Activity**
3. Check if emails are being sent and their delivery status

## Quick Fix

**To ensure emails go to `naledushyanth@gmail.com`:**

1. Log in as candidate
2. Go to Profile Settings
3. Set Email to: `naledushyanth@gmail.com`
4. Save profile
5. Try updating candidate status again

The email will now be sent to the address in your profile.

