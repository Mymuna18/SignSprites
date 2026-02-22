import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ASL tip endpoint — called when player struggles with a letter
app.post("/api/asl-tip", async (req, res) => {
  try {
    const { letter, attempts } = req.body;

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `You are a friendly, encouraging ASL (American Sign Language) tutor inside a magical Ghibli-themed game called SignSprites. A player is trying to sign the letter "${letter}" but has failed ${attempts} times.

Give a short, helpful tip (2-3 sentences max) on how to correctly form the ASL sign for the letter "${letter}". Describe the hand shape, finger positions, and palm orientation clearly. Be warm and encouraging like a Ghibli character would be.

Do not use markdown formatting. Keep it conversational and brief.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    res.json({ tip: text });
  } catch (error) {
    console.error("Gemini API error:", error);
    res.status(500).json({ error: "Failed to generate tip" });
  }
});

// Encouragement endpoint — called when player gets a letter right
app.post("/api/encouragement", async (req, res) => {
  try {
    const { letter, totalCollected } = req.body;

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `You are a magical spirit guide in a Ghibli-themed ASL learning game called SignSprites. The player just correctly signed the letter "${letter}" and has now collected ${totalCollected} out of 26 stars.

Give a very short (1 sentence) magical, whimsical encouragement message. Reference Spirited Away vibes. No markdown formatting.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    res.json({ message: text });
  } catch (error) {
    console.error("Gemini API error:", error);
    res.status(500).json({ error: "Failed to generate encouragement" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`SignSprites backend running on http://localhost:${PORT}`);
});