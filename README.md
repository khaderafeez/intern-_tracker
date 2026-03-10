# Intern Progress Tracker

A serverless daily progress tracking application for interns with secure authentication and MongoDB cloud storage.

## Features

- ✅ **Email-based Authentication**: Secure login for both admins and interns
- ✅ **One Entry Per Day**: Prevents duplicate submissions
- ✅ **Admin Dashboard**: Manage interns and view all progress entries
- ✅ **Excel Export**: Download progress reports with multiple sheets
- ✅ **Project Tracking**: Track projects, hours worked, tasks, challenges, and plans
- ✅ **Cloud Storage**: MongoDB Atlas for persistent data storage
- ✅ **Security**: Bcrypt password hashing, rate limiting, security headers
- ✅ **Serverless**: Deploy on Vercel or Netlify with zero configuration

## Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js Serverless Functions
- **Database**: MongoDB Atlas (Free Tier)
- **Hosting**: Vercel/Netlify
- **Security**: bcryptjs, Rate Limiting, Security Headers

## Quick Start

### 1. Prerequisites

- GitHub account
- Vercel account (free): https://vercel.com
- MongoDB Atlas account (free): https://www.mongodb.com/cloud/atlas

### 2. Set Up MongoDB Atlas

1. Create a free cluster at https://www.mongodb.com/cloud/atlas
2. Create a database user with username and password
3. Whitelist all IPs (0.0.0.0/0) for serverless access
4. Get your connection string (looks like `mongodb+srv://username:password@cluster.mongodb.net/`)

### 3. Deploy to Vercel

#### Option A: Deploy via Git (Recommended)

```bash
# Clone or initialize git repository
git init
git add .
git commit -m "Initial commit"

# Push to GitHub
git remote add origin <your-repo-url>
git push -u origin main

# Import on Vercel
# Go to vercel.com -> New Project -> Import your GitHub repo
```

#### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Add environment variables when prompted:
# - MONGODB_URI: <your-mongodb-connection-string>
# - MONGODB_DB: intern_tracker
# - DEFAULT_ADMIN_PASSWORD: K8@dS5Lp (or your custom password)
```

### 4. Configure Environment Variables

In Vercel Dashboard:
1. Go to your project → Settings → Environment Variables
2. Add the following:
   - `MONGODB_URI`: Your MongoDB connection string
   - `MONGODB_DB`: `intern_tracker`
   - `DEFAULT_ADMIN_PASSWORD`: `K8@dS5Lp` (change after first login)

### 5. Access the Application

- Visit your Vercel URL (e.g., https://your-app.vercel.app)
- Login as admin:
  - Email: `admin@example.com`
  - Password: `K8@dS5Lp` (or your custom password)
- **Important**: Change the admin password immediately after first login!

## Pre-registered Interns

The application comes with 20 pre-registered interns. See [CREDENTIALS_LIST.txt](CREDENTIALS_LIST.txt) for their login details (email + 4-digit PIN).

To add these users to your database, use the admin interface:
1. Login as admin
2. The "Registered Interns" table will be empty initially
3. Click "Register New Intern" and add each intern manually, OR
4. Import from the provided CSV/JSON files (see Migration section below)

## Admin Features

- **Change Password**: Update admin password (requires current password)
- **Register Interns**: Add new interns with email, name, department, and PIN
- **View All Entries**: See all intern submissions in a table view
- **Export to Excel**: Download comprehensive reports with summary statistics

## Intern Features

- **Daily Progress Entry**: Submit progress once per day
- **Form Fields**:
  - Project Name
  - Hours Worked
  - Tasks Completed
  - Challenges Faced
  - Plan for Tomorrow

## Security Features

- ✅ Bcrypt password hashing (cost factor 12)
- ✅ Rate limiting on all endpoints
- ✅ Session timeout (30 minutes)
- ✅ Security headers (XSS, clickjacking, MIME-sniffing protection)
- ✅ Input validation and sanitization
- ✅ Email and PIN format validation
- ✅ Security event logging to MongoDB

## Migration from CSV/PHP Version

If you have existing data from the PHP/CSV version, see [MIGRATION.md](MIGRATION.md) for instructions on migrating to MongoDB.

## API Endpoints

All endpoints are serverless functions in the `/api` folder:

- `POST /api/auth` - Authentication (admin/intern login)
- `POST /api/change-password` - Change admin password
- `GET /api/load-users` - Load all registered interns
- `GET /api/load-entries` - Load all progress entries
- `POST /api/save-users` - Save interns (admin only)
- `POST /api/save-entries` - Save progress entries

## Local Development

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Edit .env and add your MongoDB URI

# Run development server
npm run dev

# Open http://localhost:3000
```

## Troubleshooting

### "Too many requests" error
- Rate limits are enforced. Wait a few minutes and try again.

### Cannot connect to MongoDB
- Check your MONGODB_URI environment variable
- Ensure IP whitelist includes 0.0.0.0/0 in MongoDB Atlas
- Verify database user credentials

### Admin login not working
- Default password is set in DEFAULT_ADMIN_PASSWORD environment variable
- Try resetting by removing the admin config from MongoDB and redeploying

### Users not loading
- Check MongoDB connection
- Ensure users collection exists and has data
- Check browser console for API errors

## Support

For issues or questions, check the documentation files:
- [DEPLOYMENT.md](DEPLOYMENT.md) - Detailed deployment instructions
- [SECURITY_IMPLEMENTATION.txt](SECURITY_IMPLEMENTATION.txt) - Security details
- [CREDENTIALS_LIST.txt](CREDENTIALS_LIST.txt) - Pre-registered intern credentials
- [CREDENTIALS_INFO.txt](CREDENTIALS_INFO.txt) - Additional credential information

## License

MIT License - Free to use and modify
