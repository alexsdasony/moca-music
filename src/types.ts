/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface LyricLine {
  time: number; // in seconds
  text: string;
}

export interface TrackClip {
  id: string;
  name: string;
  startTime: number; // in seconds
  duration: number; // in seconds
  color: string;
}

export interface Track {
  id: string; // e.g. "vocals", "melody", "bass", "drums", "fx"
  name: string;
  volume: number; // 0 to 1
  isMuted: boolean;
  isSolo: boolean;
  clips: TrackClip[];
}

export interface MelodicNote {
  time: number; // relative to song start, in beats
  note: string; // e.g. "A4", "C5"
  duration: number; // in beats
}

export interface SongProject {
  id: string;
  title: string;
  description: string;
  genre: string;
  tempo: number; // BPM
  mood: string;
  lyrics: LyricLine[];
  tracks: Track[];
  createdAt: string;
  updatedAt: string;
  
  // Custom synthesis data
  chordProgression: string[];
  melodicTheme: MelodicNote[];
  bassTheme: MelodicNote[];
  drumPattern: string;
  
  // Audio file reference (base64 or blob URL) if Lyria generated it
  audioUrl?: string;
  audioBase64?: string;
  isCustomUpload?: boolean;
}

export interface MusicGeneratorParams {
  prompt: string;
  genre: string;
  tempo: number;
  mood: string;
  lyricsMode: "generate" | "none" | "custom";
  customLyrics: string;
  clipDuration: number;
}
