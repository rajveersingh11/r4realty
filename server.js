const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs/promises');
require('dotenv').config();

// Security / rate-limiting and headers
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3000;
const LEADS_FILE = path.join(__dirname, 'leads_db.json');

// ADMIN_PIN must be provided via environment for admin endpoints to work
const ADMIN_PIN = process.env.ADMIN_PIN;
if (!ADMIN_PIN) {
  console.error('FATAL: ADMIN_PIN environment variable is not set. Admin endpoints are disabled for security.');
  console.error('Set ADMIN_PIN in your environment (e.g., export ADMIN_PIN="<strong-secret>") and restart the server.');
  process.exit(1);
}

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://www.googletagmanager.com", "https://*.googletagmanager.com", "https://www.google-analytics.com", "https://*.google-analytics.com", "https://cdnjs.cloudflare.com", "'unsafe-inline'"],
      connectSrc: [
        "'self'", 
        "https://www.google-analytics.com", 
        "https://*.google-analytics.com", 
        "https://analytics.google.com", 
        "https://*.analytics.google.com", 
        "https://www.google.com", 
        "https://*.google.com", 
        "https://www.googletagmanager.com", 
        "https://*.googletagmanager.com", 
        "https://stats.g.doubleclick.net", 
        "https://*.doubleclick.net"
      ],
      imgSrc: [
        "'self'", 
        "data:", 
        "https://www.google-analytics.com", 
        "https://*.google-analytics.com", 
        "https://analytics.google.com", 
        "https://*.analytics.google.com", 
        "https://www.google.com", 
        "https://*.google.com", 
        "https://www.googletagmanager.com", 
        "https://*.googletagmanager.com", 
        "https://stats.g.doubleclick.net", 
        "https://*.doubleclick.net"
      ],
      styleSrc: ["'self'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com", "'unsafe-inline'"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      frameSrc: ["'self'"]
    }
  }
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Clean URLs / SEO routing for projects catalog and sub-pages
const projectPages = [
  'bhutani-belfair',
  'gygy-mentis',
  'mall-of-expressway',
  'sector-151-farmlands',
  'sunrise-city',
  'vedic-city-goa',
  'noida',
  'greater-noida',
  'goa'
];

app.get(['/projects', '/projects/'], (req, res) => {
  res.sendFile(path.join(__dirname, 'projects', 'index.html'));
});

projectPages.forEach(project => {
  app.get([`/projects/${project}`, `/${project}`], (req, res) => {
    res.sendFile(path.join(__dirname, 'projects', `${project}.html`));
  });
});

// Clean URLs / SEO routing for blog posts
app.get(['/blog', '/blog/'], (req, res) => {
  res.sendFile(path.join(__dirname, 'blog', 'index.html'));
});

app.get(['/blog/noida-expressway-commercial-real-estate-guide-2026', '/blog/noida-expressway-commercial-real-estate-guide-2026/'], (req, res) => {
  res.sendFile(path.join(__dirname, 'blog', 'noida-expressway-commercial-real-estate-guide-2026.html'));
});

app.get(['/blog/delhi-ncr-real-estate-trends-2026', '/blog/delhi-ncr-real-estate-trends-2026/'], (req, res) => {
  res.sendFile(path.join(__dirname, 'blog', 'delhi-ncr-real-estate-trends-2026.html'));
});

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
  if (!clientPin || clientPin !== ADMIN_PIN) {
    console.warn(`Unauthorized admin attempt from IP ${req.ip} at ${new Date().toISOString()}`);
    return res.status(401).json({ error: 'Unauthorized' });
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

// Rate limiter for admin-sensitive routes
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});

// Rate limiter for public lead submissions (basic anti-spam)
const publicLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // max 30 submissions per IP per minute
  standardHeaders: true,
  legacyHeaders: false,
});

// REST API Routes

