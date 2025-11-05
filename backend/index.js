import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import {
  login,
  signup,
  listCourses,
  addCourse,
  addStudent,
  listStudents,
  approveVM,
  connectDB,
  studentRequestVM,
} from "./functions.js";
import sql from "mssql"; // ✅ add this line

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

// ✅ Initialize DB connection first (before server starts)
await connectDB();

// AUTH
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  const response = await login(email, password);
  res.status(response.success ? 200 : 400).json(response);
});

app.post("/api/signup", async (req, res) => {
  const { fullname, email, password } = req.body;
  const response = await signup(fullname, email, password);
  res.status(response.success ? 200 : 400).json(response);
});

// TEACHER
app.post("/api/teacher/courses/list", async (req, res) => {
  try {
    const data = await listCourses(req.body.teacherName);
    res.json({ success: true, courses: data });
  } catch (e) {
    console.error("❌ /api/teacher/courses/list error:", e);
    res.status(500).json({ success: false, message: e.message });
  }
});

app.post("/api/teacher/courses/add", async (req, res) => {
  try {
    const { teacherName, courseName } = req.body;
    const response = await addCourse(teacherName, courseName);
    res.json(response);
  } catch (e) {
    console.error("❌ /api/teacher/courses/add error:", e);
    res.status(500).json({ success: false, message: e.message });
  }
});

app.post("/api/teacher/students/add", async (req, res) => {
  try {
    const { teacherName, studentEmail, courseName } = req.body;
    const response = await addStudent(teacherName, studentEmail, courseName);
    res.json(response);
  } catch (e) {
    console.error("❌ /api/teacher/students/add error:", e);
    res.status(500).json({ success: false, message: e.message });
  }
});

app.post("/api/teacher/students/list", async (req, res) => {
  try {
    const { teacherName, courseName } = req.body;
    const students = await listStudents(teacherName, courseName);
    res.json({ success: true, students });
  } catch (e) {
    console.error("❌ /api/teacher/students/list error:", e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// ADMIN
app.post("/api/admin/vm/approve", async (req, res) => {
  try {
    const { requestId } = req.body;
    const response = await approveVM(requestId);
    res.status(response.success ? 200 : 400).json(response);
  } catch (e) {
    console.error("❌ /api/admin/vm/approve error:", e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// STUDENT
app.post("/api/student/vm/request", async (req, res) => {
  const { studentEmail, courseName, vmType } = req.body;
  if (!studentEmail || !courseName || !vmType)
    return res
      .status(400)
      .json({ success: false, message: "Missing required fields" });

  try {
    const response = await studentRequestVM(studentEmail, courseName, vmType);
    res.status(response.success ? 200 : 400).json(response);
  } catch (err) {
    console.error("❌ /api/student/vm/request error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


// STUDENT: List their active VMs
app.post("/api/student/vm/list", async (req, res) => {
  const { email } = req.body;

  if (!email)
    return res.status(400).json({ success: false, message: "Email is required" });

  try {
    const pool = await connectDB();
    const result = await pool
      .request()
      .input("email", sql.VarChar, email)
      .query("SELECT * FROM dbo.StudentVMs WHERE studentEmail = @email");

    res.json({
      success: true,
      vms: result.recordset || [],
    });
  } catch (err) {
    console.error("❌ /api/student/vm/list error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


// 🧾 ADMIN: List all VM requests (must be above app.listen)
app.get("/api/admin/vm/requests", async (req, res) => {
  try {
    const pool = await connectDB();
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
      requests: result.recordset,
    });
  } catch (err) {
    console.error("❌ Error fetching VM requests:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ----------------------------------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
