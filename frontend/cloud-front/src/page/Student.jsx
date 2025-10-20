import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import Notify from "../components/notify";
import { Clock, Server, Copy, Shield } from "lucide-react";

const Student = () => {
  const [user, setUser] = useState(null);
  const [vms, setVms] = useState([]);
  const [loading, setLoading] = useState(false);
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
        const parsedUser = JSON.parse(userCookie);
        if (parsedUser.isTeacher) {
          navigate("/teacher");
          return;
        }
        setUser(parsedUser);
      } catch (err) {
        console.error("Invalid cookie format:", err);
        navigate("/login");
      }
    } else {
      navigate("/login");
    }
  }, [navigate]);

  // ✅ Calculate remaining time in minutes
  const calculateRemainingMinutes = (autoDeleteAt) => {
    const now = new Date();
    const deleteTime = new Date(autoDeleteAt);
    const diffMs = deleteTime - now;
    return diffMs > 0 ? Math.floor(diffMs / 60000) : 0;
  };

  // ✅ Fetch active VMs
  const fetchVMs = async (email) => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/student/vm/list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (data.success) {
        // Map DB fields correctly
        const mapped = data.vms.map((vm) => ({
          courseName: vm.courseName,
          vmType: vm.vmType,
          ipAddress: vm.vmIp,
          username: vm.vmUsername,
          password: vm.vmPassword,
          autoDeleteAt: vm.autoDeleteAt,
          minutesRemaining: calculateRemainingMinutes(vm.autoDeleteAt),
          connectViaRDP: `mstsc /v:${vm.vmIp}`,
        }));

        setVms(mapped);
        setNotification({
          show: true,
          message: "Active VMs retrieved successfully",
          type: "success",
        });
      } else {
        setNotification({
          show: true,
          message: data.message || "No active VMs found",
          type: "error",
        });
      }
    } catch (err) {
      console.error("Error fetching VMs:", err);
      setNotification({
        show: true,
        message: "Server error. Please try again later.",
        type: "error",
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user?.email) fetchVMs(user.email);
  }, [user]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-lime-50 via-white to-lime-100 text-gray-900 p-8 font-sans">
      <Notify
        message={notification.message}
        show={notification.show}
        type={notification.type}
        onClose={() => setNotification({ ...notification, show: false })}
      />

      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-lime-700 mb-2">
          Student Dashboard
        </h1>
        <p className="text-gray-700">
          Welcome <strong className="text-lime-800">{user.fullname}</strong> 👋
          <br />
          <span className="text-gray-600">Email:</span>{" "}
          <em className="text-gray-700">{user.email}</em>
        </p>
      </div>

      {/* Active VMs */}
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-semibold text-lime-700 mb-6">
          Your Active Virtual Machines
        </h2>

        {loading ? (
          <p className="text-gray-600">Loading your VMs...</p>
        ) : vms.length === 0 ? (
          <p className="text-gray-600 italic">No active VMs found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {vms.map((vm, idx) => {
              const remainingColor =
                vm.minutesRemaining < 30
                  ? "text-red-600"
                  : vm.minutesRemaining < 90
                  ? "text-yellow-600"
                  : "text-lime-700";

              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl shadow-md border border-lime-300 p-6 hover:shadow-xl transition transform hover:-translate-y-1"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-lime-700 flex items-center gap-2">
                      <Server size={20} />
                      {vm.courseName}
                    </h3>
                    <span className="text-sm text-gray-700 bg-lime-100 px-3 py-1 rounded-full border border-lime-200">
                      {vm.vmType}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-gray-800">
                    <p>
                      <strong>IP Address:</strong>{" "}
                      <span className="text-gray-900 font-medium">
                        {vm.ipAddress || "Unavailable"}
                      </span>
                    </p>
                    <p>
                      <strong>Username:</strong>{" "}
                      <span className="text-gray-900 font-medium">
                        {vm.username}
                      </span>
                    </p>
                    <p>
                      <strong>Password:</strong>{" "}
                      <span className="text-gray-900 font-medium">
                        {vm.password}
                      </span>
                    </p>
                    <p
                      className={`${remainingColor} font-semibold flex items-center gap-1 mt-2`}
                    >
                      <Clock size={15} />
                      {vm.minutesRemaining} minutes remaining
                    </p>
                    <p className="text-gray-600 text-xs flex items-center gap-1 mt-1">
                      <Shield size={12} />
                      Auto Delete: {new Date(vm.autoDeleteAt).toLocaleString()}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(vm.connectViaRDP);
                      setNotification({
                        show: true,
                        message: "RDP command copied to clipboard!",
                        type: "success",
                      });
                    }}
                    className="mt-5 flex items-center justify-center gap-2 bg-lime-600 text-white rounded-lg py-2 font-semibold hover:bg-lime-700 transition w-full"
                  >
                    <Copy size={16} />
                    Copy RDP Command
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Student;
