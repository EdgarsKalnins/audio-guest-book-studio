/**
 * Sequential FIFO Batch Export Queue Manager (Roadmap #01)
 * Strict Concurrency = 1 protects GPU & system memory, ensures zero memory leaks,
 * and provides fault-tolerant batch rendering across 50–100+ wedding audio files.
 */
import { BatchExportJob } from '../types/studio';

export type JobRenderHandler = (
  job: BatchExportJob,
  onProgress: (percent: number, statusText?: string) => void
) => Promise<string>;

export class BatchQueueManager {
  private jobs: BatchExportJob[] = [];
  private isRunning = false;
  private isCancelled = false;
  private activeCancelCallback: (() => void) | null = null;

  constructor(initialJobs: BatchExportJob[] = []) {
    this.jobs = [...initialJobs];
  }

  public setJobs(jobs: BatchExportJob[]): void {
    this.jobs = [...jobs];
  }

  public getJobs(): BatchExportJob[] {
    return [...this.jobs];
  }

  public addJob(job: Omit<BatchExportJob, 'status' | 'progress'>): BatchExportJob {
    const fullJob: BatchExportJob = {
      ...job,
      status: 'idle',
      progress: 0,
    };
    this.jobs.push(fullJob);
    return fullJob;
  }

  public removeJob(fileId: string): void {
    if (this.isRunning) {
      const idx = this.jobs.findIndex((j) => j.fileId === fileId);
      if (idx !== -1 && this.jobs[idx].status === 'rendering') {
        throw new Error('Cannot remove an active rendering job');
      }
    }
    this.jobs = this.jobs.filter((j) => j.fileId !== fileId);
  }

  public clear(): void {
    if (this.isRunning) {
      this.cancel();
    }
    this.jobs = [];
  }

  public cancel(): void {
    this.isCancelled = true;
    if (this.activeCancelCallback) {
      this.activeCancelCallback();
      this.activeCancelCallback = null;
    }
  }

  public getIsRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Sanitizes output file destination path.
   */
  public static sanitizeOutputName(
    originalFileName: string,
    outputDirectory: string,
    extension = 'mp4'
  ): string {
    const baseName = originalFileName
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9_\- ]/g, '_')
      .trim();
    const cleanDir = outputDirectory.replace(/[\\/]+$/, '');
    return `${cleanDir}/${baseName}_visualizer.${extension}`;
  }

  /**
   * Processes all pending jobs sequentially with concurrency = 1.
   * If any single file fails or is corrupted, it logs the error, marks the item as 'error',
   * and continues processing the remaining jobs in the batch.
   */
  public async processQueue(
    renderHandler: JobRenderHandler,
    onJobUpdate?: (job: BatchExportJob, index: number, total: number) => void
  ): Promise<BatchExportJob[]> {
    if (this.isRunning) {
      throw new Error('Batch queue is already running');
    }

    this.isRunning = true;
    this.isCancelled = false;

    try {
      const total = this.jobs.length;

      for (let i = 0; i < total; i++) {
        if (this.isCancelled) {
          break;
        }

        const job = this.jobs[i];

        // Skip completed or previously errored jobs
        if (job.status === 'done') {
          continue;
        }

        job.status = 'rendering';
        job.progress = 0;
        onJobUpdate?.(job, i, total);

        try {
          const finalOutputPath = await renderHandler(job, (pct) => {
            job.progress = Math.max(0, Math.min(100, Math.round(pct)));
            onJobUpdate?.(job, i, total);
          });

          job.status = 'done';
          job.progress = 100;
          job.outputPath = finalOutputPath;
          onJobUpdate?.(job, i, total);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          console.warn(`[BatchQueue] Job ${job.fileName} failed:`, msg);

          if (this.isCancelled) {
            job.status = 'idle';
            job.error = 'Cancelled by user';
          } else {
            job.status = 'error';
            job.error = msg;
          }

          onJobUpdate?.(job, i, total);
        }
      }

      return [...this.jobs];
    } finally {
      this.isRunning = false;
      this.isCancelled = false;
      this.activeCancelCallback = null;
    }
  }
}
