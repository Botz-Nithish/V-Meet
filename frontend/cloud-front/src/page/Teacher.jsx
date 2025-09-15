import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";
import apiFetch  from "../components/apifetch/index";
import Notify from "../components/notify";
const TeacherPortal = () => {
    const [classes, setClasses] = useState([]);
    const [newClassId, setNewClassId] = useState("");
    const [students, setStudents] = useState([]);
    const [studentEmail, setStudentEmail] = useState("");
    const [selectedClass, setSelectedClass] = useState("");
    const [loading, setLoading] = useState(false);

    // ✅ Get teacher name from cookie
    const user = JSON.parse(Cookies.get("user") || "{}");
    const teacherName = user.fullname || "";
    console.log("Teacher Name from cookie:", teacherName);
        const [notification, setNotification] = useState({
        show: false,
        message: "",
        type: "success",
    });

    // Fetch courses
    const fetchCourses = async () => {
        const data = await apiFetch("/api/teacher/courses/list", { teacherName });
        if (data.success) {
            setClasses(data.courses);
            if (data.courses.length > 0) setSelectedClass(String(data.courses[0].CourseName));
        }
    };

    // Fetch students
    const fetchStudents = async () => {
        if (!selectedClass) return;
        setLoading(true);
        const data = await apiFetch("/api/teacher/students/list", { teacherName, courseName: selectedClass });
        if (data.success) setStudents(data.students);
        setLoading(false);
    };

    // Add new class
    const handleAddClass = async () => {
        if (!newClassId.trim()) return;
        const data = await apiFetch("/api/teacher/courses/add", { teacherName, courseName: newClassId.trim() });
        if (data.success) {
            fetchCourses();
            setNewClassId("");
            setNotification({ show: true, message: "Class added successfully!", type: "success" });
        } else {
            setNotification({ show: true, message: data.message || "Failed to add class", type: "error" });
        }
    };

    // Add student
    const handleAddStudent = async () => {
        if (!studentEmail.trim() || !selectedClass) return;
        const data = await apiFetch("/api/teacher/students/add", { teacherName, studentEmail, courseName: selectedClass });
        if (data.success) {
            fetchStudents();
            setStudentEmail("");
            setNotification({ show: true, message: "Student added successfully!", type: "success" });
        } else {
            setNotification({ show: true, message: data.message || "Failed to add student", type: "error" });
        }
    };

    useEffect(() => {
        if (teacherName) {
            fetchCourses();
            fetchStudents();
        }
    }, [teacherName, selectedClass]);

    return (
        <div className="min-h-screen p-8 bg-gradient-to-b from-purple-900 to-purple-700 text-white font-sans">
            <h1 className="text-4xl font-bold mb-8 text-center">Teacher Portal</h1>

            {/* Class Creation */}
            <section className="mb-8 p-6 bg-black bg-opacity-50 rounded-lg shadow-lg">
                <h2 className="text-2xl font-semibold mb-4">Create New Class</h2>
                <div className="flex items-center gap-4">
                    <input
                        type="text"
                        placeholder="Enter Course Name"
                        value={newClassId}
                        onChange={(e) => setNewClassId(e.target.value)}
                        className="px-4 py-2 rounded-lg border border-purple-400 bg-transparent text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <button
                        onClick={handleAddClass}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition"
                    >
                        Add Class
                    </button>
                </div>
                <p className="mt-4">
                    <strong>Available Classes:</strong>{" "}
                    {classes.map((c) => c.CourseName).join(", ")}
                </p>
            </section>

            {/* Add Student */}
            <section className="mb-8 p-6 bg-black bg-opacity-50 rounded-lg shadow-lg">
                <h2 className="text-2xl font-semibold mb-4">Add Student to Class</h2>
                <div className="flex flex-wrap items-center gap-4">
                    <input
                        type="email"
                        placeholder="Student Email"
                        value={studentEmail}
                        onChange={(e) => setStudentEmail(e.target.value)}
                        className="px-4  py-2 rounded-lg border border-purple-400 bg-transparent text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <select
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                        className="px-4 py-2 rounded-lg border border-purple-400 bg-transparent text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                        {classes.map((cls, idx) => (
                            <option key={idx} value={cls.CourseName}>
                                {cls.CourseName}
                            </option>
                        ))}
                    </select>
                    <button
                        onClick={handleAddStudent}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold transition"
                    >
                        Save Student
                    </button>
                </div>
            </section>

            {/* Student Table */}
            <section className="p-6 bg-black bg-opacity-50 rounded-lg shadow-lg">
                <h2 className="text-2xl font-semibold mb-4">Students List</h2>
                {loading ? (
                    <p>Loading...</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full border border-purple-400 border-collapse">
                            <thead className="bg-purple-800">
                                <tr>
                                    <th className="py-2 px-4 border border-purple-400">Name</th>
                                    <th className="py-2 px-4 border border-purple-400">Email</th>
                                    <th className="py-2 px-4 border border-purple-400">
                                        Class Name
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map((student, idx) => (
                                    <tr key={idx} className="hover:bg-purple-900">
                                        <td className="py-2 px-4 border border-purple-400">
                                            {student.fullname}
                                        </td>
                                        <td className="py-2 px-4 border border-purple-400">
                                            {student.email}
                                        </td>
                                        <td className="py-2 px-4 border border-purple-400">
                                            {student.CourseName}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
};

export default TeacherPortal;
