import {test} from 'node:test';import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';import {readFileSync} from 'node:fs';import {cloudflareRequest,createCloudflareWorker} from './cloudflare.js';
const worker=createCloudflareWorker();
test('Cloudflare routes same-origin APIs before SPA assets and does not expose profiles',async()=>{
 let assets=0;const env={ASSETS:{fetch:async()=>{assets++;return new Response('app');}}};
 const status=await worker.fetch(new Request('https://app.example/api/ai-status'),env);assert.equal((await status.json()).ready,false);
 const missing=await worker.fetch(new Request('https://app.example/api/people'),env);assert.equal(missing.status,404);assert.equal(assets,0);
 assert.equal(await (await worker.fetch(new Request('https://app.example/'),env)).text(),'app');assert.equal(assets,1);
});
test('Public standalone entry strips spoofed Sites identity but retains Cloudflare edge IP',()=>{
 const r=cloudflareRequest(new Request('https://app.example/api/ai-status',{headers:{'oai-authenticated-user-id':'spoof','oai-authenticated-user-email':'private','CF-Connecting-IP':'192.0.2.1'}}));assert.equal(r.headers.get('oai-authenticated-user-id'),null);assert.equal(r.headers.get('oai-authenticated-user-email'),null);assert.equal(r.headers.get('CF-Connecting-IP'),'192.0.2.1');
});
test('Public AI stays off without configuration, with sanitized status and same-origin enforcement',async()=>{
 const env={AI_API_KEY:'test-secret-placeholder',AI_RATE_SALT:'test-salt'};const r=await worker.fetch(new Request('https://app.example/api/ai-status'),env);const body=await r.text();assert.ok(!body.includes('test-secret-placeholder'));assert.ok(!body.includes('test-salt'));
 const req=new Request('https://app.example/api/parse-records',{method:'POST',headers:{origin:'https://app.example','content-type':'application/json'},body:'{}'});const off=await worker.fetch(req,env);assert.equal(off.status,503);assert.equal((await off.json()).error.code,'AI_DISABLED');
 const cross=await worker.fetch(new Request('https://app.example/api/parse-records',{method:'POST',headers:{origin:'https://evil.example','content-type':'application/json'},body:'{}'}),{});assert.equal(cross.status,403);
});
test('Existing single-table migration can be applied twice without losing a counter',()=>{
 const db=new DatabaseSync(':memory:');const sql=readFileSync(new URL('../drizzle/0000_ai_quota.sql',import.meta.url),'utf8');db.exec(sql);db.exec("INSERT INTO ai_quota VALUES ('test', 3, 999)");db.exec(sql);assert.equal(db.prepare("SELECT used FROM ai_quota WHERE key='test'").get().used,3);db.close();
});
test('Wrangler config serves public static assets and keeps APIs outside SPA fallback',()=>{
 const c=JSON.parse(readFileSync(new URL('../wrangler.jsonc',import.meta.url),'utf8'));assert.equal(c.main,'server/cloudflare.js');assert.equal(c.workers_dev,true);assert.equal(c.assets.binding,'ASSETS');assert.equal(c.assets.directory,'./dist/client');assert.deepEqual(c.assets.run_worker_first,['/api','/api/*']);assert.equal(c.keep_vars,true);assert.ok(!c.vars?.AI_API_KEY);assert.ok(!c.vars?.AI_ENABLED);
});
