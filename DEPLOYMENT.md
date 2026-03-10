# Deployment Guide - Vercel & MongoDB Atlas

Complete step-by-step guide to deploy the Intern Progress Tracker on Vercel with MongoDB Atlas.

## Prerequisites

- GitHub account (free) - https://github.com
- Vercel account (free) - https://vercel.com
- MongoDB Atlas account (free) - https://www.mongodb.com/cloud/atlas

## Part 1: Set Up MongoDB Atlas (15 minutes)

### Step 1: Create MongoDB Atlas Account

1. Go to https://www.mongodb.com/cloud/atlas
2. Click "Try Free" or "Start Free"
3. Sign up with Google/GitHub or create an account
4. Complete the registration process

### Step 2: Create a Free Cluster

1. After login, click "Build a Database"
2. Choose **FREE** tier (M0 Sandbox)
3. Select your preferred cloud provider and region (AWS recommended)
4. Cluster Name: Leave default or name it `intern-tracker`
5. Click "Create" button
6. Wait 3-5 minutes for cluster creation

### Step 3: Create Database User

1. Click "Database Access" in left sidebar
2. Click "Add New Database User"
3. Choose "Password" authentication method
4. Username: `admin` (or your choice)
5. Password: Click "Autogenerate Secure Password" and **SAVE IT**
6. Database User Privileges: Select "Read and write to any database"
7. Click "Add User"

### Step 4: Configure Network Access

1. Click "Network Access" in left sidebar
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere"
4. This adds `0.0.0.0/0` (required for Vercel serverless functions)
5. Click "Confirm"

### Step 5: Get Connection String

1. Click "Database" in left sidebar
2. Click "Connect" button on your cluster
3. Choose "Connect your application"
4. Driver: Node.js, Version: 4.1 or later
5. Copy the connection string (looks like):
   ```
   mongodb+srv://admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Replace `<password>` with your actual database user password
7. **SAVE THIS CONNECTION STRING** - you'll need it for Vercel

## Part 2: Prepare Code Repository

### Step 1: Initialize Git (if not already done)

```bash
# Navigate to your project folder
cd d:\tracker

# Initialize git
git init

# Check files
git status
```

### Step 2: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `intern-progress-tracker`
3. Description: "Daily progress tracker for interns"
4. Choose "Private" or "Public"
5. Do NOT initialize with README (we already have one)
6. Click "Create repository"

### Step 3: Push Code to GitHub

```bash
# Add all files
git add .

# Commit
git commit -m "Initial commit - Serverless version with MongoDB"

# Add remote (use your actual repo URL)
git remote add origin https://github.com/YOUR-USERNAME/intern-progress-tracker.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Part 3: Deploy to Vercel (10 minutes)

### Step 1: Import Project

1. Go to https://vercel.com
2. Sign in with GitHub
3. Click "Add New..." → "Project"
4. Import your `intern-progress-tracker` repository
5. Click "Import"

### Step 2: Configure Project

1. **Project Name**: Vercel will auto-generate (you can change it)
2. **Framework Preset**: Leave as "Other"
3. **Root Directory**: Leave as `./`
4. **Build Command**: Leave empty or use default
5. **Output Directory**: Leave empty

### Step 3: Add Environment Variables

Before deploying, click "Environment Variables" section and add:

| Name | Value | Notes |
|------|-------|-------|
| `MONGODB_URI` | `mongodb+srv://admin:your-password@cluster...` | Your MongoDB connection string from Part 1 |
| `MONGODB_DB` | `intern_tracker` | Database name |
| `DEFAULT_ADMIN_PASSWORD` | `K8@dS5Lp` | Change this after first login! |

**Important**: 
- Paste the full MongoDB connection string with your actual password
- Make sure there are no extra spaces
- All variables should be available in "Production", "Preview", and "Development"

### Step 4: Deploy

1. Click "Deploy" button
2. Wait 2-3 minutes for build and deployment
3. Vercel will show a success screen with your URL

### Step 5: Visit Your Application

1. Click "Visit" or go to your Vercel URL (e.g., `https://your-app.vercel.app`)
2. You should see the login screen
3. Test admin login:
   - Email: `admin@example.com`
   - Password: `K8@dS5Lp` (or whatever you set in env variables)

## Part 4: Initial Setup (5 minutes)

### Step 1: Change Admin Password

1. Login as admin with default password
2. Scroll to "Change Admin Password" section
3. Current Password: `K8@dS5Lp`
4. New Password: Choose a strong password (min 8 chars, letters + numbers)
5. Click "Update Password"
6. You'll be logged out - login again with new password

### Step 2: Register Interns

You have two options:

#### Option A: Manual Registration
1. Click "Register New Intern"
2. Fill in details (Name, Email, Department, 4-digit PIN)
3. Click "Register"
4. Repeat for all interns

