import {test} from 'node:test';
import assert from 'node:assert/strict';
import {onRequest} from '../functions/api/[[path]].js';
test('Pages API uses existing disabled-by-default handler and rejects cross-origin requests',async()=>{
 const base='https://remember-you-access.pages.dev';
 const status=await onRequest({request:new Request(base+'/api/ai-status'),env:{}});
 assert.equal((await status.json()).ready,false);
 const missing=await onRequest({request:new Request(base+'/api/people'),env:{}});
 assert.equal(missing.status,404);
 for(const [origin,expected] of [[base,503],['https://other.example',403]]) {
  const r=await onRequest({request:new Request(base+'/api/parse-records',{method:'POST',headers:{origin,'content-type':'application/json'},body:'{}'}),env:{}});
  assert.equal(r.status,expected);
 }
});
