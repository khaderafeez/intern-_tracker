const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// MongoDB connection - UPDATE THIS WITH YOUR CONNECTION STRING
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority';
const MONGODB_DB = process.env.MONGODB_DB || 'intern_tracker';

// Old CSV file paths (adjust if needed)
const USERS_CSV = './backup/users.csv';
const ENTRIES_CSV = './backup/entries.csv';

// Parse CSV to JSON
function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  
  return lines.slice(1).map(line => {
    // Handle quoted fields with commas
    const values = [];
    let currentValue = '';
    let insideQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue.trim()); // Push last value
    
    const obj = {};
    headers.forEach((header, i) => {
      obj[header] = (values[i] || '').replace(/^"|"$/g, '');
    });
    return obj;
  });
}

async function importData() {
  try {
    console.log('Starting migration...\n');
    
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    const client = await MongoClient.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    const db = client.db(MONGODB_DB);
    
    console.log('✓ Connected to MongoDB Atlas\n');
    
    // Import Users
    if (fs.existsSync(USERS_CSV)) {
      console.log('Importing users from CSV...');
      const usersCSV = fs.readFileSync(USERS_CSV, 'utf-8');
      const usersData = parseCSV(usersCSV);
      
      const users = usersData
        .filter(user => user.ID || user.id) // Skip empty rows
        .map(user => ({
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
        console.log(`✓ Imported ${users.length} users\n`);
        
        // Show sample
        console.log('Sample user:');
        console.log(JSON.stringify(users[0], null, 2));
        console.log('');
      } else {
        console.log('⚠ No users found in CSV\n');
      }
    } else {
      console.log(`⚠ Users CSV file not found at: ${USERS_CSV}`);
      console.log('  Create a backup folder and place users.csv there\n');
    }
    
    // Import Entries
    if (fs.existsSync(ENTRIES_CSV)) {
      console.log('Importing entries from CSV...');
      const entriesCSV = fs.readFileSync(ENTRIES_CSV, 'utf-8');
      const entriesData = parseCSV(entriesCSV);
      
      const entries = entriesData
        .filter(entry => entry.ID || entry.id) // Skip empty rows
        .map(entry => ({
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
        console.log(`✓ Imported ${entries.length} entries\n`);
        
        // Show sample
        console.log('Sample entry:');
        console.log(JSON.stringify(entries[0], null, 2));
        console.log('');
      } else {
        console.log('⚠ No entries found in CSV\n');
      }
    } else {
      console.log(`⚠ Entries CSV file not found at: ${ENTRIES_CSV}`);
      console.log('  Create a backup folder and place entries.csv there\n');
    }
    
    // Set default admin password (bcrypt hash of K8@dS5Lp)
    console.log('Configuring admin password...');
    const bcrypt = require('bcryptjs');
    const adminPassword = await bcrypt.hash(process.env.DEFAULT_ADMIN_PASSWORD || 'K8@dS5Lp', 12);
    
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
    
    console.log('✓ Admin password configured\n');
    
    // Show database statistics
    const stats = await db.stats();
    console.log('Database Statistics:');
    console.log(`  Database: ${stats.db}`);
    console.log(`  Collections: ${stats.collections}`);
    console.log(`  Data Size: ${(stats.dataSize / 1024).toFixed(2)} KB`);
    console.log('');
    
    await client.close();
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✓ Migration completed successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('Next steps:');
    console.log('1. Deploy your application to Vercel');
    console.log('2. Set environment variables in Vercel:');
    console.log('   - MONGODB_URI');
    console.log('   - MONGODB_DB=intern_tracker');
    console.log('   - DEFAULT_ADMIN_PASSWORD=K8@dS5Lp');
    console.log('3. Login as admin with password: K8@dS5Lp');
    console.log('4. Change admin password immediately\n');
    
  } catch (error) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('✗ Migration failed!');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.error('Error:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Check MONGODB_URI environment variable');
    console.error('2. Verify MongoDB Atlas network access (IP whitelist)');
    console.error('3. Ensure CSV files exist in backup/ folder');
    console.error('4. Check CSV file format (headers and data)\n');
    process.exit(1);
  }
}

// Check for required dependencies
try {
  require('mongodb');
  require('bcryptjs');
} catch (error) {
  console.error('Missing dependencies! Please run:');
  console.error('  npm install mongodb bcryptjs\n');
  process.exit(1);
}

// Run import
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  Intern Tracker - Data Migration Tool  ');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

importData();
