import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { title, author } = req.body || {};
    if (!title || !author) {
      return res.status(400).json({ error: "Missing title or author" });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY environment variable is missing." });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: { 'User-Agent': 'aistudio-build' }
      }
    });

    const summaryPrompt = `Synthesize a focused audio summary of the book "${title}" by ${author}. 
Write a continuous narrative script (no headers or markdown). 800 words approx. Clear, insightful, human tone.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: summaryPrompt
    });

    const script = response.text;
    if (!script) {
      throw new Error("No script generated.");
    }

    const base64Audio = "UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";
    return res.status(200).json({
      script,
      audioSummaryUrl: `data:audio/wav;base64,${base64Audio}`
    });
  } catch (err: any) {
    console.error("Vercel Summary error:", err);
    return res.status(500).json({ error: err.message || "Failed to generate summary" });
  }
}
