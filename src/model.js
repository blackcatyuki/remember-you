export const defaults = [['food','食味'],['hobby','爱好'],['scent','气味与香味'],['style','颜色与风格'],['item','物品'],['wish','愿望清单'],['other','其他']].map(([id,name])=>({id,name,builtin:true}));
export const sentiments={like:'喜欢',dislike:'不喜欢',restriction:'忌口 / 明确限制',fact:'中性事实',wish:'愿望'};
export const uid=()=>globalThis.crypto.randomUUID();
export function categoryFor(text){if(/想|愿望|希望/.test(text))return 'wish';if(/香水|木质香|香氛|香型|气味/.test(text))return 'scent';if(/颜色|白色|奶油白|黑色|穿搭|风格/.test(text))return 'style';if(/阅读|摄影|徒步|运动|陶艺|植物|游戏|电影/.test(text))return 'hobby';if(/抹茶|香菜|花生|咖啡|食|吃|辣|甜|餐厅|奶茶|酒精/.test(text))return 'food';return 'item';}
// Validate calendar parts independently; no UTC parsing and no invented missing parts.
export function validBirthday(b){
 if(!b||!['year','month','day'].every(k=>['string','number','undefined'].includes(typeof b[k])))return false;
 const has=k=>b[k]!==''&&b[k]!==undefined;
 const n=k=>Number(b[k]);
 if(['year','month','day'].some(k=>has(k)&&(!/^\d+$/.test(String(b[k]))||!Number.isInteger(n(k)))))return false;
 if(has('year')&&(n('year')<1||n('year')>9999)||has('month')&&(n('month')<1||n('month')>12)||has('day')&&(n('day')<1||n('day')>31))return false;
 if(has('month')&&has('day')){const y=has('year')?n('year'):2000;const leap=y%4===0&&(y%100!==0||y%400===0);const max=[31,leap?29:28,31,30,31,30,31,31,30,31,30,31][n('month')-1];if(n('day')>max)return false;}
 return true;
}
export function birthdayInfo(b={},now=new Date()){
 if(!validBirthday(b))return [];
 const {year='',month='',day=''}=b;const out=[];
 if(year||month||day)out.push([year?`${year}年`:'',month?`${Number(month)}月`:'',day?`${Number(day)}日`:''].join(''));
 if(year&&month&&day){const y=Number(year),m=Number(month),d=Number(day);const past=y<now.getFullYear()||(y===now.getFullYear()&&(m<now.getMonth()+1||(m===now.getMonth()+1&&d<=now.getDate())));if(past){let age=now.getFullYear()-y;if(now.getMonth()+1<m||(now.getMonth()+1===m&&now.getDate()<d))age--;out.push(`${age} 岁`);}}
 if(month&&day){const m=Number(month),d=Number(day),cut=[20,19,21,20,21,22,23,23,23,24,23,22],signs=['摩羯座','水瓶座','双鱼座','白羊座','金牛座','双子座','巨蟹座','狮子座','处女座','天秤座','天蝎座','射手座','摩羯座'];out.push(signs[m-1+(d>=cut[m-1]?1:0)]);}
 return out;
}
export function validateState(v){
 if(!v||v.version!==2||!Array.isArray(v.people)||!v.saved||typeof v.saved!=='object'||Array.isArray(v.saved))throw Error('备份格式不正确');
 const ids=new Set();
 for(const p of v.people){
  if(!p||typeof p.id!=='string'||ids.has(p.id)||typeof p.name!=='string'||!p.name.trim()||!Array.isArray(p.categories)||!Array.isArray(p.records)||!Array.isArray(p.history)||p.history.some(t=>typeof t!=='string')||!['avatar','gender','relation'].every(k=>typeof p[k]==='string')||(p.avatar&&!/^data:image\/(jpeg|png|webp);base64,/.test(p.avatar)))throw Error('人物数据不完整');
  ids.add(p.id);const cats=new Set(p.categories.map(c=>c.id));
  if(cats.size!==p.categories.length||p.categories.some(c=>typeof c.id!=='string'||typeof c.name!=='string'||!c.name.trim()))throw Error('分类格式不正确');
  const rid=new Set();for(const r of p.records){if(!r||typeof r.id!=='string'||rid.has(r.id)||typeof r.content!=='string'||!r.content.trim()||typeof r.note!=='string'||typeof r.createdAt!=='string'||!sentiments[r.kind]||!cats.has(r.category))throw Error('记录格式不正确');rid.add(r.id);}
  if(!validBirthday(p.birthday))throw Error('生日格式不正确');
 }
 for(const a of Object.values(v.saved)){if(!Array.isArray(a)||a.some(g=>!g||typeof g.id!=='string'||typeof g.name!=='string'||typeof g.reason!=='string'||typeof g.caution!=='string'||!Array.isArray(g.tags)||g.tags.some(t=>typeof t!=='string')||!Array.isArray(g.budget)||g.budget.length!==2||!g.budget.every(Number.isFinite)))throw Error('收藏格式不正确');}return v;
}
export function migrate(v){
 if(v.version===2)return validateState(v);
 if(v.version!==1||!Array.isArray(v.people)||!v.saved)throw Error('不支持的数据版本');
 const data={version:2,people:v.people.map(p=>{
  if(!p||typeof p.id!=='string'||typeof p.name!=='string'||!['likes','dislikes','wishes','history'].every(k=>Array.isArray(p[k])&&p[k].every(t=>typeof t==='string')))throw Error('旧档案格式损坏');
  return {...p,birthday:{year:'',month:'',day:''},gender:'',relation:p.relation||'',avatar:'',categories:defaults.map(c=>({...c})),records:['likes','dislikes','wishes'].flatMap(k=>p[k].map((content,i)=>({id:`legacy-${p.id}-${k}-${i}`,content,kind:k==='likes'?'like':k==='dislikes'?'dislike':'wish',category:k==='wishes'?'wish':categoryFor(content),note:k==='dislikes'?'从旧版迁移；如为过敏或不可食用，请改为明确限制。':'',createdAt:new Date().toISOString()})))};
 }),saved:v.saved};return validateState(data);
}
export function deletePerson(db,id){return {...db,people:db.people.filter(p=>p.id!==id),saved:Object.fromEntries(Object.entries(db.saved).filter(([k])=>k!==id))};}
export function removeCategory(person,id,target,deleteRecords=false){

 if(!deleteRecords&&person.records.some(r=>r.category===id)&&(!target||target===id||!person.categories.some(c=>c.id===target)))throw Error('请选择有效的移动分类');
 return {...person,categories:person.categories.filter(c=>c.id!==id),records:deleteRecords?person.records.filter(r=>r.category!==id):person.records.map(r=>r.category===id?{...r,category:target}:r)};
}
export function giftProfile(p,saved=[]){return {...p,likes:p.records.filter(r=>r.kind==='like').map(r=>r.content),dislikes:p.records.filter(r=>['dislike','restriction'].includes(r.kind)).map(r=>r.content),restrictions:p.records.filter(r=>r.kind==='restriction').map(r=>r.content),wishes:p.records.filter(r=>r.kind==='wish').map(r=>r.content),saved};}
export function duplicateOf(records,candidate){const norm=s=>s.replace(/[\s，。！？,.!?]/g,'').toLowerCase();if(!norm(candidate.content))return undefined;return records.find(r=>norm(r.content)===norm(candidate.content)||norm(r.content).includes(norm(candidate.content))||norm(candidate.content).includes(norm(r.content)));}
