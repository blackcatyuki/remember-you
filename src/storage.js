import {migrate,validateState} from './model.js';
export const KEY='remember-you:v2',OLD_KEY='remember-you:v1';
export const emptyState=()=>({version:2,people:[],saved:{}});
export function loadState(_legacyFallback,storage=localStorage){
 try{const current=storage.getItem(KEY);if(current!==null)return {value:validateState(JSON.parse(current)),error:''};
  const old=storage.getItem(OLD_KEY);if(old!==null){const value=migrate(JSON.parse(old));try{storage.setItem(KEY,JSON.stringify(value));return {value,error:'',migrated:true};}catch{return {value,error:'旧数据已读取，但新版保存失败。请先导出备份。',locked:true};}}
  return {value:emptyState(),error:''};
 }catch{return {value:{version:2,people:[],saved:{}},error:'现有数据无法读取，已停止写入以保护原数据。请先导出原始备份。',locked:true};}
}
export function saveState(value,storage=localStorage){validateState(value);storage.setItem(KEY,JSON.stringify(value));}
export function downloadJSON(value,name){const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export function rawBackup(){return {exportedAt:new Date().toISOString(),v1:localStorage.getItem(OLD_KEY),v2:localStorage.getItem(KEY)};}
