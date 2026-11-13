// Standalone Workers entrypoint. Existing Sites entrypoint remains unchanged.
import {handleApi} from './worker.js';

export function cloudflareRequest(request) {
  const headers = new Headers(request.headers);
  // Sites identity headers are not trusted on a public workers.dev endpoint.
  for (const name of Array.from(headers.keys())) {
    if (name.toLowerCase().startsWith('oai-')) headers.delete(name);
  }
  return new Request(request, {headers});
}

export function createCloudflareWorker(api = handleApi) {
  return {
    async fetch(request, env) {
      const pathname = new URL(request.url).pathname;
      if (pathname === '/api' || pathname.startsWith('/api/')) {
        return api(cloudflareRequest(request), env);
      }
      // Static Assets normally serves these before invoking the script.
      if (!env.ASSETS) return new Response('Assets not configured', {status:503});
      return env.ASSETS.fetch(request);
    }
  };
}

export default createCloudflareWorker();
