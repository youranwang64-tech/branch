/**
 * CIBE interactive relationship network, original implementation.
 * SVG edge geometry reuses the attributed MiroFish helpers in vendor/.
 * The network visualises life events and their effects; animation is a layout,
 * not a live model simulation. All graph data remains in the browser.
 */
import { getLinkPath, getLinkMidpoint } from './mirofish-graph-geometry.js';

const NS = 'http://www.w3.org/2000/svg';
const layouts = new Map();
const COLORS = ['#ff6a32', '#245792', '#349977', '#e5a000', '#8432a4', '#cb3155'];
const PRIORITIES = { freedom: '自由与探索', stability: '稳定与安全感', growth: '成长与成就', connection: '关系与陪伴' };
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
const short = (value, limit = 10) => {
  const chars = [...String(value || '')];
  return chars.length > limit ? `${chars.slice(0, limit).join('')}…` : chars.join('');
};
const svgEl = (tag, attrs = {}, content) => {
  const el = document.createElementNS(NS, tag);
  for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, String(value));
  if (content !== undefined) el.textContent = content;
  return el;
};
const hash = value => [...value].reduce((n, c) => ((n * 31) + c.codePointAt(0)) >>> 0, 7);

export function graphStatistics(life) {
  const mainCount=life.nodes.length;
  const effects=life.nodes.reduce((total,node)=>total+(Array.isArray(node.effects)?Math.min(node.effects.length,3):0),0);
  return {nodes:mainCount+effects+3,edges:mainCount+effects+Math.max(0,mainCount-1)+2+(mainCount>0?1:0)+(mainCount>2?1:0),types:effects?4:3};
}

/**
 * @param {HTMLElement} container Dedicated host element.
 * @param {{life:object,profile:object,baseline:object,selectedId:string,onSelect:Function}} options
 * @returns {{destroy:Function,zoomIn:Function,zoomOut:Function,reset:Function,togglePause:Function,toggleLabels:Function}}
 */
