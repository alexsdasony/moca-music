import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Body parsing middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Lazy initializer for GoogleGenAI
let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not set. Please set it in Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

// REST API endpoint to generate song structures, lyrics, and try generating actual audio via Lyria
app.post("/api/generate-music", async (req, res) => {
  try {
    const { prompt, genre, tempo, mood, lyricsMode, customLyrics, clipDuration = 30 } = req.body;

    const btcPrompt = `Generate a complete structured song layout as JSON based on:
Genre: ${genre || "Any"}
Tempo (BPM): ${tempo || "120"}
Mood: ${mood || "Any"}
Direct instructions: ${prompt || "Create a catchy song"}
Lyrics option: ${lyricsMode || "generate"}
${customLyrics ? `Custom lyrics to incorporate: "${customLyrics}"` : ""}

You MUST output a valid JSON object matching the following TypeScript interface strictly. Do not include any text outside of the JSON block:
\`\`\`json
{
  "title": "A highly creative song title",
  "lyrics": "[00:00] (Intro)\\n[00:04] verse lyrics here with timestamps aligned to BPM\\n[00:15] chorus lyrics here...",
  "bpm": 120,
  "key": "A Minor",
  "mood": "Dark",
  "genre": "Synthwave",
  "chordProgression": ["Am", "F", "C", "G"],
  "structure": ["Intro", "Verse 1", "Chorus", "Verse 2", "Chorus", "Outro"],
  "melodicTheme": [
    { "time": 0, "note": "A4", "duration": 0.5 },
    { "time": 0.5, "note": "C5", "duration": 0.5 },
    { "time": 1.0, "note": "E5", "duration": 0.5 },
    { "time": 1.5, "note": "G5", "duration": 0.5 },
    { "time": 2.0, "note": "A5", "duration": 1.0 }
  ],
  "bassTheme": [
    { "time": 0, "note": "A2", "duration": 1.0 },
    { "time": 1.0, "note": "F2", "duration": 1.0 },
    { "time": 2.0, "note": "C2", "duration": 1.0 },
    { "time": 3.0, "note": "G2", "duration": 1.0 }
  ]
}
\`\`\``;

    let songDetails: any = null;
    let ai;
    try {
      ai = getAiClient();
      const textResponse = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: btcPrompt,
      });

      const text = textResponse.text || "";
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/([\{\[][\s\S]*[\}\]])/);
      if (jsonMatch) {
        songDetails = JSON.parse(jsonMatch[1]);
      } else {
        songDetails = JSON.parse(text);
      }
    } catch (e: any) {
      console.warn("Gemini Song structure generation failed/no key:", e.message);
      // Construct fallback song details in case API key is missing or failed
      songDetails = {
        title: prompt ? `${prompt.substring(0, 20)} Jam` : "Neon Horizon",
        lyrics: `[00:00] (Intro)\n[00:04] Walking in the neon light...\n[00:12] Shadows dancing in the night...\n[00:20] (Chorus) Hear the rhythm, feel the glow!\n[00:28] Let the synthesizer flow!`,
        bpm: Number(tempo) || 120,
        key: "A Minor",
        mood: mood || "Energetic",
        genre: genre || "Synthwave",
        chordProgression: ["Am", "F", "C", "G"],
        structure: ["Intro", "Verse 1", "Chorus"],
        melodicTheme: [
          { time: 0, note: "A4", duration: 0.5 },
          { time: 0.5, note: "C5", duration: 0.5 },
          { time: 1.0, note: "E5", duration: 0.5 },
          { time: 1.5, note: "G5", duration: 0.5 }
        ],
        bassTheme: [
          { time: 0, note: "A2", duration: 1.0 },
          { time: 1.0, note: "F2", duration: 1.0 }
        ]
      };
    }

    // Now, try generating the actual music audio file using the specialized Lyria models
    let lyriaAudioB64 = "";
    let useFallbackAudio = true;
    let lyriaError = "";

    try {
      if (ai) {
        // Select clip model (30s) or pro model (longer)
        const lyriaModel = clipDuration <= 30 ? "lyria-3-clip-preview" : "lyria-3-pro-preview";
        console.log(`Attempting music generation with Lyria model: ${lyriaModel}`);
        
        const lyriaPrompt = `Generate a high-quality ${clipDuration}-second ${mood || "ambient"} ${genre || "instrumental"} track with a tempo of ${tempo || 120} BPM. Description: ${prompt || "synth groove"}`;
        
        const streamResponse = await ai.models.generateContentStream({
          model: lyriaModel,
          contents: lyriaPrompt,
        });

        for await (const chunk of streamResponse) {
          const parts = chunk.candidates?.[0]?.content?.parts;
          if (!parts) continue;
          for (const part of parts) {
            if (part.inlineData?.data) {
              lyriaAudioB64 += part.inlineData.data;
              useFallbackAudio = false;
            }
          }
        }
      }
    } catch (err: any) {
      console.warn("Lyria generation failed or requires paid/whitelisted key. Falling back to dynamic procedural Web Audio synthesis:", err.message);
      lyriaError = err.message;
    }

    res.json({
      success: true,
      songDetails,
      lyriaAudioB64,
      useFallbackAudio,
      lyriaError: lyriaError || null
    });

  } catch (error: any) {
    console.error("Error generating music:", error);
    res.status(500).json({
      success: false,
      error: error.message || "An error occurred during music generation."
    });
  }
});

// Start server
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
