import {handleApi} from '../../server/worker.js';
import {cloudflareRequest} from '../../server/cloudflare.js';

// Run the existing guarded API on pages.dev itself; never redirect browsers to workers.dev.
export function onRequest({request, env}) {
  return handleApi(cloudflareRequest(request), env);
}
