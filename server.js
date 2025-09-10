const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// Disable caching for static assets during development so changes reflect immediately
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.set('Surrogate-Control', 'no-store');
    next();
});
app.use(express.static('public', { maxAge: 0, etag: false, lastModified: false }));

// Session configuration
app.use(session({
    secret: 'corhrv-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, // Set to true in production with HTTPS
        maxAge: 3600000 // 1 hour
    }
}));

// Admin credentials (in production, use environment variables)
const ADMIN_EMAIL = 'lars@lanian.ch';
const ADMIN_PASSWORD = 'Lars.128';

// Email configuration
const transporter = nodemailer.createTransporter({
    // For development/testing, we'll use a test account
    // In production, configure with your actual email provider
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER || ADMIN_EMAIL,
        pass: process.env.EMAIL_PASS || 'your-app-password-here'
    }
});

// Email sending function
async function sendNotificationEmail(to, appLink, customMessage = '') {
    const defaultMessage = `Hi there!

Great news! CorHRV is now ready for download.

You can download the app here: ${appLink}

Thank you for your patience and support!

Best regards,
The CorHRV Team`;

    const mailOptions = {
        from: `"CorHRV Team" <${ADMIN_EMAIL}>`,
        to: to,
        subject: 'CorHRV is now available for download!',
        text: customMessage || defaultMessage,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #3b5bdb;">CorHRV is now available!</h2>
                <p>Hi there!</p>
                <p>Great news! CorHRV is now ready for download.</p>
                <p><a href="${appLink}" style="background: #3b5bdb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Download CorHRV</a></p>
                <p>Thank you for your patience and support!</p>
                <p>Best regards,<br>The CorHRV Team</p>
            </div>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Email sending error:', error);
        return { success: false, error: error.message };
    }
}

// Initialize data file
const dataDir = path.join(__dirname, 'data');
const waitlistFile = path.join(dataDir, 'waitlist.json');

// Create data directory if it doesn't exist
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

// Initialize waitlist file if it doesn't exist
if (!fs.existsSync(waitlistFile)) {
    fs.writeFileSync(waitlistFile, JSON.stringify({ entries: [] }));
}

// Helper functions
function readWaitlist() {
    try {
        const data = fs.readFileSync(waitlistFile, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return { entries: [] };
    }
}

function writeWaitlist(data) {
    fs.writeFileSync(waitlistFile, JSON.stringify(data, null, 2));
}

// Middleware to check if user is authenticated
function requireAuth(req, res, next) {
    if (req.session && req.session.isAuthenticated) {
        next();
    } else {
        res.status(401).json({ error: 'Authentication required' });
    }
}

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Get waitlist count (public)
app.get('/api/waitlist/count', (req, res) => {
    const waitlist = readWaitlist();
    res.json({ count: waitlist.entries.length });
});

// Add to waitlist
app.post('/api/waitlist', (req, res) => {
    const { name, email, hrv_tool } = req.body;
    
    if (!name || !email) {
        return res.status(400).json({ error: 'Name and email are required' });
    }
    
    const waitlist = readWaitlist();
    
    // Check if email already exists
    const exists = waitlist.entries.some(entry => entry.email === email);
    if (exists) {
        return res.status(400).json({ error: 'Email already registered' });
    }
    
    // Add new entry
    const newEntry = {
        id: Date.now().toString(),
        name,
        email,
        hrv_tool: hrv_tool || 'Not specified',
        joined_date: new Date().toISOString(),
        notified: false
    };
    
    waitlist.entries.push(newEntry);
    writeWaitlist(waitlist);
    
    res.json({ 
        success: true, 
        message: 'Successfully joined the waitlist!',
        position: waitlist.entries.length 
    });
});

// Admin login
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        req.session.isAuthenticated = true;
        res.json({ success: true });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

// Admin logout
app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

// Check authentication status
app.get('/api/auth/check', (req, res) => {
    res.json({ authenticated: req.session.isAuthenticated || false });
});

// Get all waitlist entries (admin only)
app.get('/api/waitlist', requireAuth, (req, res) => {
    const waitlist = readWaitlist();
    res.json(waitlist.entries);
});

// Delete waitlist entry (admin only)
app.delete('/api/waitlist/:id', requireAuth, (req, res) => {
    const { id } = req.params;
    const waitlist = readWaitlist();
    
    waitlist.entries = waitlist.entries.filter(entry => entry.id !== id);
    writeWaitlist(waitlist);
    
    res.json({ success: true });
});

// Mark as notified (admin only)
app.put('/api/waitlist/:id/notify', requireAuth, (req, res) => {
    const { id } = req.params;
    const waitlist = readWaitlist();
    
    const entry = waitlist.entries.find(e => e.id === id);
    if (entry) {
        entry.notified = true;
        entry.notified_date = new Date().toISOString();
        writeWaitlist(waitlist);
        res.json({ success: true });
    } else {
        res.status(404).json({ error: 'Entry not found' });
    }
});

// Send email notifications (admin only)
app.post('/api/waitlist/send-emails', requireAuth, async (req, res) => {
    const { recipients, appLink, message } = req.body;
    
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
        return res.status(400).json({ error: 'Recipients array is required' });
    }
    
    if (!appLink) {
        return res.status(400).json({ error: 'App link is required' });
    }
    
    const results = [];
    const waitlist = readWaitlist();
    
    for (const recipient of recipients) {
        try {
            const emailResult = await sendNotificationEmail(recipient.email, appLink, message);
            
            if (emailResult.success) {
                // Mark user as notified
                const entry = waitlist.entries.find(e => e.id === recipient.id);
                if (entry) {
                    entry.notified = true;
                    entry.notified_date = new Date().toISOString();
                }
                
                results.push({
                    email: recipient.email,
                    success: true,
                    messageId: emailResult.messageId
                });
            } else {
                results.push({
                    email: recipient.email,
                    success: false,
                    error: emailResult.error
                });
            }
        } catch (error) {
            results.push({
                email: recipient.email,
                success: false,
                error: error.message
            });
        }
    }
    
    // Save updated waitlist
    writeWaitlist(waitlist);
    
    const successCount = results.filter(r => r.success).length;
    const failCount = results.length - successCount;
    
    res.json({
        success: true,
        sent: successCount,
        failed: failCount,
        results: results
    });
});

// Export waitlist as CSV (admin only)
app.get('/api/waitlist/export', requireAuth, (req, res) => {
    const waitlist = readWaitlist();
    
    let csv = 'Name,Email,HRV Tool,Joined Date,Notified\n';
    waitlist.entries.forEach(entry => {
        csv += `"${entry.name}","${entry.email}","${entry.hrv_tool}","${entry.joined_date}","${entry.notified}"\n`;
    });
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="waitlist.csv"');
    res.send(csv);
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
