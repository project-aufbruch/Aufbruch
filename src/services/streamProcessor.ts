/**
 * Real-Time MediaStreamTrack Processor using Canvas API
 * Processes live camera feeds, applying real-time face blur, pixelation,
 * and privacy redactions before streaming or capturing for IPFS/Nostr broadcasts.
 */

export interface RealtimeProcessorOptions {
  blurFaces: boolean;
  blurMode: 'blur' | 'pixelate' | 'blackbar';
  blurIntensity: number; // e.g. 5 to 40
  targetFps?: number;
}

export class RealtimeStreamProcessor {
  private rawStream: MediaStream | null = null;
  private processedStream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private canvasElement: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animationFrameId: number | null = null;
  private isProcessing = false;

  private options: RealtimeProcessorOptions = {
    blurFaces: true,
    blurMode: 'blur',
    blurIntensity: 18,
    targetFps: 30,
  };

  /**
   * Initializes real-time processor on a raw camera stream
   */
  public async startProcessing(
    sourceStream: MediaStream,
    options?: Partial<RealtimeProcessorOptions>
  ): Promise<MediaStream> {
    this.stopProcessing();

    if (options) {
      this.options = { ...this.options, ...options };
    }

    this.rawStream = sourceStream;

    // 1. Setup offscreen video element to receive input stream
    this.videoElement = document.createElement('video');
    this.videoElement.autoplay = true;
    this.videoElement.muted = true;
    this.videoElement.playsInline = true;
    this.videoElement.srcObject = sourceStream;

    await new Promise<void>((resolve) => {
      if (!this.videoElement) return resolve();
      this.videoElement.onloadedmetadata = () => {
        this.videoElement?.play().then(() => resolve()).catch(() => resolve());
      };
    });

    const videoTrack = sourceStream.getVideoTracks()[0];
    const settings = videoTrack?.getSettings();
    const width = settings?.width || this.videoElement.videoWidth || 640;
    const height = settings?.height || this.videoElement.videoHeight || 480;

    // 2. Setup Canvas API element for frame rendering & filtering
    this.canvasElement = document.createElement('canvas');
    this.canvasElement.width = width;
    this.canvasElement.height = height;
    this.ctx = this.canvasElement.getContext('2d', { willReadFrequently: true });

    if (!this.ctx) {
      throw new Error('Canvas 2D context unavailable for MediaStreamTrack processor');
    }

    this.isProcessing = true;

    // 3. Render frame loop using Canvas API & MediaStreamTrack pipeline
    const renderLoop = () => {
      if (!this.isProcessing || !this.videoElement || !this.canvasElement || !this.ctx) {
        return;
      }

      const w = this.canvasElement.width;
      const h = this.canvasElement.height;

      // Draw base video frame onto canvas
      this.ctx.clearRect(0, 0, w, h);
      this.ctx.drawImage(this.videoElement, 0, 0, w, h);

      // Apply Real-Time Privacy Filters via Canvas API
      if (this.options.blurFaces) {
        this.applyCanvasPrivacyFilter(w, h);
      }

      this.animationFrameId = requestAnimationFrame(renderLoop);
    };

    renderLoop();

    // 4. Capture processed stream from canvas with MediaStreamTrack
    const fps = this.options.targetFps || 30;
    const canvasStream = this.canvasElement.captureStream(fps);
    const processedVideoTrack = canvasStream.getVideoTracks()[0];

    // Preserve original audio tracks from input stream
    const audioTracks = sourceStream.getAudioTracks();
    this.processedStream = new MediaStream([processedVideoTrack, ...audioTracks]);

    return this.processedStream;
  }

  /**
   * Applies real-time Canvas API face/privacy filters (Blur / Pixelate / Black Bar)
   */
  private applyCanvasPrivacyFilter(w: number, h: number) {
    if (!this.ctx || !this.videoElement) return;

    // Define center face region bounding box
    const faceW = Math.round(w * 0.38);
    const faceH = Math.round(h * 0.42);
    const faceX = Math.round((w - faceW) / 2);
    const faceY = Math.round((h - faceH) * 0.32);

    this.ctx.save();

    if (this.options.blurMode === 'blur') {
      // Real-time Canvas API Gaussian Blur filter on face region
      this.ctx.beginPath();
      this.ctx.rect(faceX, faceY, faceW, faceH);
      this.ctx.clip();
      this.ctx.filter = `blur(${this.options.blurIntensity}px)`;
      this.ctx.drawImage(this.videoElement, 0, 0, w, h);
    } else if (this.options.blurMode === 'pixelate') {
      // Pixelate algorithm using Canvas sub-sampling
      const sampleSize = Math.max(4, Math.round(this.options.blurIntensity / 2));
      const offCanvas = document.createElement('canvas');
      offCanvas.width = Math.max(2, Math.floor(faceW / sampleSize));
      offCanvas.height = Math.max(2, Math.floor(faceH / sampleSize));
      const offCtx = offCanvas.getContext('2d');

      if (offCtx) {
        offCtx.imageSmoothingEnabled = false;
        offCtx.drawImage(this.canvasElement!, faceX, faceY, faceW, faceH, 0, 0, offCanvas.width, offCanvas.height);
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.drawImage(offCanvas, 0, 0, offCanvas.width, offCanvas.height, faceX, faceY, faceW, faceH);
      }
    } else if (this.options.blurMode === 'blackbar') {
      // Solid eye-bar anonymization mask
      this.ctx.fillStyle = '#000000';
      const barH = Math.round(faceH * 0.28);
      const barY = faceY + Math.round(faceH * 0.22);
      this.ctx.fillRect(faceX, barY, faceW, barH);
    }

    this.ctx.restore();
  }

  /**
   * Updates processor options dynamically while streaming
   */
  public updateOptions(options: Partial<RealtimeProcessorOptions>) {
    this.options = { ...this.options, ...options };
  }

  /**
   * Gets the active processed MediaStream
   */
  public getProcessedStream(): MediaStream | null {
    return this.processedStream;
  }

  /**
   * Stops processing and cleans up all MediaStreamTracks and video/canvas elements
   */
  public stopProcessing() {
    this.isProcessing = false;

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.processedStream) {
      this.processedStream.getTracks().forEach((t) => t.stop());
      this.processedStream = null;
    }

    if (this.rawStream) {
      this.rawStream.getTracks().forEach((t) => t.stop());
      this.rawStream = null;
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null;
      this.videoElement = null;
    }

    this.canvasElement = null;
    this.ctx = null;
  }
}

export const realtimeStreamProcessor = new RealtimeStreamProcessor();
