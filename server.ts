import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini API client
let aiClient: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required but missing");
    }
    aiClient = new GoogleGenAI({ apiKey: key });
  }
  return aiClient;
}

// Robust JSON Parsing helper to gracefully handle any parsing glitches
function cleanAndParseJSON(text: string): any {
  if (!text) return {};
  let cleaned = text.trim();
  // Remove markdown JSON formatting if the model slipped and generated it
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/, "").trim();
  }
  try {
    return JSON.parse(cleaned);
  } catch (err: any) {
    console.error("Standard JSON parse failed, running robust scanner. Raw text:", text);
    try {
      let result = "";
      let inString = false;
      let escapeNext = false;
      
      for (let i = 0; i < cleaned.length; i++) {
        const char = cleaned[i];
        
        if (escapeNext) {
          result += char;
          escapeNext = false;
          continue;
        }
        
        if (char === "\\") {
          result += char;
          escapeNext = true;
          continue;
        }
        
        if (char === '"') {
          if (inString) {
            // Find the next non-whitespace char to determine if this is a boundary quote
            let nextIndex = i + 1;
            while (nextIndex < cleaned.length && /\s/.test(cleaned[nextIndex])) {
              nextIndex++;
            }
            const nextChar = cleaned[nextIndex];
            
            if (nextChar === ',' || nextChar === '}' || nextChar === ']' || nextChar === ':') {
              inString = false;
              result += char;
            } else {
              result += '\\"'; // Escape the internal double quote
            }
          } else {
            inString = true;
            result += char;
          }
        } else {
          result += char;
        }
      }
      
      // Clean trailing commas in objects or arrays
      const withNoTrailingCommas = result.replace(/,\s*([\]}])/g, "$1");
      return JSON.parse(withNoTrailingCommas);
    } catch (err2: any) {
      console.error("Robust scanner also failed:", err2.message);
      // Fallback: replace any unescaped newlines inside strings which often break JSON.parse
      try {
        const fixedNewlines = cleaned.replace(/\n/g, "\\n");
        return JSON.parse(fixedNewlines);
      } catch (err3) {
        throw new Error(`JSON format error: ${err.message}. Raw content snippet: ${cleaned.substring(0, 150)}`);
      }
    }
  }
}

// Onboarding Analysis API Route
app.post("/api/onboarding", async (req, res) => {
  try {
    const { profession, dietType, habits, nativeState, currentState, otherComments } = req.body;

    if (!profession || !dietType || !nativeState || !currentState) {
      res.status(400).json({ error: "Missing required onboarding fields" });
      return;
    }

    const ai = getGenAI();

    const prompt = `
Analyze the following regional and lifestyle onboarding profile for EcoVibe (A fun, gamified carbon footprint and habit companion):
- Working Profession: ${profession}
- Diet Type: ${dietType}
- Target Habits to Curb: ${Array.isArray(habits) ? habits.join(", ") : habits || "None"}
- Native State (India): ${nativeState}
- Current State (India): ${currentState}
- Other Comments / Personal Struggles: ${otherComments || "None"}

Please perform a deep, gamified lifestyle & eco analysis:
1. Analyze the cultural, climate, and dietary shift from their Native State (${nativeState}) to their Current State (${currentState}), including lifestyle stressors or carbon impacts typical of this region.
2. Analyze the corporate lifestyle stressors and carbon intensity of being a ${profession}.
3. Extrapolate from their comments and struggles to extract exactly 3 to 5 hyper-personalized Daily Goal Checkboxes. Each goal must be concrete, actionable, easy to check off daily, and help reduce both stress and carbon footprint.
4. Generate a highly detailed "AI-Generated Outcome Note" explaining the severe physiological, mental, and environmental consequences they will face if they fail to follow these daily goals. Make it sound professional, urgent, yet supportive.

You must respond with a JSON object that adheres precisely to the provided schema. No markdown formatting, no unescaped strings, and no trailing commas.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            dailyGoals: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  text: { type: Type.STRING }
                },
                required: ["id", "text"]
              },
              description: "An array of 3 to 5 personalized daily goals to curb bad habits and reduce environmental impact."
            },
            outcomeNote: {
              type: Type.STRING,
              description: "A comprehensive behavioral and physiological warning forecast detailing what happens if they do not follow these goals."
            }
          },
          required: ["dailyGoals", "outcomeNote"]
        }
      },
    });

    const responseText = response.text || "{}";
    const data = cleanAndParseJSON(responseText);

    res.json(data);
  } catch (error: any) {
    console.error("Onboarding API Error:", error);
    res.status(500).json({ error: error.message || "Failed to analyze onboarding profile" });
  }
});

// Intelligent Nudge API Route
app.post("/api/nudge", async (req, res) => {
  try {
    const { recentSlip, screenHours, sleepHours, currentState, dietType, profession } = req.body;

    const ai = getGenAI();

    const prompt = `
Generate a compassionate, gamified and highly practical daily "Intelligent Nudge" (behavioral & eco tip) for a user with the following profile:
- Profession: ${profession || "Working Professional"}
- Diet Type: ${dietType || "General"}
- Current State (India): ${currentState || "India"}
- Recent Logged Metrics:
  * Screen Hours: ${screenHours !== undefined ? screenHours : "N/A"} (Healthy target is under 6 hours; saves device power & attention)
  * Sleep Hours: ${sleepHours !== undefined ? sleepHours : "N/A"} (Healthy target is 7-8 hours; promotes brain health)
  * Recent Habit Slips: ${recentSlip || "None"}

Requirements:
1. Provide a compassionate mitigation strategy and quick action plan.
2. Suggest specific dietary and lifestyle alternatives tailored strictly to their "Current State" (${currentState || "India"}) in India.
3. Suggest local, affordable regional ingredients/items like Makhana (fox nuts), Ragi, Sattu, buttermilk, or regional herbal teas (e.g., chamomile, ginger-tulsi) instead of Western alternatives (e.g., chia seeds, avocado toast, kale).
4. The nudge must be highly personalized, motivating, and concise (2-4 sentences).

You must respond with a JSON object that adheres precisely to the provided schema. No markdown formatting and no unescaped strings.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            nudge: {
              type: Type.STRING,
              description: "A compassionate, actionable 2-4 sentence behavioral tip or ingredient swap recommendation."
            }
          },
          required: ["nudge"]
        }
      },
    });

    const responseText = response.text || "{}";
    const data = cleanAndParseJSON(responseText);

    res.json(data);
  } catch (error: any) {
    console.error("Nudge API Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate nudge" });
  }
});

