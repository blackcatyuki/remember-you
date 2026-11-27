import {test} from 'node:test';import assert from 'node:assert/strict';
import {parseBackup,mergeBackup,importSummary} from './backup.js';import {demoState} from './demo.js';import {loadState,saveState,KEY} from './storage.js';
test('normal and raw exports restore records, categories and favorites without overwriting conflicts',()=>{
 const original=demoState();original.saved[original.people[0].id]=[{id:'book',name:'手账',reason:'阅读',caution:'确认尺寸',budget:[10,50],tags:['阅读']}];
 const imported=parseBackup(JSON.stringify({...original,exportedAt:new Date().toISOString()}));assert.equal(importSummary(original,imported).conflicts.length,1);
 const before=JSON.stringify(original),result=mergeBackup(original,imported,'copy',()=> 'new-id');assert.equal(JSON.stringify(original),before);assert.equal(result.value.people.length,2);assert.equal(result.value.people[1].name,'虚构示例 · 小林（导入副本）');assert.deepEqual(result.value.saved['new-id'],original.saved[original.people[0].id]);
 assert.equal(mergeBackup(original,imported,'skip').added,0);assert.deepEqual(parseBackup(JSON.stringify({v2:JSON.stringify(original),v1:null})),original);
 const map=new Map(),storage={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};saveState(result.value,storage);assert.deepEqual(loadState(null,storage).value,result.value);assert.ok(map.has(KEY));
});
test('import rejects damaged, oversized, prototype and orphan data before persistence',()=>{
 for(const s of ['{}','{',JSON.stringify({version:99}),'{"__proto__":{}}','x'.repeat(4*1024*1024+1)])assert.throws(()=>parseBackup(s));
 const bad=demoState();bad.people[0].records[0].category='missing';assert.throws(()=>parseBackup(JSON.stringify(bad)));
 const orphan=demoState();orphan.saved.unknown=[];assert.throws(()=>parseBackup(JSON.stringify(orphan)));
});
test('first visit stays empty; demo factory is isolated and never initializes storage',()=>{
 const writes=[];const storage={getItem:()=>null,setItem:(...args)=>writes.push(args)};assert.equal(loadState(null,storage).value.people.length,0);const a=demoState(),b=demoState();a.people[0].records=[];assert.equal(b.people[0].records.length,5);assert.equal(writes.length,0);
});
