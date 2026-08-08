import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import rateLimit from "express-rate-limit";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Rate limiter for Gemini API routes (max 20 requests per minute per IP)
const geminiRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // limit each IP to 20 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests to the AI engine. Please wait a minute before trying again." }
});

app.use("/api/gemini", geminiRateLimiter);

function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in server environment.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// Filter quotes based on semantic search query
app.post("/api/gemini/filter-quotes", async (req, res) => {
  try {
    const { qText, quotes } = req.body;
    if (!qText || !Array.isArray(quotes)) {
      return res.status(400).json({ error: "Missing qText or quotes array" });
    }
    const ai = getGenAI();
    const payload = quotes.map((q: any) => ({
      id: q.id,
      text: q.text,
      author: q.author,
      bookTitle: q.bookTitle
    }));

    const prompt = `
You are a scholar's library assistant database engine.
The user wants to construct a customized review session for a reader application. They specified the focus of today's review session: "${qText}"

Here are the user's saved quotes represented as a JSON array:
${JSON.stringify(payload)}

Your objective is to identify and filter which of these quotes fit or are semantically relevant to the user's criteria. E.g.:
- If they type an author name, find quotes by that author.
- If they type a book title, find quotes from that book.
- If they type a topic or conceptual field ("philosophy", "minds", "consciousness", "truth", "ethics"), find all quotes that touch on these topics semantically.

Return a valid JSON object ONLY containing a key "matchedIds" which is a list of quote IDs that matching this focus area. Do not write markdown wraps, code blocks, or thinking. Strictly format as:
{"matchedIds": ["some-id-one", "some-id-two"]}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const responseText = response.text || "{}";
    let cleanText = responseText.trim();
    if (cleanText.startsWith("```json")) {
      cleanText = cleanText.substring(7);
    } else if (cleanText.startsWith("```")) {
      cleanText = cleanText.substring(3);
    }
    if (cleanText.endsWith("```")) {
      cleanText = cleanText.substring(0, cleanText.length - 3);
    }

    const data = JSON.parse(cleanText.trim());
    return res.json(data);
  } catch (err: any) {
    console.error("Filter quotes error:", err);
    return res.status(500).json({ error: err.message || "Failed to filter quotes" });
  }
});

// Chat with librarian assistant
app.post("/api/gemini/chat", async (req, res) => {
  try {
    const { quotes, messages } = req.body;
    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: "Missing messages array" });
    }
    const ai = getGenAI();
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
    return res.json({ reply });
  } catch (err: any) {
    console.error("Chat error:", err);
    return res.status(500).json({ error: err.message || "Failed to generate chat response" });
  }
});

// Recommendations analysis for user profile
app.post("/api/gemini/recommendations", async (req, res) => {
  try {
    const { library } = req.body;
    if (!Array.isArray(library)) {
      return res.status(400).json({ error: "Missing library array" });
    }
    const ai = getGenAI();
    const bookBriefs = library
      .slice(0, 10)
      .map((b: any) => `"${b.title}" by ${b.author} (original category: ${b.genre || 'None'})`)
      .join('\n');

    const prompt = `
You are a highly perceptive literary archivist and librarian for the Zizhi Scholar’s Academy.
Analyze the user's current reading library.
The library contains the following books:
${bookBriefs}

Based on these books, determine their true academic study interests to expand their horizons.

Task 1: Determine the user's top 3-4 literary or scientific study domains/genres (e.g. "Philosophy", "Political Science", "Classic Fiction", "Post-Modernism", "Existentialism", "Theoretical Physics", "History", etc.). Avoid generic tags like "PDF Document", "Epub", "Textbook".
Task 2: Evaluate their overall reading mix and profile them with a witty, profound personal "Scholarly Archetype" (e.g., "The Existential Explorer", "The Scientific Realist", "The Classical Humanist", "The Speculative Thinker") with a 1-sentence description that celebrates their intellectual journey.
Task 3: Curate exactly 6 recommended readings. For each, give its title, author, its primary genre, and a profound 1-sentence explanation of why it will expand their specific horizon based on what they are already reading.

You must return a valid JSON object ONLY. Do not output any thinking block, comments, or surrounding markdown blocks (such as \`\`\`json). The JSON must conform strictly to this structure:
{
  "genres": ["Philosophy", "Existentialism", "Classic Fiction"], 
  "archetypeTitle": "The Existential Explorer",
  "archetypeDesc": "You seek fundamental truths of humans, traversing paths of ontological enquiry and classical human ethics.",
  "recommendations": [
    {
      "title": "Thus Spoke Zarathustra",
      "author": "Friedrich Nietzsche",
      "reason": "Expands on existential and philosophical questions raised in your reading of classics.",
      "genre": "Philosophy"
    }
  ]
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const responseText = response.text || "{}";
    let cleanText = responseText.trim();
    if (cleanText.startsWith("```json")) {
      cleanText = cleanText.substring(7);
    } else if (cleanText.startsWith("```")) {
      cleanText = cleanText.substring(3);
    }
    if (cleanText.endsWith("```")) {
      cleanText = cleanText.substring(0, cleanText.length - 3);
    }

    const data = JSON.parse(cleanText.trim());
    return res.json(data);
  } catch (err: any) {
    console.error("Recommendations error:", err);
    return res.status(500).json({ error: err.message || "Failed to generate recommendations" });
  }
});

// Generate book synthesis summary
app.post("/api/gemini/generate-summary", async (req, res) => {
  try {
    const { title, author } = req.body;
    if (!title || !author) {
      return res.status(400).json({ error: "Missing title or author" });
    }
    const ai = getGenAI();
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
    return res.json({
      script,
      audioSummaryUrl: `data:audio/wav;base64,${base64Audio}`
    });
  } catch (err: any) {
    console.error("Summary error:", err);
    return res.status(500).json({ error: err.message || "Failed to generate summary" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.use((_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
