import{ApiError}from'./ai.js';
const positive=(v,f,max)=>Math.min(max,Math.max(1,Number(v)||f));
export async function reserveQuota(request,env,now=Date.now()){
 if(!env.DB||!env.AI_RATE_SALT)throw new ApiError(503,'LIMITER_NOT_READY','AI 尚未完成安全配置，请稍后再试。');
 // These headers are trusted only behind Sites/Cloudflare dispatch, never on a public Node origin.
 const day=new Date(now+8*3600000).toISOString().slice(0,10);const hashes=await sourceHashes(request,env,now);
 const counters=[...hashes.flatMap(hash=>[['minute:'+Math.floor(now/60000)+':'+hash,positive(env.AI_PER_MINUTE,4,30)],['day:'+day+':'+hash,positive(env.AI_PER_PERSON_DAY,15,300)]]),['global:'+day,positive(env.AI_DAILY_LIMIT,50,10000)]];
 try{for(const [key,limit] of counters){const row=await env.DB.prepare('INSERT INTO ai_quota (key, used, expires_at) VALUES (?, 1, ?) ON CONFLICT(key) DO UPDATE SET used=used+1 WHERE used < ? RETURNING used').bind(key,now+2*86400000,limit).first();if(!row)throw new ApiError(429,'QUOTA_EXCEEDED','调用次数已达上限，请稍后或明天再试。');}}
 catch(e){if(e instanceof ApiError)throw e;throw new ApiError(503,'LIMITER_NOT_READY','AI 安全计数暂不可用，本次未调用模型。');}
 // Expired, salted hashes only; no raw IP, profile or screenshot is stored.
 await env.DB.prepare('DELETE FROM ai_quota WHERE expires_at < ?').bind(now).run().catch(()=>{});
}

async function sourceHashes(request,env,now){
 const user=request.headers.get('oai-authenticated-user-id'),ip=request.headers.get('CF-Connecting-IP');
 const day=new Date(now+8*3600000).toISOString().slice(0,10);
 const sources=[...(user?['user:'+user]:[]),...(ip?['ip:'+ip]:[])];
 if(!sources.length)throw new ApiError(403,'IDENTITY_UNAVAILABLE','无法确认请求来源，请重新登录后再试。');
 return Promise.all(sources.map(async who=>{const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(env.AI_RATE_SALT+'|'+day+'|'+who));return Array.from(new Uint8Array(bytes),v=>v.toString(16).padStart(2,'0')).join('');}));
}
// D1 leases provide an all-isolate cap; a crashed request expires after 90 seconds.
export async function acquireConcurrency(request,env,now=Date.now()){
 if(!env.DB||!env.AI_RATE_SALT)throw new ApiError(503,'LIMITER_NOT_READY','AI 安全计数尚未配置。');
 const hashes=await sourceHashes(request,env,now),held=[],nonce=crypto.getRandomValues(new Uint32Array(1))[0];
 const release=async()=>{for(const key of held)await env.DB.prepare('DELETE FROM ai_quota WHERE key = ? AND used = ?').bind(key,nonce).run().catch(()=>{});};
 async function slot(prefix,n){for(let i=0;i<n;i++){const key=prefix+':'+i;const row=await env.DB.prepare('INSERT INTO ai_quota(key,used,expires_at) VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET used=excluded.used,expires_at=excluded.expires_at WHERE expires_at <= ? RETURNING used').bind(key,nonce,now+90000,now).first();if(row){held.push(key);return;}}throw new ApiError(429,'CONCURRENCY_LIMIT','当前 AI 请求较多，请等待上一条完成后重试。');}
 try{for(const hash of hashes)await slot('active:'+hash,1);await slot('active:global',Math.floor(positive(env.AI_GLOBAL_CONCURRENCY,2,5)));return release;}
 catch(e){await release();if(e instanceof ApiError)throw e;throw new ApiError(503,'LIMITER_NOT_READY','AI 安全计数暂不可用，本次未调用模型。');}
}
