import {catalog} from './data.js';
export const kinds=['实用型','体验型','情感型'];
export function validateRecommendations(value,person,budget){
 if(!Array.isArray(value)||value.length!==3) throw Error('推荐格式异常，请重新生成。');
 const ids=new Set(); const blocked=person.dislikes.map(x=>x.trim().toLowerCase()).filter(Boolean);
 for(const g of value){
  if(!g||!['id','name','type','reason','caution'].every(k=>typeof g[k]==='string'&&g[k].trim()&&g[k].length<1200)||!kinds.includes(g.type)||!Array.isArray(g.tags)||g.tags.some(t=>typeof t!=='string'||!person.likes.includes(t))||!Array.isArray(g.budget)||g.budget.length!==2||!g.budget.every(Number.isFinite)||g.budget[0]<0||g.budget[0]>g.budget[1]||g.budget[1]>budget||ids.has(g.id)) throw Error('推荐字段校验未通过，请重试。');
  ids.add(g.id);
  if(blocked.some(t=>JSON.stringify(g).toLowerCase().includes(t))) throw Error('推荐可能涉及禁忌，已拦截。请调整偏好后重试。');
 }
 return value;
}
export function recommend({person,budget,occasion,tendency,notes='',batch=0}){
 if(!Number.isFinite(budget)||budget<10) throw Error('请输入至少 10 元的预算。');
 const banned=person.dislikes.map(t=>t.trim().toLowerCase()).filter(Boolean);
 const pool=catalog.filter(g=>g.min<=budget&&!banned.some(t=>JSON.stringify(g).toLowerCase().includes(t))&&!person.history.some(h=>h.includes(g.name)||g.name.includes(h)));
 const result=kinds.map(type=>{
  const options=pool.filter(g=>g.type===type).map(g=>({g,score:g.tags.filter(t=>person.likes.some(l=>l.includes(t)||t.includes(l))).length*4+person.wishes.filter(w=>g.tags.some(t=>w.includes(t))).length*5-(person.saved?.some(s=>s.id===g.id)?2:0)})).sort((a,b)=>b.score-a.score);
  if(!options.length) throw Error('当前预算与禁忌下无法提供三个安全方向，请调整条件。');
  const {g}=options[batch%options.length]; const tags=person.likes.filter(t=>g.tags.some(k=>t.includes(k)||k.includes(t)));const wishes=g.type==='体验型'?person.wishes.filter(w=>g.keywords.some(k=>w.includes(k))):[];
  return {id:g.id,name:g.name,type,budget:[g.min,Math.min(g.max,budget)],tags,evidence:[...tags,...wishes],reason:wishes.length?`根据你记录的愿望「${wishes.join('、')}」，这是一种可以进一步确认的实现方式。`:tags.length?`你记得 TA 喜欢${tags.join('、')}，这份${type==='体验型'?'共同体验':'心意'}可以从这里出发。适合在${occasion}表达关心。`:`可以在${occasion}作为一个待确认的方向；还没有足够的偏好记录，先问问 TA 是否喜欢。`,caution:g.caution+(person.history.length?' 请与过往礼物核对，避免重复。':'')+(notes?' 补充要求已记录；模拟模式不能理解全部自然语言，请自行核对。':'')};
 });
 if(tendency!=='均衡推荐')result.sort((a,b)=>(b.type===tendency)-(a.type===tendency));
 return validateRecommendations(result,person,budget);
}
