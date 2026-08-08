import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { quotes, messages } = req.body || {};
    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: "Missing messages array" });
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

    const context = Array.isArray(quotes) 
      ? quotes.map((q: any) => `Book: ${q.bookTitle} by ${q.author}\nQuote: "${q.text}"`).join('\n\n')
      : '';
      
    const systemInstruction = `You are Zizhi, an insightful AI librarian for the Zizhi app. You have access to the following collection of highlights from the user's books. 
Your goal is to help the user identify themes, answer questions, and explore their personal library of quotes. 
Be sophisticated, warm, and encourage deep thinking. If the user's question cannot be answered by the quotes, let them know, but try to offer related wisdom from the authors present in their library.

USER'S QUOTES:
${context}`;

    const formattedContents = messages.map((m: any) => ({
      role: m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.content || '' }]
    }));

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: formattedContents,
      config: {
        systemInstruction,
        temperature: 0.7
      }
    });

    const reply = response.text || "I'm sorry, I couldn't process that request.";
    return res.status(200).json({ reply });
  } catch (err: any) {
    console.error("Vercel Chat error:", err);
    return res.status(500).json({ error: err.message || "Failed to generate chat response" });
  }
}
