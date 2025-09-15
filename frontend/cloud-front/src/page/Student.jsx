import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import Notify from "../components/notify";

const Student = () => {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();
        const [notification, setNotification] = useState({
        show: false,
        message: "",
        type: "success",
    });

    useEffect(() => {
        // ✅ Get user from cookies
        const userCookie = Cookies.get("user");
        if (userCookie) {
            try {
                setUser(JSON.parse(userCookie));
            } catch (err) {
                console.error("Invalid cookie format:", err);
                navigate("/login"); // redirect if cookie is corrupted
            }
        } else {
            // ✅ No cookie -> redirect to login
            navigate("/login");
        }
    }, [navigate]);

    if (!user) {
        return null; // don’t flash UI while redirecting
    }
    if(user.isTeacher){
        navigate("/teacher");
        return null;
    }

    return (
        <div style={{ padding: "2rem" }}>
            <h1>Student Dashboard</h1>
            <p>
                Welcome <strong>{user.fullname}</strong> 👋 <br />
                Email: <em>{user.email}</em>
            </p>

            <section>
                <h2>Your Courses</h2>
                <ul>
                    <li>Cloud Computing 101</li>
                    <li>Introduction to React</li>
                    <li>Data Structures</li>
                </ul>
            </section>

            <section>
                <h2>Upcoming Meetings</h2>
                <ul>
                    <li>Cloud Computing Q&A - 10:00 AM, June 10</li>
                    <li>React Workshop - 2:00 PM, June 12</li>
                </ul>
            </section>
        </div>
    );
};

export default Student;
