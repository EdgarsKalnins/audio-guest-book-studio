import { describe, it, expect } from 'vitest';
import { BatchQueueManager } from '../src/engine/batchExporter';

describe('BatchQueueManager (Roadmap #01)', () => {
  it('processes jobs strictly sequentially with concurrency = 1', async () => {
    const queue = new BatchQueueManager();

    queue.addJob({
      fileId: 'job-1',
      fileName: 'guest_01.wav',
      inputPath: '/sdcard/guest_01.wav',
      outputPath: '/export/guest_01_visualizer.mp4',
    });

    queue.addJob({
      fileId: 'job-2',
      fileName: 'guest_02.wav',
      inputPath: '/sdcard/guest_02.wav',
      outputPath: '/export/guest_02_visualizer.mp4',
    });

    const executionLog: string[] = [];

    const results = await queue.processQueue(async (job, onProgress) => {
      executionLog.push(`start:${job.fileId}`);
      onProgress(50);
      onProgress(100);
      executionLog.push(`end:${job.fileId}`);
      return job.outputPath;
    });

    expect(executionLog).toEqual([
      'start:job-1',
      'end:job-1',
      'start:job-2',
      'end:job-2',
    ]);

    expect(results.length).toBe(2);
    expect(results[0].status).toBe('done');
    expect(results[0].progress).toBe(100);
    expect(results[1].status).toBe('done');
    expect(results[1].progress).toBe(100);
  });

  it('tolerates individual file failures without terminating remaining jobs in the batch', async () => {
    const queue = new BatchQueueManager();

    queue.addJob({
      fileId: 'job-ok-1',
      fileName: 'good_recording.wav',
      inputPath: '/sdcard/good_recording.wav',
      outputPath: '/export/good_1.mp4',
    });

    queue.addJob({
      fileId: 'job-corrupt-2',
      fileName: 'corrupted_file.wav',
      inputPath: '/sdcard/corrupted_file.wav',
      outputPath: '/export/corrupt_2.mp4',
    });

    queue.addJob({
      fileId: 'job-ok-3',
      fileName: 'another_good.wav',
      inputPath: '/sdcard/another_good.wav',
      outputPath: '/export/good_3.mp4',
    });

    const results = await queue.processQueue(async (job) => {
      if (job.fileId === 'job-corrupt-2') {
        throw new Error('Unreadable audio header or corrupted PCM data');
      }
      return job.outputPath;
    });

    expect(results.length).toBe(3);
    // First should succeed
    expect(results[0].status).toBe('done');
    // Second should be marked error with message
    expect(results[1].status).toBe('error');
    expect(results[1].error).toContain('Unreadable audio header');
    // Third should still execute and succeed!
    expect(results[2].status).toBe('done');
  });

  it('sanitizes output filenames cleanly across platforms', () => {
    const out1 = BatchQueueManager.sanitizeOutputName(
      'Sarah & Michael / #1 (Wedding).wav',
      '/Users/edgars/Movies'
    );
    expect(out1).toBe('/Users/edgars/Movies/Sarah _ Michael _ _1 _Wedding__visualizer.mp4');

    const out2 = BatchQueueManager.sanitizeOutputName(
      'guest-message.mp3',
      '/Volumes/SDCard/Exports/',
      'mov'
    );
    expect(out2).toBe('/Volumes/SDCard/Exports/guest-message_visualizer.mov');
  });

  it('supports graceful queue cancellation', async () => {
    const queue = new BatchQueueManager();

    queue.addJob({
      fileId: 'job-1',
      fileName: 'track_1.wav',
      inputPath: '/t1.wav',
      outputPath: '/out1.mp4',
    });
    queue.addJob({
      fileId: 'job-2',
      fileName: 'track_2.wav',
      inputPath: '/t2.wav',
      outputPath: '/out2.mp4',
    });

    let renderedCount = 0;
    const processPromise = queue.processQueue(async () => {
      renderedCount++;
      queue.cancel(); // Cancel immediately during job 1
      return 'out.mp4';
    });

    const results = await processPromise;
    expect(renderedCount).toBe(1);
    expect(results[0].status).toBe('done');
    expect(results[1].status).toBe('idle'); // 2nd job was not run
  });
});
