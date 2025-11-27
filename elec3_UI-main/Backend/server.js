const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Update connection to use promise-based queries
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'it414_db_team_yes'
}).promise();

// Update connection verification
db.connect()
    .then(() => {
        console.log('Connected to database');
        // Verify table structure
        return db.query('DESCRIBE rfid_reg');
    })
    .then((results) => {
        console.log('Table structure:', results[0]);
    })
    .catch(err => {
        console.error('Database connection/verification failed:', err);
    });

app.get('/', (req, res) => {
    res.send('Hello, World!');
});

// Fetch RFID logs with JOIN to rfid_reg
app.get('/rfid_logs', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                l.id,
                l.rfid_data,
                l.rfid_status,
                l.time_log,
                CASE 
                    WHEN r.rfid_data IS NULL THEN 'NOT FOUND'
                    WHEN l.rfid_status = 1 THEN '1'
                    WHEN l.rfid_status = 0 THEN '0'
                    ELSE 'NOT FOUND'
                END AS status_label,
                CASE 
                    WHEN r.rfid_data IS NULL THEN 'NOT FOUND'
                    WHEN r.rfid_status = 1 THEN '1'
                    WHEN r.rfid_status = 0 THEN '0'
                    ELSE 'NOT FOUND'
                END AS current_status
            FROM rfid_logs l
            LEFT JOIN rfid_reg r ON l.rfid_data = r.rfid_data
            ORDER BY l.time_log DESC
        `);
        res.json(rows);
    } catch (err) {
        console.error("Error fetching logs:", err);
        res.status(500).json({ error: err.message });
    }
});


// Update the GET endpoint with better error handling
app.get('/rfid_reg', async (req, res) => {
    try {
        console.log('Fetching RFID data...');
        const [rows] = await db.query('SELECT rfid_data, rfid_status FROM rfid_reg ORDER BY rfid_data DESC');
        console.log('RFID data fetched:', rows);
        
        if (!Array.isArray(rows)) {
            throw new Error('Invalid data structure returned from database');
        }
        
        res.json(rows);
    } catch (err) {
        console.error('Query error:', err);
        res.status(500).json({ 
            error: 'Database error', 
            message: err.message,
            details: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
});
    

// Add endpoint to update RFID status
app.post('/rfid_reg/status', async (req, res) => {
    try {
        const { rfid_data, rfid_status } = req.body;

        const [current] = await db.query(
            'SELECT rfid_status FROM rfid_reg WHERE rfid_data = ?',
            [rfid_data]
        );

        if (current.length === 0) {
            return res.status(404).json({ error: 'Record not found' });
        }

        if (current[0].rfid_status !== rfid_status) {
            await db.query(
                'UPDATE rfid_reg SET rfid_status = ? WHERE rfid_data = ?',
                [rfid_status, rfid_data]
            );
        }

        const [rows] = await db.query(
            'SELECT rfid_data, rfid_status FROM rfid_reg WHERE rfid_data = ?',
            [rfid_data]
        );

        res.json({
            ...rows[0],
            previousStatus: current[0].rfid_status,
            statusChanged: current[0].rfid_status !== rfid_status
        });
    } catch (err) {
        console.error('Update error:', err);
        res.status(500).json({ error: err.message });
    }
});


// Add new endpoint to create RFID record
app.post('/rfid_reg/add', async (req, res) => {
    try {
        const { rfid_data } = req.body;
        // Check if RFID already exists
        const [existing] = await db.query(
            'SELECT rfid_data FROM rfid_reg WHERE rfid_data = ?',
            [rfid_data]
        );

        if (existing.length > 0) {
            return res.status(400).json({ error: 'RFID already exists' });
        }

        // Insert new RFID with default status 0
        await db.query(
            'INSERT INTO rfid_reg (rfid_data, rfid_status) VALUES (?, 0)',
            [rfid_data]
        );
        
        const [rows] = await db.query(
            'SELECT rfid_data, rfid_status FROM rfid_reg WHERE rfid_data = ?',
            [rfid_data]
        );
        
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error('Insert error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Add endpoint to verify RFID existence
app.get('/rfid_reg/verify/:rfid', async (req, res) => {
    try {
        const rfid_data = req.params.rfid;
        const [rows] = await db.query(
            'SELECT rfid_data, rfid_status FROM rfid_reg WHERE rfid_data = ?',
            [rfid_data]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'RFID not found' });
        }
        
        res.json(rows[0]);
    } catch (err) {
        console.error('Verify error:', err);
        res.status(500).json({ error: err.message });
    }
});

// Add endpoint to clear all logs
app.post('/rfid_logs/clear', async (req, res) => {
    try {
        await db.query('DELETE FROM rfid_logs');
        res.json({ message: 'All logs cleared' });
    } catch (err) {
        console.error('Clear logs error:', err);
        res.status(500).json({ error: err.message });
    }
});

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});