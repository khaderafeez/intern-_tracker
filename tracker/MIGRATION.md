# Migration Guide - CSV/PHP to MongoDB/Serverless

This guide helps you migrate existing data from the PHP/CSV version to the new MongoDB/Serverless version.

## Overview

The new version uses:
- ✅ **Node.js Serverless Functions** instead of PHP
- ✅ **MongoDB Atlas** instead of CSV files
- ✅ **Vercel/Netlify** instead of traditional hosting
- ✅ Same frontend (index.html) with minor API endpoint changes

## Migration Steps

### Step 1: Export Existing Data

If you have the old PHP version running:

1. Login as admin
2. Go to "All Progress Entries" section
3. Click "Export to Excel" - this will download all data
4. **Save this file** as backup

Or access the CSV files directly:
- `data/users.csv` - All registered interns
- `data/entries.csv` - All progress entries

### Step 2: Prepare Data for MongoDB

Create a script to import data. Save this as `import-data.js` in your project root:

```javascript
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// MongoDB connection (replace with your connection string)
const MONGODB_URI = 'mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority';
const MONGODB_DB = 'intern_tracker';

// Old CSV file paths (adjust if needed)
const USERS_CSV = './data/users.csv';
const ENTRIES_CSV = './data/entries.csv';

// Parse CSV to JSON
function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const obj = {};
    headers.forEach((header, i) => {
      obj[header] = values[i] || '';
    });
    return obj;
  });
}

async function importData() {
  try {
    // Connect to MongoDB
    const client = await MongoClient.connect(MONGODB_URI);
    const db = client.db(MONGODB_DB);
    
    console.log('✓ Connected to MongoDB');
    
    // Import Users
    if (fs.existsSync(USERS_CSV)) {
      const usersCSV = fs.readFileSync(USERS_CSV, 'utf-8');
      const usersData = parseCSV(usersCSV);
      
      const users = usersData.map(user => ({
        id: user.ID || user.id,
        name: user.Name || user.name,
        email: (user.Email || user.email).toLowerCase(),
        department: user.Department || user.department,
        pin: user.PIN || user.pin,
        createdAt: new Date(user.Created || user.created || Date.now())
      }));
      
      if (users.length > 0) {
        await db.collection('users').deleteMany({});
        await db.collection('users').insertMany(users);
        console.log(`✓ Imported ${users.length} users`);
      }
    } else {
      console.log('⚠ Users CSV file not found, skipping...');
    }
    
    // Import Entries
    if (fs.existsSync(ENTRIES_CSV)) {
      const entriesCSV = fs.readFileSync(ENTRIES_CSV, 'utf-8');
      const entriesData = parseCSV(entriesCSV);
      
      const entries = entriesData.map(entry => ({
        id: entry.ID || entry.id,
        userId: entry.User_ID || entry.userId,
        name: entry.Name || entry.name,
        department: entry.Department || entry.department,
        date: entry.Date || entry.date,
        project: entry.Project || entry.project || '',
        hoursWorked: entry.Hours || entry.hoursWorked || '',
        tasksCompleted: entry.Tasks || entry.tasksCompleted || '',
        challenges: entry.Challenges || entry.challenges || '',
        planForTomorrow: entry.Plan || entry.planForTomorrow || '',
        timestamp: new Date(entry.Timestamp || entry.timestamp || Date.now())
      }));
      
      if (entries.length > 0) {
        await db.collection('entries').deleteMany({});
        await db.collection('entries').insertMany(entries);
        console.log(`✓ Imported ${entries.length} entries`);
      }
    } else {
      console.log('⚠ Entries CSV file not found, skipping...');
    }
    
    // Set default admin password (bcrypt hash of K8@dS5Lp)
    const bcrypt = require('bcryptjs');
    const adminPassword = await bcrypt.hash('K8@dS5Lp', 12);
    
    await db.collection('config').updateOne(
      { type: 'admin' },
      {
        $set: {
          type: 'admin',
          password: adminPassword,
          createdAt: new Date()
        }
      },
      { upsert: true }
    );
    
    console.log('✓ Admin password configured');
    
    await client.close();
    console.log('\n✓ Migration completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Deploy your application to Vercel');
    console.log('2. Login as admin with password: K8@dS5Lp');
    console.log('3. Change admin password immediately');
    
  } catch (error) {
    console.error('✗ Migration failed:', error);
  }
}

importData();
```

### Step 3: Run Import Script

```bash
# Install dependencies (if not already done)
npm install

# Run the import script
node import-data.js
```

Expected output:
```
✓ Connected to MongoDB
✓ Imported 20 users
✓ Imported 45 entries
✓ Admin password configured

✓ Migration completed successfully!
```

### Step 4: Verify Data in MongoDB Atlas

