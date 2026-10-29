import {modelName} from './engine.js';
/** branch life workbench. View-only composition; app.js owns state and actions. */
export function mapWorkbenchView({ session, life, node, graphMode = 'network', layout = 'split', escape, icon, stageNames = {}, priorityNames = {}, stats = {}, aiAvailable = false }) {
  const e = escape;
  const p = session.profile;
  const base = session.lives[0];
  const isBase = life.id === base.id;
  const parent=session.lives.find(l=>l.id===life.parentId);
  const beforeNode=parent?.nodes.find(n=>n.id===node.id);
  const nodeChanged=beforeNode&&['title','summary','detail'].some(key=>beforeNode[key]!==node[key]);
  const changeNotice=nodeChanged?`<aside class="wb-change-detail"><strong><span aria-hidden="true">!</span> ${node.id===life.changedNodeId?'这是你主动改写的阶段':'这个阶段受到前面选择的影响'}</strong><p>触发选择：${e(life.change?.after||'新的选择')}</p><details><summary>查看这次改写前后有什么不同</summary><div><small>改写前</small><p>${e(beforeNode.detail||beforeNode.summary)}</p><small>改写后</small><p>${e(node.detail||node.summary)}</p></div></details></aside>`:'';
  const mode = ['graph', 'split', 'workbench'].includes(layout) ? layout : 'split';
  const choices = node.options || [];
  const nodeNumber = life.nodes.findIndex(n => n.id === node.id) + 1;
  const count = value => Number.isFinite(value) ? e(value) : '—';
  const typeCount = Array.isArray(stats.types) ? stats.types.length : stats.types;
  const branchNumber = session.lives.findIndex(l => l.id === life.id);
  const changedNodes=parent?life.nodes.filter(n=>{const old=parent.nodes.find(x=>x.id===n.id);return old&&['title','summary','detail'].some(k=>old[k]!==n[k]);}):[];
  const branchLabel = isBase ? '初始人生' : `分支 ${branchNumber}`;
  const field = (label, value, wide = false) => `<div class="wb-field${wide ? ' wb-field-wide' : ''}"><span>${label}</span><div class="wb-field-value">${e(value || '尚未填写')}</div></div>`;
  const modeIcon = (kind) => `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.25" aria-hidden="true">${kind === 'graph' ? '<circle cx="4" cy="4" r="2"/><circle cx="12" cy="6" r="2"/><circle cx="6" cy="12" r="2"/><path d="m6 4 4 1M4 6l1 4m3 1 3-3"/>' : kind === 'split' ? '<rect x="1.5" y="2.5" width="13" height="11" rx="1.5"/><path d="M8 3v10"/>' : '<rect x="2.5" y="1.5" width="11" height="13" rx="1.5"/><path d="M5 5h6M5 8h6M5 11h4"/>'}</svg>`;
  const timeline = life.nodes.map((n, i) => {
    const position = [[17,25],[50,25],[83,25],[83,68],[50,68],[17,68]][i] || [50,50];
    const changed = !isBase && JSON.stringify(n) !== JSON.stringify(base.nodes[i]);
    return `<button class="life-node ${n.id === node.id ? 'selected' : ''} ${changed ? 'changed' : ''}" style="left:${position[0]}%;top:${position[1]}%" data-action="select-node" data-id="${e(n.id)}" aria-label="${e(n.age)}岁 ${e(n.title)}" aria-pressed="${n.id === node.id}"><div class="node-top"><span>${e(n.age)} 岁 · ${String(i + 1).padStart(2, '0')}</span>${icon(['leaf','book','work','pin','branch','spark'][i], 14)}</div><div class="node-title">${e(n.title)}</div><div class="node-subtitle">${e(n.category)}</div><span class="node-port"></span></button>`;
  }).join('');
  return `<main class="life-workbench layout-${mode}">
    <header class="wb-topbar">
      <div class="wb-top-left"><button class="wb-back" data-action="nav" data-page="home" aria-label="返回 branch 首页">${icon('arrow', 17)}</button><button class="wb-wordmark" data-action="nav" data-page="home">branch<span>by parallax</span></button><span class="wb-top-divider"></span><h1>人生探索空间</h1></div>
      <div class="wb-layout-switch" role="group" aria-label="工作台布局">${[['graph','图谱'],['split','分屏'],['workbench','工作台']].map(([id,label]) => `<button data-action="workbench-layout" data-layout="${id}" class="${mode === id ? 'active' : ''}" aria-pressed="${mode === id}">${modeIcon(id)}<span>${label}</span></button>`).join('')}</div>
      <div class="wb-top-right"><button class="wb-help" data-action="experience-guide">使用指南</button><span class="wb-status"><i></i>${life.mode==='ai'?'AI 路径':'示例路径'}</span><button class="wb-save" data-action="archive">${icon('download', 14)}<span>我的档案</span></button></div>
    </header>
    <div class="wb-body">
      <section class="graph-panel wb-graph-panel" aria-label="人生节点图">
        <div class="wb-graph-heading"><div><span class="wb-overline">LIFE KNOWLEDGE GRAPH</span><h2>${e(p.name)}的人生图谱 <span class="wb-graph-ready">已生成</span></h2></div><button class="wb-icon-button" data-action="network-reset" ${graphMode === 'network' ? '' : 'hidden'} aria-label="居中人生关系图">${icon('reset', 15)}</button></div>
        <div class="branch-tabs wb-branches" aria-label="切换人生路径">${session.lives.map((l,i) => `<button class="branch-tab ${l.id === life.id ? 'active' : ''}" data-action="switch-life" data-id="${e(l.id)}" aria-pressed="${l.id === life.id}">${i === 0 ? '初始路径' : `分支 ${i}`}<span>${i === 0 ? 'ORIGINAL' : e(l.change?.after || l.label)}</span></button>`).join('')}</div>
        <div class="wb-stage-rail" role="group" aria-label="按年龄选择人生阶段">${life.nodes.map(n=>`<button data-action="select-node" data-id="${e(n.id)}" aria-pressed="${n.id===node.id}"><span>${e(n.age)}<small>岁</small></span><i class="${changedNodes.some(x=>x.id===n.id)?'has-change':''}"></i></button>`).join('')}</div>
        <div class="wb-graph-toolbar"><div class="graph-view-switch"><button data-action="graph-network" class="${graphMode === 'network' ? 'active' : ''}" aria-pressed="${graphMode === 'network'}">关系图谱</button><button data-action="graph-timeline" class="${graphMode === 'timeline' ? 'active' : ''}" aria-pressed="${graphMode === 'timeline'}">人生路径</button></div><span class="wb-gesture">${graphMode === 'network' ? '拖拽节点 · 滚轮缩放' : '点击节点 · 探索选择'}</span></div>
        <div class="wb-graph-stage">
          <div class="network-wrap" ${graphMode === 'network' ? '' : 'hidden'}><div id="force-graph" aria-label="动态人生关系网络"></div><div class="network-controls"><button class="network-control" data-action="network-pause">暂停运动</button><button class="network-control" data-action="network-labels">显示关系</button><button class="network-control" data-action="network-reset">居中视图</button></div></div>
          <div class="graph-scroll" id="graph-scroll" ${graphMode === 'timeline' ? '' : 'hidden'}><div class="graph-canvas" id="graph-canvas"><svg class="graph-lines" id="graph-lines" aria-hidden="true"></svg>${timeline}</div></div>
          <div class="wb-zoom"><button data-action="zoom-in" aria-label="放大节点图">${icon('plus', 15)}</button><button data-action="zoom-out" aria-label="缩小节点图">${icon('minus', 15)}</button><button data-action="zoom-reset" aria-label="重置节点图缩放">${icon('reset', 14)}</button></div>
        </div>
        <div class="wb-graph-footer"><div class="wb-legend"><span><i class="wb-dot person"></i>玩家</span><span><i class="wb-dot event"></i>人生节点</span><span><i class="wb-dot condition"></i>影响因素</span><span><i class="wb-dot vision"></i>背景情境</span><span>紫色 ! · 本次变化，点击查看前后对照</span></div><div class="wb-stats"><span><b>${count(stats.nodes)}</b> 节点</span><span><b>${count(stats.edges)}</b> 关系</span><span><b>${count(typeCount)}</b> 节点类型</span></div></div>
      </section>
      <section class="wb-work-pane" aria-label="人生档案与节点工作台">
        <div class="wb-work-scroll workbench-scroll">
          <div class="wb-work-title"><div><span class="wb-overline">YOUR NEXT POSSIBILITY</span><h2>每一个选择，都有回响。</h2></div><span class="wb-local-tag">${session.isDemo ? '示例档案' : '个人档案'}</span></div>
          <section class="wb-card" aria-labelledby="wb-profile-title"><div class="wb-card-heading"><span class="wb-card-number">01</span><div><h3 id="wb-profile-title">人生档案</h3><p>第一步：确认你的起点。新人生会一直推演到晚年。</p></div><button class="wb-text-button" data-action="connect">连接档案 ${icon('arrow', 13)}</button></div>
            <div class="wb-fields">${field('称呼',p.name)}${field('人生阶段',`${p.age} 岁 · ${stageNames[p.stage] || p.stage}`)}${field('未来意象',p.vision,true)}${field('关注方向',p.work)}${field('此刻更看重',priorityNames[p.priority] || p.priority)}</div><div class="wb-card-bottom"><button class="wb-text-button" data-action="full-life">${life.timelineVersion===1?'用原始信息重新推演 →':'从我的信息推演完整人生 →'}</button><span class="wb-code">${e(session.code)}</span><button class="wb-text-button" data-action="new">建立新档案 ${icon('plus',12)}</button></div>
          </section>
          <section class="wb-card" id="workbench-node-detail" aria-labelledby="wb-node-title"><div class="wb-card-heading"><span class="wb-card-number">02</span><div><h3 id="wb-node-title">探索人生节点</h3><p>第二步：点击左侧的人生阶段，先读这段故事。想改变它，就点下方「改写这个节点」。</p></div><span class="wb-node-count">${String(nodeNumber).padStart(2,'0')} / ${String(life.nodes.length).padStart(2,'0')}</span></div>
            <div class="wb-node-selector" role="group" aria-label="选择人生节点">${life.nodes.map((n,i) => `<button data-action="select-node" data-id="${e(n.id)}" aria-pressed="${n.id === node.id}" aria-label="${e(n.age)}岁 ${e(n.title)}" title="${e(n.title)}"><span>${String(i + 1).padStart(2,'0')}</span>${e(n.category)}</button>`).join('')}</div><div class="wb-selected-node"><span class="wb-node-mark">${icon(node.id === 'education' ? 'book' : node.id === 'career' ? 'work' : node.id === 'city' ? 'pin' : 'spark',20)}</span><div><span class="wb-node-meta">${e(node.age)} 岁 · ${e(node.category)} · ${e(branchLabel)}</span><h4>${e(node.title)}</h4></div></div><p class="wb-node-description">${e(node.detail || node.summary)}</p>${changeNotice}
            ${(node.effects || []).length ? `<div class="wb-effects"><span class="wb-mini-label">这一选择可能影响</span><ul>${node.effects.map(effect => `<li>${e(effect)}</li>`).join('')}</ul></div>` : ''}
            <div class="wb-card-bottom">${nodeNumber < life.nodes.length ? `<button class="wb-text-button" data-action="next-stage">读下一阶段 · ${e(life.nodes[nodeNumber].age)} 岁 →</button>` : `<span>${life.timelineVersion===1?'已读到晚年。可以回到前面的阶段尝试另一种选择。':'这份旧档案到这里结束。点击上方「推演完整人生」，生成覆盖晚年的新档案。'}</span><button class="wb-text-button" data-action="nav" data-page="report">查看人生报告 →</button>`}</div>
          </section>
          <section class="wb-card wb-change-card" aria-labelledby="wb-change-title"><div class="wb-card-heading"><span class="wb-card-number">03</span><div><h3 id="wb-change-title">改写一个选择</h3><p>${choices.length ? '第三步：选一个不同方向，或写下自己的选择。AI 会改写此后的人生，原路径会保留。' : '保留现在的起点，或开启一份新档案。'}</p></div>${icon('branch',18)}</div>
            ${choices.length ? `<div class="wb-choice-summary"><span class="wb-mini-label">可以探索的方向</span><div class="wb-option-tags">${choices.map(choice => `<span class="${node.selectedOption?.id === choice.id ? 'selected' : ''}">${e(choice.label)}</span>`).join('')}<span>自定义选择</span></div></div><button class="wb-primary-action" data-action="edit-node">${icon('branch',16)}改写这个节点${icon('arrow',16)}</button><p class="wb-change-note">生成后先点「对照平行人生」看变化，再打开「人生报告」。你可以回到任意阶段继续尝试，不必改完每个节点。</p>` : `<button class="wb-primary-action" data-action="new">${icon('plus',16)}从我的信息开始${icon('arrow',16)}</button>`}
          </section>
          ${parent?`<section class="wb-impact-summary"><div><span class="wb-overline">THE RIPPLE EFFECT</span><h3>这次选择，改变了 ${changedNodes.length} 个阶段</h3><p>${e(life.change?.after||'新的选择')}</p></div><div class="wb-impact-chips">${changedNodes.map(n=>`<button data-action="select-node" data-id="${e(n.id)}">${e(n.age)} 岁 <span>查看变化 ↗</span></button>`).join('')}</div></section>`:''}
          <div class="wb-result-links"><button data-action="nav" data-page="compare">${icon('branch',16)}对照平行人生<span>↗</span></button><button data-action="nav" data-page="report">${icon('report',16)}电子版与纸质报告<span>↗</span></button></div>
          <details class="wb-archive-details"><summary>档案信息与运行记录</summary><section class="wb-log" aria-label="当前档案记录"><div class="wb-log-heading"><span><i></i>档案记录</span><span>LOCAL SESSION</span></div><div class="wb-log-lines"><p><span class="wb-log-key">[ARCHIVE]</span> 已载入${session.isDemo ? '示例' : '个人'}档案 <b>${e(session.code)}</b></p><p><span class="wb-log-key">[PATHS]</span> 当前档案包含 ${e(session.lives.length)} 条路径 · ${e(session.lives.length - 1)} 次节点改写</p><p><span class="wb-log-key">[SELECTED]</span> ${e(branchLabel)} / ${e(node.title)}</p><p class="wb-log-notice"><span class="wb-log-key">[ENGINE]</span> ${life.mode==='ai'?modelName(life.generation.model)+' · 已完成 AI 推演':aiAvailable?'示例为预设故事 · 改写时由 GPT 推演':'示例故事 · AI 连接未就绪'}</p></div><button data-action="nav" data-page="about">查看运行方式与来源 ${icon('arrow',12)}</button></section></details>
        </div>
      </section>
    </div>
  </main>`;
}
