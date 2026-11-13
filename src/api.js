import{recommend,validateRecommendations}from'./recommendations.js';import{apiJSON}from'./aiClient.js';
export async function generateGifts(input,{mode='real',signal}={}){
 if(mode==='mock'){await new Promise((resolve,reject)=>{const t=setTimeout(resolve,450);signal?.addEventListener('abort',()=>{clearTimeout(t);reject(new DOMException('Aborted','AbortError'));},{once:true});});return recommend(input);}
 const {person,budget,occasion,tendency,notes,batch}=input;
 const minimal={budget,occasion,tendency,notes,batch,person:{records:person.records.slice(0,300).map(({id,content,kind})=>({id,content,kind})),history:person.history,saved:(person.saved||[]).map(({id,name})=>({id,name}))}};
 const data=await apiJSON('/api/gift-recommendations',minimal,{signal});return validateRecommendations(data.recommendations,person,budget);
}
