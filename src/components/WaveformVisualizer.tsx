/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from "react";

interface WaveformVisualizerProps {
  id: string;
  color: string;
  isPlaying: boolean;
  progress: number; // 0 to 1
  height?: number;
}

export function WaveformVisualizer({
  id,
  color,
  isPlaying,
  progress,
  height = 40,
}: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dataPointsRef = useRef<number[]>([]);

  // Generate deterministic pseudo-random waveform peaks once on mount
  useEffect(() => {
    const count = 75;
    const points: number[] = [];
    let seed = id.charCodeAt(0) || 42;
    for (let i = 0; i < count; i++) {
      // Linear congruential generator for stable pseudo-random waveforms
      seed = (seed * 9301 + 49297) % 233280;
      const val = 0.15 + (seed / 233280) * 0.85;
      points.push(val);
    }
    dataPointsRef.current = points;
  }, [id]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = height;

    // Draw routine
    ctx.clearRect(0, 0, w, h);

    const points = dataPointsRef.current;
    if (points.length === 0) return;

    const gap = 2;
    const barWidth = (w - gap * (points.length - 1)) / points.length;

    points.forEach((peak, index) => {
      const x = index * (barWidth + gap);
      const barHeight = peak * h * 0.85;
      const y = (h - barHeight) / 2;

      // Determine color based on playback progress
      const isPlayed = index / points.length <= progress;

      if (isPlayed) {
        ctx.fillStyle = color;
      } else {
        ctx.fillStyle = "rgba(100, 116, 139, 0.25)"; // slate dark-grey muted
      }

      // Draw rounded rectangle
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, 2);
      ctx.fill();
    });
  }, [progress, color, height, id]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full block bg-transparent"
      style={{ height: `${height}px` }}
      id={`waveform-canvas-${id}`}
    />
  );
}
