const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs/promises');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const LEADS_FILE = path.join(__dirname, 'leads_db.json');
const ADMIN_PIN = process.env.ADMIN_PIN || 'admin123';

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static assets from root directory
app.use(express.static(__dirname));

// Serve static assets from projects folder
app.use('/projects', express.static(path.join(__dirname, 'projects')));

// Database credentials
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
};

const DB_NAME = process.env.DB_NAME || 'r4realty_db';

let pool = null;

// Security Authorization Middleware
function authorizeAdmin(req, res, next) {
  const clientPin = req.headers['x-admin-pin'];
  if (clientPin !== ADMIN_PIN) {
    console.warn(`Unauthorized access attempt from IP: ${req.ip}`);
    return res.status(401).json({ error: 'Unauthorized: Invalid Admin PIN.' });
  }
  next();
}

// Helper to read leads from backup JSON file
async function readLeadsFromFile() {
  try {
    const data = await fs.readFile(LEADS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

// Helper to write leads to backup JSON file
async function writeLeadsToFile(leads) {
  try {
    await fs.writeFile(LEADS_FILE, JSON.stringify(leads, null, 2), 'utf8');
  } catch (err) {
    console.error('Backup JSON write failed:', err.message);
  }
}

// Auto-initialize MySQL database and tables
async function initDatabase() {
  try {
    // 1. Establish connection to check/create database
    const connection = await mysql.createConnection(dbConfig);
    console.log('Connected to MySQL server successfully.');
    
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;`);
    console.log(`Database "${DB_NAME}" checked/created.`);
    await connection.end();

    // 2. Establish connection pool with the database selected
    pool = mysql.createPool({
      ...dbConfig,
      database: DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    // 3. Create leads table if not exists
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS leads (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        email VARCHAR(100),
        project VARCHAR(100),
        message TEXT,
        timestamp VARCHAR(50),
        status VARCHAR(20) DEFAULT 'New'
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;
    await pool.query(createTableQuery);
    console.log('Database tables verified and ready.');

  } catch (error) {
    console.error('MySQL Connection Offline:', error.message);
    console.log('Using File-based JSON Database Fallback (leads_db.json) for local operations.');
  }
}

// REST API Routes

// 1. Create a lead (MySQL + JSON fallback - Open endpoint for submissions)
app.post('/api/leads', async (req, res) => {
  const { id, name, phone, email, project, message, timestamp, status } = req.body;
  
  if (!name || !phone) {
    return res.status(400).json({ error: 'Name and Phone number are required fields.' });
  }

  const newLead = {
    id: id || 'lead_' + Date.now(),
    name,
    phone,
    email: email || 'N/A',
    project: project || 'General Inquiry',
    message: message || 'Interested in this property.',
    timestamp: timestamp || new Date().toLocaleString(),
    status: status || 'New'
  };

  // Try writing to MySQL if pool is active
  if (pool) {
    try {
      const insertQuery = `
        INSERT INTO leads (id, name, phone, email, project, message, timestamp, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      await pool.query(insertQuery, [
        newLead.id,
        newLead.name,
        newLead.phone,
        newLead.email,
        newLead.project,
        newLead.message,
        newLead.timestamp,
        newLead.status
      ]);
      console.log('Lead saved to MySQL.');
      
      // Sync local JSON file too
      const fileLeads = await readLeadsFromFile();
      fileLeads.unshift(newLead);
      await writeLeadsToFile(fileLeads);

      return res.status(201).json({ success: true, message: 'Lead stored in MySQL and local backup.' });
    } catch (error) {
      console.warn('MySQL write failed, falling back to local JSON database:', error.message);
    }
  }

  // Fallback storage: JSON File Database
  try {
    const fileLeads = await readLeadsFromFile();
    fileLeads.unshift(newLead);
    await writeLeadsToFile(fileLeads);
    console.log('Lead saved to server JSON database (MySQL offline).');
    res.status(201).json({ success: true, message: 'Lead stored in local server file (MySQL offline).' });
  } catch (err) {
    console.error('Failed to write lead to database:', err.message);
    res.status(500).json({ error: 'Failed to write lead to database.' });
  }
});

// 2. Fetch all leads (Protected - Admin pin header required)
app.get('/api/leads', authorizeAdmin, async (req, res) => {
  // Try reading from MySQL if pool is active
  if (pool) {
    try {
      const [rows] = await pool.query('SELECT * FROM leads ORDER BY timestamp DESC');
      console.log('Leads fetched from MySQL.');
      return res.status(200).json(rows);
    } catch (error) {
      console.warn('MySQL fetch failed, reading from server JSON file instead:', error.message);
    }
  }

  // Fallback: Read from JSON file database
  try {
    const fileLeads = await readLeadsFromFile();
    console.log('Leads fetched from local JSON file.');
    res.status(200).json(fileLeads);
  } catch (err) {
    console.error('Failed to read leads from database:', err.message);
    res.status(500).json({ error: 'Failed to read database records.' });
  }
});

// 3. Clear database (Protected - Admin pin header required)
app.delete('/api/leads', authorizeAdmin, async (req, res) => {
  // Clear MySQL if pool is active
  if (pool) {
    try {
      await pool.query('TRUNCATE TABLE leads');
      console.log('MySQL leads table cleared.');
    } catch (error) {
      console.warn('MySQL truncation failed:', error.message);
    }
  }

  // Clear local JSON database file
  try {
    await writeLeadsToFile([]);
    console.log('Server JSON file database cleared.');
    res.status(200).json({ success: true, message: 'Database records cleared successfully.' });
  } catch (err) {
    console.error('Failed to clear local database:', err.message);
    res.status(500).json({ error: 'Database reset operation failed.' });
  }
});

// Serve frontend route fallback to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Server
app.listen(PORT, async () => {
  console.log(`==================================================`);
  console.log(`R4Realty Backend running at http://localhost:${PORT}`);
  console.log(`==================================================`);
  await initDatabase();
});
