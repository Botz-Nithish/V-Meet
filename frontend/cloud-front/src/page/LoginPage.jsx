import { useState, useEffect } from "react";
import Notify from "../components/notify";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import LoginPhoto from "../assets/Login_Page.png";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: "", password: "", name: "" });
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "success",
  });
  const navigate = useNavigate();

  useEffect(() => {
    const userCookie = Cookies.get("user");
    if (userCookie) {
      try {
        const user = JSON.parse(userCookie);
        navigate(user.isTeacher ? "/teacher" : "/student");
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
      const res = await fetch(`https://vmeetbackend.azurewebsites.net${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullname: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });
      const data = await res.json();

      if (data.success) {
        const { fullname, email, isTeacher } = data.data;
        Cookies.set("user", JSON.stringify({ fullname, email, isTeacher }), {
          expires: 7,
          secure: true,
          sameSite: "strict",
        });

        setNotification({
          show: true,
          message: data.message || "Login successful!",
          type: "success",
        });

        navigate(isTeacher ? "/teacher" : "/student");
      } else {
        setNotification({
          show: true,
          message: data.message || "Login failed!",
          type: "error",
        });
      }
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
    <div className="min-h-screen flex flex-col md:flex-row bg-white text-gray-800">
      {/* ✅ Notification */}
      <Notify
        message={notification.message}
        show={notification.show}
        type={notification.type}
        onClose={() => setNotification({ ...notification, show: false })}
      />

      {/* ✅ Illustration Section */}
      <div className="hidden md:flex md:w-1/2 justify-center items-center p-10 bg-gradient-to-br from-lime-100 to-white">
        <img
          src={LoginPhoto}
          alt="Illustration"
          className="w-4/5 max-w-lg object-contain drop-shadow-lg"
        />
      </div>

      {/* ✅ Form Section */}
      <div className="flex flex-col justify-center items-center w-full md:w-1/2 p-8 md:p-16 bg-white">
        <h2 className="text-4xl font-extrabold mb-4 text-lime-600 tracking-tight">
          {isLogin ? "Welcome Back" : "Create Your Account"}
        </h2>
        <p className="text-gray-500 mb-8">
          {isLogin ? "Login to continue your journey." : "Sign up to start using V-Meet."}
        </p>

        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-lime-500 outline-none"
                placeholder="John Doe"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-lime-500 outline-none"
              placeholder="example@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-lime-500 outline-none"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 mt-4 font-semibold text-white bg-lime-600 rounded-lg hover:bg-lime-700 transition"
          >
            {isLogin ? "Login" : "Sign Up"}
          </button>
        </form>

        <p className="mt-8 text-sm text-gray-600">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-lime-600 hover:underline font-medium"
          >
            {isLogin ? "Sign Up" : "Login"}
          </button>
        </p>
      </div>
    </div>
  );
}
