import "dotenv/config";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { askAI } from "./aiClient.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json({ limit: "20kb" }));
app.use("/api", rateLimit({ windowMs: 60_000, max: 20 }));

// ---------- Routes ----------

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

const ROLES = ["MERN Intern", "Frontend Developer", "Backend Developer", "Full Stack Developer"];
const LEVELS = ["easy", "medium", "hard"];

app.post("/api/question", async (req, res, next) => {
  try {
    const { role = "MERN Intern", difficulty = "easy", previous = [] } = req.body;

    if (!ROLES.includes(role) || !LEVELS.includes(difficulty)) {
      return res.status(400).json({ error: "Invalid role or difficulty" });
    }

    const asked = Array.isArray(previous)
      ? previous.slice(-10).map((q) => String(q).slice(0, 300))
      : [];

    const system =
      "You are a friendly but professional technical interviewer. Ask exactly ONE interview question. Output only the question text, with no numbering or explanation.";

    const prompt = `Role: ${role}
Difficulty: ${difficulty}
Already asked (do not repeat):
${asked.length ? asked.map((q) => `- ${q}`).join("\n") : "none"}`;

    const question = await askAI({ system, prompt });
    res.json({ question });
  } catch (err) {
    next(err);
  }
});

// ---------- 404 and error handlers (hamesha sabse neeche) ----------

app.use((req, res) => res.status(404).json({ error: "Route not found" }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong" });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));