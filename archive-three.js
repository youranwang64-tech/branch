/**
 * branch original life-archive folders and scroll choreography.
 * All paper, label and grain textures are generated locally; no reference assets.
 * Runtime: locally vendored Three.js (MIT, see vendor/THREE-LICENSE.txt).
 */
import * as THREE from './three.module.js';

const BACKGROUND = '#f7f8f6';
const FOLDERS = [
  { title: '升学', english: 'LEARNING', code: 'EDU', color: '#c8af88', edge: '#ac926f', ink: '#443c31', label: '#f0eadd', note: '为还未抵达的方向 留一页空白', tab: '01 / 学习与选择' },
  { title: '工作', english: 'WORK', code: 'WRK', color: '#e1e0d8', edge: '#c1c0b7', ink: '#414540', label: '#f5f4ec', note: '把热爱与日常 慢慢写在一起', tab: '02 / 工作与成长' },
  { title: '城市', english: 'PLACES', code: 'CTY', color: '#333937', edge: '#242a28', ink: '#e4e5dc', label: '#dedfd6', note: '换一个地方 也遇见另一个自己', tab: '03 / 城市与生活' },
  { title: '关系', english: 'CONNECTIONS', code: 'REL', color: '#c4c6bc', edge: '#a4a89d', ink: '#41473e', label: '#eeeee4', note: '那些同行的人 成为故事的一部分', tab: '04 / 关系与陪伴' },
  { title: '未来', english: 'POSSIBILITIES', code: 'FUT', color: '#d5c3a6', edge: '#b7a388', ink: '#494036', label: '#f0e9dc', note: '这一份档案 仍然可以被改写', tab: '05 / 未来的意象' },
];
const clamp = value => Math.max(0, Math.min(1, value));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = value => { const t = clamp(value); return t * t * (3 - 2 * t); };

function roundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath(); ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius); ctx.closePath();
}

