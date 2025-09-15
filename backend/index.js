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
        encrypt: true, // Required for Azure
        trustServerCertificate: false
    }
};

let pool; // global connection pool

// Connect to DB
async function connectDB() {
    try {
        if (!pool) {
            pool = await sql.connect(dbConfig);
            console.log("✅ Connected to Azure SQL Database");

            const result = await pool.request().query("SELECT DB_NAME() AS currentDb");
            console.log("Connected to DB:", result.recordset[0].currentDb);
        }
        return pool;
    } catch (err) {
        console.error("❌ Database connection failed:", err);
        throw err;
    }
}
connectDB();

// ---------------------- ROUTES ----------------------

// LOGIN endpoint
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const pool = await connectDB();
        const result = await pool.request()
            .input("email", sql.VarChar, email)
            .input("password", sql.VarChar, password)
            .query("SELECT * FROM dbo.student WHERE email = @email AND password = @password");

        if (result.recordset.length > 0) {
            const user = result.recordset[0];

            res.json({
                success: true,
                message: "Login successful",
                data: {
                    id: user.id,              // include id if you want
                    fullname: user.fullname,
                    email: user.email,
                    isTeacher: user.isTeacher === true || user.isTeacher === 1 // ✅ ensure boolean
                }
            });
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
        const pool = await connectDB();

        // Check if email already exists
        const existingUser = await pool.request()
            .input("email", sql.VarChar, email)
            .query("SELECT * FROM dbo.student WHERE email = @email");

        if (existingUser.recordset.length > 0) {
            return res.status(400).json({ success: false, message: "Email already registered" });
        }

        // Insert new student
        await pool.request()
            .input("fullname", sql.VarChar, fullname)
            .input("email", sql.VarChar, email)
            .input("password", sql.VarChar, password)
            .query("INSERT INTO dbo.student (fullname, email, password) VALUES (@fullname, @email, @password)");

        res.json({ success: true, message: "Signup successful" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});
// 1. Get all Courses for a Teacher
app.post('/api/teacher/courses/list', async (req, res) => {
    console.log(">>> /api/teacher/courses/list hit with body:", req.body);
    const { teacherName } = req.body;
    console.log("Fetching courses for teacher:", teacherName);

    if (!teacherName) {
        return res.status(400).json({ success: false, message: "Teacher name is required" });
    }

    try {
        const pool = await connectDB();
        const result = await pool.request()
            .input("teacherName", sql.VarChar, teacherName)
            .query("SELECT id, TeacherName, CourseName, created_at FROM dbo.TeacherCourses WHERE TeacherName = @teacherName");

        res.json({ success: true, courses: result.recordset || [] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});


// 2. Add a new Course for Teacher
app.post('/api/teacher/courses/add', async (req, res) => {
    const { teacherName, courseName } = req.body;
    console.log(`Adding course ${courseName} for teacher ${teacherName}`);

    if (!teacherName || !courseName) {
        return res.status(400).json({ success: false, message: "Teacher name and course name are required" });
    }

    try {
        const pool = await connectDB();
        await pool.request()
            .input("teacherName", sql.VarChar, teacherName)
            .input("courseName", sql.VarChar, courseName)
            .query(`
                INSERT INTO dbo.TeacherCourses (TeacherName, CourseName, created_at) 
                VALUES (@teacherName, @courseName, GETDATE())
            `);

        res.json({ success: true, message: "Course added successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});


app.post('/api/teacher/students/add', async (req, res) => {
    const { teacherName, studentEmail, courseName } = req.body;

    if (!teacherName || !studentEmail || !courseName) {
        return res.status(400).json({ success: false, message: "All fields are required" });
    }

    try {
        const pool = await connectDB();

        // Verify student exists and is not a teacher
        const studentCheck = await pool.request()
            .input("studentEmail", sql.VarChar, studentEmail)
            .query("SELECT * FROM dbo.student WHERE email = @studentEmail AND isTeacher = 0");

        if (studentCheck.recordset.length === 0) {
            return res.status(400).json({ success: false, message: "Invalid student email" });
        }

        // Check if student is already added to this teacher/course
        const existingMapping = await pool.request()
            .input("teacherName", sql.VarChar, teacherName)
            .input("courseName", sql.VarChar, courseName)
            .input("studentEmail", sql.VarChar, studentEmail)
            .query(`
                SELECT * FROM dbo.TeacherClasses 
                WHERE TeacherName = @teacherName AND CourseName = @courseName AND email = @studentEmail
            `);

        if (existingMapping.recordset.length > 0) {
            return res.status(400).json({ success: false, message: "Student is already added to this class" });
        }

        // Insert mapping
        await pool.request()
            .input("teacherName", sql.VarChar, teacherName)
            .input("courseName", sql.VarChar, courseName)
            .input("studentEmail", sql.VarChar, studentEmail)
            .query("INSERT INTO dbo.TeacherClasses (TeacherName, CourseName, email) VALUES (@teacherName, @courseName, @studentEmail)");

        res.json({ success: true, message: "Student added successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});


app.post('/api/teacher/students/list', async (req, res) => {
    const { teacherName, courseName } = req.body;
    console.log(`Fetching students for teacher: ${teacherName}, course: ${courseName || 'ALL'}`);

    if (!teacherName) {
        return res.status(400).json({ success: false, message: "Teacher name is required" });
    }

    try {
        const pool = await connectDB();

        // Join TeacherClasses with student table
        let query = `
            SELECT 
                tc.TeacherName,
                tc.CourseName,
                tc.email,
                s.fullname
            FROM dbo.TeacherClasses tc
            JOIN dbo.student s ON tc.email = s.email
            WHERE tc.TeacherName = @teacherName
        `;

        const request = pool.request().input("teacherName", sql.VarChar, teacherName);

        // Optional filter by course
        if (courseName) {
            query += " AND tc.CourseName = @courseName";
            request.input("courseName", sql.VarChar, courseName);
        }

        const result = await request.query(query);

        res.json({ success: true, students: result.recordset || [] });
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
