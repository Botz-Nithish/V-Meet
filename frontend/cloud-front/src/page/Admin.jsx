import React, { useState, useEffect } from "react";
import apiFetch from "../components/apifetch/index";
import Notify from "../components/notify";
import TextType from "../components/TextType/TextType";

const AdminPortal = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pendingApprovals, setPendingApprovals] = useState([]); // ✅ Tracks which request IDs are being processed
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "success",
  });
  const [aiSummary, setAiSummary] = useState(""); // New state for AI summary

  // ✅ Fetch all VM requests
  const fetchVmRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch("https://vmeetbackend.azurewebsites.net/api/admin/vm/requests");
      const data = await res.json();
      if (data.success) {
        setRequests(data.requests);
        setAiSummary(data.aiSummary); // Store the AI summary
      } else {
        setNotification({
          show: true,
          message: "Failed to fetch VM requests",
          type: "error",
        });
      }
    } catch (err) {
      console.error("Error fetching VM requests:", err);
      setNotification({
        show: true,
        message: "Server error while fetching requests",
        type: "error",
      });
    }
    setLoading(false);
  };

  // ✅ Approve VM with “Pending…” state per row
  const handleApprove = async (requestId) => {
    // Mark this request as pending
    setPendingApprovals((prev) => [...prev, requestId]);

    try {
      const res = await fetch("https://vmeetbackend.azurewebsites.net/api/admin/vm/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      });

      const data = await res.json();
      if (data.success) {
        setNotification({
          show: true,
          message:
            data.message ||
            "VM Approved and created successfully (auto-deletion in 3 hours)",
          type: "success",
        });

        // Update request as approved
        setRequests((prev) =>
          prev.map((r) =>
            r.id === requestId ? { ...r, isApproved: true } : r
          )
        );
      } else {
        setNotification({
          show: true,
          message: data.message || "Approval failed",
          type: "error",
        });
      }
    } catch (err) {
      console.error("Error approving VM:", err);
      setNotification({
        show: true,
        message: "Server error while approving VM",
        type: "error",
      });
    }

    // Remove from pending state
    setPendingApprovals((prev) => prev.filter((id) => id !== requestId));
  };

  // Add this function before the return statement
  const formatBoldText = (text) => {
    // Split by bold markers ** and process alternating chunks
    const parts = text.split(/(\*\*.*?\*\*)/g);

    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        // Remove ** and wrap in strong tag
        const boldText = part.slice(2, -2);
        return (
          <strong key={index} className="font-bold">
            {boldText}
          </strong>
        );
      }
      return part;
    });
  };

  useEffect(() => {
    fetchVmRequests();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-lime-50 to-white text-gray-800 p-8 font-sans">
      {/* ✅ Notification */}
      <Notify
        message={notification.message}
        show={notification.show}
        type={notification.type}
        onClose={() => setNotification({ ...notification, show: false })}
      />

      {/* ✅ Header */}
      <h1 className="text-4xl font-extrabold text-center text-lime-600 mb-10">
        Admin Portal – VM Requests
      </h1>

      {/* Add AI Summary Section */}
      {aiSummary && (
        <div className="max-w-4xl mx-auto mb-8 bg-white rounded-2xl shadow-md border border-lime-200 p-6">
          <h2 className="text-xl font-semibold text-lime-700 mb-4">
            AI Analysis Summary
          </h2>
          <div className="bg-gray-50 rounded-lg p-4 text-gray-700">
            <TextType
              text={[aiSummary]}
              typingSpeed={25}
              pauseDuration={1500}
              showCursor={true}
              cursorCharacter="_"
              loop={false}
              className="leading-relaxed"
              as="div"
              render={(text) => <span>{formatBoldText(text)}</span>}
            />
          </div>
        </div>
      )}

      {/* ✅ Requests Table */}
      <div className="bg-white rounded-2xl shadow-md border border-lime-200 p-6 transition hover:shadow-lg">
        <h2 className="text-2xl font-semibold mb-4 text-lime-700">
          Pending & Approved Requests
        </h2>

        {loading ? (
          <p className="text-gray-500">Loading requests...</p>
        ) : requests.length === 0 ? (
          <p className="text-gray-500 italic">No VM requests available.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm text-gray-800">
              <thead className="bg-lime-100 text-lime-800">
                <tr>
                  <th className="py-3 px-5 text-left border-b border-dotted border-lime-300">
                    ID
                  </th>
                  <th className="py-3 px-5 text-left border-b border-dotted border-lime-300">
                    Teacher Email
                  </th>
                  <th className="py-3 px-5 text-left border-b border-dotted border-lime-300">
                    Course Name
                  </th>
                  <th className="py-3 px-5 text-left border-b border-dotted border-lime-300">
                    VM Type
                  </th>
                  <th className="py-3 px-5 text-left border-b border-dotted border-lime-300">
                    Status
                  </th>
                  <th className="py-3 px-5 text-left border-b border-dotted border-lime-300">
                    Requested At
                  </th>
                  <th className="py-3 px-5 text-center border-b border-dotted border-lime-300">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => {
                  const isPending = pendingApprovals.includes(req.id);
                  const isApproved = req.isApproved;

                  return (
                    <tr
                      key={req.id}
                      className="hover:bg-lime-50 transition duration-150"
                    >
                      <td className="py-3 px-5 border-b border-dotted border-gray-300">
                        {req.id}
                      </td>
                      <td className="py-3 px-5 border-b border-dotted border-gray-300">
                        {req.teacherEmail}
                      </td>
                      <td className="py-3 px-5 border-b border-dotted border-gray-300">
                        {req.courseName}
                      </td>
                      <td className="py-3 px-5 border-b border-dotted border-gray-300">
                        {req.vmType}
                      </td>
                      <td className="py-3 px-5 border-b border-dotted border-gray-300">
                        {isApproved ? (
                          <span className="text-lime-600 font-semibold">
                            Approved
                          </span>
                        ) : isPending ? (
                          <span className="text-yellow-600 font-semibold">
                            Processing...
                          </span>
                        ) : (
                          <span className="text-gray-500">Pending</span>
                        )}
                      </td>
                      <td className="py-3 px-5 border-b border-dotted border-gray-300">
                        {new Date(req.created_at).toLocaleString()}
                      </td>
                      <td className="py-3 px-5 text-center border-b border-dotted border-gray-300">
                        <button
                          onClick={() => handleApprove(req.id)}
                          disabled={isApproved || isPending}
                          className={`px-4 py-1 rounded-lg font-medium transition ${
                            isApproved
                              ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                              : isPending
                              ? "bg-yellow-500 text-white cursor-wait"
                              : "bg-lime-600 text-white hover:bg-lime-700"
                          }`}
                        >
                          {isApproved
                            ? "Approved"
                            : isPending
                            ? "Pending..."
                            : "Approve"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPortal;
