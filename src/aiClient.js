import{useEffect,useState}from'react';
export async function apiJSON(path,input,{signal}={}){
 const timeout=AbortSignal.timeout(50000);const combined=signal?AbortSignal.any([signal,timeout]):timeout;
 try{const response=await fetch(path,{method:input?'POST':'GET',headers:input?{'Content-Type':'application/json'}:undefined,body:input?JSON.stringify(input):undefined,signal:combined});const data=await response.json();if(!response.ok)throw Error(data.error?.message||'AI 服务暂不可用，请稍后重试。');return data;}
 catch(e){if(signal?.aborted)throw e;if(e.name==='TimeoutError'||e.name==='AbortError')throw Error('AI 响应超时，请稍后重试。');if(e instanceof TypeError)throw Error('网络连接失败，请检查网络后重试。');throw e;}
}
export function useAIStatus(){const[status,setStatus]=useState(null);useEffect(()=>{const c=new AbortController();apiJSON('/api/ai-status',null,{signal:c.signal}).then(setStatus).catch(()=>{if(!c.signal.aborted)setStatus({ready:false,networkError:true});});return()=>c.abort();},[]);return status;}
