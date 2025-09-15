import { useState, useEffect } from "react";
import Notify from "../components/notify";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie"; // ✅ Import js-cookie

export default function LoginPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({ email: "", password: "", name: "" });
    const [notification, setNotification] = useState({
        show: false,
        message: "",
        type: "success",
    });
    const navigate = useNavigate();

    // ✅ Check cookies on mount
    useEffect(() => {
        const userCookie = Cookies.get("user");
        if (userCookie) {
            try {
                const user = JSON.parse(userCookie);
                if (user.isTeacher) {
                    navigate("/teacher");
                } else {
                    navigate("/student");
                }
            } catch (err) {
                console.error("Invalid cookie format:", err);
            }
        }
    }, [navigate]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const endpoint = isLogin ? "/api/login" : "/api/signup";
        try {
            const res = await fetch(`http://localhost:5000${endpoint}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fullname: formData.name,
                    email: formData.email,
                    password: formData.password
                })
            });
            const data = await res.json();

            if (data.success) {
                const { fullname, email, isTeacher } = data.data;

                // ✅ Store cookie (no password)
                Cookies.set("user", JSON.stringify({ fullname, email, isTeacher }), {
                    expires: 7,
                    secure: true,
                    sameSite: "strict"
                });

                setNotification({
                    show: true,
                    message: data.message || "Login successful!",
                    type: "success",
                });

                // ✅ Redirect based on role
                if (isTeacher) {
                    navigate("/teacher");
                } else {
                    navigate("/student");
                }
            } else {
                setNotification({
                    show: true,
                    message: data.message || "Login failed!",
                    type: "error",
                });
            }

            console.log(data);
        } catch (err) {
            console.error("Error:", err);
            setNotification({
                show: true,
                message: "Something went wrong. Please try again.",
                type: "error",
            });
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-black relative">
            {/* ✅ Notification Component */}
            <Notify
                message={notification.message}
                show={notification.show}
                type={notification.type}
                onClose={() => setNotification({ ...notification, show: false })}
            />

            <div className="w-full max-w-md p-8 bg-gray-900 rounded-2xl border-2 border-purple-400 shadow-xl">
                <h2 className="text-3xl font-bold text-center text-white mb-6">
                    {isLogin ? "V-Meet Login" : "V-Meet Signup"}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <div>
                            <label className="block text-purple-300">Full Name</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 mt-1 border border-purple-700 bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                placeholder="Enter Name Here"
                            />
                        </div>
                    )}
                    <div>
                        <label className="block text-white">Email Address</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 mt-1 border border-purple-700 bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                            placeholder="Enter your email address"
                        />
                    </div>
                    <div>
                        <label className="block text-white">Password</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 mt-1 border border-purple-700 bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full py-2 font-semibold text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition"
                    >
                        {isLogin ? "Login" : "Sign Up"}
                    </button>
                </form>

                <p className="mt-6 text-sm text-center text-purple-300">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-purple-400 hover:underline font-medium"
                    >
                        {isLogin ? "Sign Up" : "Login"}
                    </button>
                </p>
            </div>
        </div>
    );
}
