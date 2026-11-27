import {migrate,validateState,uid} from './model.js';
export const MAX_BACKUP_BYTES=4*1024*1024;
// Accept normal v1/v2 exports and the raw recovery envelope. Never execute imported text.
export function parseBackup(text){
 if(typeof text!=='string'||new TextEncoder().encode(text).length>MAX_BACKUP_BYTES)throw Error('备份文件最大 4 MB。');
 let value;try{value=JSON.parse(text,(key,v)=>{if(['__proto__','prototype','constructor'].includes(key))throw Error();return v;});}catch{throw Error('不是有效的 JSON 备份。');}
 if(value&&value.version===undefined&&(typeof value.v2==='string'||typeof value.v1==='string'))return parseBackup(value.v2||value.v1);
 try{value=migrate(value);}catch{throw Error('备份格式或数据关联不正确，请选择记得你导出的完整备份。');}
 if(value.people.length>200||value.people.some(p=>p.records.length>2000||p.categories.length>100||p.name.length>100||p.avatar.length>1500000)||Object.keys(value.saved).some(id=>!value.people.some(p=>p.id===id)))throw Error('备份超过容量限制或包含无主收藏。');
 return value;
}
export function importSummary(current,incoming){const conflicts=incoming.people.filter(p=>current.people.some(x=>x.id===p.id||x.name.trim()===p.name.trim()));return {total:incoming.people.length,conflicts:conflicts.map(p=>p.name)};}
export function mergeBackup(current,incoming,policy='copy',makeId=uid){
 validateState(current);validateState(incoming);if(!['copy','skip'].includes(policy))throw Error('请选择冲突处理方式。');
 const people=[...current.people],saved={...current.saved};let added=0,skipped=0;
 for(const p of incoming.people){const conflict=current.people.some(x=>x.id===p.id||x.name.trim()===p.name.trim());if(conflict&&policy==='skip'){skipped++;continue;}
  let id=makeId();if(people.some(x=>x.id===id))throw Error('无法生成独立档案标识，请重试。');
  const name=conflict?p.name+'（导入副本）':p.name;people.push({...p,id,name});if(incoming.saved[p.id])saved[id]=incoming.saved[p.id].map(g=>({...g}));added++;
 }
 return {value:validateState({version:2,people,saved}),added,skipped};
}