// 1. Create a lead (MySQL + JSON fallback - Open endpoint for submissions)
app.post('/api/leads', publicLimiter, async (req, res) => {
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

// Helper: fetch all leads, preferring MySQL
async function fetchAllLeads() {
  if (pool) {
    try {
      const [rows] = await pool.query('SELECT * FROM leads ORDER BY timestamp DESC');
      return rows;
    } catch (error) {
      console.warn('MySQL fetch failed, falling back to file:', error.message);
    }
  }
  return await readLeadsFromFile();
}

// 2. Fetch all leads (Protected - Admin pin header required)
app.get('/api/leads', adminLimiter, authorizeAdmin, async (req, res) => {
  try {
    const rows = await fetchAllLeads();
    res.status(200).json(rows);
  } catch (err) {
    console.error('Failed to fetch leads:', err.message);
    res.status(500).json({ error: 'Failed to read database records.' });
  }
});

// 2b. Export leads as CSV (Protected)
app.get('/api/leads/export', adminLimiter, authorizeAdmin, async (req, res) => {
  try {
    const leads = await fetchAllLeads();

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="r4realty_leads_${new Date().toISOString().slice(0,10)}.csv"`);

    // CSV header
    res.write('Date & Time,Name,Phone,Email,Project,Message,Status\n');

    leads.forEach(lead => {
      const row = [
        `"${(lead.timestamp || '').toString().replace(/"/g, '""')}"`,
        `"${(lead.name || '').toString().replace(/"/g, '""')}"`,
        `"${(lead.phone || '').toString().replace(/"/g, '""')}"`,
        `"${(lead.email || '').toString().replace(/"/g, '""')}"`,
        `"${(lead.project || '').toString().replace(/"/g, '""')}"`,
        `"${(lead.message || '').toString().replace(/"/g, '""')}"`,
        `"${(lead.status || 'New').toString().replace(/"/g, '""')}"`
      ];
      res.write(row.join(',') + '\n');
    });

    res.end();
  } catch (err) {
    console.error('Failed to export leads as CSV:', err.message);
    res.status(500).json({ error: 'Failed to export leads.' });
  }
});

// 3. Update lead status/notes (Protected - Admin pin header required)
app.patch('/api/leads', adminLimiter, authorizeAdmin, async (req, res) => {
  const { id, status, message } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Lead ID is required.' });
  }

  // Update MySQL if active
  if (pool) {
    try {
      if (status && message) {
        await pool.query('UPDATE leads SET status = ?, message = ? WHERE id = ?', [status, message, id]);
      } else if (status) {
        await pool.query('UPDATE leads SET status = ? WHERE id = ?', [status, id]);
      } else if (message) {
        await pool.query('UPDATE leads SET message = ? WHERE id = ?', [message, id]);
      }
    } catch (error) {
      console.warn('MySQL update failed:', error.message);
    }
  }

  // Update local JSON file
  try {
    const fileLeads = await readLeadsFromFile();
    const target = fileLeads.find(l => (l.id || l.timestamp) === id);
    if (target) {
      if (status) target.status = status;
      if (message) target.message = message;
      await writeLeadsToFile(fileLeads);
    }
    res.status(200).json({ success: true, message: 'Lead updated successfully.' });
  } catch (err) {
    console.error('Failed to update lead in database:', err.message);
    res.status(500).json({ error: 'Failed to update lead record.' });
  }
});

// 4. Clear database or delete single lead (Protected - Admin pin header required)
app.delete('/api/leads', adminLimiter, authorizeAdmin, async (req, res) => {
  const leadId = req.query.id;

  if (leadId) {
    // Delete single lead
    if (pool) {
      try {
        await pool.query('DELETE FROM leads WHERE id = ?', [leadId]);
      } catch (error) {
        console.warn('MySQL single lead deletion failed:', error.message);
      }
    }

    try {
      let fileLeads = await readLeadsFromFile();
      fileLeads = fileLeads.filter(l => (l.id || l.timestamp) !== leadId);
      await writeLeadsToFile(fileLeads);
      return res.status(200).json({ success: true, message: `Lead ${leadId} deleted.` });
    } catch (err) {
      console.error('Failed to delete lead:', err.message);
      return res.status(500).json({ error: 'Failed to delete lead.' });
    }
  }

  // Clear all leads
  if (pool) {
    try {
      await pool.query('TRUNCATE TABLE leads');
      console.log('MySQL leads table cleared.');
    } catch (error) {
      console.warn('MySQL truncation failed:', error.message);
    }
  }

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
