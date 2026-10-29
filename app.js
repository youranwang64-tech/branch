import {aiReady,aiStatus,inferLife,pendingTasks,acknowledgeTask} from './ai-client.js';
import {createLife,branchLife,buildReport,validateSession,modelName} from './engine.js';
import {mountForceGraph,graphStatistics} from './force-graph.js';
import {mapWorkbenchView} from './map-workbench.js';
import {mountTunnel} from './tunnel-three.js';
import {mountArchiveFolders} from './archive-three.js';
import {homeView,mountHomeMotion} from './home-view.js';
import {getLinkPath,getLinkMidpoint} from './vendor/mirofish-graph-geometry.js';

const $=s=>document.querySelector(s);
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const paths={map:'M3 5l6-2 6 2 6-2v16l-6 2-6-2-6 2V5zm6-2v16m6-14v16',branch:'M6 3v12a4 4 0 004 4h8M6 9h8a4 4 0 004-4V3',report:'M6 3h9l4 4v14H5V3h1zm8 0v5h5M9 12h6m-6 4h6',arrow:'M5 12h14m-5-5l5 5-5 5',spark:'M12 3l2.6 6.4L21 12l-6.4 2.6L12 21l-2.6-6.4L3 12l6.4-2.6L12 3z',book:'M3 4h7l2 2 2-2h7v15h-7l-2 2-2-2H3V4zm9 2v15',work:'M3 7h18v13H3V7zm5 0V3h8v4M3 12h18m-11 0v3h4v-3',pin:'M12 22s8-8 8-14a8 8 0 00-16 0c0 6 8 14 8 14zm0-17a3 3 0 110 6 3 3 0 010-6',leaf:'M20 3C7 2 2 8 5 15c4 8 14 2 15-12zM4 21L15 9',clock:'M12 22a10 10 0 110-20 10 10 0 010 20zm0-16v6l4 3',plus:'M12 5v14M5 12h14',minus:'M5 12h14',download:'M12 3v12m-4-4l4 4 4-4M4 16v5h16v-5',close:'M5 5l14 14M5 19L19 5',key:'M14 9a5 5 0 11-10 0 5 5 0 0110 0zm0 0h8m-3 0v4m-3-4v3',check:'M5 12l4 4L19 6',info:'M12 22a10 10 0 110-20 10 10 0 010 20zm0-12v7m0-11v1',reset:'M3 10a9 9 0 119 11M3 3v7h7',print:'M7 8V3h10v5M7 17H3V9h18v8h-4M7 14h10v7H7v-7',upload:'M12 16V3m-4 4l4-4 4 4M4 16v5h16v-5'};
const icon=(name,size=18)=>`<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name]||paths.spark}"/></svg>`;
const storageKey='cibe-life-v1';
const demoProfile={name:'林知夏',age:22,stage:'university',vision:'做喜欢的设计，也给生活留一点自由。',education:'work',work:'设计与创意',priority:'freedom',question:'如果毕业后不急着工作，人生会有什么不同？'};
const baseline=createLife(demoProfile);
let session={schemaVersion:1,code:'CIBE-DEMO',isDemo:true,profile:demoProfile,lives:[baseline],activeLifeId:baseline.id};
let sessions={},storageAvailable=true;
const validSession=validateSession;
try{const data=JSON.parse(localStorage.getItem(storageKey)||'{}');sessions=Object.fromEntries(Object.entries(data.sessions||{}).filter(([code,s])=>validSession(s)&&code===s.code));if(sessions[data.active])session=sessions[data.active];}catch{storageAvailable=false;}
let aiBusy=false;
const reportJobs=new Map();
let page='home',selected='education',formStep=0,draft={},zoom=1,compareId=null,toastTimer,modalReturn=null;
let graphMode='network',workbenchLayout='split',network=null,hero=null,mountFrame=0;
const uiKey='cibe-view-v2';let branchDraft=null;
try{
  const ui=JSON.parse(localStorage.getItem(uiKey)||'{}');
  if(['home','map','onboard','compare','report','about'].includes(ui.page))page=ui.page;
  else if(!session.isDemo)page='map';
  if(['start','education','career','city','turning','ending'].includes(ui.selected))selected=ui.selected;
  if([0,1,2].includes(ui.formStep))formStep=ui.formStep;
  if(ui.draft&&typeof ui.draft==='object')draft=Object.fromEntries(Object.entries(ui.draft).filter(([k,v])=>['name','age','stage','vision','education','work','priority','question'].includes(k)&&['string','number'].includes(typeof v)).map(([k,v])=>[k,String(v).slice(0,240)]));
  branchDraft=ui.branchDraft||null;
}catch{}
function persistView(){try{localStorage.setItem(uiKey,JSON.stringify({page,selected,formStep,draft,branchDraft}));}catch{}}
function rememberInput(){
  const form=$('#profile-form');if(form)draft={...draft,...Object.fromEntries(new FormData(form))};
  const branch=$('#branch-form');if(branch)branchDraft={lifeId:currentLife().id,nodeId:selected,...Object.fromEntries(new FormData(branch))};
  persistView();
}
document.addEventListener('input',rememberInput);document.addEventListener('change',rememberInput);
window.addEventListener('pagehide',rememberInput);

