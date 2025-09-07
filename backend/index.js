// Import dependencies
const express = require('express');
const sql = require('mssql');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// SQL configuration
const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    options: {
        encrypt: true,
        trustServerCertificate: false
    }
};

// Connect to DB
async function connectDB() {
    try {
        await sql.connect(dbConfig);
        console.log("✅ Connected to Azure SQL Database");
        const result = await sql.query`SELECT DB_NAME() AS currentDb`;
        console.log("Connected to DB:", result.recordset[0].currentDb);

    } catch (err) {
        console.error("❌ Database connection failed:", err);
    }
}
connectDB();

// ---------------------- ROUTES ----------------------

// LOGIN endpoint
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const result = await sql.query`
            SELECT * FROM dbo.student WHERE email = ${email} AND password = ${password}
        `;

        if (result.recordset.length > 0) {
            res.json({ success: true, message: "Login successful", data: result.recordset[0] });
        } else {
            res.status(401).json({ success: false, message: "Invalid email or password" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// SIGNUP endpoint
app.post('/api/signup', async (req, res) => {
    const { fullname, email, password } = req.body;

    try {
        // Check if email already exists
        const existingUser = await sql.query`
            SELECT * FROM dbo.student WHERE email = ${email}
        `;

        if (existingUser.recordset.length > 0) {
            return res.status(400).json({ success: false, message: "Email already registered" });
        }

        // Insert new dbo.student
        await sql.query`
            INSERT INTO dbo.student (fullname, email, password)
            VALUES (${fullname}, ${email}, ${password})
        `;

        res.json({ success: true, message: "Signup successful" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// ----------------------------------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});

