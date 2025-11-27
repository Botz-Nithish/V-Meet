import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import dayjs from "dayjs";
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

const allowedOrigins = [
  "https://polite-field-0c534db00.3.azurestaticapps.net", // your frontend
  "http://localhost:5173", // optional: for local testing
];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("CORS not allowed for this origin"));
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
}));

// ✅ Initialize DB connection first (before server starts)
try {
  await connectDB();
  console.log("✅ Database connected successfully");
} catch (err) {
  console.error("❌ Database connection failed:", err.message);
}

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

        const requests = result.recordset;

        if (!requests.length) {
            return res.json({
                success: true,
                total: 0,
                requests: [],
                aiSummary: "No VM requests found in the database.",
            });
        }

        // 🧮 Compute Weekly Stats
        const now = dayjs();
        const oneWeekAgo = now.subtract(7, "day");
        const thisWeek = requests.filter((r) => dayjs(r.created_at).isAfter(oneWeekAgo));

        const totalThisWeek = thisWeek.length;
        const approvedThisWeek = thisWeek.filter((r) => r.isApproved === 1).length;
        const pendingThisWeek = thisWeek.filter((r) => r.isApproved === 0).length;
        const totalApproved = requests.filter((r) => r.isApproved === 1).length;
        const totalPending = requests.filter((r) => r.isApproved === 0).length;

        // 🧠 AI Summary using Gemini
        const geminiApiKey = process.env.GEMINI_API_KEY;
        const geminiModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";

        let aiSummary = "No AI summary generated.";

        if (geminiApiKey) {
            const systemPrompt = `
      You are "EduAI Analytics", a data analyst assistant for the Virtual Lab Admin Dashboard.
      Using the provided VM request statistics, generate a concise, insightful summary (max 150 words).
      Focus on weekly activity, approval trends, and actionable insights.
      Give the answer in a single String no need of Boldness
      `;

            const context = `I have attatched a SQL Select Query's response based on that you need to tell if it's response ${requests} the query was 
                  SELECT 
        id,
        teacherEmail,
        courseName,
        vmType,
        isApproved,
        created_at
      FROM dbo.VMRequests
      ORDER BY created_at DESC
      `;

            const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`;
            const payload = {
                contents: [
                    {
                        parts: [
                            { text: systemPrompt },
                            { text: context },
                        ],
                    },
                ],
            };

            try {
                const aiResponse = await fetch(url, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });

                const aiData = await aiResponse.json();
                aiSummary =
                    aiData?.candidates?.[0]?.content?.parts?.[0]?.text ||
                    "AI summary could not be generated.";
            } catch (aiErr) {
                console.warn("⚠️ Gemini API call failed:", aiErr.message);
                aiSummary = "Gemini summary service unavailable.";
            }
        } else {
            aiSummary = "Gemini API key not configured.";
        }

        // ✅ Return full dataset + AI summary
        res.json({
            success: true,
            total: requests.length,
            requests, // original recordset
            aiSummary, // extra descriptive field
        });
    } catch (err) {
        console.error("❌ Error fetching VM requests:", err);
        res.status(500).json({
            success: false,
            message: "Server error",
            details: err.message,
        });
    }
});
// TEACHER: GenAI Chat Assistant (Gemini Version)
app.post("/api/teacher/chat", async (req, res) => {
    const { message } = req.body;
    if (!message)
        return res.status(400).json({ success: false, message: "Message is required" });

    try {
        const geminiApiKey = process.env.GEMINI_API_KEY;
        const geminiModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";

        if (!geminiApiKey)
            return res.status(500).json({ success: false, message: "Gemini API key missing" });

        const systemRole = `
        You are "EduAI", a virtual lab assistant for TEACHERS using the V-Meet Portal.
        Help teachers with:
        - Creating classes using 'Add Class'
        - Adding students using 'Save Student'
        - Requesting VMs (Python, Chrome, NodeJS)
        - Understanding VM statuses (Pending / Approved)
        Respond clearly, step-by-step, and only about teacher tasks in the portal.
        If asked something outside your scope, say:
        "I can only assist with the Virtual Lab Teacher Portal."
        Give the answer in a single String no need of Boldness or Spacing.
        `;

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`;

        const payload = {
            contents: [
                {
                    parts: [
                        { text: systemRole },
                        { text: message }
                    ]
                }
            ]
        };

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();
        const reply =
            data?.candidates?.[0]?.content?.parts?.[0]?.text ||
            "Sorry, I couldn’t generate a response.";

        res.json({ success: true, functionCode: 101, reply });
    } catch (err) {
        console.error("❌ /api/teacher/chat (Gemini) error:", err);
        res.status(500).json({
            success: false,
            message: "Server error",
            details: err.message,
        });
    }
});

// STUDENT: GenAI Chat Assistant (Gemini Version)
app.post("/api/student/chat", async (req, res) => {
    const { message } = req.body;
    if (!message)
        return res.status(400).json({ success: false, message: "Message is required" });

    try {
        const geminiApiKey = process.env.GEMINI_API_KEY;
        const geminiModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";

        if (!geminiApiKey)
            return res.status(500).json({ success: false, message: "Gemini API key missing" });

        // 🧠 Student-specific system role
        const systemRole = `
        You are "EduAI", a helpful virtual lab assistant for STUDENTS using the V-Meet Portal.
        You help students:
        - View their allocated Virtual Machines (VMs)
        - Understand VM details (IP Address, Username, Password)
        - Connect to their VM using the RDP command format: "mstsc /v:<IP_ADDRESS>"
        - Explain what each field means and how to use it safely
        - Remind them to copy their RDP command and paste it into Windows Run (Win+R)
        - Warn that VMs auto-delete after the shown remaining time, and they should save work early
        - If the student has issues connecting, tell them to verify IP, network, or contact the teacher
        - If asked about other portal areas, politely decline with:
          "I can only help you with Virtual Machine access and usage."
        Respond in a friendly, step-by-step way.
        Give the answer in a single String no need of Boldness
        `;

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`;

        const payload = {
            contents: [
                {
                    parts: [
                        { text: systemRole },
                        { text: message }
                    ]
                }
            ]
        };

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();
        const reply =
            data?.candidates?.[0]?.content?.parts?.[0]?.text ||
            "Sorry, I couldn’t generate a response.";

        res.json({ success: true, functionCode: 102, reply });
    } catch (err) {
        console.error("❌ /api/student/chat (Gemini) error:", err);
        res.status(500).json({
            success: false,
            message: "Server error",
            details: err.message,
        });
    }
});

app.get("/", (req, res) => {
  res.json({
    message: "✅ V-Meet backend is running successfully on Azure!",
    environment: process.env.NODE_ENV || "development",
    time: new Date().toISOString(),
  });
});

// Example route (optional)
app.get("/api/test", (req, res) => {
  res.send("Hello from /api/test endpoint!");
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



// ----------------------------------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
