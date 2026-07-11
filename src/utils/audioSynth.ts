/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SongProject } from "../types";

class AudioEngine {
  private ctx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private currentProject: SongProject | null = null;
  private startTime: number = 0;
  private resumeTime: number = 0;
  private schedulerTimer: any = null;
  private lookahead: number = 0.1; // seconds
  private scheduleAheadTime: number = 0.2; // seconds
  private nextNoteTime: number = 0.0;
  private beatCount: number = 0;
  
  // Track gain nodes
  private trackGains: Record<string, GainNode> = {};
  // Lyria direct audio node
  private lyriaAudio: HTMLAudioElement | null = null;
  private lyriaSource: MediaElementAudioSourceNode | null = null;
  private masterGain: GainNode | null = null;

  // Callbacks
  private onTimeUpdateCallback: ((time: number) => void) | null = null;
  private timeUpdateTimer: any = null;

  constructor() {}

  public init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.8;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  public getContextState(): string {
    return this.ctx ? this.ctx.state : "uninitialized";
  }

  public play(project: SongProject, startOffset: number = 0, onTimeUpdate: (time: number) => void) {
    this.init();
    if (this.isPlaying) {
      this.stop();
    }

    this.isPlaying = true;
    this.currentProject = project;
    this.onTimeUpdateCallback = onTimeUpdate;
    this.resumeTime = startOffset;
    this.startTime = this.ctx!.currentTime - startOffset;

    // Set up gain nodes for all tracks
    this.trackGains = {};
    const tracks = ["vocals", "melody", "bass", "drums", "fx"];
    tracks.forEach((tId) => {
      const trackObj = project.tracks.find((t) => t.id === tId);
      const gain = this.ctx!.createGain();
      
      // Calculate active gain based on volume, mute, solo
      let targetVolume = trackObj ? trackObj.volume : 0.7;
      if (trackObj?.isMuted) {
        targetVolume = 0;
      }
      
      // Check if another track is soloed
      const isAnySoloed = project.tracks.some((t) => t.isSolo);
      if (isAnySoloed && trackObj && !trackObj.isSolo) {
        targetVolume = 0;
      }

      gain.gain.setValueAtTime(targetVolume, this.ctx!.currentTime);
      gain.connect(this.masterGain!);
      this.trackGains[tId] = gain;
    });

    // Option A: If we have Lyria audio, use the Audio Element for playback
    if (project.audioUrl && !project.isCustomUpload) {
      this.playLyriaAudio(project.audioUrl, startOffset);
    } else if (project.isCustomUpload && project.audioUrl) {
      this.playLyriaAudio(project.audioUrl, startOffset);
    } else {
      // Option B: Procedural synthesis scheduler
      this.nextNoteTime = this.ctx!.currentTime;
      this.beatCount = Math.floor((startOffset * project.tempo) / 60);
      this.runScheduler();
    }

    // Timer for UI timeline updates
    this.timeUpdateTimer = setInterval(() => {
      if (!this.isPlaying) return;
      const elapsed = this.ctx!.currentTime - this.startTime;
      
      // Stop automatically if song exceeds length (e.g. 45 seconds for fallbacks)
      const maxLen = project.audioUrl ? 180 : 45; // seconds
      if (elapsed >= maxLen) {
        this.stop();
        if (this.onTimeUpdateCallback) this.onTimeUpdateCallback(0);
      } else {
        if (this.onTimeUpdateCallback) this.onTimeUpdateCallback(elapsed);
      }
    }, 50);
  }

  private playLyriaAudio(url: string, offset: number) {
    if (this.lyriaAudio) {
      this.lyriaAudio.pause();
    }

    this.lyriaAudio = new Audio(url);
    this.lyriaAudio.crossOrigin = "anonymous";
    this.lyriaAudio.currentTime = offset;

    try {
      this.lyriaSource = this.ctx!.createMediaElementSource(this.lyriaAudio);
      // Connect Lyria to the master gain
      this.lyriaSource.connect(this.masterGain!);
    } catch (e) {
      // Source node already created or direct connection error, connect audio directly
      console.warn("MediaElementSource connection issue:", e);
    }

    this.lyriaAudio.play().catch((err) => {
      console.error("Audio playback error:", err);
    });
  }