#### Option B: Bulk Import (Recommended)
1. See [MIGRATION.md](MIGRATION.md) for script to import from CSV
2. Or use the admin interface to bulk register

### Step 3: Share Credentials

1. Check [CREDENTIALS_LIST.txt](CREDENTIALS_LIST.txt) for pre-registered intern details
2. Send each intern their email and PIN via email
3. Instruct interns to login and submit daily progress

## Part 5: Verify Everything Works

### Test Admin Features:
- ✅ Login with new password
- ✅ View "Registered Interns" table (should show your interns)
- ✅ View "All Progress Entries" (empty initially)
- ✅ Register a new intern
- ✅ Export to Excel (should generate file even if empty)

### Test Intern Features:
- ✅ Login as an intern (use email + PIN)
- ✅ Submit today's progress
- ✅ Try submitting again (should be blocked - one per day)
- ✅ Logout and login as admin to see the entry

### Test Security:
- ✅ Try wrong password (should fail after 5 attempts)
- ✅ Wait 30 minutes (session should expire)
- ✅ Check that MongoDB shows security_logs collection

## Troubleshooting

### Deployment Failed
- **Error**: "Module not found"
  - Solution: Make sure `package.json` exists with dependencies
  - Run locally: `npm install` to verify
  
- **Error**: "Build timeout"
  - Solution: Project is too large or network issue
  - Try deploying again

### Cannot Connect to MongoDB
- **Error**: "MongoServerError: bad auth"
  - Solution: Check MONGODB_URI has correct password
  - Verify database user exists in MongoDB Atlas
  
- **Error**: "getaddrinfo ENOTFOUND"
  - Solution: Connection string might be wrong
  - Copy fresh connection string from MongoDB Atlas

### Admin Login Not Working
- **Issue**: Password incorrect
  - Solution: Check DEFAULT_ADMIN_PASSWORD environment variable in Vercel
  - Try redeploying after updating env variable
  - If database already has admin password, use that one

### Users Not Loading
- **Issue**: Empty table
  - Solution: MongoDB collections are created on first write
  - Register at least one intern to create the users collection
  - Check Vercel function logs for errors

### Rate Limit Errors
- **Issue**: "Too many requests"
  - Solution: Rate limits are enforced for security
  - Wait 5 minutes for auth endpoints, 1 minute for data endpoints
  - This is normal behavior to prevent brute force attacks

## Updating Your Deployment

### Code Changes
```bash
# Make changes to your code
git add .
git commit -m "Your changes"
git push

# Vercel will auto-deploy on every push to main branch
```

### Environment Variable Changes
1. Go to Vercel Dashboard
2. Your Project → Settings → Environment Variables
3. Edit the variable
4. Click "Save"
5. Redeploy: Deployments → Latest → Redeploy

## Custom Domain (Optional)

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your domain (e.g., `tracker.yourcompany.com`)
3. Follow DNS configuration instructions
4. Wait for SSL certificate provisioning (automatic)

## Monitoring & Logs

### View Function Logs
1. Vercel Dashboard → Your Project
2. Click "Deployments"
3. Click on latest deployment
4. Click "Functions" tab
5. View real-time logs for each API endpoint

### MongoDB Monitoring
1. MongoDB Atlas Dashboard
2. Click "Metrics" for your cluster
3. View connections, operations, and database size

## Backup Strategy

### MongoDB Atlas Backups
- Free tier includes snapshot backups
- Go to Cluster → Backup tab
- Configure backup schedule if needed

### Export Data Regularly
1. Login as admin
2. Export to Excel regularly
3. Keep offline backups of intern data

## Cost Breakdown

| Service | Tier | Cost | Limits |
|---------|------|------|--------|
| Vercel | Hobby | **FREE** | 100GB bandwidth/month |
| MongoDB Atlas | M0 | **FREE** | 512MB storage |
| GitHub | Free | **FREE** | Unlimited public/private repos |

**Total Monthly Cost: $0** (within free tier limits)

## Scaling Considerations

### When to Upgrade:
- **Vercel**: Upgrade if you exceed 100GB bandwidth/month (~1M requests)
- **MongoDB**: Upgrade if you exceed 512MB storage (~100,000 entries)

### Free Tier Limits:
- Supports up to 1000 interns
- Stores 1 year of daily progress data
- Handles 100,000+ requests per month

## Support & Resources

- Vercel Docs: https://vercel.com/docs
- MongoDB Atlas Docs: https://docs.atlas.mongodb.com/
- Node.js Docs: https://nodejs.org/docs/

## Next Steps

1. ✅ Change admin password
2. ✅ Register all interns
3. ✅ Send credentials to interns
4. ✅ Test end-to-end flow
5. ✅ Set up custom domain (optional)
6. ✅ Configure backups
7. ✅ Monitor usage and logs

---

**Deployment Complete!** 🎉

Your intern progress tracker is now live and ready to use.
