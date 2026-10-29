export let aiStatus={checked:false,available:false,message:'正在检查 AI 连接…',model:'gpt-6.1-terra'};
let token='',apiBase='';
const pendingKey='cibe-pending-v2';
function readPending(){try{return JSON.parse(localStorage.getItem(pendingKey)||'{}');}catch{return {};}}
function writePending(records){try{localStorage.setItem(pendingKey,JSON.stringify(records));}catch{}}
const requestKey=payload=>JSON.stringify(payload);
export function pendingTasks(){return Object.values(readPending()).filter(r=>r&&r.id&&r.payload&&['generate','branch','report'].includes(r.payload.kind));}
export function acknowledgeTask(payload){const records=readPending();delete records[requestKey(payload)];writePending(records);}
async function check(base){
  const response=await fetch(base+'/api/status',{signal:AbortSignal.timeout(8000)});
  const status=await response.json();
  if(!response.ok||status.service!=='cibe-life-ai'||status.protocol!==2)throw Error('not-current');
  apiBase=base;token=status.token;aiStatus={...status,checked:true};
}
export const aiReady=Promise.resolve(aiStatus={checked:true,available:false,model:'gpt-6.1-terra',message:'这是 branch 公开展示版。你可以浏览示例人生、历史变化和报告。个人 AI 推演需要活动现场的服务，目前尚未向公众开放。'});

export async function inferLife(payload,onProgress=()=>{}) {
  await aiReady;
  if(!aiStatus.available)throw Error(aiStatus.message);
  if(aiStatus.protocol!==2)throw Error('后台需要更新，请重新运行本地启动器后刷新页面。');
  const key=requestKey(payload);let record=readPending()[key];
  if(record?.result)return record.result;
  if(!record){
    const response=await fetch(apiBase+'/api/life/jobs',{method:'POST',headers:{'Content-Type':'application/json','X-CIBE-Token':token},body:JSON.stringify(payload),signal:AbortSignal.timeout(15000)});
    const created=await response.json();
    if(!response.ok)throw Error(created.error||'无法开始推演。');
    record={id:created.id,payload,started:Date.now(),base:apiBase};
    writePending({...readPending(),[key]:record});
  }
  if(record.base!==apiBase){acknowledgeTask(payload);throw Error('后台已更新，上次任务无法恢复。填写的信息和原路径仍保留，请重新生成。');}
  const deadline=Date.now()+(payload.kind==='report'?220000:580000);
  while(Date.now()<deadline) {
    const result=await fetch(apiBase+'/api/life/jobs/'+record.id,{headers:{'X-CIBE-Token':token},signal:AbortSignal.timeout(10000)});
    const job=await result.json();
    if(!result.ok){if(result.status===404)acknowledgeTask(payload);throw Error(result.status===404?'上次任务因后台重启已结束。信息已保留，请重新生成。':job.error||'无法读取推演结果。');}
    onProgress(job.message,job);
    if(job.state==='completed'){writePending({...readPending(),[key]:{...record,result:job.life}});return job.life;}
    if(job.state==='failed'){acknowledgeTask(payload);throw Error(job.message);}
    await new Promise(resolve=>setTimeout(resolve,300));
  }
  throw Error('本次推演等待时间较长，请稍后重试。原来的档案没有改变。');
}
