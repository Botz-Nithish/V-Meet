// utils/apiFetch.js
const apiFetch = async (endpoint, body = {}, method = "POST") => {
    try {
        const res = await fetch(`http://localhost:5000${endpoint}`, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

        const data = await res.json();
        return data;
    } catch (err) {
        console.error(`Error in apiFetch (${endpoint}):`, err);
        return { success: false, message: "Network error" };
    }
};
export default apiFetch;