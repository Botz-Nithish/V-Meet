import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import Notify from "../components/notify";
import { Clock, Server, Copy, Shield, PlusCircle, MessageCircle, Loader } from "lucide-react";
import TextType from "../components/TextType/TextType";

const Student = () => {
  const [user, setUser] = useState(null);
  const [vms, setVms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "success",
  });

  // 🔹 New: form state
  const [courseName, setCourseName] = useState("");
  const [vmType, setVmType] = useState("pythonVM");
  const [requestLoading, setRequestLoading] = useState(false);

  // 🔹 New: chat state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [isTyping, setIsTyping] = useState(false);

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

  // 🔹 New: request VM handler
  const handleRequestVM = async (e) => {
    e.preventDefault();

    if (!courseName.trim()) {
      setNotification({
        show: true,
        message: "Please enter your course name.",
        type: "error",
      });
      return;
    }

    setRequestLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/student/vm/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentEmail: user.email,
          courseName,
          vmType,
        }),
      });

      const data = await res.json();

      setNotification({
        show: true,
        message: data.message,
        type: data.success ? "success" : "error",
      });

      if (data.success) setCourseName("");
    } catch (err) {
      console.error("Error requesting VM:", err);
      setNotification({
        show: true,
        message: "Server error while requesting VM.",
        type: "error",
      });
    }
    setRequestLoading(false);
  };

  // 🔹 New: chat handler
  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    // Add user message to chat
    setChatHistory(prev => [...prev, { role: 'user', content: chatMessage }]);
    
    setIsTyping(true);
    setChatMessage("");
    
    try {
      const response = await fetch("http://localhost:5000/api/student/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: chatMessage }),
      });
      
      const data = await response.json();
      if (data.success) {
        setChatHistory(prev => [...prev, { 
          role: 'assistant', 
          content: data.reply,
          isNew: true 
        }]);
      }
    } catch (err) {
      console.error("Chat error:", err);
    } finally {
      setIsTyping(false);
    }
  };

  useEffect(() => {
    if (user?.email) fetchVMs(user.email);
  }, [user]);

  if (!user) return null;

  return (
    <div className={`min-h-screen bg-gradient-to-br from-lime-50 via-white to-lime-100 text-gray-900 ${isChatOpen ? 'mr-96' : 'mr-16'} transition-all duration-300`}>
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

      {/* 🔹 Request VM Form */}
      <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-md border border-lime-300 p-6 mb-12">
        <h2 className="text-2xl font-semibold text-lime-700 mb-4 flex items-center gap-2">
          <PlusCircle size={22} /> Request a Virtual Machine
        </h2>

        <form onSubmit={handleRequestVM} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Course Name
            </label>
            <input
              type="text"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              placeholder="e.g. Cloud Computing"
              className="w-full border border-lime-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-lime-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select VM Type
            </label>
            <select
              value={vmType}
              onChange={(e) => setVmType(e.target.value)}
              className="w-full border border-lime-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-lime-400"
            >
              <option value="pythonVM">Python VM</option>
              <option value="chromeVM">Chrome VM</option>
              <option value="nodejsVM">NodeJS VM</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={requestLoading}
            className={`w-full py-2 rounded-lg font-semibold text-white transition ${
              requestLoading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-lime-600 hover:bg-lime-700"
            }`}
          >
            {requestLoading ? "Submitting..." : "Request VM"}
          </button>
        </form>
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

      {/* Add Chat Section */}
      <div className={`fixed right-0 top-0 h-full bg-white shadow-lg transition-all duration-300 ${isChatOpen ? 'w-96' : 'w-16'} border-l border-lime-200`}>
        <div className="h-full flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b border-lime-200 flex items-center justify-between bg-white">
            {isChatOpen && <h3 className="font-semibold text-lime-600">AI Assistant</h3>}
            <button
              onClick={() => setIsChatOpen(!isChatOpen)}
              className="p-2 hover:bg-lime-100 rounded-lg transition-colors"
            >
              <MessageCircle size={20} className="text-lime-600" />
            </button>
          </div>

          {/* Chat Messages */}
          {isChatOpen && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatHistory.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        msg.role === 'user'
                          ? 'bg-lime-600 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {msg.role === 'assistant' && msg.isNew ? (
                        <TextType 
                          text={[msg.content]}
                          typingSpeed={25}
                          pauseDuration={1500}
                          showCursor={true}
                          cursorCharacter="_"
                          loop={false}
                        />
                      ) : (
                        msg.content
                      )}
                    </div>
                  </div>
                ))}
                
                {/* Loading indicator */}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg p-3">
                      <Loader className="w-5 h-5 animate-spin text-lime-600" />
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleChatSubmit} className="p-4 border-t border-lime-200">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="Ask me anything..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-lime-500 outline-none"
                    disabled={isTyping}
                  />
                  <button
                    type="submit"
                    className={`px-4 py-2 bg-lime-600 text-white rounded-lg transition ${
                      isTyping ? 'opacity-50 cursor-not-allowed' : 'hover:bg-lime-700'
                    }`}
                    disabled={isTyping}
                  >
                    Send
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Student;
