import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { qText, quotes } = req.body || {};
    if (!qText || !Array.isArray(quotes)) {
      return res.status(400).json({ error: "Missing qText or quotes array" });
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
    return res.status(200).json(data);
  } catch (err: any) {
    console.error("Vercel Filter quotes error:", err);
    return res.status(500).json({ error: err.message || "Failed to filter quotes" });
  }
}
