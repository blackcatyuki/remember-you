import {test} from 'node:test';
import assert from 'node:assert/strict';
import {providerJSON} from './ai.js';
import {verifyFreeModel,FREE_MODEL} from './free-policy.js';
import {handleApi} from './worker.js';
const env={AI_API_KEY:'test-placeholder',AI_TEXT_MODEL:FREE_MODEL,AI_FREE_ONLY:'true',AI_FREE_KEY_RESTRICTED:'true',AI_FREE_REVIEW_UNTIL:new Date(Date.now()+3600000).toISOString()};
const timeout=()=>Object.assign(new Error('private details'),{name:'TimeoutError'});
test('Scope and generation use independent deadlines; generation is not retried',async()=>{
 const signals=[];let calls=0;
 await assert.rejects(()=>providerJSON(env,{system:'test',data:{}},async(url,init)=>{
  signals.push(init.signal);calls++;
  if(url.endsWith('/models'))return Response.json({data:[{id:FREE_MODEL}]});
  throw timeout();
 }),e=>e.code==='COMPLETION_TIMEOUT'&&e.status===504&&!e.message.includes('private'));
 assert.equal(calls,2);assert.notEqual(signals[0],signals[1]);
});
test('Scope timeout is distinct and never sends generation',async()=>{
 let calls=0;await assert.rejects(()=>providerJSON(env,{system:'test',data:{}},async()=>{calls++;throw timeout();}),e=>e.code==='MODEL_LIST_TIMEOUT');assert.equal(calls,1);
});
test('Price catalog network, timeout and HTTP failures are distinct and never cached as free',async()=>{
 for(const [fetcher,code] of [[async()=>{throw timeout();},'FREE_CATALOG_TIMEOUT'],[async()=>{throw Error('secret');},'FREE_CATALOG_UNREACHABLE'],[async()=>new Response('secret',{status:503}),'FREE_MODEL_STOPPED']])await assert.rejects(()=>verifyFreeModel(env,fetcher),e=>e.code===code&&!e.message.includes('secret'));
});
test('Public diagnostics identify revision without exposing configuration values',async()=>{
 const r=await handleApi(new Request('https://test.example/api/ai-status'),{});
 assert.equal(r.headers.get('x-ai-revision'),'stages-v1');assert.match(r.headers.get('server-timing'),/total;dur=/);
});
