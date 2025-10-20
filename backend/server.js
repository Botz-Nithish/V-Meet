import express from "express";
import dotenv from "dotenv";
import { createVM } from "./create-VM.js";

dotenv.config();
const app = express();
app.use(express.json());

app.post("/create-vm", async (req, res) => {
  const { type } = req.body;

  try {
    const vmInfo = await createVM(type);
    res.status(200).json({
      message: `${type} created successfully!`,
      vmDetails: {
        ipAddress: vmInfo.ipAddress,
        username: vmInfo.username,
        password: vmInfo.password,
        connectViaRDP: `mstsc /v:${vmInfo.ipAddress}`
      }
    });
  } catch (err) {
    console.error("❌ Error creating VM:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(5000, () => console.log("🚀 Server running on http://localhost:5000"));
