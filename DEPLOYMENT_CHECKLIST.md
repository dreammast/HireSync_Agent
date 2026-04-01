# HireSync AI - Complete Deployment Files Checklist

## 📋 Essential Files for Deployment

### 1. **Core Application Files**
These files are REQUIRED for the application to run:

#### Frontend Files
- ✅ `index.html` - Main HTML entry point
- ✅ `index.tsx` - React application entry point
- ✅ `App.tsx` - Main application component
- ✅ `index.css` - Global styles

#### Components (in `/components` folder)
- ✅ `CandidateDashboard.tsx` - Main dashboard component
- ✅ `JobCard.tsx` - Job listing card component
- ✅ `ResumeAnalysis.tsx` - Resume analysis display
- ✅ `HRConsole.tsx` - HR management console
- ✅ `EmailPreview.tsx` - Email preview component

#### Services (in `/services` folder)
- ✅ `groqService.ts` - AI analysis service (Groq API integration)
- ✅ `emailService.ts` - Email sending service (Supabase Edge Function)
- ✅ `supabaseClient.ts` - Supabase client configuration
- ✅ Other service files as needed

#### Type Definitions
- ✅ `types.ts` - TypeScript type definitions

### 2. **Configuration Files**
These files configure the build and development environment:

- ✅ `package.json` - Dependencies and scripts
- ✅ `package-lock.json` - Locked dependency versions
- ✅ `tsconfig.json` - TypeScript configuration
- ✅ `vite.config.ts` - Vite build configuration
- ✅ `tailwind.config.js` - Tailwind CSS configuration
- ✅ `postcss.config.js` - PostCSS configuration

### 3. **Environment Variables**
Create these files (DO NOT commit to Git):

#### `.env` or `.env.local`
```bash
# Groq API Configuration
GROQ_API_KEY=your_groq_api_key_here

# SendGrid Email Configuration
SENDGRID_API_KEY=your_sendgrid_api_key_here
SENDGRID_FROM_EMAIL=dreammasterorigin@gmail.com

# Supabase Configuration (if using)
SUPABASE_URL=https://isehlzzcgfrvwwdimybu.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 4. **Supabase Edge Function** (Optional - for email functionality)
Located in `/supabase/functions/send-automated-email/`:

- ✅ `index.ts` - Edge function code
- ✅ `deno.json` - Deno configuration (if needed)

### 5. **Documentation Files** (Optional but recommended)
- ✅ `README.md` - Project overview and setup instructions
- ✅ `DEPLOYMENT_GUIDE.md` - Deployment instructions
- ✅ `GROQ_MIGRATION.md` - AI model migration notes
- ✅ `.gitignore` - Files to exclude from Git

---

## 🚀 Deployment Options

### **Option 1: Vercel (Recommended for Frontend)**

#### Files Needed:
1. All core application files
2. Configuration files
3. Environment variables set in Vercel dashboard

#### Steps:
```bash
# 1. Build the application
npm run build

# 2. Deploy to Vercel
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

#### Environment Variables in Vercel:
- Go to Vercel Dashboard → Your Project → Settings → Environment Variables
- Add:
  - `GROQ_API_KEY`
  - `SENDGRID_API_KEY`
  - `SENDGRID_FROM_EMAIL`

---

### **Option 2: Netlify**

#### Files Needed:
1. All core application files
2. Configuration files
3. Create `netlify.toml` (optional):

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### Steps:
```bash
# 1. Build the application
npm run build

# 2. Deploy to Netlify
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod
```

---

### **Option 3: Traditional Web Server (Apache/Nginx)**

#### Files Needed:
1. Build output from `npm run build` (the `dist` folder)
2. Web server configuration

#### Steps:
```bash
# 1. Build the application
npm run build

# 2. Copy the 'dist' folder contents to your web server
# For example, to /var/www/html on Linux
cp -r dist/* /var/www/html/

# 3. Configure your web server to serve the files
```

#### Nginx Configuration Example:
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

### **Option 4: Docker Container**

#### Create `Dockerfile`:
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Create `nginx.conf`:
```nginx
server {
    listen 80;
    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
}
```

#### Build and Run:
```bash
# Build Docker image
docker build -t hiresync-ai .

# Run container
docker run -p 80:80 \
  -e GROQ_API_KEY=your_key \
  -e SENDGRID_API_KEY=your_key \
  -e SENDGRID_FROM_EMAIL=your_email \
  hiresync-ai
```

---

## 📦 Files to EXCLUDE from Deployment

Add these to `.gitignore`:

```
# Dependencies
node_modules/

# Build output
dist/
build/

# Environment variables
.env
.env.local
.env.production

# IDE files
.vscode/
.idea/

# Test files
test_groq_model.js
dushyanth_resume.txt

# Logs
*.log
npm-debug.log*

# OS files
.DS_Store
Thumbs.db
```

---

## ✅ Pre-Deployment Checklist

Before deploying, ensure:

1. ✅ All dependencies are installed: `npm install`
2. ✅ Application builds successfully: `npm run build`
3. ✅ Environment variables are configured
4. ✅ API keys are valid and working
5. ✅ Test the application locally: `npm run dev`
6. ✅ Remove test files and sensitive data
7. ✅ Update `.gitignore` to exclude sensitive files
8. ✅ (Optional) Deploy Supabase Edge Function for email functionality

---

## 🔑 Required API Keys

You need the following API keys:

1. **Groq API Key** (for AI resume analysis)
   - Get from: https://console.groq.com/
   - Current model: `llama-3.3-70b-versatile`

2. **SendGrid API Key** (for email functionality)
   - Get from: https://app.sendgrid.com/
   - Requires "Mail Send" permissions

3. **Supabase Keys** (if using Edge Functions)
   - Get from: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api
   - Need: `SUPABASE_URL` and `SUPABASE_ANON_KEY`

---

## 🎯 Quick Deploy Commands

```bash
# 1. Install dependencies
npm install

# 2. Build for production
npm run build

# 3. Test the build locally
npm run preview

# 4. Deploy (choose one)
vercel --prod          # For Vercel
netlify deploy --prod  # For Netlify
```

---

## 📊 Current Model Configuration

The application is currently configured to use:
- **AI Model**: `llama-3.3-70b-versatile` (Groq)
- **Temperature**: 0.3
- **Max Tokens**: 2048
- **Response Format**: JSON object

**Note**: The `meta-llama/llama-prompt-guard-2-86m` model is NOT suitable for resume analysis as it's designed for prompt injection detection, not general text analysis.

---

## 🆘 Support

If you encounter issues during deployment:
1. Check the browser console for errors
2. Verify all environment variables are set correctly
3. Ensure API keys are valid
4. Check the deployment platform logs
5. Refer to `DEPLOYMENT_GUIDE.md` for troubleshooting
