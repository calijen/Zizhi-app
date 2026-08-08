import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { library } = req.body || {};
    if (!Array.isArray(library)) {
      return res.status(400).json({ error: "Missing library array" });
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
    return res.status(200).json(data);
  } catch (err: any) {
    console.error("Vercel Recommendations error:", err);
    return res.status(500).json({ error: err.message || "Failed to generate recommendations" });
  }
}
