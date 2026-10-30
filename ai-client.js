export const aiStatus={checked:true,available:false,model:'gpt-6.1-terra',message:'个人 AI 推演将在活动现场开放。请保存报名凭证，到场后扫描现场二维码。'};
export const aiReady=Promise.resolve(aiStatus);
export const pendingTasks=()=>[];
export function acknowledgeTask(){}
export async function inferLife(){throw Error(aiStatus.message);}