1. Go to MongoDB Atlas Dashboard
2. Click "Browse Collections"
3. Select your database (`intern_tracker`)
4. You should see three collections:
   - `users` - Your interns
   - `entries` - Progress entries
   - `config` - Admin password
   - `security_logs` - Security events (created on first request)

### Step 5: Deploy and Test

1. Follow [DEPLOYMENT.md](DEPLOYMENT.md) to deploy to Vercel
2. Login as admin
3. Verify all users appear in "Registered Interns" table
4. Verify all entries appear in "All Progress Entries" table
5. Export to Excel to confirm data integrity

## Alternative: Manual Import via Admin Interface

If you have a small number of interns (< 20), you can register them manually:

1. Deploy the new version
2. Login as admin
3. For each intern in your old `users.csv`:
   - Click "Register New Intern"
   - Fill in Name, Email, Department, PIN
   - Click "Register"

This method doesn't migrate progress entries - only user accounts.

## Data Structure Comparison

### Old (CSV) Structure

**users.csv**:
```
ID,Name,Email,Department,PIN,Created
1,John Doe,john@example.com,IT,1234,2024-01-15
```

**entries.csv**:
```
ID,User_ID,Name,Department,Date,Project,Hours,Tasks,Challenges,Plan,Timestamp
1,1,John Doe,IT,2024-03-10,API Dev,8,Built API,None,Testing,2024-03-10T18:30:00
```

### New (MongoDB) Structure

**users collection**:
```json
{
  "_id": ObjectId("..."),
  "id": "1",
  "name": "John Doe",
  "email": "john@example.com",
  "department": "IT",
  "pin": "1234",
  "createdAt": ISODate("2024-01-15T00:00:00Z")
}
```

**entries collection**:
```json
{
  "_id": ObjectId("..."),
  "id": "1",
  "userId": "1",
  "name": "John Doe",
  "department": "IT",
  "date": "2024-03-10",
  "project": "API Dev",
  "hoursWorked": "8",
  "tasksCompleted": "Built API",
  "challenges": "None",
  "planForTomorrow": "Testing",
  "timestamp": ISODate("2024-03-10T18:30:00Z")
}
```

## Troubleshooting Migration

### "Cannot find module" error
```bash
# Install missing dependencies
npm install mongodb bcryptjs
```

### "Connection refused" error
- Check MONGODB_URI is correct
- Ensure IP whitelist includes your current IP or 0.0.0.0/0
- Verify database user credentials

### Duplicate entries
```bash
# The script deletes existing data before importing
# If you need to keep existing data, modify the script:
# Remove these lines:
# await db.collection('users').deleteMany({});
# await db.collection('entries').deleteMany({});
```

### CSV parsing errors
- Ensure CSV files have proper headers
- Check for commas in data fields (should be quoted)
- Try opening CSV in Excel and re-saving

### Date format issues
- The script handles multiple date formats
- If dates are incorrect, check CSV timestamp format
- Manually adjust date parsing in the script if needed

## Post-Migration Checklist

- [ ] All users imported successfully
- [ ] All entries imported successfully
- [ ] Admin login works
- [ ] Intern login works (test with one user)
- [ ] Export to Excel generates correct data
- [ ] Session timeout works (wait 30 minutes)
- [ ] Change admin password
- [ ] Delete old PHP files from server
- [ ] Remove old CSV files (keep as backup)
- [ ] Update intern documentation with new URL

## Rollback Plan

If something goes wrong, you can rollback:

1. Keep old PHP version running until migration is verified
2. Keep CSV file backups
3. MongoDB Atlas free tier includes automatic backups
4. You can re-run the import script multiple times (it clears old data first)

## Performance Comparison

| Feature | Old (PHP/CSV) | New (MongoDB/Vercel) |
|---------|---------------|----------------------|
| **Data Storage** | Local CSV files | Cloud MongoDB |
| **Scalability** | Limited to single server | Globally distributed |
| **Backup** | Manual | Automatic |
| **Search** | Linear (slow) | Indexed (fast) |
| **Concurrent Users** | Limited | Unlimited |
| **Deployment** | Manual FTP | Git push |
| **SSL/HTTPS** | Manual setup | Automatic |
| **Cost** | Hosting fee | Free tier |

## Benefits of Migration

✅ **No Server Management**: Vercel handles everything
✅ **Automatic Scaling**: Handles any number of users
✅ **Free Hosting**: Within free tier limits
✅ **Automatic SSL**: HTTPS by default
✅ **Git Deployment**: Push to deploy
✅ **Global CDN**: Fast worldwide access
✅ **Automatic Backups**: MongoDB Atlas backups
✅ **Better Security**: Enterprise-grade infrastructure

## Support

If you encounter issues during migration:

1. Check MongoDB Atlas connection
2. Verify CSV file format
3. Review import script output
4. Check Vercel deployment logs
5. Test with small dataset first

---

**Migration Guide Complete!** 
Your legacy data is now in MongoDB and ready for serverless deployment.