function paperTexture(def, index, back = false) {
  const canvas = document.createElement('canvas');
  canvas.width = 768; canvas.height = 1152;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  ctx.fillStyle = def.color; ctx.fillRect(0, 0, 768, 1152);
  let seed = 313 + index * 739;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  for (let i = 0; i < 14500; i++) {
    ctx.fillStyle = random() > .5 ? 'rgba(255,255,240,.035)' : 'rgba(37,31,23,.025)';
    const x = random() * 768, y = random() * 1152;
    ctx.fillRect(x, y, .4 + random() * 1.6, .3 + random() * 1.7);
  }
  // Paired bright/dark strokes read as pressed paper seams instead of ink art.
  ctx.strokeStyle = index === 2 ? '#505653' : '#ffffff55'; ctx.lineWidth = 1.4;
  roundedRect(ctx, 24, 23, 720, 1106, 12); ctx.stroke();
  ctx.strokeStyle = index === 2 ? '#202523' : '#695a4040'; ctx.lineWidth = 1;
  roundedRect(ctx, 27, 26, 714, 1100, 11); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(41, 38); ctx.lineTo(41, 1110); ctx.moveTo(727, 38); ctx.lineTo(727, 1110); ctx.stroke();
  if (back) {
    ctx.strokeStyle = index === 2 ? '#1d2422' : '#73664a30'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(29, 1120); ctx.lineTo(384, 800); ctx.lineTo(740, 1120); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(384, 36); ctx.lineTo(384, 800); ctx.stroke();
    ctx.fillStyle = def.ink; ctx.globalAlpha = .3;
    ctx.font = '500 14px Arial, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('branch  /  PERSONAL LIFE ARCHIVE', 384, 1044);
    ctx.globalAlpha = 1;
    return canvas;
  }
  ctx.fillStyle = def.ink;
  ctx.font = '600 22px Arial, sans-serif'; ctx.fillText('branch', 65, 83);
  ctx.textAlign = 'right'; ctx.font = '400 13px Arial, sans-serif';
  ctx.fillText(`ARCHIVE  /  00${index + 1}`, 703, 80);
  ctx.textAlign = 'left';
  ctx.globalAlpha = .5; ctx.font = '400 11px Arial, sans-serif';
  ctx.fillText('A LIFE THAT IS STILL BEING WRITTEN', 65, 109); ctx.globalAlpha = 1;

  // Slightly raised adhesive label, with real stationery typography.
  ctx.fillStyle = '#20241b13'; roundedRect(ctx, 68, 558, 635, 405, 5); ctx.fill();
  ctx.fillStyle = def.label; roundedRect(ctx, 64, 553, 635, 405, 5); ctx.fill();
  ctx.strokeStyle = '#797f6b38'; ctx.lineWidth = 1;
  roundedRect(ctx, 80, 570, 603, 371, 2); ctx.stroke();
  const labelInk = '#383e35';
  ctx.fillStyle = labelInk; ctx.font = '500 12px Arial, sans-serif';
  ctx.fillText('PERSONAL LIFE ARCHIVE', 104, 607);
  ctx.textAlign = 'right'; ctx.font = '400 13px Arial, sans-serif'; ctx.fillText(`branch—${def.code}—00${index + 1}`, 659, 607);
  ctx.textAlign = 'left'; ctx.font = '500 103px "Microsoft YaHei", "PingFang SC", sans-serif';
  ctx.fillText(def.title, 99, 747);
  ctx.font = '500 17px Arial, sans-serif'; ctx.fillText(def.english, 106, 787);
  ctx.strokeStyle = '#8c917c55'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(104, 815); ctx.lineTo(659, 815); ctx.stroke();
  ctx.fillStyle = '#737969'; ctx.font = '400 14px "Microsoft YaHei", "PingFang SC", sans-serif';
  ctx.fillText(def.note, 105, 851);
  ctx.fillStyle = labelInk; ctx.font = '400 10px Arial, sans-serif';
  ctx.fillText('SUBJECT', 105, 901); ctx.fillText('YOUR NEXT CHAPTER', 175, 901);
  ctx.textAlign = 'right'; ctx.fillText(`0${index + 1} / 05`, 659, 901); ctx.textAlign = 'left';
  ctx.fillStyle = def.ink; ctx.globalAlpha = .65;
  ctx.font = '400 12px "Microsoft YaHei", sans-serif'; ctx.fillText(def.tab, 65, 1035);
  ctx.font = '400 10px Arial, sans-serif'; ctx.fillText('KEEP THE QUESTIONS. CHANGE THE POSSIBILITIES.', 65, 1064);
  ctx.globalAlpha = .55;
  // Registration marks and a small serial barcode, no decorative illustration.
  let x = 584;
  for (let i = 0; i < 29; i++) { const bar = i % 4 === 0 ? 3 : 1.3; ctx.fillRect(x, 1009, bar, 33); x += bar + 1.6; }
  ctx.globalAlpha = 1;
  return canvas;
}

function paperPage(index) {
  const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 768;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  ctx.fillStyle = '#fafaf4'; ctx.fillRect(0, 0, 512, 768);
  ctx.fillStyle = '#8e9487'; ctx.font = '400 11px Arial, sans-serif';
  ctx.fillText('branch / LIFE EXPLORATION', 33, 30);
  ctx.textAlign = 'right'; ctx.fillText(`FILE 0${index + 1}`, 478, 30); ctx.textAlign = 'left';
  ctx.strokeStyle = '#d9ddd2'; ctx.lineWidth = 1;
  for (let y = 49; y < 740; y += 26) { ctx.beginPath(); ctx.moveTo(33, y); ctx.lineTo(479, y); ctx.stroke(); }
  return canvas;
}