  private runScheduler() {
    if (!this.isPlaying || !this.currentProject) return;

    while (this.nextNoteTime < this.ctx!.currentTime + this.scheduleAheadTime) {
      this.scheduleNote(this.beatCount, this.nextNoteTime);
      this.advanceNote();
    }

    this.schedulerTimer = setTimeout(() => this.runScheduler(), 50);
  }

  private advanceNote() {
    if (!this.currentProject) return;
    const secondsPerBeat = 60.0 / this.currentProject.tempo;
    this.nextNoteTime += 0.25 * secondsPerBeat; // 16th notes
    this.beatCount++;
  }

  private scheduleNote(beat: number, time: number) {
    if (!this.currentProject) return;

    const bar = Math.floor(beat / 16);
    const stepInBar = beat % 16; // 16th note step in the current bar
    const chordIndex = bar % this.currentProject.chordProgression.length;
    const currentChord = this.currentProject.chordProgression[chordIndex];

    // 1. DRUMS (Kick, Snare, Hi-hat)
    const drumGain = this.trackGains["drums"];
    if (drumGain && drumGain.gain.value > 0) {
      const pattern = this.currentProject.drumPattern || "electronic";

      // Kick drum (beat 1 and 3, or steps 0, 8, and sometimes 12)
      if (stepInBar === 0 || stepInBar === 8 || (pattern === "hiphop" && stepInBar === 11)) {
        this.playKick(time, drumGain);
      }

      // Snare drum (beat 2 and 4, steps 4 and 12)
      if (stepInBar === 4 || stepInBar === 12) {
        this.playSnare(time, drumGain);
      }

      // Hi-hat (eighth notes, steps 2, 6, 10, 14, or 16th notes in techno)
      if (stepInBar % 2 === 0) {
        const volume = stepInBar % 4 === 0 ? 0.3 : 0.15;
        this.playHiHat(time, volume, drumGain);
      }
    }

    // 2. BASS
    const bassGain = this.trackGains["bass"];
    if (bassGain && bassGain.gain.value > 0) {
      // Determine base note of chord
      const bassNote = this.getChordRootFreq(currentChord);
      
      // Techno bassline: 8th note rhythm
      if (stepInBar % 2 === 0) {
        let pitchMultiplier = 1;
        if (stepInBar % 8 === 2 || stepInBar % 8 === 6) {
          pitchMultiplier = 1.5; // perfect fifth
        }
        this.playSynthNote(time, bassNote * pitchMultiplier * 0.25, 0.12, 0.25, "sawtooth", bassGain);
      }
    }

    // 3. MELODY / SYNTH
    const melodyGain = this.trackGains["melody"];
    if (melodyGain && melodyGain.gain.value > 0) {
      const melodyTheme = this.currentProject.melodicTheme || [];
      const beatPosition = beat / 4; // convert 16th beat to quarter beats
      
      // Find melody notes scheduled at this beat (wrapped to loop duration, say 4 bars = 16 beats)
      const loopBeat = beatPosition % 16;
      const matchedNotes = melodyTheme.filter((n) => Math.abs(n.time - loopBeat) < 0.125);

      matchedNotes.forEach((n) => {
        const freq = this.noteToFreq(n.note);
        if (freq > 0) {
          this.playSynthNote(time, freq, n.duration * (60 / this.currentProject!.tempo), 0.35, "triangle", melodyGain);
        }
      });

      // Ambient Chord Pad: play chord tones softly on step 0
      if (stepInBar === 0) {
        const chordFreqs = this.getChordFreqs(currentChord);
        chordFreqs.forEach((freq) => {
          this.playSynthNote(time, freq * 0.5, 2.5, 0.15, "sine", melodyGain);
        });
      }
    }

    // 4. VOCALS
    const vocalsGain = this.trackGains["vocals"];
    if (vocalsGain && vocalsGain.gain.value > 0) {
      // Simulate singing/vocal pad humming along with chord roots and fifths
      if (stepInBar === 0 || stepInBar === 8) {
        const rootFreq = this.getChordRootFreq(currentChord);
        const pitch = rootFreq; // Hum root chord octave
        this.playVocalSynth(time, pitch, 1.8, 0.3, vocalsGain);
      }
    }

    // 5. FX
    const fxGain = this.trackGains["fx"];
    if (fxGain && fxGain.gain.value > 0) {
      // Play a crash/reverb splash at bar start (step 0 of bar 0, 4, 8)
      if (stepInBar === 0 && bar % 4 === 0) {
        this.playFXCrash(time, fxGain);
      }
      // Play frequency sweep up before major bars (steps 12 to 15 of bar 3, 7)
      if (bar % 4 === 3 && stepInBar === 12) {
        this.playFXSweep(time, fxGain);
      }
    }
  }

