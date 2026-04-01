# 🚀 HireSync AI - Vercel Deployment Guide

## Step-by-Step Deployment Instructions

### **Step 1: Install Vercel CLI**

Open PowerShell and run:
```powershell
npm install -g vercel
```

Wait for installation to complete.

---

### **Step 2: Login to Vercel**

```powershell
vercel login
```

**What will happen:**
- A browser window will open
- You'll be asked to login/signup with one of these options:
  - GitHub (Recommended)
  - GitLab
  - Bitbucket
  - Email

**Choose your preferred method and complete the login.**

---

### **Step 3: Navigate to Your Project**

```powershell
cd e:\hiresyncai
```

---

### **Step 4: Deploy to Vercel**

Run the deployment command:
```powershell
vercel --prod
```

---

## 📝 Questions Vercel Will Ask & How to Answer

When you run `vercel --prod`, Vercel will ask you several questions. Here's what to fill in:

### **Question 1: Set up and deploy?**
```
? Set up and deploy "e:\hiresyncai"? [Y/n]
```
**Answer:** Press `Y` and Enter

---

### **Question 2: Which scope?**
```
? Which scope do you want to deploy to?
```
**Answer:** Select your username/organization (use arrow keys and press Enter)

---

### **Question 3: Link to existing project?**
```
? Link to existing project? [y/N]
```
**Answer:** Press `N` and Enter (since this is your first deployment)

---

### **Question 4: What's your project's name?**
```
? What's your project's name?
```
**Answer:** Type: `hiresync-ai` (or any name you prefer)
- Use lowercase letters, numbers, and hyphens only
- No spaces allowed

---

### **Question 5: In which directory is your code located?**
```
? In which directory is your code located?
```
**Answer:** Press Enter (it will use `./` which is correct)

---

### **Question 6: Want to override the settings?**
```
? Want to override the settings? [y/N]
```
**Answer:** Press `N` and Enter (Vercel will auto-detect Vite settings)

---

## ⚙️ After Deployment: Set Environment Variables

Once deployment completes, you need to add your API keys:

### **Method 1: Using Vercel Dashboard (Recommended)**

1. Go to https://vercel.com/dashboard
2. Click on your project (`hiresync-ai`)
3. Click on **Settings** tab
4. Click on **Environment Variables** in the left sidebar
5. Add the following variables:

| Name | Value | Environment |
|------|-------|-------------|
| `GROQ_API_KEY` | `your_groq_api_key_here` | Production, Preview, Development |
| `SENDGRID_API_KEY` | `your_sendgrid_api_key_here` | Production, Preview, Development |
| `SENDGRID_FROM_EMAIL` | `dreammasterorigin@gmail.com` | Production, Preview, Development |

**For each variable:**
- Click **Add New**
- Enter the **Name** (e.g., `GROQ_API_KEY`)
- Enter the **Value** (the API key)
- Check all three environments: **Production**, **Preview**, **Development**
- Click **Save**

6. After adding all variables, click **Redeploy** button at the top

---

### **Method 2: Using Vercel CLI**

```powershell
# Navigate to your project
cd e:\hiresyncai

# Add environment variables
vercel env add GROQ_API_KEY production
# When prompted, paste: your_groq_api_key_here

vercel env add SENDGRID_API_KEY production
# When prompted, paste: your_sendgrid_api_key_here

vercel env add SENDGRID_FROM_EMAIL production
# When prompted, paste: dreammasterorigin@gmail.com

# Redeploy with new environment variables
vercel --prod
```

---

## 🎯 Complete Command Sequence

Here's the complete sequence of commands to run:

```powershell
# 1. Install Vercel CLI (if not already installed)
npm install -g vercel

# 2. Login to Vercel
vercel login

# 3. Navigate to project
cd e:\hiresyncai

# 4. Deploy to production
vercel --prod
```

---

## 📊 What Happens During Deployment

1. **Uploading Files** - Vercel uploads your project files
2. **Installing Dependencies** - Runs `npm install`
3. **Building** - Runs `npm run build` (creates the `dist` folder)
4. **Deploying** - Deploys the built files to Vercel's CDN
5. **Success** - You'll get a URL like: `https://hiresync-ai.vercel.app`

---

## ✅ After Deployment

Once deployment is complete, you'll see:

```
✅ Production: https://hiresync-ai-xxxxx.vercel.app [copied to clipboard]
```

**Important Steps:**

1. ✅ **Add Environment Variables** (see above)
2. ✅ **Redeploy** after adding environment variables
3. ✅ **Test Your Application** - Open the URL and test:
   - Upload a resume
   - Check if AI analysis works
   - Verify email functionality (if configured)

---

## 🔧 Troubleshooting

### **Issue: Build Failed**
**Solution:** Check the build logs in Vercel dashboard
- Common issue: Missing dependencies
- Run `npm install` locally first to verify

### **Issue: Environment Variables Not Working**
**Solution:** 
- Make sure you added them in Vercel dashboard
- Ensure you selected all environments (Production, Preview, Development)
- Redeploy after adding variables

### **Issue: 404 Errors on Page Refresh**
**Solution:** The `vercel.json` file I created should fix this
- It redirects all routes to `index.html`

### **Issue: API Calls Failing**
**Solution:**
- Check browser console for errors
- Verify environment variables are set correctly
- Make sure API keys are valid

---

## 🔄 Redeploying After Changes

Whenever you make changes to your code:

```powershell
# Option 1: Deploy to production
vercel --prod

# Option 2: Deploy to preview (for testing)
vercel

# Option 3: If you linked to GitHub, just push your code
git push origin main
# Vercel will auto-deploy
```

---

## 🌐 Custom Domain (Optional)

To add a custom domain:

1. Go to Vercel Dashboard → Your Project
2. Click **Settings** → **Domains**
3. Add your domain (e.g., `hiresync.com`)
4. Follow DNS configuration instructions

---

## 📱 Vercel Dashboard Features

After deployment, you can access:

- **Deployments** - View all deployments and their status
- **Analytics** - See visitor statistics
- **Logs** - View runtime logs
- **Settings** - Configure environment variables, domains, etc.
- **Preview Deployments** - Test changes before going to production

---

## 🎉 Quick Reference

| Command | Purpose |
|---------|---------|
| `vercel login` | Login to Vercel |
| `vercel` | Deploy to preview |
| `vercel --prod` | Deploy to production |
| `vercel env ls` | List environment variables |
| `vercel env add` | Add environment variable |
| `vercel logs` | View deployment logs |
| `vercel ls` | List all deployments |

---

## 📞 Need Help?

- Vercel Documentation: https://vercel.com/docs
- Vercel Support: https://vercel.com/support
- Check deployment logs in Vercel dashboard

---

## ⚠️ Important Notes

1. **Free Tier Limits:**
   - 100 GB bandwidth per month
   - Unlimited deployments
   - Serverless function execution: 100 GB-hours

2. **Environment Variables:**
   - Must be added after first deployment
   - Require redeployment to take effect
   - Keep API keys secure - never commit to Git

3. **Build Time:**
   - First deployment: 2-5 minutes
   - Subsequent deployments: 1-3 minutes

4. **Domain:**
   - Free subdomain: `your-project.vercel.app`
   - Custom domain: Requires DNS configuration

---

## 🚀 Ready to Deploy?

Run these commands now:

```powershell
cd e:\hiresyncai
vercel --prod
```

Good luck! 🎉