function contactShadowTexture() {
  const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 124);
  gradient.addColorStop(0, 'rgba(39,44,35,1)');
  gradient.addColorStop(.22, 'rgba(39,44,35,.68)');
  gradient.addColorStop(.52, 'rgba(39,44,35,.23)');
  gradient.addColorStop(.78, 'rgba(39,44,35,.045)');
  gradient.addColorStop(1, 'rgba(39,44,35,0)');
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, 256, 256);
  return canvas;
}

function roundedGeometry(width, height, depth, radius = .055) {
  const x = -width / 2, y = -height / 2;
  const shape = new THREE.Shape();
  shape.moveTo(x + radius, y); shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius); shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius, y + height); shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  shape.lineTo(x, y + radius); shape.quadraticCurveTo(x, y, x + radius, y);
  return new THREE.ExtrudeGeometry(shape, {
    depth, steps: 1, bevelEnabled: true, bevelSize: .008, bevelThickness: .005, bevelSegments: 2, curveSegments: 8,
    UVGenerator: {
      generateTopUV(_geometry, vertices, a, b, c) { return [a, b, c].map(i => new THREE.Vector2((vertices[i * 3] + width / 2) / width, (vertices[i * 3 + 1] + height / 2) / height)); },
      generateSideWallUV() { return [new THREE.Vector2(0, 0), new THREE.Vector2(1, 0), new THREE.Vector2(1, 1), new THREE.Vector2(0, 1)]; },
    },
  });
}

function foldGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(-1.015, 1.55); shape.lineTo(1.015, 1.55);
  shape.lineTo(1.015, 1.13); shape.quadraticCurveTo(1.015, 1.08, .965, 1.06);
  shape.lineTo(.2, .865); shape.quadraticCurveTo(0, .805, -.2, .865);
  shape.lineTo(-.965, 1.06); shape.quadraticCurveTo(-1.015, 1.08, -1.015, 1.13); shape.closePath();
  return new THREE.ExtrudeGeometry(shape, { depth: .018, bevelEnabled: true, bevelSize: .008, bevelThickness: .004, bevelSegments: 2, steps: 1 });
}

function getProgress(section) {
  if (!section) return 0;
  const rect = section.getBoundingClientRect();
  return clamp(-rect.top / Math.max(1, rect.height - window.innerHeight));
}

function choreography(index, progress, halfWidth, halfHeight, time = 0, still = false) {
  // First turn the pile upright, then let all five personal folders find space.
  const turn = smooth((progress - .04 - index * .022) / .37);
  const spread = smooth((progress - .37 - index * .019) / .46);
  const fit = Math.min(1, (halfWidth * 2 - .48) / 11.5);
  const initialScale = Math.min(1.22, halfWidth * .73);
  const centerY = -halfHeight * .25;
  const rowX = (index - 2) * 2.34 * fit;
  const float = still ? 0 : Math.sin(time * .00065 + index * 1.17) * .032;
  return {
    x: lerp((index - 2) * .032, rowX, spread),
    y: centerY + lerp((index - 2) * .19, [0, .24, -.08, .29, .04][index] * fit, spread) + float,
    z: lerp((index - 2) * .105, [0, .12, .24, .10, -.02][index], spread),
    rx: lerp(-1.31, -.035, turn) + (still ? 0 : Math.sin(time * .00035 + index) * .009),
    ry: lerp(-.17 + index * .015, (index - 2) * -.065, spread),
    rz: lerp(-.085 + index * .038, [ .035, -.025, 0, .025, -.035 ][index], spread),
    scale: lerp(initialScale, fit * [.94, 1.02, .97, 1.04, .93][index], spread),
  };
}

