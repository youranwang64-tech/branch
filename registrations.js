import {timedFetch} from './network.js';
import {registrationConfig as config} from './registration-config.js';
export function registrationConfigured(){return /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(config.url)&&Boolean(config.publishableKey)&&!config.publishableKey.startsWith('sb_secret_');}
export async function submitRegistration(profile,{consent=false,requestId,fetcher=timedFetch}={}){
 if(!registrationConfigured())throw Error('共享报名后台正在配置，暂未开放正式提交。你的填写草稿仍保存在本设备，请稍后再试。');
 if(!consent)throw Error('请先确认报名资料的使用说明。');
 const res=await fetcher(config.url+'/rest/v1/rpc/branch_register',{method:'POST',headers:{'apikey':config.publishableKey,'Content-Type':'application/json'},body:JSON.stringify({p_request_id:requestId,p_profile:profile,p_consent:true}),timeoutMs:20000});
 const result=await res.json();
 if(!res.ok||!/^BR-[A-F0-9]{16}$/.test(result.code)||!result.savedAt)throw Error('未收到后台保存确认，请重试。不会显示报名成功。');
 return {...result,storage:'cloud',version:1};
}
