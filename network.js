/** Timeout support for mobile browsers without AbortSignal.timeout. */
export async function timedFetch(url,{timeoutMs=20000,...options}={}){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{return await fetch(url,{...options,signal:controller.signal});}
  finally{clearTimeout(timer);}
}
