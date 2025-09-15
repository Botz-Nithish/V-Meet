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
  } catch (err) {
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
    <header className=" text-white flex justify-start items-center p-4">
      <div className="relative ml-auto">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="bg-purple-600 hover:bg-purple-500 px-4 py-2 rounded-md focus:outline-none"
        >
          {user.fullname} ▼
        </button>
        {dropdownOpen && (
          <div className="absolute left-0 mt-2 w-32 bg-purple-600 rounded-md shadow-lg z-50">
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 hover:bg-purple-500"
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