function mountFallback(container) {
  const section = container.closest('.archive-section');
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  const root = document.createElement('div'); root.className = 'archive-folders-fallback';
  root.setAttribute('role', 'img'); root.setAttribute('aria-label', '升学、工作、城市、关系与未来，五份可以改写的人生档案。');
  root.style.cssText = `position:absolute;inset:0;overflow:hidden;perspective:1100px;pointer-events:none;background:${BACKGROUND};`;
  const items = FOLDERS.map((def, index) => {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = `position:absolute;left:0;top:0;transform-style:preserve-3d;border-radius:6px;background:${def.color};box-shadow:1px 2px 0 ${def.edge},3px 5px 0 ${def.edge},0 7px 12px #20281b12;will-change:transform;`;
    const texture = paperTexture(def, index);
    const image = document.createElement('img'); image.src = texture.toDataURL(); image.alt = '';
    image.style.cssText = 'display:block;width:100%;height:100%;border-radius:5px;';
    wrapper.append(image);
    const flap = document.createElement('div');
    flap.style.cssText = `position:absolute;left:2%;top:1%;width:96%;height:20%;background:${def.color};clip-path:polygon(0 0,100% 0,100% 70%,50% 100%,0 70%);filter:brightness(1.03);border-top:1px solid #ffffff44;`;
    wrapper.append(flap);
    const string = document.createElement('div');
    string.style.cssText = `position:absolute;left:49.5%;top:17%;width:2px;height:14%;background:${index === 2 ? '#c4baa0' : '#7d6d50'};transform:rotate(-8deg);box-shadow:1px 0 0 #d9cbaa88;`;
    wrapper.append(string);
    for (const top of ['17%', '29%']) {
      const button = document.createElement('span');
      button.style.cssText = `position:absolute;left:46%;top:${top};width:8%;aspect-ratio:1;border-radius:50%;background:${def.edge};border:1px solid #6f665433;box-shadow:0 2px 2px #1b271526,inset 0 0 0 3px #ffffff18;`;
      wrapper.append(button);
    }
    root.append(wrapper); return wrapper;
  });
  container.append(root);
  let destroyed = false, visible = true, frame = 0;
  function update() {
    frame = 0;
    if (destroyed || !visible || document.hidden) return;
    const { width, height } = container.getBoundingClientRect();
    const aspect = width / Math.max(height, 1), halfHeight = aspect < 1 ? 5.1 : 4.8, halfWidth = halfHeight * aspect;
    const progress = media.matches ? 1 : getProgress(section);
    section?.style.setProperty('--archive-progress', String(progress));
    items.forEach((item, index) => {
      const layout = choreography(index, progress, halfWidth, halfHeight, 0, true), pixels = height / (2 * halfHeight);
      const w = 2.1 * pixels * layout.scale, h = 3.2 * pixels * layout.scale;
      item.style.width = `${w}px`; item.style.height = `${h}px`;
      item.style.transform = `translate3d(${width / 2 + layout.x * pixels - w / 2}px,${height / 2 - layout.y * pixels - h / 2}px,${layout.z * pixels}px) rotateX(${-layout.rx}rad) rotateY(${layout.ry}rad) rotateZ(${-layout.rz}rad)`;
      item.style.zIndex = String(index + 1);
    });
  }
  const request = () => { if (!frame && !destroyed && visible && !document.hidden) frame = requestAnimationFrame(update); };
  const resize = typeof ResizeObserver === 'function' ? new ResizeObserver(request) : null; resize?.observe(container);
  const intersection = typeof IntersectionObserver === 'function' ? new IntersectionObserver(entries => { visible = entries[0]?.isIntersecting ?? true; if (visible) request(); }, { rootMargin: '100px' }) : null; intersection?.observe(container);
  window.addEventListener('scroll', request, { passive: true }); window.addEventListener('resize', request, { passive: true });
  document.addEventListener('visibilitychange', request); media.addEventListener?.('change', request); update();
  return { destroy() { if (destroyed) return; destroyed = true; if (frame) cancelAnimationFrame(frame); resize?.disconnect(); intersection?.disconnect();
    window.removeEventListener('scroll', request); window.removeEventListener('resize', request); document.removeEventListener('visibilitychange', request); media.removeEventListener?.('change', request); root.remove(); } };
}

