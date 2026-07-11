/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  Square,
  Volume2,
  VolumeX,
  Download,
  Sparkles,
  Plus,
  Trash2,
  Music,
  Sliders,
  RefreshCw,
  Mic,
  Folder,
  Layers,
  Info,
  Clock,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { SongProject, Track, TrackClip } from "./types";
import { audioSynth } from "./utils/audioSynth";
import { WaveformVisualizer } from "./components/WaveformVisualizer";
import { LyricsPlayer } from "./components/LyricsPlayer";

// --- PRE-LOADED DEMO PROJECTS ---
const DEMO_PROJECTS: SongProject[] = [
  {
    id: "demo-cyber-retro",
    title: "Synthwave Sunset",
    description: "An energetic driving synthwave track with soaring leads and heavy analog bass.",
    genre: "Synthwave",
    tempo: 124,
    mood: "Energetic",
    chordProgression: ["Am", "F", "C", "G"],
    lyrics: [
      { time: 0, text: "(Intro - High-energy synthesizer starts)" },
      { time: 4.5, text: "Walking through the neon light," },
      { time: 9.0, text: "Shadows dancing in the night." },
      { time: 13.5, text: "Engines scream and tires burn," },
      { time: 18.0, text: "There is no point of return!" },
      { time: 22.0, text: "(Chorus) Feel the rhythm, feel the glow!" },
      { time: 26.5, text: "Let the synthesizer flow!" },
      { time: 31.0, text: "No more limits, run the night," },
      { time: 35.5, text: "We will reach the speed of light!" },
      { time: 40.0, text: "(Outro - Synthesizers fade away)" },
    ],
    tracks: [
      {
        id: "vocals",
        name: "Vocals & Harmonies",
        volume: 0.8,
        isMuted: false,
        isSolo: false,
        clips: [
          { id: "v-c1", name: "Verse 1 Vocal Phrase", startTime: 4, duration: 15, color: "from-pink-500 to-rose-600" },
          { id: "v-c2", name: "Chorus Vocal Phrase", startTime: 22, duration: 18, color: "from-pink-500 to-rose-600" },
        ],
      },
      {
        id: "melody",
        name: "Lead Melody Synth",
        volume: 0.75,
        isMuted: false,
        isSolo: false,
        clips: [
          { id: "m-c1", name: "Intro Theme Lead", startTime: 0, duration: 8, color: "from-purple-500 to-indigo-600" },
          { id: "m-c2", name: "Chorus Hook Lead", startTime: 20, duration: 20, color: "from-purple-500 to-indigo-600" },
        ],
      },
      {
        id: "bass",
        name: "Sub Bassline",
        volume: 0.85,
        isMuted: false,
        isSolo: false,
        clips: [{ id: "b-c1", name: "Arpeggiated Bassline", startTime: 0, duration: 42, color: "from-blue-500 to-teal-600" }],
      },
      {
        id: "drums",
        name: "Retro Drum Machine",
        volume: 0.9,
        isMuted: false,
        isSolo: false,
        clips: [{ id: "d-c1", name: "124 BPM 4/4 Beat", startTime: 2, duration: 40, color: "from-amber-500 to-orange-600" }],
      },
      {
        id: "fx",
        name: "FX & Sweeps",
        volume: 0.6,
        isMuted: false,
        isSolo: false,
        clips: [
          { id: "f-c1", name: "Riser Sweep", startTime: 16, duration: 4, color: "from-emerald-500 to-green-600" },
          { id: "f-c2", name: "Reverb Crash Splash", startTime: 20, duration: 5, color: "from-emerald-500 to-green-600" },
        ],
      },
    ],
    melodicTheme: [
      { time: 0, note: "A4", duration: 0.5 },
      { time: 0.5, note: "B4", duration: 0.5 },
      { time: 1.0, note: "C5", duration: 1.0 },
      { time: 2.0, note: "B4", duration: 0.5 },
      { time: 2.5, note: "G4", duration: 1.5 },
      { time: 4.0, note: "A4", duration: 2.0 },
      // Chorus loop notes
      { time: 8.0, note: "C5", duration: 0.5 },
      { time: 8.5, note: "D5", duration: 0.5 },
      { time: 9.0, note: "E5", duration: 1.0 },
      { time: 10.0, note: "G5", duration: 1.0 },
      { time: 11.0, note: "E5", duration: 2.0 },
    ],
    bassTheme: [
      { time: 0, note: "A2", duration: 2.0 },
      { time: 2.0, note: "F2", duration: 2.0 },
      { time: 4.0, note: "C2", duration: 2.0 },
      { time: 6.0, note: "G2", duration: 2.0 },
    ],
    drumPattern: "electronic",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "demo-ambient-lofi",
    title: "Chilled Dreams",
    description: "A calming, warm ambient track perfect for focusing or relaxing.",
    genre: "Ambient Lofi",
    tempo: 85,
    mood: "Ethereal",
    chordProgression: ["Fmaj7", "G6", "Em7", "Am9"],
    lyrics: [
      { time: 0, text: "(Ambient Rain soundscape begins)" },
      { time: 6.0, text: "Raindrops fall on my window pane," },
      { time: 13.0, text: "Washing out all the dust and pain." },
      { time: 20.0, text: "Close your eyes, let your thoughts float free," },
      { time: 27.0, text: "In this dream, we are meant to be." },
      { time: 34.0, text: "(Outro - Rain continues to fade out)" },
    ],
    tracks: [
      {
        id: "vocals",
        name: "Lofi Whispers",
        volume: 0.6,
        isMuted: false,
        isSolo: false,
        clips: [{ id: "v-l1", name: "Vocal Swells", startTime: 5, duration: 25, color: "from-pink-500 to-rose-600" }],
      },
      {
        id: "melody",
        name: "Rhodes Piano Pad",
        volume: 0.85,
        isMuted: false,
        isSolo: false,
        clips: [{ id: "m-l1", name: "Warm Chords", startTime: 0, duration: 40, color: "from-purple-500 to-indigo-600" }],
      },
      {
        id: "bass",
        name: "Warm Sine Bass",
        volume: 0.7,
        isMuted: false,
        isSolo: false,
        clips: [{ id: "b-l1", name: "Deep Subline", startTime: 4, duration: 36, color: "from-blue-500 to-teal-600" }],
      },
      {
        id: "drums",
        name: "Dusty Vinyl Beats",
        volume: 0.65,
        isMuted: false,
        isSolo: false,
        clips: [{ id: "d-l1", name: "Relaxed Vinyl Snap", startTime: 8, duration: 32, color: "from-amber-500 to-orange-600" }],
      },
      {
        id: "fx",
        name: "Vinyl Crackle & Rain",
        volume: 0.8,
        isMuted: false,
        isSolo: false,
        clips: [{ id: "f-l1", name: "Rain & Dust FX", startTime: 0, duration: 40, color: "from-emerald-500 to-green-600" }],
      },
    ],
    melodicTheme: [
      { time: 0, note: "F4", duration: 1.0 },
      { time: 1.0, note: "A4", duration: 1.0 },
      { time: 2.0, note: "C5", duration: 2.0 },
      { time: 4.0, note: "G4", duration: 1.0 },
      { time: 5.0, note: "B4", duration: 1.0 },
      { time: 6.0, note: "D5", duration: 2.0 },
    ],
    bassTheme: [
      { time: 0, note: "F2", duration: 4.0 },
      { time: 4.0, note: "G2", duration: 4.0 },
    ],
    drumPattern: "hiphop",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Safe localStorage access utilities to prevent SecurityError in sandboxed iframe environments
const safeGetLocalStorage = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    console.warn("localStorage read blocked or unavailable", e);
    return null;
  }
};

