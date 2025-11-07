// functions.js
import sql from "mssql";
import dotenv from "dotenv";
import { createVM, deleteVM } from "./create-VM.js";
dotenv.config();

// SQL CONFIG
const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    options: {
        encrypt: true,
        trustServerCertificate: false,
    },
};

let pool;

// DB connection function
export async function connectDB() {
    try {
        if (!pool) {
            pool = await sql.connect(dbConfig);
            console.log("✅ Connected to Azure SQL Database");
        }
        return pool;
    } catch (err) {
        console.error("❌ Database connection failed:", err);
        throw err;
    }
}

// LOGIN
export async function login(email, password) {
    const pool = await connectDB();
    const result = await pool
        .request()
        .input("email", sql.VarChar, email)
        .input("password", sql.VarChar, password)
        .query("SELECT * FROM dbo.student WHERE email=@email AND password=@password");

    if (result.recordset.length > 0) {
        const user = result.recordset[0];
        return {
            success: true,
            message: "Login successful",
            data: {
                id: user.id,
                fullname: user.fullname,
                email: user.email,
                isTeacher: user.isTeacher === true || user.isTeacher === 1,
            },
        };
    } else {
        return { success: false, message: "Invalid email or password" };
    }
}

// SIGNUP
export async function signup(fullname, email, password) {
    const pool = await connectDB();
    const existing = await pool
        .request()
        .input("email", sql.VarChar, email)
        .query("SELECT * FROM dbo.student WHERE email=@email");

    if (existing.recordset.length > 0) {
        return { success: false, message: "Email already registered" };
    }

    await pool
        .request()
        .input("fullname", sql.VarChar, fullname)
        .input("email", sql.VarChar, email)
        .input("password", sql.VarChar, password)
        .query("INSERT INTO dbo.student (fullname, email, password) VALUES (@fullname,@email,@password)");

    return { success: true, message: "Signup successful" };
}

// TEACHER: LIST COURSES
export async function listCourses(teacherName) {
    const pool = await connectDB();
    const result = await pool
        .request()
        .input("teacherName", sql.VarChar, teacherName)
        .query("SELECT * FROM dbo.TeacherCourses WHERE TeacherName=@teacherName");
    return result.recordset;
}

// TEACHER: ADD COURSE
export async function addCourse(teacherName, courseName) {
    const pool = await connectDB();
    await pool
        .request()
        .input("teacherName", sql.VarChar, teacherName)
        .input("courseName", sql.VarChar, courseName)
        .query("INSERT INTO dbo.TeacherCourses (TeacherName,CourseName,created_at) VALUES (@teacherName,@courseName,GETDATE())");
    return { success: true, message: "Course added successfully" };
}

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

// TEACHER: ADD STUDENT
export async function addStudent(teacherName, studentEmail, courseName) {
    const pool = await connectDB();
    const student = await pool
        .request()
        .input("studentEmail", sql.VarChar, studentEmail)
        .query("SELECT * FROM dbo.student WHERE email=@studentEmail AND isTeacher=0");

    if (student.recordset.length === 0) return { success: false, message: "Invalid student email" };

    const exists = await pool
        .request()
        .input("teacherName", sql.VarChar, teacherName)
        .input("courseName", sql.VarChar, courseName)
        .input("studentEmail", sql.VarChar, studentEmail)
        .query("SELECT * FROM dbo.TeacherClasses WHERE TeacherName=@teacherName AND CourseName=@courseName AND email=@studentEmail");

    if (exists.recordset.length > 0)
        return { success: false, message: "Student already added to class" };

    await pool
        .request()
        .input("teacherName", sql.VarChar, teacherName)
        .input("courseName", sql.VarChar, courseName)
        .input("studentEmail", sql.VarChar, studentEmail)
        .query("INSERT INTO dbo.TeacherClasses (TeacherName,CourseName,email) VALUES (@teacherName,@courseName,@studentEmail)");

    return { success: true, message: "Student added successfully" };
}

// TEACHER: LIST STUDENTS
export async function listStudents(teacherName, courseName) {
    const pool = await connectDB();
    let query = `
      SELECT tc.TeacherName, tc.CourseName, tc.email, s.fullname
      FROM dbo.TeacherClasses tc
      JOIN dbo.student s ON tc.email=s.email
      WHERE tc.TeacherName=@teacherName
  `;
    const request = pool.request().input("teacherName", sql.VarChar, teacherName);
    if (courseName) {
        query += " AND tc.CourseName=@courseName";
        request.input("courseName", sql.VarChar, courseName);
    }
    const result = await request.query(query);
    return result.recordset;
}