/** Mount five physical archive folders; call destroy before removing the host. */
export function mountArchiveFolders(container) {
  if (!(container instanceof HTMLElement)) return { destroy() {} };
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' }); }
  catch { return mountFallback(container); }

  const section = container.closest('.archive-section');
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  const resources = { geometries: new Set(), materials: new Set(), textures: new Set() };
  const geometry = value => { resources.geometries.add(value); return value; };
  const material = value => { resources.materials.add(value); return value; };
  const texture = canvas => { const value = new THREE.CanvasTexture(canvas); value.colorSpace = THREE.SRGBColorSpace;
    value.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy()); resources.textures.add(value); return value; };
  const canvas = renderer.domElement; canvas.className = 'archive-folders-canvas';
  canvas.setAttribute('role', 'img'); canvas.setAttribute('aria-label', '五份立体人生档案袋，从叠放到展开，分别标记升学、工作、城市、关系与未来。');
  canvas.style.cssText = 'display:block;width:100%;height:100%;pointer-events:none;';
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.07;
  // Contact ellipses avoid the displaced, rectangular silhouette of cast shadows.
  renderer.shadowMap.enabled = false;
  container.append(canvas);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(BACKGROUND);
  const camera = new THREE.OrthographicCamera(-8, 8, 4.8, -4.8, .1, 100);
  camera.position.set(0, 0, 30); camera.lookAt(0, 0, 0);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xb9b6aa, 2.2));
  const key = new THREE.DirectionalLight(0xffffff, 3.05); key.position.set(-4.5, 7.5, 9);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xeef1ed, .65); fill.position.set(7, 1, 5); scene.add(fill);
  const shadowMap = texture(contactShadowTexture());
  const shadowGeo = geometry(new THREE.PlaneGeometry(1, 1));
  const shadows = FOLDERS.map((_, index) => {
    const shadow = new THREE.Mesh(shadowGeo, material(new THREE.MeshBasicMaterial({
      map: shadowMap, transparent: true, opacity: .075, depthWrite: false, toneMapped: false,
    })));
    shadow.position.z = -25 - index * .005; scene.add(shadow); return shadow;
  });
  // Project the folder bounds into screen space so the shadow follows its bottom
  // throughout the flat-stack to upright transition, without changing the layout.
  const shadowCorners = [];
  for (const x of [-1.07, 1.07]) for (const y of [-1.64, 1.69]) for (const z of [-.08, .16]) {
    shadowCorners.push(new THREE.Vector3(x, y, z));
  }
  const shadowPoint = new THREE.Vector3();

  const bodyGeo = geometry(roundedGeometry(2.1, 3.2, .048));
  const backGeo = geometry(roundedGeometry(2.12, 3.23, .024));
  const pageGeo = geometry(roundedGeometry(2.01, 3.03, .007, .025));
  const flapGeo = geometry(foldGeometry());
  const buttonGeo = geometry(new THREE.CylinderGeometry(.077, .079, .017, 28));
  const eyeletGeo = geometry(new THREE.TorusGeometry(.017, .005, 7, 18));
  const seamGeo = geometry(new THREE.BoxGeometry(.009, 2.9, .005));

  const folders = FOLDERS.map((def, index) => {
    const group = new THREE.Group();
    const edge = material(new THREE.MeshStandardMaterial({ color: def.edge, roughness: .98 }));
    const front = material(new THREE.MeshPhysicalMaterial({ map: texture(paperTexture(def, index)), roughness: .91, metalness: 0, clearcoat: .025, clearcoatRoughness: .9 }));
    const back = material(new THREE.MeshStandardMaterial({ map: texture(paperTexture(def, index, true)), roughness: .96 }));
    const fold = material(new THREE.MeshStandardMaterial({ color: def.color, roughness: .97 }));
    const paper = material(new THREE.MeshStandardMaterial({ map: texture(paperPage(index)), roughness: 1 }));
    const paperEdge = material(new THREE.MeshStandardMaterial({ color: '#e1e2d6', roughness: 1 }));
    const buttonMaterial = material(new THREE.MeshStandardMaterial({ color: def.edge, roughness: .9 }));
    const metal = material(new THREE.MeshStandardMaterial({ color: '#a99c7b', roughness: .5, metalness: .45 }));
    const stringMaterial = material(new THREE.MeshStandardMaterial({ color: index === 2 ? '#bfb396' : '#77684e', roughness: 1 }));
    const add = (geo, mat, x, y, z) => {
      const mesh = new THREE.Mesh(geo, mat); mesh.position.set(x, y, z); group.add(mesh); return mesh;
    };
    add(backGeo, [back, edge], 0, 0, -.068);
    for (let sheet = 0; sheet < 3; sheet++) {
      const page = add(pageGeo, [paper, paperEdge], -.012 + sheet * .013, .13 + sheet * .012, -.032 + sheet * .013);
      page.rotation.z = (sheet - 1) * .0035;
    }
    add(bodyGeo, [front, edge], 0, -.018, .018);
    add(flapGeo, fold, 0, 0, .074);
    add(seamGeo, edge, -.99, -.06, .071);
    add(seamGeo, edge, .99, -.06, .071);
    // Genuine three-dimensional string-and-button closure.
    for (const [y, z] of [[1.075, .112], [.53, .088]]) {
      const button = add(buttonGeo, buttonMaterial, 0, y, z); button.rotation.x = Math.PI / 2;
      add(eyeletGeo, metal, 0, y, z + .013);
    }
    const points = [
      [-.045, 1.10, .137], [-.07, 1.07, .14], [-.045, 1.025, .141], [.045, 1.015, .141],
      [.073, 1.06, .14], [.04, 1.12, .14], [-.03, 1.13, .14], [-.065, 1.08, .14],
      [.055, .57, .118], [.068, .52, .12], [.02, .465, .12], [-.05, .49, .12],
      [-.07, .545, .12], [-.02, .59, .12], [.055, .56, .12], [-.045, 1.055, .14],
      [-.04, 1.09, .144], [.05, 1.08, .145], [.09, .98, .144], [.11, .93, .14],
    ].map(p => new THREE.Vector3(...p));
    const stringCurve = new THREE.CatmullRomCurve3(points, false, 'centripetal');
    add(geometry(new THREE.TubeGeometry(stringCurve, 100, .0058, 5, false)), stringMaterial, 0, 0, 0);
    scene.add(group); return group;
  });

  // Independent tilts made the flap of one folder cross the next folder's body.
  // Pack their actual transformed depth bounds, not only their centre points.
  // Orthographic projection preserves the intended screen layout at every depth.
  const folderBounds = folders.map(folder => new THREE.Box3().setFromObject(folder));
  const depthBounds = folders.map(() => new THREE.Box3());
  let destroyed = false, frame = 0, visible = true, fallback = null, width = 1, height = 1;
  let halfWidth = 8, halfHeight = 4.8, progress = getProgress(section), target = progress, last = 0, time = 0;
  function publish(value) {
    section?.style.setProperty('--archive-progress', value.toFixed(4));
    if (section) section.dataset.archivePhase = value < .4 ? 'stack' : value < .84 ? 'opening' : 'spread';
  }
  function render(still = media.matches) {
    if (destroyed || fallback || document.hidden || !visible) return;
    const displayedProgress = media.matches ? 1 : progress;
    publish(displayedProgress);
    const states = folders.map((_, index) => choreography(index, displayedProgress, halfWidth, halfHeight, time, still));
    let frontDepth = 0;
    folders.forEach((folder, index) => {
      const state = states[index];
      folder.position.set(state.x, state.y, 0); folder.rotation.set(state.rx, state.ry, state.rz); folder.scale.setScalar(state.scale);
      folder.updateMatrix();
      const bounds = depthBounds[index].copy(folderBounds[index]).applyMatrix4(folder.matrix);
      folder.position.z = frontDepth - bounds.min.z;
      frontDepth += bounds.max.z - bounds.min.z + .045;
    });
    folders.forEach((folder, index) => {
      const state = states[index];
      folder.position.z -= (frontDepth - .045) / 2;
      folder.updateMatrix();
      let bottom = Infinity, left = Infinity, right = -Infinity;
      for (const corner of shadowCorners) {
        shadowPoint.copy(corner).applyMatrix4(folder.matrix);
        bottom = Math.min(bottom, shadowPoint.y); left = Math.min(left, shadowPoint.x); right = Math.max(right, shadowPoint.x);
      }
      const shadow = shadows[index];
      shadow.position.x = (left + right) / 2;
      shadow.position.y = bottom - .035 * state.scale;
      shadow.scale.set((right - left) * 1.12, .29 * state.scale, 1);
      // Overlapping stack shadows stay light; separated folders get a soft anchor.
      shadow.material.opacity = lerp(.022, .095, smooth((displayedProgress - .39) / .49));
    });
    renderer.render(scene, camera);
  }
  function resize() {
    if (destroyed || fallback) return;
    const bounds = container.getBoundingClientRect(); width = Math.max(1, bounds.width); height = Math.max(1, bounds.height);
    const aspect = width / height; halfHeight = aspect < 1 ? 5.1 : 4.8; halfWidth = halfHeight * aspect;
    camera.left = -halfWidth; camera.right = halfWidth; camera.top = halfHeight; camera.bottom = -halfHeight;
    camera.updateProjectionMatrix(); renderer.setSize(width, height, false); render();
  }
  function stop() { if (frame) cancelAnimationFrame(frame); frame = 0; last = 0; }
  function tick(now) {
    frame = 0;
    if (destroyed || fallback || !visible || document.hidden) return;
    const dt = last ? Math.min(60, now - last) : 16.67; last = now; time += dt;
    target = getProgress(section);
    progress = media.matches ? 1 : lerp(progress, target, 1 - Math.exp(-dt / 110));
    render();
    if (!media.matches) frame = requestAnimationFrame(tick);
  }
  function request() {
    if (destroyed || fallback || !visible || document.hidden || frame) return;
    frame = requestAnimationFrame(tick);
  }
  function scroll() { target = getProgress(section); if (media.matches) { progress = 1; render(true); } else request(); }
  function visibility() { if (document.hidden) stop(); else request(); }
  function motion() { stop(); progress = media.matches ? 1 : getProgress(section); render(true); request(); }
  const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(resize) : null; observer?.observe(container);
  const intersection = typeof IntersectionObserver === 'function' ? new IntersectionObserver(entries => {
    visible = entries[0]?.isIntersecting ?? true;
    if (visible) { progress = getProgress(section); resize(); request(); } else stop();
  }, { rootMargin: '100px' }) : null;
  intersection?.observe(container);
  function contextLost(event) {
    event.preventDefault(); stop(); canvas.style.display = 'none';
    if (!destroyed && !fallback) fallback = mountFallback(container);
  }
  window.addEventListener('scroll', scroll, { passive: true }); window.addEventListener('resize', resize, { passive: true });
  document.addEventListener('visibilitychange', visibility); media.addEventListener?.('change', motion);
  canvas.addEventListener('webglcontextlost', contextLost);
  resize(); request();

  return { destroy() {
    if (destroyed) return; destroyed = true; stop(); observer?.disconnect(); intersection?.disconnect(); fallback?.destroy();
    window.removeEventListener('scroll', scroll); window.removeEventListener('resize', resize);
    document.removeEventListener('visibilitychange', visibility); media.removeEventListener?.('change', motion);
    canvas.removeEventListener('webglcontextlost', contextLost);
    for (const item of resources.geometries) item.dispose();
    for (const item of resources.materials) item.dispose();
    for (const item of resources.textures) item.dispose();
    renderer.dispose(); renderer.forceContextLoss(); canvas.remove();
  } };
}
