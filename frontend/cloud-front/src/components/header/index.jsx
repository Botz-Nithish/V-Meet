import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";

const Header = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const userCookie = Cookies.get("user");
  let user = null;

  try {
    if (userCookie) user = JSON.parse(userCookie);
  } catch {
    console.error("Invalid user cookie");
  }

  const handleProfileClick = () => {
    if (!user) return;
    if (user.isTeacher) navigate("/teacher");
    else navigate("/student");
  };

  const handleLogout = () => {
    Cookies.remove("user");
    navigate("/login");
  };

  if (!user) return null;

  return (
    <header className="bg-white border-b border-lime-200 shadow-sm flex justify-between items-center px-6 py-3">
      {/* App Logo / Name */}
      <div
        onClick={() => navigate(user.isTeacher ? "/teacher" : "/student")}
        className="text-2xl font-extrabold text-lime-600 cursor-pointer select-none"
      >
        V-Meet
      </div>

      {/* Profile Dropdown */}
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 bg-lime-600 hover:bg-lime-700 text-white px-4 py-2 rounded-md font-medium transition-all focus:outline-none"
        >
          <span>{user.fullname}</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.8}
            stroke="currentColor"
            className="w-4 h-4"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-40 bg-white border border-lime-200 rounded-lg shadow-lg z-50 overflow-hidden">
            <button
              onClick={handleProfileClick}
              className="w-full text-left px-4 py-2 text-gray-700 hover:bg-lime-50 hover:text-lime-700 transition"
            >
              Profile
            </button>
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-gray-700 hover:bg-red-50 hover:text-red-600 transition"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
