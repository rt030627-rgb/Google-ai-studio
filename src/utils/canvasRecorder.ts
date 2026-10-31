/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface RecorderOptions {
  fps?: number;
  durationSeconds?: number;
  onProgress?: (elapsedMs: number, maxMs: number) => void;
  onComplete?: (blob: Blob, url: string) => void;
  onError?: (err: Error) => void;
}

export type SupportedVideoMime = 'video/webm;codecs=vp9' | 'video/webm;codecs=vp8' | 'video/webm' | 'video/mp4';

/**
 * Finds the best supported video mime type in the current browser
 */
export function getSupportedVideoMimeType(): string {
  if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') {
    return 'video/webm';
  }

  const preferredTypes: SupportedVideoMime[] = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
    'video/mp4',
  ];

  for (const mime of preferredTypes) {
    if (MediaRecorder.isTypeSupported(mime)) {
      return mime;
    }
  }

  return 'video/webm';
}

/**
 * Checks if browser canvas recording is supported
 */
export function isCanvasRecordingSupported(): boolean {
  if (typeof window === 'undefined') return false;
  const testCanvas = document.createElement('canvas');
  return (
    typeof testCanvas.captureStream === 'function' &&
    typeof window.MediaRecorder !== 'undefined'
  );
}

export class CanvasVideoRecorder {
  private canvas: HTMLCanvasElement;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private isRecording: boolean = false;
  private startTime: number = 0;
  private progressInterval: number | null = null;
  private autoStopTimeout: number | null = null;

  private defaultOptions: RecorderOptions;

  constructor(canvas: HTMLCanvasElement, defaultOptions: RecorderOptions = {}) {
    this.canvas = canvas;
    this.defaultOptions = defaultOptions;
  }

  public get active(): boolean {
    return this.isRecording;
  }

  public start(options: RecorderOptions = {}): boolean {
    if (this.isRecording) return false;
    if (!isCanvasRecordingSupported()) {
      options.onError?.(new Error('MediaRecorder or canvas.captureStream not supported in this browser'));
      return false;
    }

    const mergedOptions = { ...this.defaultOptions, ...options };

    try {
      const fps = mergedOptions.fps || 60;
      const stream = this.canvas.captureStream(fps);
      const mimeType = getSupportedVideoMimeType();

      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 8000000, // 8 Mbps high quality
      });

      this.recordedChunks = [];
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        this.cleanUpTimers();
        this.isRecording = false;

        const blob = new Blob(this.recordedChunks, { type: mimeType });
        const videoUrl = URL.createObjectURL(blob);
        mergedOptions.onComplete?.(blob, videoUrl);
      };

      this.mediaRecorder.start(250); // Emit chunks every 250ms
      this.isRecording = true;
      this.startTime = Date.now();

      const durationMs = (mergedOptions.durationSeconds || 10) * 1000;

      // Progress reporting ticker
      this.progressInterval = window.setInterval(() => {
        const elapsed = Date.now() - this.startTime;
        mergedOptions.onProgress?.(elapsed, durationMs);
      }, 100);

      // Auto stop after duration
      this.autoStopTimeout = window.setTimeout(() => {
        this.stop();
      }, durationMs);

      return true;
    } catch (err) {
      this.isRecording = false;
      this.cleanUpTimers();
      mergedOptions.onError?.(err instanceof Error ? err : new Error(String(err)));
      return false;
    }
  }

  public async stop(): Promise<Blob | null> {
    if (!this.isRecording || !this.mediaRecorder) return null;
    return new Promise((resolve) => {
      const mr = this.mediaRecorder;
      if (mr) {
        const existingOnStop = mr.onstop;
        mr.onstop = (ev) => {
          if (existingOnStop) existingOnStop.call(mr, ev);
          const mimeType = mr.mimeType || getSupportedVideoMimeType();
          const blob = new Blob(this.recordedChunks, { type: mimeType });
          resolve(blob);
        };

        try {
          if (mr.state !== 'inactive') {
            mr.stop();
          } else {
            resolve(null);
          }
        } catch {
          resolve(null);
        }
      } else {
        resolve(null);
      }
      this.cleanUpTimers();
    });
  }

  public downloadRecording(filename: string, blob?: Blob): void {
    const targetBlob = blob || new Blob(this.recordedChunks, { type: getSupportedVideoMimeType() });
    const url = URL.createObjectURL(targetBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  private cleanUpTimers(): void {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
    if (this.autoStopTimeout) {
      clearTimeout(this.autoStopTimeout);
      this.autoStopTimeout = null;
    }
  }
}

/**
 * Formats recording timer text into standard retro camcorder format (MM:SS:CC)
 */
export function formatCamcorderTime(elapsedMs: number): string {
  const totalSeconds = Math.floor(elapsedMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const centiseconds = Math.floor((elapsedMs % 1000) / 10);

  const pad = (n: number, len: number = 2) => String(n).padStart(len, '0');
  return `${pad(minutes)}:${pad(seconds)}:${pad(centiseconds)}`;
}