const currentLife=()=>session.lives.find(l=>l.id===session.activeLifeId)||session.lives[0];
const selectedNode=()=>currentLife().nodes.find(n=>n.id===selected)||currentLife().nodes[1];
const stageNames={secondary:'中学阶段',university:'大学阶段',working:'正在工作',transition:'探索与转型'};
const priorityNames={freedom:'自由与探索',stability:'稳定与安全感',growth:'成长与成就',connection:'关系与陪伴'};
function save(){if(session.isDemo)return;try{sessions[session.code]=session;localStorage.setItem(storageKey,JSON.stringify({active:session.code,sessions}));storageAvailable=true;}catch{storageAvailable=false;toast('浏览器无法保存，请导出档案以保留本次体验。');}}
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),4500);}
function shell(content){return `<div class="app-shell"><aside class="sidebar"><a class="brand" href="#" data-action="nav" data-page="home"><span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i><i></i></span>branch</a><div class="brand-sub">by parallax</div><div class="nav-caption">探索你的可能</div><nav class="nav" aria-label="主导航">${[['map','map','我的人生图','01'],['compare','branch','平行人生','02'],['report','report','人生报告','03']].map(([id,i,t,num])=>`<button data-action="nav" data-page="${id}" class="${page===id?'active':''}" ${page===id?'aria-current="page"':''}>${icon(i)}<span>${t}</span><span class="nav-num">${num}</span></button>`).join('')}</nav><div class="sidebar-bottom"><div class="sidebar-note"><span class="little-star">✳</span><p>未来尚未发生，<br>选择正在生长。</p></div><button class="text-link" data-action="nav" data-page="about">${icon('info',14)} 关于这次探索</button></div></aside><main class="main-shell"><header class="topbar"><div class="breadcrumb">人生探索计划 <span>/</span> <strong>${({map:'我的人生图',compare:'平行人生',report:'人生报告',onboard:'建立人生档案',about:'项目与技术来源'})[page]}</strong></div><div class="top-actions"><span class="demo-pill">${currentLife().mode==='ai'?'AI 人生推演':'示例 / 本地档案'}</span><button class="plain-btn" data-action="connect">${icon('key',14)}连接我的人生</button><span class="avatar" aria-label="玩家">${escape(session.profile.name.slice(0,1))}</span></div></header>${content}<footer class="footer"><span>branch by parallax · 为每一种可能，留一个位置。</span><span>${storageAvailable?'档案仅保存在当前浏览器':'当前浏览器无法持久保存'} · <button data-action="nav" data-page="about">来源与说明</button></span></footer></main></div>`;}
function flow(active=2){return `<div class="flowbar">${['留下起点','遇见人生','改写选择','带走故事'].map((t,i)=>`${i?'<div class="flowline"></div>':''}<div class="flowstep ${i<=active?'on':''}"><span>0${i+1}</span>${t}</div>`).join('')}<div class="flow-end">一段关于你自己的探索</div></div>`;}
function render(){
 persistView();
 cancelAnimationFrame(mountFrame);mountFrame=0;network?.destroy();network=null;hero?.destroy();hero=null;
 document.body.classList.toggle('is-workbench',page==='map');
 if(page==='home'){document.body.classList.add('is-home');$('#app').innerHTML=homeView();hero=mountHomeMotion(mountTunnel($('#life-tunnel')),mountArchiveFolders($('#life-archives-scene')));return;}
 document.body.classList.remove('is-home');
 const content=page==='map'?mapView():page==='onboard'?onboardView():page==='compare'?compareView():page==='report'?reportView():aboutView();
 $('#app').innerHTML=page==='map'?content:shell(content);
 if(page==='map'&&workbenchLayout!=='workbench')mountFrame=requestAnimationFrame(()=>{
  mountFrame=0;if(page!=='map'||!document.querySelector('.graph-panel'))return;
  if(graphMode==='network'){
   network=mountForceGraph($('#force-graph'),{life:currentLife(),profile:session.profile,baseline:session.lives.find(l=>l.id===currentLife().parentId),selectedId:selected,onSelect:selectWorkbenchNode});

   const state=network.getState();
   $('[data-action=network-pause]').textContent=state.paused?'继续运动':'暂停运动';
   const labelButton=$('[data-action=network-labels]');labelButton.textContent=state.showLabels?'隐藏关系':'显示关系';labelButton.setAttribute('aria-pressed',String(state.showLabels));
  }else drawGraph();
 });
}
function selectWorkbenchNode(id){
 const scroll=$('#graph-scroll')?.scrollLeft||0;selected=id;
 if(workbenchLayout==='graph')workbenchLayout='split';
 render();if($('#graph-scroll'))$('#graph-scroll').scrollLeft=scroll;
 const detail=$('#workbench-node-detail'),pane=$('.workbench-scroll');
 if(detail&&pane){if(innerWidth>800)pane.scrollTop=Math.max(0,detail.offsetTop-pane.offsetTop-18);else detail.scrollIntoView({block:'start',behavior:'instant'});}
}
function mapView(){return mapWorkbenchView({session,life:currentLife(),node:selectedNode(),graphMode,layout:workbenchLayout,escape,icon,stageNames,priorityNames,stats:graphStatistics(currentLife()),aiAvailable:aiStatus.available});}
function drawGraph(){const canvas=$('#graph-canvas');if(!canvas)return;const width=Math.max(590,$('#graph-scroll').clientWidth)*zoom;canvas.style.width=width+'px';const height=canvas.clientHeight;const points=[[.17,.25],[.5,.25],[.83,.25],[.83,.68],[.5,.68],[.17,.68]].map(([x,y])=>({x:x*width,y:y*height}));const life=currentLife();const changedIndex=life.changedNodeId?life.nodes.findIndex(n=>n.id===life.changedNodeId):99;let edges='';for(let i=0;i<5;i++){const edge={source:points[i],target:points[i+1],curvature:i===2?-1.4:0,pairTotal:1};const label=getLinkMidpoint(edge);edges+=`<path d="${getLinkPath(edge)}" fill="none" stroke="${i>=changedIndex?'#b4a1c6':'#b8c8af'}" stroke-width="1.4" stroke-dasharray="4 5"/><circle cx="${label.x}" cy="${label.y}" r="3" fill="${i>=changedIndex?'#c7b5d5':'#c2d0b9'}"/>`;if(i===2)edges+=`<text x="${label.x-7}" y="${label.y+5}" text-anchor="end" fill="#a3ad98" font-size="9">继续生长</text>`;}$('#graph-lines').innerHTML=edges;$('#graph-lines').setAttribute('viewBox',`0 0 ${width} ${height}`);}
function field(label,name,value='',placeholder='',type='text',required=true){return `<label class="field"><span class="field-label">${label}</span><input class="input" name="${name}" type="${type}" value="${escape(value)}" placeholder="${escape(placeholder)}" ${required?'required':''} ${type==='number'?'min="16" max="80" step="1"':(name==='name'?'maxlength="40"':'maxlength="80"')}></label>`;}
function textarea(label,name,placeholder,max=240){return `<label class="field"><span class="field-label">${label}</span><textarea class="input" name="${name}" placeholder="${escape(placeholder)}" maxlength="${max}" required>${escape(draft[name]||'')}</textarea></label>`;}
function radio(name,items,value){return `<div class="choice-grid">${items.map(([id,label])=>`<label class="choice-label"><input type="radio" name="${name}" value="${id}" ${value===id?'checked':''} required>${label}</label>`).join('')}</div>`;}
function onboardView(){const content=[`<div class="field-row">${field('怎么称呼你','name',draft.name,'一个你喜欢的名字')}${field('现在的年龄','age',draft.age||22,'','number')}</div><label class="field"><span class="field-label">你正处在人生的哪个阶段？</span><select class="input" name="stage">${Object.entries(stageNames).map(([id,l])=>`<option value="${id}" ${draft.stage===id?'selected':''}>${l}</option>`).join('')}</select></label><p class="notice">不需要真实姓名。写下你愿意带进这次探索的信息就好。</p>`,`${textarea('你期待未来的生活是什么样的？','vision','比如，在海边生活，从事喜欢的设计，每年给自己一段旅行的时间。')}<div class="field"><span class="field-label">如果先选一个，你现在更在意什么？</span>${radio('priority',Object.entries(priorityNames),draft.priority||'freedom')}</div>`, `<div class="field"><span class="field-label">面对接下来的学习与工作，你更倾向于？</span>${radio('education',[['study','继续学习'],['work','进入或继续工作'],['explore','先探索不同方向']],draft.education||'work')}</div>${field('你感兴趣的工作方向','work',draft.work,'比如设计、教育、科技、经营一家小店')}${textarea('有没有一个你想尝试改写的选择？','question','比如，留在熟悉的城市，还是去一个新的地方？')}`][formStep];return `<section class="page-heading"><div class="eyebrow">A STARTING POINT, NOT A DEFINITION</div><h1>从此刻的你开始。</h1><p>留下几个线索，让这段人生与你有关。</p></section><div class="form-layout"><form class="form-card" id="profile-form"><div class="form-progress">${[0,1,2].map(i=>`<i class="${i<=formStep?'active':''}"></i>`).join('')}</div><div class="form-step-label">0${formStep+1} / 03</div><h2>${['先认识一下现在的你','给未来一个意象','把选择带进故事'][formStep]}</h2>${content}<div class="form-actions"><button type="button" class="plain-btn" data-action="form-back">${formStep?'返回上一步':'返回人生图'}</button><button type="submit" class="btn">${formStep===2?'生成我的人生':'继续'} ${icon('arrow',15)}</button></div><p class="notice">点击生成后，你填写的信息将通过本机后台发送给 ${modelName(aiStatus.model)}，生成可能的人生故事。档案保存在当前浏览器，可导出保存。</p></form><aside class="aside-story"><div class="orbit-art" aria-hidden="true"><i></i><i></i><i></i></div><div class="eyebrow">A NOTE TO YOUR FUTURE SELF</div><h3>不必想好一切，<br>先让可能性发生。</h3><p>你写下的期待，会成为人生图的起点。在活动现场，你可以回来，选中一个节点，试着走向另一个方向。</p></aside></div>`;}
function compareView(){const base=session.lives[0],branches=session.lives.slice(1);if(!branches.length)return `<section class="page-heading"><div class="eyebrow">PARALLEL POSSIBILITIES</div><h1>同一个起点，不同的故事。</h1><p>把改变前后的人生放在一起，看看一个选择如何影响后来。</p></section><div class="empty-state">${icon('branch',42)}<h2>你的第一条分支，还没有发生。</h2><p>回到人生图，选择一个节点并改写它。这里就会出现原始路径与新路径的对照。</p><button class="btn" data-action="nav" data-page="map">去改变一个选择 ${icon('arrow',15)}</button></div>`;const newer=branches.find(l=>l.id===compareId)||branches.find(l=>l.id===session.activeLifeId)||branches.at(-1);compareId=newer.id;return `<section class="page-heading"><div class="eyebrow">PARALLEL POSSIBILITIES</div><h1>同一个起点，不同的故事。</h1><p>紫色标记的节点，记录了你的选择带来的变化。</p></section><div class="path-picker"><span>与初始人生比较</span><select class="input" id="compare-picker" aria-label="选择要比较的人生分支">${branches.map((l,i)=>`<option value="${escape(l.id)}" ${l.id===newer.id?'selected':''}>分支 ${i+1} · ${escape(l.change?.after||l.label)}</option>`).join('')}</select><button class="btn secondary small" data-action="switch-life" data-id="${escape(newer.id)}">在图中查看 ${icon('arrow',14)}</button></div><div class="comparison">${[base,newer].map((life,col)=>`<section class="compare-card"><div class="compare-head ${col?'new':''}"><h2>${col?'修改后的可能':'最初的故事'}</h2><p>${col?escape(life.change?.after||life.label):'活动前生成的初始人生'}</p></div><div class="timeline">${life.nodes.map((n,i)=>`<div class="timeline-item ${col&&JSON.stringify(n)!==JSON.stringify(base.nodes[i])?'changed':''}"><div class="timeline-age">${escape(n.age)} 岁 · ${escape(n.category)}</div><h3>${escape(n.title)}</h3><p>${escape(n.detail||n.summary)}</p></div>`).join('')}</div></section>`).join('')}</div>`;}
function reportView(){const p=session.profile,life=currentLife(),base=session.lives[0];return `<section class="page-heading"><div class="eyebrow">A LETTER FROM YOUR POSSIBLE FUTURE</div><h1>把这些可能，带回生活。</h1><p>记录你从哪里出发，改变了什么，又看见了怎样的未来。</p></section><div class="report-layout"><div class="report-toolbar"><button class="btn secondary" data-action="archive">${icon('download',14)}保存档案</button><button class="btn secondary" data-action="print" ${life.mode==='ai'&&!life.aiReport?'disabled':''}>${icon('print',14)}打印 / 保存 PDF</button><button class="btn" data-action="download-report" ${life.mode==='ai'&&!life.aiReport?'disabled':''}>${icon('download',14)}下载电子版（TXT）</button></div><p class="report-delivery-note">电子版：下载文字报告，或在打印窗口中选择「另存为 PDF」。纸质版：选择已连接的打印机打印。</p><article class="report-paper"><div class="eyebrow">branch · PERSONAL LIFE EXPLORATION</div><h2 class="report-title">${escape(p.name)}的人生探索报告</h2><div class="report-meta"><span>档案 ${escape(session.code)}</span><span>${session.lives.length} 条路径 · ${session.lives.length-1} 次改写</span><span>${life.mode==='ai'?modelName(life.generation.model)+' · AI 情景推演':'预设示例路径'}</span></div><section class="report-section"><h2>01 你期待的未来</h2><p class="vision-quote">“${escape(p.vision)}”</p><p>你从 ${escape(p.age)} 岁的${escape(stageNames[p.stage]||p.stage)}出发，关注${escape(p.work)}，当下更看重${escape(priorityNames[p.priority]||p.priority)}。</p><p>带入这次探索的问题：${escape(p.question)}</p></section><section class="report-section"><h2>02 最初的故事</h2><div class="report-path">${base.nodes.map(n=>`<span>${escape(n.title)}</span>`).join(' → ')}</div><p>${escape(base.nodes.at(-1).detail)}</p></section><section class="report-section"><h2>03 你亲手改变的选择</h2>${session.lives.length===1?'<p>你还没有改写节点。这份报告记录了初始人生，之后的探索会继续出现在这里。</p>':session.lives.slice(1).map((l,i)=>`<div class="report-change"><small>分支 ${i+1} · ${escape(l.nodes.find(n=>n.id===l.changedNodeId)?.age||'')} 岁</small><h3>${escape(l.change?.before||'原有选择')} → ${escape(l.change?.after||l.label)}</h3><p>${escape(l.nodes.at(-1).detail)}</p></div>`).join('')}</section>${aiReportMarkup(life)}<section class="report-section"><h2>04 此刻停留的那条人生</h2><p>当前查看：${life.id===base.id?'初始路径':escape(life.label)}</p><p>${escape(life.nodes.at(-1).summary)}</p><p>这些可能之中，哪一部分最接近你最初写下的生活？这个问题，留给做出选择的你。</p></section><div class="report-end">${life.mode==='ai'?'本路径由 '+modelName(life.generation.model)+' 根据你的信息与选择生成，内容是可能的情景，不代表未来事实。示例路径会保留自己的来源。节点年龄仅用于安排叙事时间线。':'当前是预设示例故事。创建新档案后，可以使用 AI 探索自己的选择。'}<br>branch · 每一次选择，都值得被看见。</div></article></div>`;}
function aboutView(){return `<section class="page-heading"><div class="eyebrow">BUILT WITH CONTEXT</div><h1>这段体验，从哪里开始。</h1><p>branch 是 parallax 推出的人生推演互动体验。这里记录原型的技术来源与实现方式。</p></section><div class="source-grid"><section class="source-card"><span class="badge">来自 MiroFish</span><h2>图谱的连线与曲线标签</h2><p>从 GraphPanel.vue 中抽取并适配两个函数：</p><ul><li>getLinkPath：生成 SVG 直线、曲线和自环路径。</li><li>getLinkMidpoint：计算连线标签与标记的位置。</li><li>改为独立 JavaScript 模块，并加入坐标重合保护。</li></ul><a href="https://github.com/666ghj/MiroFish/blob/7657031ac01184afe2cb220f5ee3545573b5e843/frontend/src/components/GraphPanel.vue#L500" target="_blank" rel="noopener">查看上游代码 ↗</a></section><section class="source-card"><span class="badge purple">为 branch 新增</span><h2>从个人意象到平行人生</h2><ul><li>白底人手与机械手相向的动态开场，衔接 Three.js 光影隧道与人生档案袋堆叠展开动画。</li><li>三步信息问卷与个人人生档案。</li><li>参照 MiroFish 的全屏图谱工作台，支持图谱、分屏与工作台切换；动态图可拖拽、缩放与暂停。</li><li>根据玩家输入生成的六个人生节点。</li><li>预设选择与自由输入，保留历史路径。</li><li>节点改写后下游事件联动，以及分支对照。</li><li>人生报告、打印和文字下载。</li><li>本地编号连接、档案导出与跨设备导入。</li></ul></section></div><div class="source-note"><strong>当前运行方式</strong><p>branch 自己的网页通过本机后台连接 ${modelName(aiStatus.model)}。填写信息后由 AI 生成人生节点；改写节点后保留过去、重新推演后续事件，完整报告在打开时按需生成并保存。仅复用 MiroFish 的部分图谱绘制代码，没有调用 MiroFish 后台或 Zep。示例档案仍是明确标记的预设故事。</p><p>档案只保存在当前浏览器。个人编号可在此浏览器中重新连接；跨设备需先导出，再导入档案文件。不要把示例页面理解为已经拥有云端账号或后台人生预测服务。</p><p>网站源代码按 AGPL-3.0 提供，保留 MiroFish 的来源、许可和改动记录。Three.js 0.180.0 使用 MIT 许可，原文保存在 vendor/THREE-LICENSE.txt。图谱实现来源版本：7657031ac01184afe2cb220f5ee3545573b5e843。</p><div class="modal-actions" style="margin-top:18px"><a class="btn secondary" href="./source.zip" download>${icon('download',14)}下载完整网页源码</a><a class="btn secondary" href="./LICENSE.txt" target="_blank">查看开源许可</a><a class="btn secondary" href="./PROVENANCE.md" target="_blank">查看复用明细</a></div></div>`;}
function openModal(body,wide=false){modalReturn=document.activeElement;$('#modal-root').innerHTML=`<div class="overlay"><section class="modal ${wide?'wide':''}" role="dialog" aria-modal="true" aria-labelledby="dialog-title"><button class="modal-close icon-button" data-action="close-modal" aria-label="关闭">${icon('close',15)}</button>${body}</section></div>`;setTimeout(()=>$('.modal input:not([type=radio]),.modal button')?.focus(),0);}
function closeModal(){if(aiBusy)return;$('#modal-root').innerHTML='';modalReturn?.focus();}
async function createFullLife(){
  await aiReady;
  if((aiStatus.revision||0)<6)return toast('完整人生版需要运行本地启动器更新后台，然后刷新页面。原档案会保留。');
  const payload={kind:'generate',profile:session.profile};
  try{commitGenerated(payload,await runAI(payload));}catch(error){toast(error.message);}
}
function choiceExample(node){
  if(node.age>=65)return '比如，减少工作投入，把时间留给喜欢的事、重要的人和熟悉的社区，尝试一种更自在的晚年生活。';
  const examples={
    education:'比如，先用三个月尝试一个实际项目，再决定接下来的工作方向和需要补充的技能。',
    career:'比如，加入一个稳定的团队，同时每周留出固定时间做自己的创作项目。',
    city:'比如，先在想去的城市短住一段时间，了解工作机会、生活成本和居住条件，再决定是否搬过去。',
    turning:'比如，先保留现有收入，用半年时间尝试一个新方向，再决定是否正式转型。',
    ending:'比如，保留已经积累的事业方向，减少加班，给重要的人和自己的生活留出固定时间。'
  };
  return examples[node.id]||'比如，调整工作与生活的安排，尝试一种更接近自己期待的生活。';
}
function editNode(){const n=selectedNode();if(!n.options.length)return;openModal(`<div class="eyebrow">WHAT IF YOU CHOOSE AGAIN</div><h2 id="dialog-title">如果这一次，换个方向。</h2><p class="lead">${escape(n.age)} 岁 · ${escape(n.title)}<br>先选下面的一个方向，或写下自己的选择。生成后，这个阶段以后的整段人生会重新展开。</p><form id="branch-form">${n.options.map((o,i)=>`<label class="option-card"><input type="radio" name="option" value="${escape(o.id)}" ${n.selectedOption?.id===o.id?'checked':''}><span><strong>${escape(o.label)}</strong><small>${escape(o.description)}</small></span></label>`).join('')}<label class="option-card"><input type="radio" name="option" value="custom" ${n.selectedOption?.id==='custom'?'checked':''}><span><strong>我想试试自己的选择</strong><small>用一句话，说说你想怎样改变。</small></span></label><label class="field"><span class="field-label">我的新选择</span><textarea class="input" name="custom" maxlength="180" placeholder="${escape(choiceExample(n))}">${n.selectedOption?.id==='custom'?escape(n.selectedOption.label):''}</textarea></label><div id="branch-error" class="error" role="alert"></div><button class="btn purple wide" type="submit">看看后半生会怎样 ${icon('arrow',15)}</button><p class="notice">本次由 ${modelName(aiStatus.model)} 根据新选择重新推演。此前节点与原路径保留，先更新后续故事，打开人生报告时再生成完整报告。</p></form>`);}
function connect(){openModal(`<div class="eyebrow">WELCOME BACK</div><h2 id="dialog-title">连接你的人生。</h2><p class="lead">输入个人编号，回到当前浏览器里保存的故事。</p><form id="connect-form"><label class="field"><span class="field-label">个人编号</span><input class="input" name="code" placeholder="输入你的个人编号" required maxlength="24" autocomplete="off" style="text-transform:uppercase"></label><div id="connect-error" class="error" role="alert"></div><button class="btn wide" type="submit">进入我的人生 ${icon('arrow',14)}</button></form><div class="divider"></div><button class="plain-btn" data-action="import">${icon('upload',15)}从其他设备导入档案</button><p class="notice">编号只在保存过档案的浏览器中有效。更换设备时，请导入此前导出的 JSON 档案文件。</p>${Object.keys(sessions).length?`<div class="divider"></div><div class="mini-label">本机已保存的档案</div>${Object.values(sessions).map(s=>`<button class="branch-tab" style="margin:3px" data-action="load-session" data-code="${escape(s.code)}">${escape(s.profile.name)} · ${escape(s.code)}</button>`).join('')}`:''}`);}
function archive(){openModal(`<div class="eyebrow">YOUR PERSONAL ARCHIVE</div><h2 id="dialog-title">给这段人生，留一把钥匙。</h2><p class="lead">保存编号，或把档案导出，带到活动现场的设备上继续。</p><div class="code-box"><p>${escape(session.profile.name)}的个人编号${session.isDemo?' · 示例':''}</p><div class="code-display">${escape(session.code)}</div><p>只用于当前浏览器中的档案连接</p></div><div class="modal-actions"><button class="btn" data-action="export">${icon('download',15)}导出档案</button><button class="btn secondary" data-action="import">${icon('upload',15)}导入档案</button></div><p class="notice">档案包含你的回答和全部人生分支。下载的 JSON 文件可以在另一台设备上导入；调用 AI 时，相关信息会经本机后台发送给模型；档案保存在当前浏览器。</p>`);}
function download(name,content,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([content],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000);}
function navigate(target){history.replaceState(null,document.title,location.pathname+location.search);page=target;closeModal();render();window.scrollTo({top:0,behavior:'instant'});const heading=document.querySelector('#app h1,#app h2');if(heading){heading.setAttribute('tabindex','-1');heading.focus({preventScroll:true});}if(target==='report')void ensureReport();}
document.addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(!b)return;e.preventDefault();if(aiBusy)return;const a=b.dataset.action;
  if(a==='nav')navigate(b.dataset.page);
  else if(a==='hands-pause'){hero?.toggleHandsPause();}
  else if(a==='tunnel-pause'){const paused=hero?.togglePause();b.textContent=paused?'▷':'Ⅱ';b.setAttribute('aria-label',paused?'播放开场动画':'暂停开场动画');}
  else if(a==='experience-guide'){openModal(`<div class="eyebrow">BRANCH / BY PARALLAX</div><h2 id="dialog-title">从一个选择开始。</h2><div class="guide-step"><b>01</b><div><h3>读一段人生</h3><p>点上方年龄，或图中的人生节点，阅读当时的故事。</p></div></div><div class="guide-step"><b>02</b><div><h3>换一个方向</h3><p>点击「改写这个节点」，选择其他方向，或写下自己的想法。提交后新选择立即显示，AI 完成的结果随后更新。</p></div></div><div class="guide-step"><b>03</b><div><h3>看选择的回响</h3><p>紫色感叹号标出变化。点开节点对照改写前后，再查看报告。旧路径保存在上方历史中。</p></div></div><button class="btn" data-action="close-modal">开始探索 →</button>`);}
  else if(a==='full-life'){void createFullLife();}
  else if(a==='next-stage'){const nodes=currentLife().nodes;const index=nodes.findIndex(n=>n.id===selected);selectWorkbenchNode(nodes[Math.min(index+1,nodes.length-1)].id);}
  else if(a==='new'){draft={stage:'university',priority:'freedom',education:'work'};formStep=0;navigate('onboard');}
  else if(a==='workbench-layout'){if(['graph','split','workbench'].includes(b.dataset.layout)){workbenchLayout=b.dataset.layout;render();}}
  else if(a==='graph-network'||a==='graph-timeline'){graphMode=a==='graph-network'?'network':'timeline';render();}
  else if(a==='network-pause'){b.textContent=network.togglePause()?'继续运动':'暂停运动';}
  else if(a==='network-labels'){const visible=network.toggleLabels();b.textContent=visible?'隐藏关系':'显示关系';b.setAttribute('aria-pressed',String(visible));}
  else if(a==='network-reset'){network.reset();}
  else if(a==='select-node'){selectWorkbenchNode(b.dataset.id);}
  else if(a==='edit-node')editNode();
  else if(a==='switch-life'){session.activeLifeId=b.dataset.id;save();navigate('map');}
  else if(a==='connect')connect();
  else if(a==='archive')archive();
  else if(a==='close-modal')closeModal();
  else if(a==='load-session'){session=sessions[b.dataset.code];selected='education';save();navigate('map');toast('已连接你的个人档案。');}
  else if(a==='form-back'){if(formStep){draft={...draft,...Object.fromEntries(new FormData($('#profile-form')))};formStep--;render();}else navigate('map');}
  else if(a.startsWith('zoom-')){if(graphMode==='network'){if(a==='zoom-in')network.zoomIn();else if(a==='zoom-out')network.zoomOut();else network.reset();return;}zoom=a==='zoom-reset'?1:Math.max(.85,Math.min(1.5,zoom+(a==='zoom-in'?.1:-.1)));const scroll=$('#graph-scroll').scrollLeft;render();$('#graph-scroll').scrollLeft=scroll;}
  else if(a==='export'){download(`branch-${session.profile.name}-人生档案.json`,JSON.stringify({...session,exportedAt:new Date().toISOString()},null,2),'application/json');toast('档案已导出，可在其他设备上导入。');}
  else if(a==='import')$('#import-file').click();
  else if(a==='retry-report'){void ensureReport(true);}
  else if(a==='download-report'){if(currentLife().mode==='ai'&&!currentLife().aiReport)return toast('请等待报告生成完成。');download(`branch-${session.profile.name}-人生报告.txt`,buildReport(session),'text/plain;charset=utf-8');toast('人生报告已下载。');}
  else if(a==='print'){if(currentLife().mode==='ai'&&!currentLife().aiReport)return toast('请等待报告生成完成。');window.print();}
});

