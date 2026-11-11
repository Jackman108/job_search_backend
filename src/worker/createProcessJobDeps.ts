import type { ProcessJobDeps } from '@market-hunter/hh-worker/job';
import { broadcast } from '@server';
import { incrementSpinCount, updateSuccessfulResponsesCount } from '@services';

/** API composition root: wire `@services` counters + `@server` broadcast into hh-worker ports. */
export function createProcessJobDeps(): ProcessJobDeps {
    return {
        counters: {
            incrementSpinCount,
            updateSuccessfulResponsesCount,
        },
        broadcast: {
            broadcast,
        },
    };
}
