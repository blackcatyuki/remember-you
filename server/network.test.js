import {test} from 'node:test';import assert from 'node:assert/strict';import {verifyFreeModel,FREE_MODEL} from './free-policy.js';import {providerJSON} from './ai.js';
test('Workers-compatible manual redirects reject catalog or keyed upstream redirects without following',async()=>{
 const env={AI_API_KEY:'unit-test-placeholder',AI_TEXT_MODEL:FREE_MODEL,AI_FREE_ONLY:'true',AI_FREE_KEY_RESTRICTED:'true',AI_FREE_REVIEW_UNTIL:new Date(Date.now()+3600000).toISOString()};let calls=0;
 const redirect=async(url,options)=>{calls++;assert.equal(options.redirect,'manual');return new Response('',{status:302,headers:{location:'https://other.example'}});};
 await assert.rejects(verifyFreeModel(env,redirect),e=>e.code==='FREE_MODEL_STOPPED');assert.equal(calls,1);calls=0;await assert.rejects(providerJSON(env,{system:'test',data:{}},redirect),e=>e.code==='UPSTREAM_ERROR');assert.equal(calls,1);
});