  // --- Sound Synthesizers using Web Audio API ---

  private playKick(time: number, outGain: AudioNode) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(outGain);

    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.3);

    gain.gain.setValueAtTime(1.0, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);

    osc.start(time);
    osc.stop(time + 0.35);
  }

  private playSnare(time: number, outGain: AudioNode) {
    if (!this.ctx) return;
    // Low frequency tone
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.frequency.setValueAtTime(180, time);
    osc.connect(oscGain);
    oscGain.connect(outGain);
    oscGain.gain.setValueAtTime(0.3, time);
    oscGain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);

    // White noise for sizzle
    const bufferSize = this.ctx.sampleRate * 0.2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.setValueAtTime(1000, time);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.4, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(outGain);

    osc.start(time);
    osc.stop(time + 0.2);
    noise.start(time);
    noise.stop(time + 0.2);
  }

  private playHiHat(time: number, volume: number, outGain: AudioNode) {
    if (!this.ctx) return;
    // Simulating hihat via bandpassed white noise
    const bufferSize = this.ctx.sampleRate * 0.05;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(10000, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(outGain);

    noise.start(time);
    noise.stop(time + 0.06);
  }

  private playSynthNote(time: number, freq: number, duration: number, volume: number, type: OscillatorType, outGain: AudioNode) {
    if (!this.ctx || freq <= 0) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);
    
    osc.connect(gain);
    gain.connect(outGain);

    // ADSR Envelope
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(volume, time + 0.02); // attack
    gain.gain.setValueAtTime(volume, time + duration - 0.05); // sustain
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration); // release

    osc.start(time);
    osc.stop(time + duration);
  }

  private playVocalSynth(time: number, freq: number, duration: number, volume: number, outGain: AudioNode) {
    if (!this.ctx) return;
    // Complex vocal sound: standard dual oscillator with comb filtering to simulate "ah" or "oh" formants
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    // Detuned sawtooth/triangle oscillators
    osc1.type = "sawtooth";
    osc1.frequency.setValueAtTime(freq, time);
    
    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(freq * 1.01, time); // detune slightly

    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    // Formant frequency for vocal "ah" around 1000Hz
    filter.frequency.setValueAtTime(950, time);
    filter.Q.setValueAtTime(4.0, time);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(outGain);

    // Vocal ADSR
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(volume, time + 0.15); // soft vocal attack
    gain.gain.linearRampToValueAtTime(volume * 0.8, time + duration - 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc1.start(time);
    osc1.stop(time + duration);
    osc2.start(time);
    osc2.stop(time + duration);
  }

  private playFXCrash(time: number, outGain: AudioNode) {
    if (!this.ctx) return;
    // Ambient noise wash
    const bufferSize = this.ctx.sampleRate * 2.0;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.setValueAtTime(2000, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 1.8);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(outGain);

    noise.start(time);
    noise.stop(time + 2.0);
  }

  private playFXSweep(time: number, outGain: AudioNode) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(80, time);
    osc.frequency.exponentialRampToValueAtTime(600, time + 1.0);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(100, time);
    filter.frequency.exponentialRampToValueAtTime(2000, time + 1.0);

    gain.gain.setValueAtTime(0.01, time);
    gain.gain.linearRampToValueAtTime(0.12, time + 0.8);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 1.0);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(outGain);

    osc.start(time);
    osc.stop(time + 1.05);
  }

  // --- Helpers for chord/freq calculations ---

  private getChordRootFreq(chord: string): number {
    const root = chord.replace(/[m|maj|dim|7|sus4]/g, "");
    const baseFreqs: Record<string, number> = {
      C: 130.81, // C3
      "C#": 138.59,
      D: 146.83,
      "D#": 155.56,
      E: 164.81,
      F: 174.61,
      "F#": 185.00,
      G: 196.00,
      "G#": 207.65,
      A: 220.00, // A3
      "A#": 233.08,
      B: 246.94,
    };
    return baseFreqs[root] || 130.81;
  }

  private getChordFreqs(chord: string): number[] {
    const rootFreq = this.getChordRootFreq(chord) * 2; // Octave higher for pad (C4)
    const isMinor = chord.includes("m") && !chord.includes("maj");
    
    // Interval factors: root, minor/major third, fifth
    const thirdFactor = isMinor ? 1.1892 : 1.2599; // Minor 3rd (3 semitones) / Major 3rd (4 semitones)
    const fifthFactor = 1.4983; // Perfect 5th (7 semitones)

    return [rootFreq, rootFreq * thirdFactor, rootFreq * fifthFactor];
  }

  private noteToFreq(note: string): number {
    const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const match = note.match(/^([A-G]#?)(-?\d+)$/);
    if (!match) return 0;
    
    const noteName = match[1];
    const octave = parseInt(match[2], 10);
    const noteIndex = notes.indexOf(noteName);
    
    // Calculate semitones from A4 (440Hz)
    // A4 is index 9, octave 4
    const semitones = noteIndex - 9 + (octave - 4) * 12;
    return 440 * Math.pow(2, semitones / 12);
  }

  // --- Dynamic timeline mixer volume adjustment ---

  public updateTrackVolume(trackId: string, volume: number, isMuted: boolean, isAnySoloed: boolean, isSolo: boolean) {
    const gainNode = this.trackGains[trackId];
    if (gainNode) {
      let targetVolume = volume;
      if (isMuted) {
        targetVolume = 0;
      }
      if (isAnySoloed && !isSolo) {
        targetVolume = 0;
      }
      gainNode.gain.setTargetAtTime(targetVolume, this.ctx ? this.ctx.currentTime : 0, 0.05);
    }
  }

  public updateMasterVolume(volume: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(volume, this.ctx.currentTime, 0.05);
    }
  }

  public stop() {
    this.isPlaying = false;
    
    if (this.schedulerTimer) {
      clearTimeout(this.schedulerTimer);
      this.schedulerTimer = null;
    }
    
    if (this.timeUpdateTimer) {
      clearInterval(this.timeUpdateTimer);
      this.timeUpdateTimer = null;
    }

    if (this.lyriaAudio) {
      this.lyriaAudio.pause();
      this.lyriaAudio = null;
    }

    this.trackGains = {};
  }

  // --- Export offline synth render to actual high-quality WAV ---

  public async exportToWav(project: SongProject): Promise<Blob> {
    const sampleRate = 44100;
    const duration = project.audioUrl ? 30 : 40; // render 30s for clips, 40s for fallbacks
    const numChannels = 2;
    const numSamples = sampleRate * duration;
    
    // Create OfflineAudioContext
    const offlineCtx = new OfflineAudioContext(numChannels, numSamples, sampleRate);
    const masterGain = offlineCtx.createGain();
    masterGain.gain.setValueAtTime(0.8, 0);
    masterGain.connect(offlineCtx.destination);

    // Create gain nodes for each track in the offline context
    const offlineTrackGains: Record<string, GainNode> = {};
    const tracks = ["vocals", "melody", "bass", "drums", "fx"];
    tracks.forEach((tId) => {
      const trackObj = project.tracks.find((t) => t.id === tId);
      const gain = offlineCtx.createGain();
      let targetVolume = trackObj ? trackObj.volume : 0.7;
      if (trackObj?.isMuted) targetVolume = 0;
      const isAnySoloed = project.tracks.some((t) => t.isSolo);
      if (isAnySoloed && trackObj && !trackObj.isSolo) targetVolume = 0;

      gain.gain.setValueAtTime(targetVolume, 0);
      gain.connect(masterGain);
      offlineTrackGains[tId] = gain;
    });

    // Run the scheduler offline
    const totalBeats = Math.floor((duration * project.tempo) / 60);
    const secondsPerBeat = 60.0 / project.tempo;

    // Schedule all synth notes inside the offline context
    for (let beat = 0; beat < totalBeats; beat++) {
      const time = beat * 0.25 * secondsPerBeat;
      const bar = Math.floor(beat / 16);
      const stepInBar = beat % 16;
      const chordIndex = bar % project.chordProgression.length;
      const currentChord = project.chordProgression[chordIndex];

      // Drums
      const drumGain = offlineTrackGains["drums"];
      if (drumGain) {
        const pattern = project.drumPattern || "electronic";
        if (stepInBar === 0 || stepInBar === 8 || (pattern === "hiphop" && stepInBar === 11)) {
          // Offline Kick
          const osc = offlineCtx.createOscillator();
          const gain = offlineCtx.createGain();
          osc.connect(gain); gain.connect(drumGain);
          osc.frequency.setValueAtTime(150, time);
          osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.3);
          gain.gain.setValueAtTime(1.0, time);
          gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);
          osc.start(time); osc.stop(time + 0.35);
        }
        if (stepInBar === 4 || stepInBar === 12) {
          // Offline Snare
          const osc = offlineCtx.createOscillator();
          const oscGain = offlineCtx.createGain();
          osc.frequency.setValueAtTime(180, time);
          osc.connect(oscGain); oscGain.connect(drumGain);
          oscGain.gain.setValueAtTime(0.3, time);
          oscGain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);
          osc.start(time); osc.stop(time + 0.2);

          // White noise snare component
          const bufferSize = sampleRate * 0.2;
          const noiseBuffer = offlineCtx.createBuffer(1, bufferSize, sampleRate);
          const data = noiseBuffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
          const noise = offlineCtx.createBufferSource();
          noise.buffer = noiseBuffer;
          const filter = offlineCtx.createBiquadFilter();
          filter.type = "highpass"; filter.frequency.setValueAtTime(1000, time);
          const noiseGain = offlineCtx.createGain();
          noiseGain.gain.setValueAtTime(0.4, time);
          noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
          noise.connect(filter); filter.connect(noiseGain); noiseGain.connect(drumGain);
          noise.start(time); noise.stop(time + 0.2);
        }
        if (stepInBar % 2 === 0) {
          // Offline Hi-hat
          const bufferSize = sampleRate * 0.05;
          const hhBuffer = offlineCtx.createBuffer(1, bufferSize, sampleRate);
          const data = hhBuffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
          const noise = offlineCtx.createBufferSource();
          noise.buffer = hhBuffer;
          const filter = offlineCtx.createBiquadFilter();
          filter.type = "bandpass"; filter.frequency.setValueAtTime(10000, time);
          const gain = offlineCtx.createGain();
          const vol = stepInBar % 4 === 0 ? 0.3 : 0.15;
          gain.gain.setValueAtTime(vol, time);
          gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
          noise.connect(filter); filter.connect(gain); gain.connect(drumGain);
          noise.start(time); noise.stop(time + 0.06);
        }
      }

      // Bass
      const bassGain = offlineTrackGains["bass"];
      if (bassGain) {
        const bassNote = this.getChordRootFreq(currentChord);
        if (stepInBar % 2 === 0) {
          let multiplier = 1;
          if (stepInBar % 8 === 2 || stepInBar % 8 === 6) multiplier = 1.5;
          const osc = offlineCtx.createOscillator();
          const gain = offlineCtx.createGain();
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(bassNote * multiplier * 0.25, time);
          osc.connect(gain); gain.connect(bassGain);
          gain.gain.setValueAtTime(0, time);
          gain.gain.linearRampToValueAtTime(0.25, time + 0.02);
          gain.gain.setValueAtTime(0.25, time + 0.07);
          gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
          osc.start(time); osc.stop(time + 0.12);
        }
      }

      // Melody
      const melodyGain = offlineTrackGains["melody"];
      if (melodyGain) {
        const melodyTheme = project.melodicTheme || [];
        const beatPosition = beat / 4;
        const loopBeat = beatPosition % 16;
        const matched = melodyTheme.filter((n) => Math.abs(n.time - loopBeat) < 0.125);

        matched.forEach((n) => {
          const freq = this.noteToFreq(n.note);
          if (freq > 0) {
            const osc = offlineCtx.createOscillator();
            const gain = offlineCtx.createGain();
            osc.type = "triangle";
            osc.frequency.setValueAtTime(freq, time);
            osc.connect(gain); gain.connect(melodyGain);
            const noteDur = n.duration * secondsPerBeat;
            gain.gain.setValueAtTime(0, time);
            gain.gain.linearRampToValueAtTime(0.35, time + 0.02);
            gain.gain.setValueAtTime(0.35, time + noteDur - 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, time + noteDur);
            osc.start(time); osc.stop(time + noteDur);
          }
        });

        // Ambient Chord Pad
        if (stepInBar === 0) {
          const freqs = this.getChordFreqs(currentChord);
          freqs.forEach((freq) => {
            const osc = offlineCtx.createOscillator();
            const gain = offlineCtx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(freq * 0.5, time);
            osc.connect(gain); gain.connect(melodyGain);
            gain.gain.setValueAtTime(0, time);
            gain.gain.linearRampToValueAtTime(0.15, time + 0.25);
            gain.gain.setValueAtTime(0.15, time + 2.25);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 2.5);
            osc.start(time); osc.stop(time + 2.5);
          });
        }
      }

      // Vocals pad simulation
      const vocalsGain = offlineTrackGains["vocals"];
      if (vocalsGain && (stepInBar === 0 || stepInBar === 8)) {
        const rootFreq = this.getChordRootFreq(currentChord);
        const osc1 = offlineCtx.createOscillator();
        const osc2 = offlineCtx.createOscillator();
        const gain = offlineCtx.createGain();
        osc1.type = "sawtooth"; osc1.frequency.setValueAtTime(rootFreq, time);
        osc2.type = "triangle"; osc2.frequency.setValueAtTime(rootFreq * 1.01, time);
        const filter = offlineCtx.createBiquadFilter();
        filter.type = "bandpass"; filter.frequency.setValueAtTime(950, time); filter.Q.setValueAtTime(4.0, time);
        osc1.connect(filter); osc2.connect(filter); filter.connect(gain); gain.connect(vocalsGain);
        
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.3, time + 0.15);
        gain.gain.linearRampToValueAtTime(0.24, time + 1.6);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 1.8);
        osc1.start(time); osc1.stop(time + 1.8);
        osc2.start(time); osc2.stop(time + 1.8);
      }

      // FX
      const fxGain = offlineTrackGains["fx"];
      if (fxGain) {
        if (stepInBar === 0 && bar % 4 === 0) {
          const noiseBuffer = offlineCtx.createBuffer(1, sampleRate * 2.0, sampleRate);
          const data = noiseBuffer.getChannelData(0);
          for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
          const noise = offlineCtx.createBufferSource();
          noise.buffer = noiseBuffer;
          const filter = offlineCtx.createBiquadFilter();
          filter.type = "highpass"; filter.frequency.setValueAtTime(2000, time);
          const gain = offlineCtx.createGain();
          gain.gain.setValueAtTime(0.3, time);
          gain.gain.exponentialRampToValueAtTime(0.001, time + 1.8);
          noise.connect(filter); filter.connect(gain); gain.connect(fxGain);
          noise.start(time); noise.stop(time + 2.0);
        }
        if (bar % 4 === 3 && stepInBar === 12) {
          const osc = offlineCtx.createOscillator();
          const gain = offlineCtx.createGain();
          const filter = offlineCtx.createBiquadFilter();
          osc.type = "sawtooth"; osc.frequency.setValueAtTime(80, time); osc.frequency.exponentialRampToValueAtTime(600, time + 1.0);
          filter.type = "lowpass"; filter.frequency.setValueAtTime(100, time); filter.frequency.exponentialRampToValueAtTime(2000, time + 1.0);
          gain.gain.setValueAtTime(0.01, time);
          gain.gain.linearRampToValueAtTime(0.12, time + 0.8);
          gain.gain.exponentialRampToValueAtTime(0.001, time + 1.0);
          osc.connect(filter); filter.connect(gain); gain.connect(fxGain);
          osc.start(time); osc.stop(time + 1.05);
        }
      }
    }

    // Perform the offline render
    const renderedBuffer = await offlineCtx.startRendering();
    
    // Encode the AudioBuffer into a WAV Blob
    return this.encodeWAV(renderedBuffer);
  }

  private encodeWAV(audioBuffer: AudioBuffer): Blob {
    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    
    let result;
    if (numChannels === 2) {
      result = this.interleave(audioBuffer.getChannelData(0), audioBuffer.getChannelData(1));
    } else {
      result = audioBuffer.getChannelData(0);
    }
    
    const buffer = new ArrayBuffer(44 + result.length * 2);
    const view = new DataView(buffer);
    
    // RIFF identifier
    this.writeString(view, 0, "RIFF");
    // file length
    view.setUint32(4, 36 + result.length * 2, true);
    // RIFF type
    this.writeString(view, 8, "WAVE");
    // format chunk identifier
    this.writeString(view, 12, "fmt ");
    // format chunk length
    view.setUint32(16, 16, true);
    // sample format (raw)
    view.setUint16(20, format, true);
    // channel count
    view.setUint16(22, numChannels, true);
    // sample rate
    view.setUint32(24, sampleRate, true);
    // byte rate (sample rate * block align)
    view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true);
    // block align (channel count * bytes per sample)
    view.setUint16(32, numChannels * (bitDepth / 8), true);
    // bits per sample
    view.setUint16(34, bitDepth, true);
    // data chunk identifier
    this.writeString(view, 36, "data");
    // data chunk length
    view.setUint32(40, result.length * 2, true);
    
    // Write PCM audio data
    let offset = 44;
    for (let i = 0; i < result.length; i++, offset += 2) {
      const s = Math.max(-1, Math.min(1, result[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    
    return new Blob([view], { type: "audio/wav" });
  }

  private interleave(inputL: Float32Array, inputR: Float32Array): Float32Array {
    const length = inputL.length + inputR.length;
    const result = new Float32Array(length);
    let index = 0;
    let inputIndex = 0;
    
    while (index < length) {
      result[index++] = inputL[inputIndex];
      result[index++] = inputR[inputIndex];
      inputIndex++;
    }
    return result;
  }

  private writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }
}

export const audioSynth = new AudioEngine();