function aiReportMarkup(life){
  const report=life.aiReport;if(!report){
    if(life.mode!=='ai')return '';
    const state=reportJobs.get(life.id);
    return '<section class="report-section report-pending" aria-live="polite"><h2>正在把故事整理成报告</h2><p>'+escape(state?.message||'第一次打开时生成完整报告，完成后会保存在这条人生中。')+'</p>'+(state?.state==='failed'?'<button class="btn secondary" data-action="retry-report">重新生成报告</button>':'<div class="ai-progress" aria-hidden="true"><i></i><i></i><i></i></div><p class="notice">你可以先回到人生图，报告完成后会自动保存。</p>')+'</section>';
  }
  return '<section class="report-section"><h2>AI 推演笔记</h2><p class="notice">'+modelName(report.model||life.generation.model)+'</p><p>'+escape(report.summary)+'</p>'+[['causalChain','一个选择，如何影响后来'],['tradeoffs','得到与付出'],['assumptions','这段故事基于哪些假设'],['questions','带回现实的问题']].map(([key,label])=>'<h3>'+label+'</h3><ul>'+report[key].map(t=>'<li>'+escape(t)+'</li>').join('')+'</ul>').join('')+'</section>';
}
async function ensureReport(retry=false){
  const life=currentLife();
  if(life.mode!=='ai'||life.aiReport)return;
  const existing=reportJobs.get(life.id);
  if(existing?.state==='running'||(existing?.state==='failed'&&!retry))return;
  const source=structuredClone(session),id=life.id,code=session.code;
  const state={state:'running',message:'正在整理这条人生的因果、取舍与反思…'};
  reportJobs.set(id,state);if(page==='report')render();
  try{
    const generated=await inferLife({kind:'report',session:source});
    if(generated.id!==id||JSON.stringify(generated.nodes)!==JSON.stringify(life.nodes)||!generated.aiReport)throw Error('报告与当前路径不匹配，请重试。');
    // Merge only this report; navigation or a new active branch must not be overwritten.
    const target=session.code===code?session:sessions[code];
    if(!target)throw Error('该档案已移除，报告没有保存。');
    const updated={...target,lives:target.lives.map(l=>l.id===id?{...l,aiReport:generated.aiReport}:l)};
    if(!validSession(updated))throw Error('报告档案未通过检查，请重试。');
    sessions[code]=updated;if(session.code===code)session=updated;
    save();acknowledgeTask({kind:'report',session:source});state.state='completed';state.message='报告已保存。';
    toast('人生报告已生成并保存。');
  }catch(error){state.state='failed';state.message=error.message||'报告生成失败，你的人生节点已保留。';}
  if(page==='report'&&currentLife().id===id)render();
}
async function runGraphAI(payload){
  if(aiBusy)throw Error('请等待当前推演完成。');
  closeModal();graphMode='network';workbenchLayout='split';page='map';selected=payload.nodeId;render();aiBusy=true;
  await new Promise(resolve=>requestAnimationFrame(resolve));
  network?.beginPreview(payload.nodeId,payload.choice.label);
  try{return await inferLife(payload,(message,job)=>network?.updatePreview(job.nodes,message));}
  catch(error){render();throw error;}
  finally{aiBusy=false;}
}
async function runAI(payload){
  if(payload.kind==='branch')return runGraphAI(payload);
  if(aiBusy)throw Error('请等待当前推演完成。');
  openModal('<div class="eyebrow">branch / AI SIMULATION</div><h2 id="dialog-title">你的选择，正在展开。</h2><div class="ai-progress" aria-hidden="true"><i></i><i></i><i></i></div><p id="ai-progress-text" class="lead" role="status">正在连接 '+modelName(aiStatus.model)+'…</p><p id="ai-elapsed" class="notice">已等待 0 秒</p><div id="ai-node-preview" class="ai-node-preview" aria-live="polite"></div><p class="notice">节点将按实际完成情况逐步出现。完整报告在打开时再生成。原来的路径会保留；刷新后会恢复这次推演。</p>');
  aiBusy=true;$('.modal-close').hidden=true;
  const resumed=pendingTasks().find(r=>JSON.stringify(r.payload)===JSON.stringify(payload));
  const started=resumed?.started||Date.now();let shown=0;
  const timer=setInterval(()=>{const el=$('#ai-elapsed');if(el)el.textContent='已等待 '+Math.floor((Date.now()-started)/1000)+' 秒';},1000);
  try{return await inferLife(payload,(message,job)=>{
    const status=$('#ai-progress-text');if(status)status.textContent=message;
    const preview=$('#ai-node-preview');
    if(preview&&job.nodes?.length>shown){
      for(const node of job.nodes.slice(shown)){
        const article=document.createElement('article');article.className='ai-node-card';
        article.innerHTML='<small>已展开 '+(shown+1)+' / '+job.total+' · 待整条路径校验</small><h3>'+escape(node.title)+'</h3><p>'+escape(node.summary)+'</p><details><summary>展开故事</summary><p>'+escape(node.detail)+'</p></details>';
        preview.append(article);shown++;
      }
    }
  });}
  finally{clearInterval(timer);aiBusy=false;closeModal();}
}
function commitGenerated(payload,life){
  let next;
  if(payload.kind==='generate'){
    const existing=Object.values(sessions).find(s=>s.lives.some(l=>l.id===life.id));
    next=existing||{schemaVersion:1,code:newCode(),isDemo:false,profile:life.profile,lives:[life],activeLifeId:life.id};
  }else{
    const source=payload.session;
    const stored=Object.values(sessions).find(s=>s.lives.some(l=>l.id===life.id));
    next=stored||{...source,code:source.isDemo?newCode():source.code,isDemo:false,lives:[...source.lives,life],activeLifeId:life.id};
  }
  if(!validSession(next))throw Error('AI 档案未通过完整性检查，原路径没有改变。');
  session=next;selected=payload.nodeId||'education';zoom=1;compareId=life.id;branchDraft=null;
  save();acknowledgeTask(payload);navigate('map');
  if(payload.kind==='generate')openModal(`<div class="eyebrow">YOUR LIFE · START HERE</div><h2 id="dialog-title">你的人生已经展开。</h2><p class="lead">从 ${life.nodes[0].age} 岁到 ${life.nodes.at(-1).age} 岁，用几个大阶段读完一生。</p><ol><li>先读故事：点击「读下一阶段」，了解这条人生。</li><li>遇到想改变的地方：点击「改写这个节点」。</li><li>新路径生成后：对照两条人生，再查看人生报告。</li></ol><p class="notice">不用每一步都做选择，也可以随时回到前面的阶段。时间是情景设定，不代表寿命预测。档案已保存在这个浏览器。</p><button class="btn" data-action="close-modal">开始读我的人生 →</button>`);
  toast(payload.kind==='branch'?'人生图已原地更新。放大的 ! 节点是本次改变的地方，点击可查看前后变化。':'人生已保存。先点击一个阶段读故事，再改写选择。');
}
function restoreBranchDraft(){
  if(!branchDraft||branchDraft.lifeId!==currentLife().id)return;
  selected=branchDraft.nodeId;editNode();
  const form=$('#branch-form');if(!form)return;
  const radio=[...form.querySelectorAll('[name=option]')].find(el=>el.value===branchDraft.option);if(radio)radio.checked=true;
  form.querySelector('[name=custom]').value=branchDraft.custom||'';
}
async function restorePending(){
  await aiReady;
  const record=pendingTasks().find(r=>r.payload.kind!=='report');
  if(record){
    const payload=record.payload;
    if(payload.kind==='branch'&&!validSession(payload.session)){acknowledgeTask(payload);return;}
    if(payload.kind==='generate'){draft=payload.profile;formStep=2;page='onboard';}
    else{session=payload.session;selected=payload.nodeId;page='map';branchDraft={lifeId:currentLife().id,nodeId:selected,option:payload.choice.id,custom:payload.choice.id==='custom'?payload.choice.label:''};}
    render();
    try{commitGenerated(payload,await runAI(payload));}
    catch(error){render();if(payload.kind==='branch')restoreBranchDraft();toast(error.message);}
  }else{
    if(page==='map')restoreBranchDraft();
    if(page==='report')void ensureReport();
  }
}
function newCode(){let code;do{code='CIBE-'+crypto.randomUUID().replaceAll('-','').slice(0,8).toUpperCase();}while(sessions[code]);return code;}
document.addEventListener('submit',async e=>{
  const form=e.target;e.preventDefault();if(aiBusy)return;
  const values=Object.fromEntries(new FormData(form));
  if(form.id==='profile-form'){
    if(Object.values(values).some(v=>typeof v==='string'&&!v.trim()))return toast('请填写内容后继续。');
    draft={...draft,...values};persistView();
    if(formStep<2){formStep++;render();window.scrollTo({top:0,behavior:'instant'});return;}
    const profile={...draft,age:Number(draft.age)};
    try{
      const life=await runAI({kind:'generate',profile});
      commitGenerated({kind:'generate',profile},life);
    }catch(error){render();toast(error.message||'生成未完成，请重试。');}
  } else if(form.id==='branch-form'){
    const node=selectedNode();
    const choice=values.option==='custom'?{id:'custom',label:values.custom.trim(),description:'玩家写下的新选择'}:node.options.find(o=>o.id===values.option);
    if(!choice||!choice.label){$('#branch-error').textContent='请写下你想尝试的新选择。';return;}
    if(session.lives.length>=100){$('#branch-error').textContent='这个档案已保存 100 条路径，请导出后创建新档案。';return;}
    try{
      branchLife(currentLife(),node.id,choice);
      const source=JSON.parse(JSON.stringify(session));
      const life=await runAI({kind:'branch',session:source,nodeId:node.id,choice});
      commitGenerated({kind:'branch',session:source,nodeId:node.id,choice},life);
    }catch(error){
      editNode();const f=$('#branch-form');if(f){const radio=[...f.querySelectorAll('[name=option]')].find(x=>x.value===values.option);if(radio)radio.checked=true;f.querySelector('[name=custom]').value=values.custom||'';$('#branch-error').textContent=error.message||'改写未完成，请重试。';}
    }
  } else if(form.id==='connect-form'){
    const code=values.code.trim().toUpperCase();
    if(code==='CIBE-DEMO'){const life=createLife(demoProfile);session={schemaVersion:1,code,isDemo:true,profile:demoProfile,lives:[life],activeLifeId:life.id};}
    else if(sessions[code])session=sessions[code];
    else{$('#connect-error').textContent='此浏览器中没有找到这个编号。请核对编号，或导入其他设备上的档案。';return;}
    selected='education';save();navigate('map');toast('已连接人生档案。');
  }
});

document.addEventListener('change',e=>{if(e.target.id==='compare-picker'){compareId=e.target.value;render();}});
$('#import-file').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{if(file.size>2_000_000)throw new Error('文件过大');const imported=JSON.parse(await file.text());if(!validSession(imported))throw new Error('不是有效的 branch 档案');if(imported.code==='CIBE-DEMO'||sessions[imported.code])imported.code='CIBE-'+crypto.randomUUID().replaceAll('-','').slice(0,8).toUpperCase();imported.isDemo=false;session=imported;save();selected='education';navigate('map');toast('档案已导入，可以继续探索。');}catch{toast('无法导入：请选择由 branch 导出的完整 JSON 档案（不超过 2 MB）。');}e.target.value='';});
document.addEventListener('keydown',e=>{const modal=$('.modal');if(!modal)return;if(e.key==='Escape')closeModal();if(e.key==='Tab'){const list=[...modal.querySelectorAll('button,input,textarea,select,a[href]')].filter(el=>!el.disabled);const first=list[0],last=list.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}});
window.addEventListener('resize',()=>{if(page==='map'&&graphMode==='timeline')drawGraph();});
render();



aiReady.then(()=>{if(page==='home'||page==='map')render();void restorePending();});