export function mountForceGraph(container, { life, profile = life?.profile || {}, baseline, selectedId, onSelect = () => {} }) {
  if (!container || !Array.isArray(life?.nodes)) throw new Error('人生关系图需要有效的容器与人生节点。');
  const prefersReduced = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)');
  const cacheKey = life.id || `${profile.name || ''}:${profile.age || ''}`;
  const saved = layouts.get(cacheKey) || layouts.get(life.parentId);
  const nodes = [];
  const edges = [];
  const cleanups = [];
  let previewBusy=false,previewNodeId=null;
  let width = saved?.width || 700, height = saved?.height || 500, frame = 0, destroyed = false, hovering = null;
  let paused = prefersReduced?.matches ? true : Boolean(saved?.paused);
  let showLabels = saved?.showLabels ?? true;
  let zoom = saved?.zoom || 1, panX = saved?.panX || 0, panY = saved?.panY || 0;
  let lastTime = 0, elapsed = saved?.elapsed || 0, gesture = null, skipClickUntil = 0;
  let userMovedView = Boolean(saved?.userMovedView), energy = 1;
  const baseNodes = Array.isArray(baseline?.nodes) ? baseline.nodes : [];
  const baseById = new Map(baseNodes.map(n => [n.id, n]));
  const previousPosition = saved?.positions || {};
  const originalContainerPosition = container.style.position;
  if (getComputedStyle(container).position === 'static') container.style.position = 'relative';

  function listen(el, event, fn, options) {
    el.addEventListener(event, fn, options);
    cleanups.push(() => el.removeEventListener(event, fn, options));
  }
  function addNode(data, x = 0, y = 0) {
    const old = previousPosition[data.id];
    const phase = hash(data.id) % 628 / 100;
    const node = { ...data, x: old?.x ?? x, y: old?.y ?? y, vx: 0, vy: 0, phase, fx: null, fy: null };
    nodes.push(node);
    return node;
  }
  function addEdge(source, target, label, kind = 'effect', curvature = 0) {
    edges.push({ source, target, label, kind, curvature, pairTotal: 1, changed: Boolean(source.changed || target.changed) });
  }

  const player = addNode({ id: 'person', label: short(profile.name || '你', 8), full: `${profile.name || '你'} · 这段人生的起点`, kind: 'person', radius: 15, color: '#ff6a32', anchor: { x: 0, y: 0 } });
  const mains = life.nodes.map((item, index) => {
    const angle = -Math.PI / 2 + index * Math.PI / 3;
    const anchor = { x: Math.cos(angle) * 163, y: Math.sin(angle) * 148 };
    const base = baseById.get(item.id);
    const changed = Boolean(base && JSON.stringify(base) !== JSON.stringify(item));
    const color = changed ? '#8432a4' : COLORS[index % COLORS.length];
    const main = addNode({ id: item.id, lifeId: item.id, kind: 'main', radius: 9,
      label: short(item.title, 12), full: `${item.age} 岁 · ${item.title}\n${item.detail || item.summary || ''}`,
      age: item.age, category: item.category || '人生节点', color, changed, anchor, index }, anchor.x, anchor.y);
    addEdge(player, main, ['从此刻出发', '学习与准备', '工作与协作', '选择生活地', '重新作出选择', '走向一种可能'][index] || '关联', 'person', index % 2 ? 0.15 : -0.15);
    (Array.isArray(item.effects) ? item.effects.slice(0, 3) : []).forEach((effect, effectIndex) => {
      const effectAngle = angle + (effectIndex - 1) * 0.83;
      const distance = 73 + (effectIndex === 1 ? 13 : 0);
      const satellite = addNode({ id: `${item.id}:effect:${effectIndex}`, kind: 'effect', radius: 4,
        label: short(effect, 9), full: `${item.title}\n${effect}`, color, changed,
        owner: main, anchor: { x: anchor.x + Math.cos(effectAngle) * distance, y: anchor.y + Math.sin(effectAngle) * distance } },
      anchor.x + Math.cos(effectAngle) * distance, anchor.y + Math.sin(effectAngle) * distance);
      addEdge(main, satellite, ['带来变化', '需要安排', '影响后续'][effectIndex], 'effect', effectIndex === 1 ? 0.18 : 0);
    });
    return main;
  });
  mains.forEach((node, index) => {
    if (index < mains.length - 1) addEdge(node, mains[index + 1], '延续到下一阶段', 'timeline', 0.12);
  });
  const vision = addNode({ id: 'vision', kind: 'context', radius: 9, label: '未来的意象',
    full: `未来的意象\n${profile.vision || '希望拥有的生活'}`, color: '#8432a4', anchor: { x: -62, y: -70 } }, -62, -70);
  const priority = addNode({ id: 'priority', kind: 'context', radius: 8, label: PRIORITIES[profile.priority] || '重视的事情',
    full: `重视的事情\n${PRIORITIES[profile.priority] || '当前更在意的生活条件'}`, color: '#e5a000', anchor: { x: 65, y: 65 } }, 65, 65);
  addEdge(player, vision, '期待', 'context', -0.3);
  addEdge(player, priority, '重视', 'context', 0.3);
  if (mains.at(-1)) addEdge(vision, mains.at(-1), '作为生活参照', 'context', 0.3);
  if (mains[2]) addEdge(priority, mains[2], '影响选择', 'context', -0.15);

  const svg = svgEl('svg', { width: '100%', height: '100%', role: 'group', 'aria-label': '动态人生关系网络，可拖动节点，滚轮缩放；按 Tab 选择人生节点并按回车打开详情。', class: 'force-network-svg' });
  Object.assign(svg.style, { display: 'block', width: '100%', height: '100%', minHeight: '0', overflow: 'hidden', touchAction: 'none', userSelect: 'none', cursor: 'grab' });
  svg.append(svgEl('title', {}, '人生关系网络'));
  svg.append(svgEl('desc', {}, '六个人生事件与各自的影响相连。节点缓慢移动仅表示关系图布局；点击主要节点查看人生事件。'));
  const scene = svgEl('g');
  const edgeLayer = svgEl('g', { 'aria-hidden': 'true' });
  const labelLayer = svgEl('g', { 'aria-hidden': 'true', 'pointer-events': 'none' });
  const particleLayer = svgEl('g', { 'aria-hidden': 'true', 'pointer-events': 'none' });
  const nodeLayer = svgEl('g');
  scene.append(edgeLayer, labelLayer, particleLayer, nodeLayer);
  svg.append(scene);
  const tooltip = document.createElement('div');
  tooltip.className = 'force-network-tooltip';
  tooltip.setAttribute('role', 'tooltip');
  Object.assign(tooltip.style, { display: 'none', position: 'absolute', zIndex: '5', maxWidth: '280px',
    padding: '10px 13px', border: '1px solid #dde3d7', borderRadius: '10px', background: 'rgba(255,255,253,.97)',
    boxShadow: '0 8px 26px #34432b14', color: '#4b5647', fontSize: '11px', lineHeight: '1.7', whiteSpace: 'pre-line', pointerEvents: 'none' });
  const hint = document.createElement('div');
  hint.className = 'force-network-hint';
  hint.textContent = '拖动节点 · 滚轮缩放 · 点击人生节点';
  Object.assign(hint.style, { position: 'absolute', left: '16px', bottom: '12px', color: '#8b9585', fontSize: '10px', letterSpacing: '.4px', pointerEvents: 'none' });
  container.replaceChildren(svg, tooltip, hint);

  for (const [index, edge] of edges.entries()) {
    edge.path = svgEl('path', { fill: 'none', stroke: edge.changed ? '#b08abc' : '#b8bec6', 'stroke-width': edge.kind === 'timeline' ? 1.1 : 0.75, 'vector-effect': 'non-scaling-stroke', opacity: '.72' });
    if (edge.kind === 'context') edge.path.setAttribute('stroke-dasharray', '3 4');
    edge.path.append(svgEl('title', {}, `${edge.source.label} → ${edge.target.label}：${edge.label}`));
    edgeLayer.append(edge.path);
    edge.text = svgEl('text', { fill: edge.changed ? '#92729c' : '#7e8790', 'font-size': 8,
      'font-family': 'system-ui, Microsoft YaHei, sans-serif', 'text-anchor': 'middle', 'paint-order': 'stroke', stroke: '#fafbfc', 'stroke-width': '3', 'stroke-linejoin': 'round', opacity: edge.kind === 'effect' ? '.75' : '.9' }, edge.label);
    labelLayer.append(edge.text);
    if (index % 3 === 0 && edge.kind !== 'effect') {
      edge.particle = svgEl('circle', { r: 2, fill: edge.changed ? '#a17fbd' : '#72936b', opacity: '.75' });
      edge.particlePhase = (index * 0.173) % 1;
      particleLayer.append(edge.particle);
    }
  }
  for (const node of nodes) {
    const group = svgEl('g', { class: `force-node force-node-${node.kind}`, 'data-node-id': node.id });
    group.style.cursor = node.kind === 'main' ? 'pointer' : 'grab';
    if (node.kind === 'main') {
      group.setAttribute('tabindex', '0');
      group.setAttribute('role', 'button');
      group.setAttribute('aria-label', `${node.age} 岁，${node.category}，${life.nodes[node.index].title}，查看此节点`);
      group.setAttribute('aria-pressed', String(node.lifeId === selectedId));
    }
    group.append(svgEl('title', {}, node.full));
    node.halo = svgEl('circle', { r: node.radius + (node.kind === 'main' ? 7 : 4), fill: node.color, opacity: node.lifeId === selectedId ? '.15' : '.045' });
    node.ring = svgEl('circle', { r: node.radius + 5, fill: 'none', stroke: node.color, 'stroke-width': 1.2, opacity: node.lifeId === selectedId ? '.7' : '0' });
    node.circle = svgEl('circle', { r: node.radius, fill: node.color, stroke: '#ffffff', 'stroke-width': node.kind === 'effect' ? 1.5 : 2.5 });
    group.append(node.halo, node.ring, node.circle);
    if (node.kind === 'person') {
      const personGlyph = svgEl('text', { 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: '#fff', 'font-size': 14, 'font-family': 'system-ui, Microsoft YaHei, sans-serif', 'pointer-events': 'none' }, short(profile.name || '你', 1).replace('…', ''));
      group.append(personGlyph);
    }
    const label = svgEl('text', { x: node.radius + 7, y: 3, fill: node.kind === 'effect' ? '#707780' : '#333a43',
      'font-size': node.kind === 'main' ? 10 : node.kind === 'effect' ? 8 : 10,
      'font-family': 'system-ui, Microsoft YaHei, sans-serif', 'font-weight': node.kind === 'main' || node.kind === 'person' ? 600 : 400,
      'paint-order': 'stroke', stroke: '#fbfcf8', 'stroke-width': '3', 'stroke-linejoin': 'round', 'pointer-events': 'none' }, node.label);
    group.append(label);
    node.labelEl = label;
    if (node.kind === 'main') {
      node.ageEl = svgEl('text', { x: node.radius + 7, y: 17, fill: '#96a08e', 'font-size': 8, 'font-family': 'system-ui, Microsoft YaHei, sans-serif', 'pointer-events': 'none' }, `${node.age} 岁 · ${node.category}`);
      group.append(node.ageEl);
    }
    node.el = group;
    nodeLayer.append(group);
    if(node.kind==='main' && node.changed)markChange(node,node.lifeId===life.changedNodeId?'你改写的选择':'受选择影响');
    listen(group, 'pointerenter', event => showTooltip(node, event));
    listen(group, 'pointerleave', () => hideTooltip());
    listen(group, 'focus', () => { node.ring.setAttribute('opacity', '.9'); showTooltip(node); });
    listen(group, 'blur', () => { node.ring.setAttribute('opacity', node.lifeId === selectedId ? '.7' : '0'); hideTooltip(); });
    listen(group, 'click', event => {
      event.stopPropagation();
      if (performance.now() < skipClickUntil || node.kind !== 'main') return;
      if(!previewBusy)onSelect(node.lifeId);
    });
    listen(group, 'keydown', event => {
      if ((event.key === 'Enter' || event.key === ' ') && node.kind === 'main') {
        event.preventDefault(); if(!previewBusy)onSelect(node.lifeId);
      }
    });
    listen(group, 'pointerdown', event => {
      if (event.button !== 0) return;
      event.stopPropagation();
      event.preventDefault();
      const point = toWorld(event.clientX, event.clientY);
      gesture = { type: 'node', node, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, offsetX: node.x - point.x, offsetY: node.y - point.y, moved: false };
      node.fx = node.x; node.fy = node.y;
      svg.setPointerCapture(event.pointerId);
      svg.style.cursor = 'grabbing'; hideTooltip();
      energy = 1;
    });
  }

  const progress=document.createElement('div');
  progress.className='graph-live-progress';progress.hidden=true;progress.setAttribute('role','status');progress.setAttribute('aria-live','polite');container.append(progress);
  function markChange(node,message){
    node.radius=14;node.color='#8432a4';node.changed=true;
    node.circle.setAttribute('r',14);node.circle.setAttribute('fill',node.color);
    node.ring.setAttribute('r',20);node.ring.setAttribute('stroke',node.color);node.ring.setAttribute('opacity','.65');
    node.halo.setAttribute('fill',node.color);node.halo.setAttribute('opacity','.14');
    node.labelEl.setAttribute('x',23);node.labelEl.setAttribute('font-size',11);node.ageEl?.setAttribute('x',23);
    if(!node.changeGlyph){
      node.changeGlyph=svgEl('text',{'text-anchor':'middle','dominant-baseline':'central',fill:'#fff','font-size':17,'font-weight':700,'pointer-events':'none'},'!');
      node.changeText=svgEl('text',{x:23,y:31,fill:'#8432a4','font-size':9,'paint-order':'stroke',stroke:'#fff','stroke-width':3,'stroke-linejoin':'round'},message);
      node.el.append(node.changeGlyph,node.changeText);
    }
    node.changeText.textContent=message;
    node.el.setAttribute('aria-label',`${node.age} 岁，${node.label}，${message}`);
  }
  function replacePreview(item,message){
    const node=nodes.find(n=>n.lifeId===item.id);if(!node)return;
    node.label=short(item.title,12);node.labelEl.textContent=node.label;
    node.full=`${message}\n${node.age} 岁 · ${item.title}\n${item.detail||item.summary||''}`;
    node.el.querySelector('title').textContent=node.full;
    markChange(node,message);
    (item.effects||[]).forEach((effect,i)=>{
      const satellite=nodes.find(n=>n.id===`${item.id}:effect:${i}`);if(!satellite)return;
      satellite.labelEl.textContent=short(effect,9);satellite.full=effect;satellite.circle.setAttribute('fill','#8432a4');
    });
    if(hovering===node)tooltip.textContent=node.full;
  }

  function showTooltip(node, event) {
    if (gesture || destroyed) return;
    hovering = node;
    tooltip.textContent = node.full;
    tooltip.style.display = 'block';
    const rect = container.getBoundingClientRect();
    const sx = event ? event.clientX - rect.left : width / 2 + panX + node.x * zoom;
    const sy = event ? event.clientY - rect.top : height / 2 + panY + node.y * zoom;
    const tw = tooltip.offsetWidth || 250, th = tooltip.offsetHeight || 80;
    tooltip.style.left = `${clamp(sx + 14, 8, Math.max(8, width - tw - 8))}px`;
    tooltip.style.top = `${clamp(sy + 15, 8, Math.max(8, height - th - 8))}px`;
    for (const edge of edges) edge.path.style.opacity = edge.source === node || edge.target === node ? '1' : '.22';
  }
  function hideTooltip() {
    hovering = null; tooltip.style.display = 'none';
    for (const edge of edges) edge.path.style.opacity = '';
  }
  function toWorld(clientX, clientY) {
    const rect = svg.getBoundingClientRect();
    return { x: (clientX - rect.left - width / 2 - panX) / zoom, y: (clientY - rect.top - height / 2 - panY) / zoom };
  }
  function setZoom(value, clientX, clientY) {
    const next = clamp(value, .35, 3);
    if (clientX !== undefined) {
      const before = toWorld(clientX, clientY), rect = svg.getBoundingClientRect();
      panX = clientX - rect.left - width / 2 - before.x * next;
      panY = clientY - rect.top - height / 2 - before.y * next;
    }
    zoom = next; userMovedView = true; hideTooltip(); paint();
    return Math.round(zoom * 100);
  }
  listen(svg, 'wheel', event => { event.preventDefault(); setZoom(zoom * Math.exp(-event.deltaY * .0013), event.clientX, event.clientY); }, { passive: false });
  listen(svg, 'pointerdown', event => {
    if (event.button !== 0) return;
    event.preventDefault();
    gesture = { type: 'pan', pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, panX, panY, moved: false };
    svg.setPointerCapture(event.pointerId); svg.style.cursor = 'grabbing'; hideTooltip();
  });
  listen(svg, 'pointermove', event => {
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    const distance = Math.hypot(event.clientX - gesture.startX, event.clientY - gesture.startY);
    gesture.moved ||= distance > 4;
    if (gesture.type === 'node') {
      const point = toWorld(event.clientX, event.clientY);
      gesture.node.x = gesture.node.fx = point.x + gesture.offsetX;
      gesture.node.y = gesture.node.fy = point.y + gesture.offsetY;
      gesture.node.vx = gesture.node.vy = 0;
    } else {
      panX = gesture.panX + event.clientX - gesture.startX;
      panY = gesture.panY + event.clientY - gesture.startY;
      userMovedView = true;
    }
    paint();
  });
  function endGesture(event) {
    if (!gesture || (event.pointerId !== undefined && event.pointerId !== gesture.pointerId)) return;
    const current = gesture;
    if (current.type === 'node') { current.node.fx = current.node.fy = null; energy = .7; }
    if (current.moved) skipClickUntil = performance.now() + 300;
    gesture = null; svg.style.cursor = 'grab';
    if (svg.hasPointerCapture(current.pointerId)) svg.releasePointerCapture(current.pointerId);
    // Pointer capture retargets clicks to the SVG; resolve taps here instead.
    if (!current.moved && current.type === 'node' && current.node.kind === 'main' && event.type === 'pointerup') {
      skipClickUntil = performance.now() + 300;
      onSelect(current.node.lifeId);
    }
  }
  listen(svg, 'pointerup', endGesture);
  listen(svg, 'pointercancel', endGesture);
  listen(svg, 'lostpointercapture', endGesture);

  function simulate(dt = 1, ambient = true) {
    // Weak semantic anchors retain readable clusters; springs and repulsion keep
    // the network organic and responsive when players drag an event.
    for (const node of nodes) {
      if (node.fx !== null) { node.x = node.fx; node.y = node.fy; continue; }
      const strength = node.kind === 'person' ? .045 : node.kind === 'effect' ? .003 : .012;
      node.vx += (node.anchor.x - node.x) * strength * dt;
      node.vy += (node.anchor.y - node.y) * strength * dt;
      if (ambient) {
        node.vx += Math.sin(elapsed / 3400 + node.phase) * .022 * dt;
        node.vy += Math.cos(elapsed / 4100 + node.phase * 1.7) * .022 * dt;
      }
    }
    for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i], b = nodes[j];
      let dx = b.x - a.x, dy = b.y - a.y;
      let d2 = dx * dx + dy * dy;
      if (d2 < .01) { dx = .1 + i * .002; dy = .13; d2 = dx * dx + dy * dy; }
      const d = Math.sqrt(d2);
      const minimum = a.radius + b.radius + (a.kind === 'main' || b.kind === 'main' ? 26 : 18);
      let force = Math.min(1.8, (a.kind === 'effect' && b.kind === 'effect' ? 145 : 240) / Math.max(d2, 200));
      if (d < minimum) force += (minimum - d) * .026;
      const fx = dx / d * force * dt, fy = dy / d * force * dt;
      a.vx -= fx; a.vy -= fy; b.vx += fx; b.vy += fy;
    }
    for (const edge of edges) {
      const dx = edge.target.x - edge.source.x, dy = edge.target.y - edge.source.y;
      const d = Math.max(1, Math.hypot(dx, dy));
      const length = edge.kind === 'effect' ? 76 : edge.kind === 'timeline' ? 145 : edge.kind === 'context' ? 112 : 155;
      const strength = edge.kind === 'effect' ? .017 : edge.kind === 'person' ? .003 : .0015;
      const force = (d - length) * strength * dt;
      const fx = dx / d * force, fy = dy / d * force;
      edge.source.vx += fx; edge.source.vy += fy; edge.target.vx -= fx; edge.target.vy -= fy;
    }
    for (const node of nodes) {
      if (node.fx !== null) continue;
      node.vx *= Math.pow(.78, dt); node.vy *= Math.pow(.78, dt);
      node.x += clamp(node.vx, -3, 3) * dt; node.y += clamp(node.vy, -3, 3) * dt;
    }
    energy *= .98;
  }
  function updateLabels() {
    labelLayer.style.display = showLabels ? '' : 'none';
    for (const node of nodes) {
      // Main event labels remain visible when relationship labels are hidden.
      node.labelEl.style.display = node.kind === 'effect' && !showLabels ? 'none' : '';
    }
  }
  function paint() {
    if (destroyed) return;
    scene.setAttribute('transform', `translate(${width / 2 + panX},${height / 2 + panY}) scale(${zoom})`);
    for (const [index, edge] of edges.entries()) {
      edge.path.setAttribute('d', getLinkPath(edge));
      const mid = getLinkMidpoint(edge);
      edge.text.setAttribute('x', mid.x); edge.text.setAttribute('y', mid.y - 4);
      const breathing = paused ? .68 : .57 + Math.sin(elapsed / 2100 + index * .3) * .13;
      edge.path.setAttribute('opacity', breathing.toFixed(2));
      if (edge.particle) {
        edge.particle.style.display = paused ? 'none' : '';
        const t = (elapsed / 9000 + edge.particlePhase) % 1;
        const cx = 2 * mid.x - .5 * (edge.source.x + edge.target.x);
        const cy = 2 * mid.y - .5 * (edge.source.y + edge.target.y);
        const a = (1 - t) ** 2, b = 2 * (1 - t) * t, c = t ** 2;
        edge.particle.setAttribute('cx', a * edge.source.x + b * cx + c * edge.target.x);
        edge.particle.setAttribute('cy', a * edge.source.y + b * cy + c * edge.target.y);
      }
    }
    for (const node of nodes) {
      node.el.setAttribute('transform', `translate(${node.x.toFixed(2)},${node.y.toFixed(2)})`);
      const selected = node.lifeId === selectedId;
      node.halo.setAttribute('r', node.radius + (selected && !paused ? 7 + Math.sin(elapsed / 1400) * 1.6 : node.kind === 'main' ? 7 : 4));
    }
  }
  function fit() {
    const minX = Math.min(...nodes.map(n => n.x - n.radius - 8));
    const maxX = Math.max(...nodes.map(n => n.x + n.radius + (n.kind === 'effect' ? 85 : 130)));
    const minY = Math.min(...nodes.map(n => n.y - n.radius - 12));
    const maxY = Math.max(...nodes.map(n => n.y + n.radius + 25));
    zoom = clamp(Math.min((width - 38) / Math.max(1, maxX - minX), (height - 65) / Math.max(1, maxY - minY), 1.15), .35, 1.15);
    panX = -(minX + maxX) / 2 * zoom;
    panY = -(minY + maxY) / 2 * zoom - 8;
    paint();
  }
  function measure() {
    if (destroyed) return;
    const rect = container.getBoundingClientRect();
    const viewportChanged = Math.abs(width-Math.max(240,rect.width))>2 || Math.abs(height-Math.max(120,rect.height))>2;
    width = Math.max(240, rect.width); height = Math.max(120, rect.height);
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    if (!userMovedView || viewportChanged) fit(); else paint();
  }
  function remember() {
    layouts.set(cacheKey, { positions: Object.fromEntries(nodes.map(n => [n.id, { x: n.x, y: n.y }])), zoom, panX, panY, paused, showLabels, elapsed, width, height, userMovedView });
    if (layouts.size > 16) layouts.delete(layouts.keys().next().value);
  }
  function animate(now) {
    frame = 0;
    if (destroyed || paused) return;
    const dt = lastTime ? Math.min(2, (now - lastTime) / 16.67) : 1;
    lastTime = now; elapsed += dt * 16.67;
    if (!document.hidden) { simulate(dt, true); paint(); }
    frame = requestAnimationFrame(animate);
  }
  function run() { if (!destroyed && !paused && !frame) { lastTime = 0; frame = requestAnimationFrame(animate); } }
  function stop() { if (frame) cancelAnimationFrame(frame); frame = 0; lastTime = 0; }
  // Settle synchronously so reduced-motion users also get a complete layout.
  if (!saved) for (let i = 0; i < 90; i++) simulate(1, false);
  updateLabels(); measure();
  const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : null;
  observer?.observe(container);
  if (!observer) listen(window, 'resize', measure);
  if (prefersReduced?.addEventListener) listen(prefersReduced, 'change', event => {
    if (event.matches) { paused = true; stop(); paint(); remember(); }
  });
  listen(document, 'visibilitychange', () => { if (document.hidden) stop(); else run(); });
  run();

  return {
    beginPreview(nodeId,choice){
      previewBusy=true;previewNodeId=nodeId;progress.hidden=false;progress.textContent='你的选择已显示，AI 正在推演后续变化…';
      const source=life.nodes.find(n=>n.id===nodeId);
      replacePreview({...source,title:choice,detail:'这是你刚提交的选择，尚不是 AI 推演结果。'},'新选择 · 正在推演');
      const begin=life.nodes.findIndex(n=>n.id===nodeId);
      nodes.filter(n=>n.kind==='main'&&n.index>begin).forEach(n=>{n.ring.setAttribute('opacity','.5');n.ring.setAttribute('stroke-dasharray','3 3');});
      paint();
    },
    updatePreview(items,message){
      progress.textContent=message+' · 完成后自动保存';
      for(const item of items||[]){
        const node=nodes.find(n=>n.lifeId===item.id);if(!node||node.previewDetail===item.detail)continue;
        node.previewDetail=item.detail;replacePreview(item,item.id===previewNodeId?'改写结果 · 待保存':'新故事 · 待保存');
        node.ring.removeAttribute('stroke-dasharray');
      }
      paint();
    },
    getState() { return {paused,showLabels,nodes:nodes.length,edges:edges.length}; },
    destroy() {
      if (destroyed) return;
      remember(); destroyed = true; stop(); observer?.disconnect();
      for (const cleanup of cleanups) cleanup();
      svg.remove(); tooltip.remove(); hint.remove(); progress.remove();
      container.style.position = originalContainerPosition;
    },
    zoomIn() { return setZoom(zoom * 1.17); },
    zoomOut() { return setZoom(zoom / 1.17); },
    reset() { userMovedView = false; fit(); return Math.round(zoom * 100); },
    togglePause() { paused = !paused; if (paused) stop(); else run(); paint(); remember(); return paused; },
    toggleLabels() { showLabels = !showLabels; updateLabels(); remember(); return showLabels; },
  };
}