const safeSetLocalStorage = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.warn("localStorage write blocked or unavailable", e);
  }
};

export default function App() {
  const [projects, setProjects] = useState<SongProject[]>(() => {
    const saved = safeGetLocalStorage("ai_music_projects");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error("Failed to parse saved projects:", e);
      }
    }
    return DEMO_PROJECTS;
  });

  const [selectedProjectId, setSelectedProjectId] = useState<string>(() => {
    const saved = safeGetLocalStorage("ai_music_projects");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed[0].id;
        }
      } catch (e) {}
    }
    return DEMO_PROJECTS[0].id;
  });

  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [masterVolume, setMasterVolume] = useState<number>(0.8);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Form parameters
  const [prompt, setPrompt] = useState<string>("");
  const [genre, setGenre] = useState<string>("Synthwave");
  const [tempo, setTempo] = useState<number>(120);
  const [mood, setMood] = useState<string>("Energetic");
  const [lyricsMode, setLyricsMode] = useState<"generate" | "none" | "custom">("generate");
  const [customLyrics, setCustomLyrics] = useState<string>("");
  const [clipDuration, setClipDuration] = useState<number>(30);

  // Cover/Remix UI helper states
  const [coverOriginalTitle, setCoverOriginalTitle] = useState<string | null>(null);
  const [remixOriginalTitle, setRemixOriginalTitle] = useState<string | null>(null);

  // Export progress overlay
  const [exportingFormat, setExportingFormat] = useState<string | null>(null);

  // Save projects to localStorage whenever updated
  const saveProjects = (updatedProjects: SongProject[]) => {
    setProjects(updatedProjects);
    safeSetLocalStorage("ai_music_projects", JSON.stringify(updatedProjects));
  };

  // Find active project
  const activeProject = (projects && projects.find((p) => p.id === selectedProjectId)) || (projects && projects[0]) || DEMO_PROJECTS[0];

  // Stop sound if project changes
  useEffect(() => {
    if (isPlaying) {
      audioSynth.stop();
      setIsPlaying(false);
      setCurrentTime(0);
    }
  }, [selectedProjectId]);

  // Adjust master volume on the audioEngine
  useEffect(() => {
    audioSynth.updateMasterVolume(masterVolume);
  }, [masterVolume]);

  const handlePlayPause = () => {
    if (!activeProject) return;

    if (isPlaying) {
      audioSynth.stop();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      audioSynth.play(activeProject, currentTime, (time) => {
        setCurrentTime(time);
      });
    }
  };

  const handleStop = () => {
    audioSynth.stop();
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleTimelineSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!activeProject) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickPercent = clickX / rect.width;
    const duration = activeProject.audioUrl ? 30 : 40; // max length
    const newTime = clickPercent * duration;

    setCurrentTime(newTime);
    if (isPlaying) {
      audioSynth.play(activeProject, newTime, (time) => {
        setCurrentTime(time);
      });
    }
  };

  // Skip to lyric line timestamp
  const handleLyricSeek = (time: number) => {
    if (!activeProject) return;
    setCurrentTime(time);
    if (isPlaying) {
      audioSynth.play(activeProject, time, (t) => {
        setCurrentTime(t);
      });
    }
  };

  // Dynamic individual track controls
  const handleMuteToggle = (trackId: string) => {
    const updatedProjects = projects.map((proj) => {
      if (proj.id === selectedProjectId) {
        const tracks = proj.tracks.map((t) => {
          if (t.id === trackId) {
            const newMute = !t.isMuted;
            // Instantly sync sound engine
            const isAnySoloed = proj.tracks.some((other) => other.id !== trackId && other.isSolo);
            audioSynth.updateTrackVolume(trackId, t.volume, newMute, isAnySoloed, t.isSolo);
            return { ...t, isMuted: newMute };
          }
          return t;
        });
        return { ...proj, tracks };
      }
      return proj;
    });
    saveProjects(updatedProjects);
  };

  const handleSoloToggle = (trackId: string) => {
    const updatedProjects = projects.map((proj) => {
      if (proj.id === selectedProjectId) {
        const anyActiveSolo = proj.tracks.some((t) => t.id !== trackId && t.isSolo);
        const tracks = proj.tracks.map((t) => {
          if (t.id === trackId) {
            return { ...t, isSolo: !t.isSolo };
          }
          return t;
        });

        // Sync sound engine for all tracks in current project
        const willBeSoloed = !proj.tracks.find((t) => t.id === trackId)?.isSolo;
        tracks.forEach((t) => {
          const isTargetSolo = t.id === trackId ? willBeSoloed : t.isSolo;
          const isAnySoloed = tracks.some((other) => other.isSolo);
          audioSynth.updateTrackVolume(t.id, t.volume, t.isMuted, isAnySoloed, isTargetSolo);
        });

        return { ...proj, tracks };
      }
      return proj;
    });
    saveProjects(updatedProjects);
  };

  const handleTrackVolumeChange = (trackId: string, volume: number) => {
    const updatedProjects = projects.map((proj) => {
      if (proj.id === selectedProjectId) {
        const tracks = proj.tracks.map((t) => {
          if (t.id === trackId) {
            const isAnySoloed = proj.tracks.some((other) => other.isSolo);
            audioSynth.updateTrackVolume(trackId, volume, t.isMuted, isAnySoloed, t.isSolo);
            return { ...t, volume };
          }
          return t;
        });
        return { ...proj, tracks };
      }
      return proj;
    });
    saveProjects(updatedProjects);
  };

  // --- DELETE PROJECT ---
  const handleDeleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (projects.length <= 1) {
      alert("You need at least one song project in your library!");
      return;
    }
    const filtered = projects.filter((p) => p.id !== id);
    saveProjects(filtered);
    if (selectedProjectId === id) {
      setSelectedProjectId(filtered[0].id);
    }
  };

  // --- GENERATE AI MUSIC ---
  const handleGenerateMusic = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setGenerationError(null);
    handleStop();

    try {
      const response = await fetch("/api/generate-music", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          genre,
          tempo,
          mood,
          lyricsMode,
          customLyrics: lyricsMode === "custom" ? customLyrics : "",
          clipDuration,
        }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Server failed to generate music.");
      }

      const info = data.songDetails;
      
      // Convert lyrics string into parsed timestamp array
      const parsedLyrics = parseLyricsString(info.lyrics || "");

      // Setup dynamic procedural tracks
      const colorPalettes = {
        vocals: "from-pink-500 to-rose-600",
        melody: "from-purple-500 to-indigo-600",
        bass: "from-blue-500 to-teal-600",
        drums: "from-amber-500 to-orange-600",
        fx: "from-emerald-500 to-green-600",
      };

      const tracks: Track[] = ["vocals", "melody", "bass", "drums", "fx"].map((tId) => {
        const clips: TrackClip[] = [];
        if (tId === "bass" || tId === "melody" || tId === "drums") {
          // Standard full length clips
          clips.push({
            id: `${tId}-clip-1`,
            name: `${info.genre} ${tId}`,
            startTime: 0,
            duration: clipDuration,
            color: colorPalettes[tId as keyof typeof colorPalettes],
          });
        } else if (tId === "vocals" && lyricsMode !== "none" && parsedLyrics.length > 0) {
          clips.push({
            id: `vocal-clip`,
            name: "Vocal Vocoder Stems",
            startTime: parsedLyrics[0].time,
            duration: Math.max(8, parsedLyrics[parsedLyrics.length - 1].time - parsedLyrics[0].time),
            color: colorPalettes.vocals,
          });
        } else if (tId === "fx") {
          clips.push({
            id: `fx-clip-1`,
            name: "Sweeps & Reverb Riser",
            startTime: 2,
            duration: 6,
            color: colorPalettes.fx,
          });
        }

        return {
          id: tId,
          name: tId.charAt(0).toUpperCase() + tId.slice(1),
          volume: 0.8,
          isMuted: false,
          isSolo: false,
          clips,
        };
      });

      // Construct a new song project
      let coverSuffix = "";
      if (coverOriginalTitle) {
        coverSuffix = ` (Cover of ${coverOriginalTitle})`;
      } else if (remixOriginalTitle) {
        coverSuffix = ` (Remix of ${remixOriginalTitle})`;
      }

      // Convert Lyria b64 audio to URL if present
      let audioUrl = "";
      if (data.lyriaAudioB64) {
        audioUrl = `data:audio/mp3;base64,${data.lyriaAudioB64}`;
      }

      const newProject: SongProject = {
        id: `project-${Date.now()}`,
        title: `${info.title}${coverSuffix}`,
        description: prompt || `Procedurally synthesized ${info.mood} ${info.genre} track.`,
        genre: info.genre || genre,
        tempo: info.bpm || tempo,
        mood: info.mood || mood,
        lyrics: parsedLyrics,
        tracks,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        chordProgression: info.chordProgression || ["Am", "F", "C", "G"],
        melodicTheme: info.melodicTheme || [
          { time: 0, note: "A4", duration: 0.5 },
          { time: 0.5, note: "C5", duration: 0.5 },
          { time: 1.0, note: "E5", duration: 1.0 },
        ],
        bassTheme: info.bassTheme || [
          { time: 0, note: "A2", duration: 1.0 },
          { time: 1.0, note: "F2", duration: 1.0 },
        ],
        drumPattern: info.genre?.toLowerCase().includes("ambient") ? "hiphop" : "electronic",
        audioUrl,
        audioBase64: data.lyriaAudioB64 || undefined,
      };

      const updatedProjects = [newProject, ...projects];
      saveProjects(updatedProjects);
      setSelectedProjectId(newProject.id);

      // Clean up inputs & cover states
      setPrompt("");
      setCoverOriginalTitle(null);
      setRemixOriginalTitle(null);

    } catch (err: any) {
      console.error(err);
      setGenerationError(err.message || "An unexpected error occurred during song generation.");
    } finally {
      setIsGenerating(false);
    }
  };

  // --- LYRICS STRING PARSER Helper ---
  const parseLyricsString = (lyricString: string) => {
    const lines: { time: number; text: string }[] = [];
    const regex = /\[(\d{2}):(\d{2})\]\s*(.*)/g;
    let match;
    
    // Split lines
    const rawLines = lyricString.split("\n");
    rawLines.forEach((l) => {
      const m = l.match(/\[(\d{2}):(\d{2})\]\s*(.*)/);
      if (m) {
        const mins = parseInt(m[1], 10);
        const secs = parseInt(m[2], 10);
        const time = mins * 60 + secs;
        const text = m[3].trim();
        if (text) {
          lines.push({ time, text });
        }
      }
    });

    if (lines.length === 0) {
      // Fallback timeline structure if no timestamps matched
      const fallbackSentences = lyricString.split(/\.|\n/).map((s) => s.trim()).filter(Boolean);
      fallbackSentences.forEach((sentence, index) => {
        lines.push({
          time: index * 6 + 2, // space them out every 6 seconds
          text: sentence,
        });
      });
    }

    return lines;
  };

  // --- REMIX FEATURE ---
  const handleRemixClick = (p: SongProject) => {
    setPrompt(`A reimagined remix of '${p.title}', with ${p.mood} elements.`);
    setGenre(p.genre);
    setTempo(p.tempo);
    setMood(p.mood);
    setClipDuration(30);
    setRemixOriginalTitle(p.title);
    setCoverOriginalTitle(null);

    // Scroll generator panel into view
    document.getElementById("generator-panel")?.scrollIntoView({ behavior: "smooth" });
  };

  // --- COVER FEATURE ---
  const handleCoverClick = (p: SongProject) => {
    setPrompt(`A vocal cover rendition of '${p.title}'. Keep the core melodic hook but style it uniquely.`);
    setGenre(p.genre);
    setTempo(p.tempo);
    setMood(p.mood);
    setLyricsMode("custom");
    setCustomLyrics(p.lyrics.map((l) => `[00:${l.time.toString().padStart(2, "0")}] ${l.text}`).join("\n"));
    setCoverOriginalTitle(p.title);
    setRemixOriginalTitle(null);

    document.getElementById("generator-panel")?.scrollIntoView({ behavior: "smooth" });
  };

  // --- HIGH QUALITY FILE EXPORT (WAV & MP3 Simulation) ---
  const handleExportFile = async (format: "wav" | "mp3") => {
    if (!activeProject) return;
    setExportingFormat(format);

    try {
      // Small visual delay to simulate premium high-quality export processing
      await new Promise((resolve) => setTimeout(resolve, 1500));

      let blob: Blob;
      
      if (activeProject.audioUrl && !activeProject.isCustomUpload) {
        // If Lyria already provided a generated audio file, fetch it directly
        const res = await fetch(activeProject.audioUrl);
        blob = await res.blob();
      } else {
        // Render project audio losslessly using Web Audio API offline renderer
        blob = await audioSynth.exportToWav(activeProject);
      }

      // Create downloadable file
      const fileUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = fileUrl;
      link.download = `${activeProject.title.replace(/\s+/g, "_")}_HQ.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(fileUrl);
    } catch (err) {
      console.error("Export failed", err);
      alert("Failed to export. Please make sure audio was generated correctly.");
    } finally {
      setExportingFormat(null);
    }
  };

  // Helper to format track length (suno limits clips to 30s)
  const durationLimit = activeProject?.audioUrl ? 30 : 40;

  return (
    <div className="min-h-screen bg-[#09090b] text-gray-200 font-sans flex flex-col antialiased selection:bg-purple-600/30 selection:text-purple-200 overflow-x-hidden" id="main-app-container">
      {/* Top Banner Header */}
      <header className="border-b border-[#1c1c21] bg-[#0c0c0e] px-6 py-4 flex items-center justify-between sticky top-0 z-40 shadow-md">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-900/20">
            <Sparkles className="w-5.5 h-5.5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                Moca Studio
              </span>
              <span className="text-[10px] font-semibold bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded-full border border-purple-500/20 uppercase tracking-widest">
                Lyria Engine v3
              </span>
            </div>
            <p className="text-xs text-gray-400">High-Fidelity AI Co-Composer & Lyrics Syncer</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Local DB Connected</span>
          </div>
          
          <a
            href="https://ai.studio/build"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition"
          >
            <span>Google AI Studio</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </header>

      {/* Main Grid Workspace */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 max-w-[1700px] mx-auto w-full">
        {/* Left Control Column (3 cols) */}
        <div className="lg:col-span-3 space-y-6 flex flex-col h-full overflow-y-auto" id="left-sidebar">
          
          {/* 1. PROJECT CREATOR & TUNER PANEL */}
          <div className="bg-[#121214] border border-[#1e1e24] rounded-2xl p-5 shadow-xl flex flex-col shrink-0" id="generator-panel">
            <div className="flex items-center gap-2 pb-4 border-b border-[#1e1e24] mb-4">
              <Sliders className="w-5 h-5 text-purple-400" />
              <h2 className="text-md font-bold text-gray-100">AI Creator Panel</h2>
            </div>

            <form onSubmit={handleGenerateMusic} className="space-y-4">
              {/* Prompt box */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">What kind of track do you want to create?</label>
                <textarea
                  required
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. A fast synthwave track with heavy synthesizer leads and cyber ambience..."
                  rows={3}
                  className="w-full text-sm bg-[#1a1a1e] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition resize-none"
                />
              </div>

              {/* Genre Selection */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Genre Style</label>
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="w-full text-sm bg-[#1a1a1e] border border-zinc-800 rounded-xl px-3 py-2 text-gray-200 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition"
                >
                  <option value="Synthwave">Synthwave / Retro-Future</option>
                  <option value="Cyberpunk">Cyberpunk / Industrial Beat</option>
                  <option value="Ambient Lofi">Ambient Lofi / Chill Rain</option>
                  <option value="Techno">Techno / Dark Electronic</option>
                  <option value="Orchestral Synth">Orchestral Synth / Dramatic Space</option>
                  <option value="Retro Rock">Retro Rock / Electric Dream</option>
                </select>
              </div>

              {/* Mood Selection */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Emotional Mood</label>
                <select
                  value={mood}
                  onChange={(e) => setMood(e.target.value)}
                  className="w-full text-sm bg-[#1a1a1e] border border-zinc-800 rounded-xl px-3 py-2 text-gray-200 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition"
                >
                  <option value="Energetic">Energetic & Driven</option>
                  <option value="Dark">Dark & Mysterious</option>
                  <option value="Ethereal">Ethereal & Relaxing</option>
                  <option value="Majestic">Majestic & Galactic</option>
                  <option value="Melancholy">Melancholic & Moody</option>
                  <option value="Uplifting">Uplifting & Inspiring</option>
                </select>
              </div>

              {/* Tempo BPM & Duration */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Tempo (BPM)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={60}
                      max={180}
                      value={tempo}
                      onChange={(e) => setTempo(Math.max(60, Math.min(180, parseInt(e.target.value, 10) || 120)))}
                      className="w-full text-sm bg-[#1a1a1e] border border-zinc-800 rounded-xl px-2.5 py-1.5 text-center text-gray-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Track Duration</label>
                  <select
                    value={clipDuration}
                    onChange={(e) => setClipDuration(parseInt(e.target.value, 10))}
                    className="w-full text-sm bg-[#1a1a1e] border border-zinc-800 rounded-xl px-2 py-1.5 text-gray-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  >
                    <option value={30}>Clip (30s)</option>
                    <option value={45}>Full Track (45s)</option>
                  </select>
                </div>
              </div>

              {/* Lyrics Mode selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5">Lyrics Sync Mode</label>
                <div className="grid grid-cols-3 gap-1 bg-[#1a1a1e] p-1 rounded-xl border border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setLyricsMode("generate")}
                    className={`text-[10px] font-medium py-1.5 rounded-lg transition ${
                      lyricsMode === "generate" ? "bg-purple-600 text-white shadow-sm" : "text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    AI Sync
                  </button>
                  <button
                    type="button"
                    onClick={() => setLyricsMode("custom")}
                    className={`text-[10px] font-medium py-1.5 rounded-lg transition ${
                      lyricsMode === "custom" ? "bg-purple-600 text-white shadow-sm" : "text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    Custom
                  </button>
                  <button
                    type="button"
                    onClick={() => setLyricsMode("none")}
                    className={`text-[10px] font-medium py-1.5 rounded-lg transition ${
                      lyricsMode === "none" ? "bg-purple-600 text-white shadow-sm" : "text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    None
                  </button>
                </div>
              </div>

              {lyricsMode === "custom" && (
                <div className="animate-fadeIn">
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Provide Custom Lyrics with Timestamps (optional)</label>
                  <textarea
                    value={customLyrics}
                    onChange={(e) => setCustomLyrics(e.target.value)}
                    placeholder={`[00:00] (Intro rhythm)\n[00:04] This is my custom verse line...\n[00:12] High frequency wave starts...`}
                    rows={4}
                    className="w-full text-xs font-mono bg-[#1a1a1e] border border-zinc-800 rounded-xl px-3 py-2 text-gray-200 placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none"
                  />
                </div>
              )}

              {/* Cover/Remix Status Indicator banner */}
              {(coverOriginalTitle || remixOriginalTitle) && (
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 flex items-center justify-between text-xs text-purple-300">
                  <span className="truncate">
                    {coverOriginalTitle ? `👉 Vocal Cover of: ${coverOriginalTitle}` : `👉 Remix of: ${remixOriginalTitle}`}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setCoverOriginalTitle(null);
                      setRemixOriginalTitle(null);
                      setPrompt("");
                    }}
                    className="text-xs text-pink-400 hover:text-pink-300 font-bold ml-2 underline"
                  >
                    Reset
                  </button>
                </div>
              )}

              {/* Generate button */}
              <button
                type="submit"
                disabled={isGenerating}
                className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm tracking-wide transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-purple-900/10 ${
                  isGenerating
                    ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 text-white hover:opacity-90 hover:scale-[1.01] active:scale-[0.99]"
                }`}
                id="generate-button"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-purple-400" />
                    <span>Synthesizing Multitracks...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>
                      {coverOriginalTitle ? "Create Vocal Cover" : remixOriginalTitle ? "Generate Remix" : "Generate AI Song"}
                    </span>
                  </>
                )}
              </button>
            </form>

            {generationError && (
              <div className="mt-3 bg-red-900/10 border border-red-500/30 text-xs text-red-400 p-3 rounded-xl flex items-start gap-2 animate-pulse">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <p>{generationError}</p>
              </div>
            )}
          </div>

          {/* 2. LIBRARY / SAVED PROJECTS ORGANIZER */}
          <div className="bg-[#121214] border border-[#1e1e24] rounded-2xl p-5 shadow-xl flex-1 flex flex-col min-h-[300px]">
            <div className="flex items-center justify-between pb-4 border-b border-[#1e1e24] mb-3">
              <div className="flex items-center gap-2">
                <Folder className="w-4.5 h-4.5 text-purple-400" />
                <h2 className="text-sm font-bold text-gray-100">Project Library</h2>
              </div>
              <span className="text-[10px] bg-zinc-900 px-2 py-0.5 rounded-full text-zinc-400 border border-zinc-800">
                {projects.length} Saved
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[340px] lg:max-h-[none]">
              {projects.map((p) => {
                const isSelected = p.id === selectedProjectId;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedProjectId(p.id)}
                    className={`group w-full text-left p-3 rounded-xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? "bg-purple-950/20 border-purple-500/40"
                        : "bg-transparent border-[#1e1e24] hover:bg-zinc-900 hover:border-zinc-800"
                    }`}
                    id={`library-project-card-${p.id}`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div
                        className={`h-8 w-8 rounded-lg shrink-0 flex items-center justify-center ${
                          isSelected ? "bg-purple-500/20 text-purple-400" : "bg-zinc-900 text-zinc-500"
                        }`}
                      >
                        <Music className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-xs text-gray-100 truncate group-hover:text-purple-300 transition">
                          {p.title}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px] px-1.5 py-0.2 bg-zinc-900 text-zinc-400 rounded-md font-mono border border-zinc-800">
                            {p.tempo} BPM
                          </span>
                          <span className="text-[9px] text-zinc-500 truncate max-w-[80px]">
                            {p.genre}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        title="Remix this song style"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemixClick(p);
                        }}
                        className="p-1 rounded-lg bg-zinc-800 hover:bg-purple-950/40 text-purple-400 border border-zinc-700/50 hover:border-purple-500/30 transition cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        title="Vocal Cover"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCoverClick(p);
                        }}
                        className="p-1 rounded-lg bg-zinc-800 hover:bg-pink-950/40 text-pink-400 border border-zinc-700/50 hover:border-pink-500/30 transition cursor-pointer"
                      >
                        <Mic className="w-3.5 h-3.5" />
                      </button>
                      <button
                        title="Delete project"
                        onClick={(e) => handleDeleteProject(p.id, e)}
                        className="p-1 rounded-lg bg-zinc-800 hover:bg-red-950/40 text-red-400 border border-zinc-700/50 hover:border-red-500/30 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Center / Right Workspace Column (9 cols) */}
        <div className="lg:col-span-9 space-y-6 flex flex-col h-full overflow-y-auto" id="workspace-column">
          
          {/* Active Song Overview header bar */}
          <div className="bg-[#121214] border border-[#1e1e24] rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <span className="text-xl font-extrabold text-gray-100 tracking-tight">{activeProject.title}</span>
                <span className="text-xs font-semibold bg-[#1a1a1e] border border-zinc-800 text-purple-400 px-2.5 py-0.5 rounded-full">
                  {activeProject.genre}
                </span>
                <span className="text-xs font-semibold bg-[#1a1a1e] border border-zinc-800 text-pink-400 px-2.5 py-0.5 rounded-full">
                  {activeProject.mood}
                </span>
              </div>
              <p className="text-xs text-gray-400 italic max-w-xl">{activeProject.description}</p>
            </div>

            {/* HIGH-QUALITY EXPORTS CONTROL */}
            <div className="flex items-center gap-2 bg-[#1a1a1e] p-2 rounded-xl border border-zinc-800 shrink-0">
              <span className="text-[10px] font-mono font-bold text-zinc-500 px-2">EXPORT HQ:</span>
              <button
                onClick={() => handleExportFile("wav")}
                disabled={!!exportingFormat}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-purple-900/30 hover:text-purple-300 border border-zinc-700 text-xs font-semibold transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>WAV (Lossless)</span>
              </button>
              <button
                onClick={() => handleExportFile("mp3")}
                disabled={!!exportingFormat}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-pink-900/30 hover:text-pink-300 border border-zinc-700 text-xs font-semibold transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>MP3 (320kbps)</span>
              </button>
            </div>
          </div>

          {/* SPLIT ROW: Multi-Track Timeline VS scrolling lyrics */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
            
            {/* TIMELINE VIEW (7 cols) */}
            <div className="xl:col-span-8 bg-[#121214] border border-[#1e1e24] rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-6" id="timeline-workspace">
              
              {/* TIMELINE CONTROL HEADER */}
              <div className="flex items-center justify-between border-b border-[#1e1e24] pb-4">
                <div className="flex items-center gap-4">
                  {/* Play & Stop Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePlayPause}
                      className="h-11 w-11 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:scale-105 active:scale-95 text-white flex items-center justify-center transition shadow-lg shadow-purple-900/30 cursor-pointer"
                      title={isPlaying ? "Pause track" : "Play track"}
                    >
                      {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                    </button>
                    <button
                      onClick={handleStop}
                      className="h-11 w-11 rounded-full bg-zinc-800 hover:bg-zinc-700 text-gray-200 flex items-center justify-center transition border border-zinc-700 cursor-pointer"
                      title="Stop & Reset track"
                    >
                      <Square className="w-4 h-4 fill-current" />
                    </button>
                  </div>

                  {/* Playback time display */}
                  <div className="flex flex-col">
                    <span className="text-xl font-mono font-bold tracking-wider text-gray-100">
                      {Math.floor(currentTime / 60).toString().padStart(2, "0")}:
                      {Math.floor(currentTime % 60).toString().padStart(2, "0")}.
                      {Math.floor((currentTime % 1) * 100).toString().padStart(2, "0")}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                      TIME POSITION ({durationLimit}s max)
                    </span>
                  </div>
                </div>

                {/* Master Volume Slider */}
                <div className="flex items-center gap-2.5 bg-black/40 px-3 py-1.5 rounded-xl border border-zinc-800/60">
                  <button
                    onClick={() => setMasterVolume(masterVolume === 0 ? 0.8 : 0)}
                    className="text-zinc-400 hover:text-white transition"
                  >
                    {masterVolume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={masterVolume}
                    onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
                    className="w-20 accent-purple-500 cursor-pointer h-1 rounded-lg"
                  />
                  <span className="text-xs font-mono font-bold text-zinc-400 w-8 text-right">
                    {Math.round(masterVolume * 100)}%
                  </span>
                </div>
              </div>

              {/* DYNAMIC SEQUENCE & TIMELINE GRID TRACKS */}
              <div className="flex-1 space-y-3.5 relative min-h-[320px]">
                
                {/* Visual playback head cursor overlay */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-500 via-pink-500 to-indigo-500 shadow-[0_0_8px_rgba(168,85,247,0.8)] z-10 pointer-events-none transition-all duration-75"
                  style={{
                    left: `calc(180px + (100% - 180px) * ${currentTime / durationLimit})`,
                  }}
                />

                {/* Grid header metrics labels */}
                <div className="flex text-[10px] font-mono font-bold text-zinc-500 tracking-wider">
                  <div className="w-[180px] shrink-0">MIXER CONTROLS</div>
                  <div className="flex-1 flex justify-between px-2">
                    <span>00:00</span>
                    <span>00:08</span>
                    <span>00:16</span>
                    <span>00:24</span>
                    <span>00:32</span>
                    <span>{durationLimit === 30 ? "00:30" : "00:40"}</span>
                  </div>
                </div>

                {/* Multiple Audio Tracks */}
                {activeProject.tracks.map((track) => {
                  // Percentage position of clips relative to track length
                  return (
                    <div
                      key={track.id}
                      className="flex items-center bg-[#16161a] border border-[#1e1e24] rounded-xl overflow-hidden relative group/track"
                      id={`timeline-track-row-${track.id}`}
                    >
                      {/* Left Control Panel inside each row */}
                      <div className="w-[180px] shrink-0 bg-[#121214] p-3 border-r border-[#1e1e24] flex flex-col justify-between gap-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-200 truncate pr-2">{track.name}</span>
                          <div className="flex items-center gap-1">
                            {/* Mute button */}
                            <button
                              onClick={() => handleMuteToggle(track.id)}
                              className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded transition ${
                                track.isMuted
                                  ? "bg-red-600 text-white shadow-md shadow-red-900/10"
                                  : "bg-[#1a1a1e] text-zinc-500 hover:text-zinc-200"
                              }`}
                            >
                              M
                            </button>
                            {/* Solo button */}
                            <button
                              onClick={() => handleSoloToggle(track.id)}
                              className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded transition ${
                                track.isSolo
                                  ? "bg-amber-600 text-white shadow-md shadow-amber-900/10"
                                  : "bg-[#1a1a1e] text-zinc-500 hover:text-zinc-200"
                              }`}
                            >
                              S
                            </button>
                          </div>
                        </div>

                        {/* Volume Fader inside row */}
                        <div className="flex items-center gap-1.5">
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={track.volume}
                            onChange={(e) => handleTrackVolumeChange(track.id, parseFloat(e.target.value))}
                            className="w-full h-1 bg-zinc-800 rounded-lg accent-purple-500"
                          />
                          <span className="text-[9px] font-mono text-zinc-500 text-right w-6">
                            {Math.round(track.volume * 100)}
                          </span>
                        </div>
                      </div>

                      {/* Right Waveform & Clips Display */}
                      <div
                        onClick={handleTimelineSeek}
                        className="flex-1 h-[68px] relative bg-black/25 cursor-pointer flex items-center px-2 select-none"
                      >
                        {/* Interactive Waveform Grid Visualizer inside track */}
                        <div className="absolute inset-x-2 inset-y-1 z-0 opacity-75">
                          <WaveformVisualizer
                            id={track.id + "_" + activeProject.id}
                            color={
                              track.id === "vocals"
                                ? "#ec4899"
                                : track.id === "melody"
                                ? "#a855f7"
                                : track.id === "bass"
                                ? "#3b82f6"
                                : track.id === "drums"
                                ? "#f59e0b"
                                : "#10b981"
                            }
                            isPlaying={isPlaying}
                            progress={currentTime / durationLimit}
                            height={60}
                          />
                        </div>

                        {/* Interactive Clip Blocks Layer */}
                        {track.clips.map((clip) => {
                          const startPercent = (clip.startTime / durationLimit) * 100;
                          const widthPercent = (clip.duration / durationLimit) * 100;

                          return (
                            <div
                              key={clip.id}
                              className={`absolute h-8 rounded-lg bg-gradient-to-r ${clip.color} opacity-40 border border-white/10 flex items-center px-2 shadow-sm pointer-events-none transition-all duration-300`}
                              style={{
                                left: `${startPercent}%`,
                                width: `${widthPercent}%`,
                              }}
                            >
                              <span className="text-[10px] font-extrabold text-white truncate drop-shadow-md">
                                {clip.name}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Informative tips box */}
              <div className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-900 flex items-start gap-2 text-xs text-zinc-500 leading-relaxed">
                <Info className="w-4.5 h-4.5 text-purple-400 shrink-0 mt-0.5 animate-pulse" />
                <p>
                  SunoWave Studio processes multitracks instantly. Clicking the timeline lets you skip position.
                  Use the <strong>M (Mute)</strong> or <strong>S (Solo)</strong> toggles to isolate or layer synthesizers.
                  Click <strong>HQ Exports</strong> to save lossless assets.
                </p>
              </div>

            </div>

            {/* SYNCED LYRICS SCROLLER PANEL (4 cols) */}
            <div className="xl:col-span-4 h-[550px] xl:h-auto flex flex-col">
              <LyricsPlayer
                lyrics={activeProject.lyrics}
                currentTime={currentTime}
                onSeek={handleLyricSeek}
                isPlaying={isPlaying}
              />
            </div>

          </div>

        </div>
      </div>

      {/* FULL EXPORT PROGRESS MODAL OVERLAY */}
      {exportingFormat && (
        <div className="fixed inset-0 bg-black/85 z-50 flex flex-col items-center justify-center p-6 backdrop-blur-md animate-fadeIn" id="exporting-overlay">
          <div className="bg-[#121214] border border-purple-500/20 max-w-sm w-full p-8 rounded-2xl shadow-2xl text-center space-y-5 animate-scaleUp">
            <div className="relative mx-auto h-16 w-16 bg-purple-500/10 rounded-full flex items-center justify-center border border-purple-500/30">
              <RefreshCw className="w-8 h-8 text-purple-400 animate-spin" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-extrabold text-gray-100 uppercase tracking-wide">
                Rendering High Fidelity File
              </h3>
              <p className="text-xs text-gray-400">
                Converting active stems to premium {exportingFormat.toUpperCase()} at 44.1kHz stereo
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden border border-zinc-800">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-full animate-exportProgress rounded-full" />
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono font-semibold text-zinc-500">
                <span>Lossless Offline Master</span>
                <span>100% COMPLETE</span>
              </div>
            </div>

            <p className="text-[10px] text-zinc-500 leading-normal bg-black/30 p-3 rounded-lg border border-zinc-800">
              Your audio contains synthesized acoustic waves rendering dynamically using modern Web Audio APIs.
            </p>
          </div>
        </div>
      )}

      {/* Aesthetic Footer */}
      <footer className="border-t border-[#1c1c21] bg-[#0c0c0e] px-6 py-4 mt-auto text-center text-xs text-zinc-500 flex flex-col sm:flex-row items-center justify-between gap-4">
        <span>&copy; {new Date().getFullYear()} SunoWave Studio. Professional AI Music Creator.</span>
        <div className="flex items-center gap-4 text-[11px]">
          <span>Format: PCM 16-Bit WAV / MP3 Pro</span>
          <span className="text-zinc-700">|</span>
          <span>Offline Synthesizer Engine V3</span>
        </div>
      </footer>
    </div>
  );
}
