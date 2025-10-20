import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";
import apiFetch from "../components/apifetch/index";
import Notify from "../components/notify";
import { Menu, X, BookOpen, Cpu } from "lucide-react"; // ✅ icons

const TeacherPortal = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState("courses");
  const [classes, setClasses] = useState([]);
  const [newClassId, setNewClassId] = useState("");
  const [students, setStudents] = useState([]);
  const [studentEmail, setStudentEmail] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedVmClass, setSelectedVmClass] = useState("");
  const [vmType, setVmType] = useState("pythonVM");
  const [vmRequests, setVmRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const user = JSON.parse(Cookies.get("user") || "{}");
  const teacherName = user.fullname || "";
  const teacherEmail = user.email || "";

  // Fetch Courses
  const fetchCourses = async () => {
    const data = await apiFetch("/api/teacher/courses/list", { teacherName });
    if (data.success) {
      setClasses(data.courses);
      if (data.courses.length > 0) {
        setSelectedClass(data.courses[0].CourseName);
        setSelectedVmClass(data.courses[0].CourseName);
      }
    }
  };

  // Fetch Students
  const fetchStudents = async () => {
    if (!selectedClass) return;
    setLoading(true);
    const data = await apiFetch("/api/teacher/students/list", {
      teacherName,
      courseName: selectedClass,
    });
    if (data.success) setStudents(data.students);
    setLoading(false);
  };

  // Fetch VM Requests
  const fetchVmRequests = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/admin/vm/requests");
      const data = await res.json();
      if (data.success) {
        const filtered = data.requests.filter(
          (req) => req.teacherEmail === teacherEmail
        );
        setVmRequests(filtered);
      }
    } catch (err) {
      console.error("Error fetching VM requests:", err);
    }
  };

  // Add New Class
  const handleAddClass = async () => {
    if (!newClassId.trim()) return;
    const data = await apiFetch("/api/teacher/courses/add", {
      teacherName,
      courseName: newClassId.trim(),
    });
    if (data.success) {
      fetchCourses();
      setNewClassId("");
      setNotification({
        show: true,
        message: "Class added successfully!",
        type: "success",
      });
    } else {
      setNotification({
        show: true,
        message: data.message || "Failed to add class",
        type: "error",
      });
    }
  };

  // Add Student
  const handleAddStudent = async () => {
    if (!studentEmail.trim() || !selectedClass) return;
    const data = await apiFetch("/api/teacher/students/add", {
      teacherName,
      studentEmail,
      courseName: selectedClass,
    });
    if (data.success) {
      fetchStudents();
      setStudentEmail("");
      setNotification({
        show: true,
        message: "Student added successfully!",
        type: "success",
      });
    } else {
      setNotification({
        show: true,
        message: data.message || "Failed to add student",
        type: "error",
      });
    }
  };

  // Request VM
  const handleVmRequest = async () => {
    if (!teacherEmail || !selectedVmClass || !vmType) return;
    try {
      const response = await fetch("http://localhost:5000/api/teacher/vm/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherEmail,
          courseName: selectedVmClass,
          vmType,
        }),
      });
      const data = await response.json();
      if (data.success) {
        fetchVmRequests();
        setNotification({
          show: true,
          message: data.message || "VM Request submitted successfully!",
          type: "success",
        });
      } else {
        setNotification({
          show: true,
          message: data.message || "Failed to request VM",
          type: "error",
        });
      }
    } catch (err) {
      console.error("Error:", err);
      setNotification({
        show: true,
        message: "Server error. Please try again.",
        type: "error",
      });
    }
  };

  useEffect(() => {
    if (teacherName) fetchCourses();
  }, [teacherName]);

  useEffect(() => {
    if (selectedClass) fetchStudents();
  }, [selectedClass]);

  useEffect(() => {
    if (teacherEmail) fetchVmRequests();
  }, [teacherEmail]);

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-white via-lime-50 to-white text-gray-800 font-sans">
      {/* ✅ Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } transition-all duration-300 bg-white border-r border-lime-200 shadow-lg flex flex-col items-start p-4`}
      >
        <div className="flex justify-between items-center w-full mb-6">
          <h1
            className={`text-2xl font-extrabold text-lime-600 transition-all ${
              sidebarOpen ? "opacity-100" : "opacity-0 w-0"
            }`}
          >
            Quick Select
          </h1>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-md hover:bg-lime-100"
          >
            {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        <nav className="space-y-3 w-full">
          <button
            onClick={() => setActiveSection("courses")}
            className={`flex items-center gap-3 w-full px-4 py-2 rounded-lg font-medium transition-all ${
              activeSection === "courses"
                ? "bg-lime-600 text-white"
                : "hover:bg-lime-50 hover:text-lime-700 text-gray-700"
            }`}
          >
            <BookOpen size={20} />
            {sidebarOpen && <span>Course Management</span>}
          </button>

          <button
            onClick={() => setActiveSection("vm")}
            className={`flex items-center gap-3 w-full px-4 py-2 rounded-lg font-medium transition-all ${
              activeSection === "vm"
                ? "bg-lime-600 text-white"
                : "hover:bg-lime-50 hover:text-lime-700 text-gray-700"
            }`}
          >
            <Cpu size={20} />
            {sidebarOpen && <span>VM Management</span>}
          </button>
        </nav>
      </aside>

      {/* ✅ Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <Notify
          message={notification.message}
          show={notification.show}
          type={notification.type}
          onClose={() => setNotification({ ...notification, show: false })}
        />

        {/* ===== COURSE MANAGEMENT SECTION ===== */}
        {activeSection === "courses" && (
          <section id="courses">
            <h2 className="text-3xl font-bold text-lime-600 mb-8">Course Management</h2>

            {/* Create New Class */}
            <div className="mb-8 bg-white rounded-2xl shadow-md border border-lime-200 p-6">
              <h3 className="text-2xl font-semibold mb-4 text-lime-700">Create New Class</h3>
              <div className="flex flex-wrap gap-4 items-center">
                <input
                  type="text"
                  placeholder="Enter Course Name"
                  value={newClassId}
                  onChange={(e) => setNewClassId(e.target.value)}
                  className="flex-1 min-w-[200px] px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 outline-none"
                />
                <button
                  onClick={handleAddClass}
                  className="px-5 py-2 bg-lime-600 text-white rounded-lg font-semibold hover:bg-lime-700 transition"
                >
                  Add Class
                </button>
              </div>
            </div>

            {/* Add Student */}
            <div className="mb-8 bg-white rounded-2xl shadow-md border border-lime-200 p-6">
              <h3 className="text-2xl font-semibold mb-4 text-lime-700">Add Student to Class</h3>
              <div className="flex flex-wrap gap-4 items-center">
                <input
                  type="email"
                  placeholder="Student Email"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  className="flex-1 min-w-[200px] px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 outline-none"
                />
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 outline-none"
                >
                  {classes.map((cls, idx) => (
                    <option key={idx} value={cls.CourseName}>
                      {cls.CourseName}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAddStudent}
                  className="px-5 py-2 bg-lime-600 text-white rounded-lg font-semibold hover:bg-lime-700 transition"
                >
                  Save Student
                </button>
              </div>
            </div>

            {/* Student List */}
            <div className="bg-white rounded-2xl shadow-md border border-lime-200 p-6">
              <h3 className="text-2xl font-semibold mb-4 text-lime-700">Students List</h3>
              {loading ? (
                <p className="text-gray-500">Loading...</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse text-sm text-gray-800">
                    <thead className="bg-lime-100 text-lime-800">
                      <tr>
                        <th className="py-3 px-5 text-left border-b border-dotted border-lime-300">Name</th>
                        <th className="py-3 px-5 text-left border-b border-dotted border-lime-300">Email</th>
                        <th className="py-3 px-5 text-left border-b border-dotted border-lime-300">Class</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.length === 0 ? (
                        <tr>
                          <td colSpan="3" className="text-center py-6 text-gray-400 italic">
                            No students found
                          </td>
                        </tr>
                      ) : (
                        students.map((student, idx) => (
                          <tr key={idx} className="hover:bg-lime-50 transition">
                            <td className="py-3 px-5 border-b border-dotted border-gray-300">
                              {student.fullname}
                            </td>
                            <td className="py-3 px-5 border-b border-dotted border-gray-300">
                              {student.email}
                            </td>
                            <td className="py-3 px-5 border-b border-dotted border-gray-300">
                              {student.CourseName}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ===== VM MANAGEMENT SECTION ===== */}
        {activeSection === "vm" && (
          <section id="vm">
            <h2 className="text-3xl font-bold text-lime-600 mb-8">VM Management</h2>

            {/* Request VM */}
            <div className="mb-8 bg-white rounded-2xl shadow-md border border-lime-200 p-6">
              <h3 className="text-2xl font-semibold mb-4 text-lime-700">Request a Virtual Machine</h3>
              <div className="flex flex-wrap gap-4 items-center">
                <select
                  value={selectedVmClass}
                  onChange={(e) => setSelectedVmClass(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 outline-none"
                >
                  {classes.map((cls, idx) => (
                    <option key={idx} value={cls.CourseName}>
                      {cls.CourseName}
                    </option>
                  ))}
                </select>

                <select
                  value={vmType}
                  onChange={(e) => setVmType(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 outline-none"
                >
                  <option value="pythonVM">Python VM</option>
                  <option value="chromeVM">Chrome VM</option>
                  <option value="nodejsVM">NodeJS VM</option>
                </select>

                <button
                  onClick={handleVmRequest}
                  className="px-5 py-2 bg-lime-600 text-white rounded-lg font-semibold hover:bg-lime-700 transition"
                >
                  Request VM
                </button>
              </div>
            </div>

            {/* VM Requests Table */}
            <div className="bg-white rounded-2xl shadow-md border border-lime-200 p-6">
              <h3 className="text-2xl font-semibold mb-4 text-lime-700">Your VM Requests</h3>
              {vmRequests.length === 0 ? (
                <p className="text-gray-500">No VM requests found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse text-sm text-gray-800">
                    <thead className="bg-lime-100 text-lime-800">
                      <tr>
                        <th className="py-3 px-5 text-left border-b border-dotted border-lime-300">Course</th>
                        <th className="py-3 px-5 text-left border-b border-dotted border-lime-300">VM Type</th>
                        <th className="py-3 px-5 text-left border-b border-dotted border-lime-300">Status</th>
                        <th className="py-3 px-5 text-left border-b border-dotted border-lime-300">Requested On</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vmRequests.map((req) => (
                        <tr key={req.id} className="hover:bg-lime-50 transition">
                          <td className="py-3 px-5 border-b border-dotted border-gray-300">{req.courseName}</td>
                          <td className="py-3 px-5 border-b border-dotted border-gray-300">{req.vmType}</td>
                          <td className="py-3 px-5 border-b border-dotted border-gray-300">
                            {req.isApproved ? (
                              <span className="text-lime-600 font-semibold">Approved</span>
                            ) : (
                              <span className="text-gray-500">Pending</span>
                            )}
                          </td>
                          <td className="py-3 px-5 border-b border-dotted border-gray-300">
                            {new Date(req.created_at).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default TeacherPortal;
