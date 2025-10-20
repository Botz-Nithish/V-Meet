import express from "express";
import sql from "mssql";
import dotenv from "dotenv";
import cors from "cors";
import { createVM } from "./create-VM.js";
import { deleteVM } from "./create-VM.js";

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

app.post('/api/admin/vm/approve', async (req, res) => {
    const { requestId } = req.body;
    if (!requestId)
        return res.status(400).json({ success: false, message: "Request ID required" });

    try {
        const pool = await connectDB();

        // 1️⃣ Fetch pending request
        const reqData = await pool.request()
            .input("id", sql.Int, requestId)
            .query("SELECT * FROM dbo.VMRequests WHERE id = @id AND isApproved = 0");

        if (reqData.recordset.length === 0)
            return res.status(404).json({ success: false, message: "No pending request found" });

        const { teacherEmail, courseName, vmType } = reqData.recordset[0];

        // 2️⃣ Fetch all students for that course
        const students = await pool.request()
            .input("courseName", sql.VarChar, courseName)
            .query("SELECT email FROM dbo.TeacherClasses WHERE CourseName = @courseName");

        if (students.recordset.length === 0)
            return res.status(404).json({ success: false, message: "No students found for this course" });

        // 3️⃣ Mark request approved
        await pool.request()
            .input("id", sql.Int, requestId)
            .query("UPDATE dbo.VMRequests SET isApproved = 1 WHERE id = @id");

        const createdVMs = [];

        // 4️⃣ Create VM for each student
        for (const student of students.recordset) {
            const email = student.email;
            const rollMatch = email.match(/(\d+)/);
            const rollNumber = rollMatch ? rollMatch[0] : "000";
            const username = rollNumber; // 👈 personalized username
            const last3 = rollNumber.slice(-3);
            const password = `${last3}@Rec#2025`;
            const vmName = `${courseName}-${last3}`; // 👈 unique VM name

            console.log(`Creating VM for ${email} (${username}/${password})`);

            // ✅ Pass student-specific info to createVM
            const vmInfo = await createVM(vmType, vmName, username, password);
            const safeVmName = vmInfo.vmName; // Use sanitized name returned by createVM()

            // Insert into StudentVMs
            const createdAt = new Date();
            const autoDeleteAt = new Date(createdAt.getTime() + 3 * 60 * 60 * 1000); // +3 hours

            await pool.request()
                .input("studentEmail", sql.VarChar, email)
                .input("courseName", sql.VarChar, courseName)
                .input("vmType", sql.VarChar, vmType)
                .input("vmName", sql.VarChar, vmInfo.vmName) // ✅ new line
                .input("vmIp", sql.VarChar, vmInfo.ipAddress)
                .input("vmUsername", sql.VarChar, username)
                .input("vmPassword", sql.VarChar, password)
                .input("autoDeleteAt", sql.DateTime, autoDeleteAt)
                .query(`
    INSERT INTO dbo.StudentVMs (studentEmail, courseName, vmType, vmName, vmIp, vmUsername, vmPassword, autoDeleteAt)
    VALUES (@studentEmail, @courseName, @vmType, @vmName, @vmIp, @vmUsername, @vmPassword, @autoDeleteAt)
  `);



            createdVMs.push({ email, ip: vmInfo.ipAddress, username, password, vmName });

            // 🕒 Schedule deletion after 3 hours
            setTimeout(async () => {
                console.log(`🕒 Auto-deleting VM for ${email}: ${safeVmName}`);
                await deleteVM(safeVmName);

                // Delete from DB
                await pool.request()
                    .input("studentEmail", sql.VarChar, email)
                    .query("DELETE FROM dbo.StudentVMs WHERE studentEmail = @studentEmail");

                console.log(`🗑️ VM and record for ${email} deleted successfully.`);
            }, 10800000);
        }


        res.json({
            success: true,
            message: "VMs created successfully (auto-deletion in 3 hours)",
            data: createdVMs
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

app.post('/api/teacher/vm/request', async (req, res) => {
    const { teacherEmail, courseName, vmType } = req.body;

    if (!teacherEmail || !courseName || !vmType)
        return res.status(400).json({ success: false, message: "Missing required fields" });

    try {
        const pool = await connectDB();
        await pool.request()
            .input("teacherEmail", sql.VarChar, teacherEmail)
            .input("courseName", sql.VarChar, courseName)
            .input("vmType", sql.VarChar, vmType)
            .query(`INSERT INTO dbo.VMRequests (teacherEmail, courseName, vmType, isApproved) VALUES (@teacherEmail, @courseName, @vmType, 0)`);

        res.json({ success: true, message: "VM Request submitted for admin approval" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});


app.post('/api/student/vm/list', async (req, res) => {
    const { email } = req.body;
    if (!email)
        return res.status(400).json({ success: false, message: "Email is required" });

    try {
        const pool = await connectDB();
        const result = await pool.request()
            .input("email", sql.VarChar, email)
            .query("SELECT * FROM dbo.StudentVMs WHERE studentEmail = @email");

        res.json({ success: true, vms: result.recordset || [] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// 🧾 Admin API - List all VM Requests
app.get('/api/admin/vm/requests', async (req, res) => {
  try {
    const pool = await connectDB();

    // Fetch all VM requests (pending + approved)
    const result = await pool.request().query(`
      SELECT 
        id,
        teacherEmail,
        courseName,
        vmType,
        isApproved,
        created_at
      FROM dbo.VMRequests
      ORDER BY created_at DESC
    `);

    res.json({
      success: true,
      total: result.recordset.length,
      requests: result.recordset
    });
  } catch (err) {
    console.error("❌ Error fetching VM requests:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});



// ----------------------------------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
