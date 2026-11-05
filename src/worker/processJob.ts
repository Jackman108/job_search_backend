import { getFeedback, sendFeedback } from '@run';
import { incrementSpinCount, updateSuccessfulResponsesCount } from '@services';
import { readJob, updateJob } from './jobStore.js';

export async function processJob(id: string): Promise<void> {
  const job = readJob(id);
  if (!job) throw new Error(`job not found: ${id}`);

  updateJob(id, {
    status: 'running',
    startedAt: new Date().toISOString(),
  } as Partial<typeof job>);

  try {
    if (job.kind === 'sendFeedback') {
      await sendFeedback(job.payload);
      await incrementSpinCount(job.userId);
      await updateSuccessfulResponsesCount(job.userId);
      updateJob(id, {
        status: 'done',
        finishedAt: new Date().toISOString(),
        countersUpdated: true,
      } as Partial<typeof job>);
    } else {
      await getFeedback(job.payload);
      updateJob(id, {
        status: 'done',
        finishedAt: new Date().toISOString(),
      } as Partial<typeof job>);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    updateJob(id, {
      status: 'error',
      finishedAt: new Date().toISOString(),
      error: message,
    } as Partial<typeof job>);
    throw err;
  }
}