// Adaptive AI Coach Chat API Route
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, onboarding, goals } = req.body;
    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: "Missing messages array" });
      return;
    }

    const ai = getGenAI();

    const systemPrompt = `You are a warm, supportive, and direct Indian Regional Habit & Carbon Footprint Coach for EcoVibe (A fun, gamified carbon footprint companion).
Your goal is to guide the user towards healthier lifestyles, reducing bad habits and carbon footprint.

User Profile:
- Profession: ${onboarding?.profession || "Working Professional"}
- Diet Type: ${onboarding?.dietType || "General"}
- Native State: ${onboarding?.nativeState || "India"}
- Current State: ${onboarding?.currentState || "India"}
- Chosen Daily Goals: ${Array.isArray(goals) ? goals.map((g: any) => `- ${g.text}`).join("\n") : "None"}
- Additional struggles: ${onboarding?.otherComments || "None"}

Coaching Guidelines:
1. Speak compassionately and empower the user. Maintain a direct, positive focus ("Keep Smiling!").
2. Emphasize Indian regional solutions: local ingredients (like Makhana, Ragi, Sattu, buttermilk, Tulsi tea, turmeric water) and lifestyle adjustments (like morning sun, walks instead of driving, deep breathing, posture breaks).
3. Do not suggest Western remedies. Suggest local Indian regional items.
4. Keep responses conversational, short (2-3 paragraphs max), and extremely practical. Avoid medical diagnostics, focus on behavioral support.`;

    // Map conversation to Gemini model contents format
    const geminiContents = messages.map((m: any) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: geminiContents,
      config: {
        systemInstruction: systemPrompt,
      },
    });

    res.json({ text: response.text || "I'm here to support you. Keep smiling!" });
  } catch (error: any) {
    console.error("Chat API Error:", error);
    res.status(500).json({ error: error.message || "Failed to process chat" });
  }
});

// Hackathon Developer & Judge Diagnostic Test Endpoint
app.get("/api/test-gemini", async (req, res) => {
  try {
    const ai = getGenAI();
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: "Respond with the word 'SUCCESS' to confirm API pipeline integrity.",
    });
    
    const outputText = (response.text || "").trim();
    if (outputText.includes("SUCCESS")) {
      res.json({ status: "success", message: "Gemini 3.5 API Connection fully active and authenticated!" });
    } else {
      res.json({ status: "partial", message: "Connected, but received unexpected output: " + outputText });
    }
  } catch (error: any) {
    console.error("Diagnostic Test Failed:", error);
    res.status(500).json({ status: "error", error: error.message || "Gemini API Connection failed" });
  }
});

// Vite middleware integration
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
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
