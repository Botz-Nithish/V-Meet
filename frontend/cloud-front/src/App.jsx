import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./page/LoginPage";
import Student from "./page/Student";
import Header from "./components/header";
import Teacher from "./page/Teacher";
import AdminPortal from "./page/Admin";
export default function App() {
  return (
    <>
      <Router>
        <Header/>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<div>Dashboard Page</div>} />
          <Route path="/teacher" element={<Teacher/>} />
          <Route path="/student" element={<Student />} />
          <Route path="/admin" element={<AdminPortal/>} />
        </Routes>
      </Router>
    </>
  );
}