// ADMIN: APPROVE VM
export async function approveVM(requestId) {
    const pool = await connectDB();

    const reqData = await pool
        .request()
        .input("id", sql.Int, requestId)
        .query("SELECT * FROM dbo.VMRequests WHERE id=@id AND isApproved=0");

    if (reqData.recordset.length === 0)
        return { success: false, message: "No pending request found" };

    const { teacherEmail, courseName, vmType } = reqData.recordset[0];

    const students = await pool
        .request()
        .input("courseName", sql.VarChar, courseName)
        .query("SELECT email FROM dbo.TeacherClasses WHERE CourseName=@courseName");

    if (students.recordset.length === 0)
        return { success: false, message: "No students found for this course" };

    await pool.request().input("id", sql.Int, requestId).query("UPDATE dbo.VMRequests SET isApproved=1 WHERE id=@id");

    const createdVMs = [];
    for (const student of students.recordset) {
        const email = student.email;
        const rollMatch = email.match(/(\d+)/);
        const rollNumber = rollMatch ? rollMatch[0] : "000";
        const username = rollNumber;
        const last3 = rollNumber.slice(-3);
        const password = `${last3}@Rec#2025`;
        const vmName = `${courseName}-${last3}`;

        const vmInfo = await createVM(vmType, vmName, username, password);
        const createdAt = new Date();
        const autoDeleteAt = new Date(createdAt.getTime() + 3 * 60 * 60 * 1000);

        await pool
            .request()
            .input("studentEmail", sql.VarChar, email)
            .input("courseName", sql.VarChar, courseName)
            .input("vmType", sql.VarChar, vmType)
            .input("vmName", sql.VarChar, vmInfo.vmName)
            .input("vmIp", sql.VarChar, vmInfo.ipAddress)
            .input("vmUsername", sql.VarChar, username)
            .input("vmPassword", sql.VarChar, password)
            .input("autoDeleteAt", sql.DateTime, autoDeleteAt)
            .query(
                "INSERT INTO dbo.StudentVMs (studentEmail,courseName,vmType,vmName,vmIp,vmUsername,vmPassword,autoDeleteAt) VALUES (@studentEmail,@courseName,@vmType,@vmName,@vmIp,@vmUsername,@vmPassword,@autoDeleteAt)"
            );

        createdVMs.push({ email, ip: vmInfo.ipAddress, username, password, vmName });

        setTimeout(async () => {
            await deleteVM(vmInfo.vmName);
            await pool.request().input("studentEmail", sql.VarChar, email).query("DELETE FROM dbo.StudentVMs WHERE studentEmail=@studentEmail");
        }, 10800000);
    }

    return { success: true, message: "VMs created successfully", data: createdVMs };

}

// STUDENT: REQUEST VM
export async function studentRequestVM(studentEmail, courseName, vmType) {
  const pool = await connectDB();

  // Verify student exists
  const studentCheck = await pool
    .request()
    .input("studentEmail", sql.VarChar, studentEmail)
    .query("SELECT * FROM dbo.student WHERE email=@studentEmail AND isTeacher=0");

  if (studentCheck.recordset.length === 0)
    return { success: false, message: "Invalid student email" };

  // Verify student enrolled in course
  const enrolled = await pool
    .request()
    .input("studentEmail", sql.VarChar, studentEmail)
    .input("courseName", sql.VarChar, courseName)
    .query("SELECT * FROM dbo.TeacherClasses WHERE email=@studentEmail AND CourseName=@courseName");

  if (enrolled.recordset.length === 0)
    return { success: false, message: "Student not enrolled in this course" };

  // Check for duplicate pending request
  const existing = await pool
    .request()
    .input("studentEmail", sql.VarChar, studentEmail)
    .input("courseName", sql.VarChar, courseName)
    .query("SELECT * FROM dbo.VMRequests WHERE teacherEmail=@studentEmail AND courseName=@courseName AND isApproved=0");

  if (existing.recordset.length > 0)
    return { success: false, message: "You already have a pending VM request" };

  // Insert new request
  await pool
    .request()
    .input("teacherEmail", sql.VarChar, studentEmail) // reuse same column for email
    .input("courseName", sql.VarChar, courseName)
    .input("vmType", sql.VarChar, vmType)
    .query(
      "INSERT INTO dbo.VMRequests (teacherEmail, courseName, vmType, isApproved) VALUES (@teacherEmail, @courseName, @vmType, 0)"
    );

  return { success: true, message: "VM request submitted for admin approval" };
}

