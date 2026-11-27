import {ApiError} from './ai.js';
// Exact name returned by the provider's public model catalog, not the paid aliases.
export const FREE_MODEL = 'DeepSeek-V4.1-Flash 小力孩AI';
export const CATALOG_URL = 'https://ygxnhzy.cn/api/pub/models';
const stop=message=>{throw new ApiError(503,'FREE_MODEL_STOPPED',message);};
export function freeConfigValid(env,now=Date.now()){
 const end=Date.parse(env.AI_FREE_REVIEW_UNTIL||'');
 return env.AI_TEXT_MODEL===FREE_MODEL&&env.AI_FREE_ONLY==='true'&&env.AI_FREE_KEY_RESTRICTED==='true'&&Number.isFinite(end)&&end>now&&end<=now+86400000;
}
export async function verifyFreeModel(env,fetcher=fetch,now=Date.now()){
 if(!freeConfigValid(env,now))stop('免费 AI 尚未完成安全确认或复核已到期，已停止请求；不会切换收费模型。');
 // Never cache prices: check every request, without transmitting the API key.
 let response;try{response=await fetcher(CATALOG_URL,{signal:AbortSignal.timeout(8000),cache:'no-store',redirect:'error'});}catch{stop('服务端无法连接免费模型目录，已停止请求；请稍后重试，不会切换收费模型。');}
 if(!response.ok)stop('暂时无法核实免费条件，已停止请求。');
 const raw=await response.text();if(raw.length>300000)stop('免费模型目录异常，已停止请求。');
 let list;try{list=JSON.parse(raw);}catch{stop('免费模型目录格式异常，已停止请求。');}
 const m=Array.isArray(list)?list.find(m=>m.name===FREE_MODEL):null;
 if(!m||m.is_free!==true||m.available!==true||m.kind!=='chat'||m.virtual!==false||m.price_in_credits!==0||m.price_out_credits!==0||m.price_credits_per_1m!==0||!(m.free_daily_tokens>0))stop('免费模型已下线、免费额度条件改变或存在收费风险，已停止请求。');
 if(m.eol_date){const end=Date.parse(m.eol_date);if(!Number.isFinite(end)||end<=now+86400000)stop('免费模型已临近下线，已停止请求，请管理员核实。');}
 return m;
}
