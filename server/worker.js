import{ApiError,configuration,validateParseInput,validateRecords,validateGiftInput,giftCandidates,validateGifts,providerJSON,parseSystem,giftSystem}from'./ai.js';import{reserveQuota,acquireConcurrency}from'./limits.js';import{verifyFreeModel,freeConfigValid}from'./free-policy.js';
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff',...(status===429?{'retry-after':'60'}:{})}});
async function bodyJSON(request){if(Number(request.headers.get('content-length'))>2900000)throw new ApiError(413,'TOO_LARGE','请求内容过大。');if(!request.headers.get('content-type')?.includes('application/json'))throw new ApiError(415,'INVALID_TYPE','请发送 JSON 请求。');const reader=request.body?.getReader();if(!reader)throw new ApiError(400,'INVALID_INPUT','请求为空。');let size=0,parts=[];while(true){const r=await reader.read();if(r.done)break;size+=r.value.length;if(size>2900000){await reader.cancel();throw new ApiError(413,'TOO_LARGE','请求内容过大。');}parts.push(r.value);}const bytes=new Uint8Array(size);let offset=0;for(const p of parts){bytes.set(p,offset);offset+=p.length;}try{return JSON.parse(new TextDecoder().decode(bytes));}catch{throw new ApiError(400,'INVALID_JSON','输入格式错误。');}}
// Diagnostic headers contain only stage durations and HTTP status, never prompts or credentials.
export async function handleApi(request,env={},fetcher=fetch){
 const timings=[];const started=performance.now();
 const measured=async(url,options)=>{
  const stage=url.includes('/api/pub/models')?'free_catalog':url.endsWith('/models')?'key_scope':'generation';
  const start=performance.now();let status='network';
  try{const response=await fetcher(url,options);status=String(response.status);return response;}
  finally{timings.push(stage+';dur='+(performance.now()-start).toFixed(1)+';desc="'+status+'"');}
 };
 const response=await handleApiRequest(request,env,measured);
 response.headers.set('Server-Timing',[...timings,'total;dur='+(performance.now()-started).toFixed(1)].join(', '));
 response.headers.set('X-AI-Revision','stages-v1');
 return response;
}
async function handleApiRequest(request,env={},fetcher=fetch){
 const url=new URL(request.url);
 if(url.pathname==='/api/ai-status'&&request.method==='GET'){const c=configuration(env);const reviewValid=freeConfigValid(env);const ready=c.enabled&&c.configured&&c.limiterReady&&reviewValid;const message=!c.enabled?'管理员暂未启用 AI，可手动记录或选择规则演示。':!c.configured?'AI 服务端凭据尚未配置。':!c.limiterReady?'AI 安全限流尚未就绪，已停止请求。':!reviewValid?'免费条件复核未完成或已到期，已停止请求；不会切换收费模型。':'服务端配置就绪；每次请求仍会核实免费状态。';return json({...c,ready,reviewValid,message});}
 if(!['/api/parse-records','/api/gift-recommendations'].includes(url.pathname))return json({error:{code:'NOT_FOUND',message:'接口不存在。'}},404);
 try{
  if(request.method!=='POST')throw new ApiError(405,'METHOD_NOT_ALLOWED','请使用 POST。');
  if(request.headers.get('origin')!==url.origin||request.headers.get('sec-fetch-site')==='cross-site')throw new ApiError(403,'ORIGIN_REJECTED','不允许跨站请求。');
  const c=configuration(env);if(!c.enabled)throw new ApiError(503,'AI_DISABLED','AI 暂未启用，仍可手动记录或明确选择演示。');if(!c.configured)throw new ApiError(503,'AI_NOT_CONFIGURED','AI 尚未完成配置，请稍后再试。');
  const body=await bodyJSON(request);
  if(url.pathname==='/api/parse-records'){
   const input=validateParseInput(body);if(input.image)throw new ApiError(503,'VISION_UNAVAILABLE','当前免费 DeepSeek 没有明确的图片理解支持，截图识别不可用，请使用文字记录。');
   await verifyFreeModel(env,fetcher);await reserveQuota(request,env);const release=await acquireConcurrency(request,env);try{const {image,...data}=input;const result=await providerJSON(env,{system:parseSystem,data,image:null,vision:false},fetcher);return json({mode:'real',records:validateRecords(result,input)});}finally{await release();}
  }
  const input=validateGiftInput(body);const candidates=giftCandidates(input);if(['实用型','体验型','情感型'].some(k=>!candidates.some(c=>c.type===k)))throw new ApiError(422,'NO_SAFE_CANDIDATES','当前预算和禁忌下没有三个可选方向，请调整条件。');
  await verifyFreeModel(env,fetcher);await reserveQuota(request,env);const release=await acquireConcurrency(request,env);try{const result=await providerJSON(env,{system:giftSystem,data:{...input,candidates}},fetcher);return json({mode:'real',recommendations:validateGifts(result,input)});}finally{await release();}
 }catch(e){if(e instanceof ApiError)return json({error:{code:e.code,message:e.message,...(e.stage?{stage:e.stage}:{})}},e.status);if(e?.name==='TimeoutError'||e?.name==='AbortError')return json({error:{code:'AI_TIMEOUT',message:'AI 响应超时，请稍后手动重试。'}},504);return json({error:{code:'AI_UNAVAILABLE',message:'AI 服务暂不可用，请稍后重试。'}},502);}
}
export function createWorker(assets={}){return{async fetch(request,env){const url=new URL(request.url);if(url.pathname.startsWith('/api/'))return handleApi(request,env);const file=assets[url.pathname]||(!url.pathname.split('/').pop().includes('.')?assets['/index.html']:null);if(!file)return new Response('Not found',{status:404});if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405});const bytes=Uint8Array.from(atob(file.base64),c=>c.charCodeAt(0));return new Response(request.method==='HEAD'?null:bytes,{headers:{'content-type':file.type,'cache-control':url.pathname.startsWith('/assets/')?'public, max-age=31536000, immutable':'no-cache','x-content-type-options':'nosniff','referrer-policy':'same-origin','content-security-policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'"}});}};}
export default createWorker();
