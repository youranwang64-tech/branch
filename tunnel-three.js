/**
 * CIBE original cinematic tunnel scene, built with vendored three@0.180.0 (MIT).
 * Visual reference informed composition only. All geometry and textures below
 * are procedural; no frames or assets from the reference video are included.
 */
import * as THREE from './vendor/three.module.js';

const DEPTH = 192;
const HALF_W = 7;
const HALF_H = 4.65;
const SPEED = 12.5;
const TAU = Math.PI * 2;
const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
function randomGenerator(seed = 73119) {
  return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
}
function canvasTexture(size, paint) {
  const canvas = document.createElement('canvas');
  canvas.width = size; canvas.height = size;
  const context = canvas.getContext('2d');
  if (context) paint(context, size);
  return canvas;
}

function haloCanvas() {
  return canvasTexture(64, (ctx, size) => {
    const gradient = ctx.createRadialGradient(size/2,size/2,0,size/2,size/2,size/2);
    gradient.addColorStop(0,'rgba(235,248,255,1)');
    gradient.addColorStop(.13,'rgba(163,211,255,.82)');
    gradient.addColorStop(.36,'rgba(85,133,230,.24)');
    gradient.addColorStop(1,'rgba(25,45,100,0)');
    ctx.fillStyle = gradient; ctx.fillRect(0,0,size,size);
  });
}

function reflectionEnvironment() {
  const faces = Array.from({length:6},(_,index)=>canvasTexture(256,(ctx,size)=>{
    ctx.fillStyle='#03060b';ctx.fillRect(0,0,size,size);
    const gradient=ctx.createLinearGradient(0,0,size,size);
    gradient.addColorStop(0,'#02050a');gradient.addColorStop(.46,'#10182a');
    gradient.addColorStop(.5,'#a7b9d7');gradient.addColorStop(.54,'#101728');gradient.addColorStop(1,'#02050a');
    ctx.fillStyle=gradient;ctx.fillRect(0,0,size,size);
    ctx.fillStyle=index%2?'#bcf7ff':'#dce9ff';
    ctx.fillRect(0,126,size,3);ctx.fillRect(0,130,size,1);
    ctx.fillStyle='#0b3159';ctx.fillRect(121,0,15,size);
    ctx.fillStyle='#49b8ed';ctx.fillRect(126,0,3,size);
    for(let i=0;i<14;i++){
      const x=(i*71+index*29)%size,y=(i*47+index*59)%size;
      ctx.fillStyle=i%3?'#26334c':'#abc4e7';ctx.fillRect(x,y,3+(i%3)*3,2);
    }
  }));
  const environment=new THREE.CubeTexture(faces);
  environment.colorSpace=THREE.SRGBColorSpace;environment.needsUpdate=true;
  return environment;
}

function makePanelTexture() {
  const random=randomGenerator(91);
  const canvas=canvasTexture(512,(ctx,size)=>{
    ctx.fillStyle='#5b6470';ctx.fillRect(0,0,size,size);
    for(let i=0;i<1300;i++){
      const tone=90+Math.floor(random()*37);
      ctx.strokeStyle=`rgba(${tone},${tone+4},${tone+10},.18)`;
      const y=random()*size;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(size,y);ctx.stroke();
    }
    ctx.strokeStyle='#222d3a';ctx.lineWidth=4;ctx.strokeRect(4,4,size-8,size-8);
    ctx.strokeStyle='#96a2b5';ctx.lineWidth=1;ctx.strokeRect(9,9,size-18,size-18);
    for(const x of [18,size-18])for(const y of [18,size-18]){
      ctx.fillStyle='#171f2a';ctx.beginPath();ctx.arc(x,y,3,0,TAU);ctx.fill();
    }
  });
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(5,36);
  return texture;
}

// The 2D fallback keeps the same perspective composition without a GPU context.
function mountCanvasFallback(container) {
  const canvas=document.createElement('canvas');
  canvas.className='tunnel-canvas tunnel-fallback';canvas.setAttribute('aria-hidden','true');
  canvas.style.cssText='display:block;width:100%;height:100%;pointer-events:none;background:#020409;';
  container.append(canvas);
  const ctx=canvas.getContext('2d');
  const media=window.matchMedia('(prefers-reduced-motion: reduce)');
  const random=randomGenerator();
  const points=Array.from({length:120},()=>({side:Math.floor(random()*4),offset:random()*1.8-0.9,z:random(),length:.03+random()*.035}));
  let paused=media.matches,destroyed=false,frame=0,last=0,time=0,width=1,height=1;
  function render(){
    if(!ctx||destroyed)return;
    const cx=width*.5,cy=height*.5;
    ctx.fillStyle='#020409';ctx.fillRect(0,0,width,height);
    const ambience=ctx.createRadialGradient(cx,cy,10,cx,cy,Math.max(width,height)*.63);
    ambience.addColorStop(0,'#010308');ambience.addColorStop(.38,'#060b19');ambience.addColorStop(1,'#020408');
    ctx.fillStyle=ambience;ctx.fillRect(0,0,width,height);
    ctx.lineWidth=1;
    for(let i=0;i<26;i++){
      const z=(i/26+time*.075)%1;
      const scale=Math.pow(z,2.3)*1.6;
      ctx.strokeStyle=`rgba(91,115,155,${.03+z*.16})`;
      ctx.strokeRect(cx-width*.53*scale,cy-height*.61*scale,width*1.06*scale,height*1.22*scale);
    }
    ctx.strokeStyle='rgba(37,63,113,.32)';
    for(let i=-6;i<=6;i++){
      ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+i*width*.16,0);ctx.stroke();
      ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+i*width*.16,height);ctx.stroke();
    }
    for(const point of points){
      const z=(point.z+time*.115)%1,scale=Math.pow(z,2.1)*1.7;
      let x,y;
      if(point.side<2){x=cx+point.offset*width*.55*scale;y=cy+(point.side?1:-1)*height*.64*scale;}
      else{x=cx+(point.side===2?1:-1)*width*.57*scale;y=cy+point.offset*height*.6*scale;}
      ctx.strokeStyle=`rgba(${point.side%2?'82,149,255':'223,239,255'},${z*.8})`;
      ctx.lineWidth=Math.max(1,z*3);
      ctx.shadowColor=point.side%2?'#4e96ff':'#cce8ff';ctx.shadowBlur=z*13;
      ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+(x-cx)*point.length,y+(y-cy)*point.length);ctx.stroke();
    }
    ctx.shadowBlur=0;
    const horizon=ctx.createLinearGradient(0,cy-14,0,cy+14);
    horizon.addColorStop(0,'rgba(100,151,255,0)');horizon.addColorStop(.45,'rgba(125,181,255,.28)');
    horizon.addColorStop(.5,'rgba(240,249,255,.9)');horizon.addColorStop(.55,'rgba(125,181,255,.28)');horizon.addColorStop(1,'rgba(100,151,255,0)');
    ctx.fillStyle=horizon;ctx.fillRect(0,cy-14,width,28);
    const axis=ctx.createLinearGradient(cx-9,0,cx+9,0);
    axis.addColorStop(0,'rgba(39,158,245,0)');axis.addColorStop(.45,'rgba(54,163,239,.38)');axis.addColorStop(.5,'rgba(108,220,255,.8)');axis.addColorStop(.55,'rgba(54,163,239,.38)');axis.addColorStop(1,'rgba(39,158,245,0)');
    ctx.fillStyle=axis;ctx.fillRect(cx-9,0,18,height);
    const quiet=ctx.createRadialGradient(cx,cy,0,cx,cy,Math.min(width,height)*.31);
    quiet.addColorStop(0,'rgba(1,3,8,1)');quiet.addColorStop(.3,'rgba(1,3,8,.92)');quiet.addColorStop(1,'rgba(1,3,8,0)');
    ctx.fillStyle=quiet;ctx.fillRect(0,0,width,height);
  }
  function resize(){
    const box=container.getBoundingClientRect();width=Math.max(1,box.width);height=Math.max(1,box.height);
    const ratio=Math.min(window.devicePixelRatio||1,1.5);
    canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);ctx?.setTransform(ratio,0,0,ratio,0,0);render();
  }
  function tick(now){
    if(destroyed||paused)return;
    if(!document.hidden){time+=Math.min(50,now-(last||now))/1000;render();}
    last=now;frame=requestAnimationFrame(tick);
  }
  function motionChange(){if(media.matches){paused=true;cancelAnimationFrame(frame);render();}}
  const observer=new ResizeObserver(resize);observer.observe(container);
  media.addEventListener('change',motionChange);resize();if(!paused)frame=requestAnimationFrame(tick);
  return {
    get paused(){return paused;},
    togglePause(){paused=!paused;cancelAnimationFrame(frame);last=0;if(!paused)frame=requestAnimationFrame(tick);return paused;},
    destroy(){if(destroyed)return;destroyed=true;cancelAnimationFrame(frame);observer.disconnect();media.removeEventListener('change',motionChange);canvas.remove();},
  };
}

/** Mount the original reflective corridor. No external assets or network calls. */
export function mountTunnel(container) {
  if(!(container instanceof HTMLElement))return {destroy(){},togglePause(){return true;},paused:true};
  let renderer;
  try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});}
  catch{return mountCanvasFallback(container);}
  const canvas=renderer.domElement;
  canvas.className='tunnel-canvas';canvas.setAttribute('aria-hidden','true');
  canvas.style.cssText='display:block;width:100%;height:100%;pointer-events:none;background:#020409;';
  container.append(canvas);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.65));
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
  const scene=new THREE.Scene();scene.background=new THREE.Color(0x020409);scene.fog=new THREE.FogExp2(0x020409,.0135);
  const camera=new THREE.PerspectiveCamera(66,1,.1,240);camera.position.set(0,0,11);
  const environment=reflectionEnvironment();scene.environment=environment;scene.environmentIntensity=.75;
  const textures=[environment];const geometries=[];const materials=[];
  const rememberGeometry=g=>(geometries.push(g),g);
  const rememberMaterial=m=>(materials.push(m),m);
  const boxGeometry=rememberGeometry(new THREE.BoxGeometry(1,1,1));
  const planeGeometry=rememberGeometry(new THREE.PlaneGeometry(1,1));
  const panelTexture=makePanelTexture();textures.push(panelTexture);
  const metal=rememberMaterial(new THREE.MeshPhysicalMaterial({color:0x172237,metalness:.93,roughness:.22,map:panelTexture,envMapIntensity:.8,clearcoat:.35,clearcoatRoughness:.14}));
  const rimMetal=rememberMaterial(new THREE.MeshStandardMaterial({color:0x4d607c,metalness:.95,roughness:.19,envMapIntensity:.85}));
  const darkMetal=rememberMaterial(new THREE.MeshStandardMaterial({color:0x111a2b,metalness:.88,roughness:.27,envMapIntensity:.55}));
  scene.add(new THREE.AmbientLight(0x687aa3,.42));
  const key=new THREE.DirectionalLight(0xd6e7ff,2.1);key.position.set(-3,5,8);scene.add(key);
  const fill=new THREE.DirectionalLight(0x3476c5,1.1);fill.position.set(4,-3,-30);scene.add(fill);

  // Four continuous brushed-metal surfaces reflect a procedural strip-light environment.
  for(const side of [-1,1]){
    const floor=new THREE.Mesh(planeGeometry,metal);floor.scale.set(HALF_W*2,DEPTH,1);
    floor.rotation.x=side>0?Math.PI/2:-Math.PI/2;floor.position.set(0,side*HALF_H,-DEPTH/2+10);scene.add(floor);
    const wall=new THREE.Mesh(planeGeometry,metal);wall.scale.set(DEPTH,HALF_H*2,1);
    wall.rotation.y=side>0?-Math.PI/2:Math.PI/2;wall.position.set(side*HALF_W,0,-DEPTH/2+10);scene.add(wall);
  }
  function beam(x,y,w,h,material){
    const mesh=new THREE.Mesh(boxGeometry,material);mesh.scale.set(w,h,DEPTH);mesh.position.set(x,y,-DEPTH/2+10);scene.add(mesh);return mesh;
  }
  for(const y of [-HALF_H,HALF_H])for(const x of [-5.6,-3.8,-2.0,2.0,3.8,5.6])beam(x,y,.045,.045,darkMetal);
  for(const x of [-HALF_W,HALF_W])for(const y of [-3.5,-2.1,2.1,3.5])beam(x,y,.045,.045,darkMetal);

  function lightMaterial(color,opacity=1){return rememberMaterial(new THREE.MeshBasicMaterial({color,transparent:opacity<1,opacity,blending:opacity<1?THREE.AdditiveBlending:THREE.NormalBlending,depthWrite:opacity===1,toneMapped:false,fog:true}));}
  const white=lightMaterial(0xe6f1ff),cyan=lightMaterial(0x65d9ff),blue=lightMaterial(0x3c71d5);
  const whiteHalo=lightMaterial(0x88b4ff,.1),blueHalo=lightMaterial(0x167bd2,.13);
  // Mid-height white rails create the reference's horizontal line of light.
  for(const side of [-1,1]){
    beam(side*(HALF_W-.05),0,.08,.055,white);
    beam(side*(HALF_W-.08),0,.13,.31,whiteHalo);
    beam(side*(HALF_W-.10),0,.16,.72,lightMaterial(0x7eafff,.026));
    beam(side*(HALF_W-.04),.12,.045,.02,white);
    // Twin cyan ceiling/floor rails form the vertical axis around the vanishing point.
    for(const x of [-.16,.16]){
      beam(x,side*(HALF_H-.04),.04,.065,cyan);
      beam(x,side*(HALF_H-.07),.2,.08,blueHalo);
    }
    for(const x of [-4.6,4.6])beam(x,side*(HALF_H-.05),.025,.04,blue);
  }

  // Metal frames move as one instanced draw call, continuously passing the camera.
  const frameCount=34;
  const ribs=new THREE.InstancedMesh(boxGeometry,rimMetal,frameCount*4);ribs.instanceMatrix.setUsage(THREE.DynamicDrawUsage);ribs.frustumCulled=false;scene.add(ribs);
  const dummy=new THREE.Object3D();
  const random=randomGenerator();
  const specks=Array.from({length:184},(_,index)=>({
    side:index%4,offset:random()*1.7-.85,depth:random()*DEPTH,
    wide:.055+random()*.13,long:.22+random()*.85,blue:index%3===0,
  }));
  const markerMaterial=rememberMaterial(new THREE.MeshBasicMaterial({color:0xffffff,toneMapped:false}));
  const markers=new THREE.InstancedMesh(boxGeometry,markerMaterial,specks.length);markers.instanceMatrix.setUsage(THREE.DynamicDrawUsage);markers.frustumCulled=false;scene.add(markers);
  const markerColor=new THREE.Color();
  specks.forEach((speck,index)=>markers.setColorAt(index,markerColor.set(speck.blue?0x416bd2:0xc4d5ef)));
  const haloTexture=new THREE.CanvasTexture(haloCanvas());textures.push(haloTexture);
  const haloGeometry=rememberGeometry(new THREE.BufferGeometry());
  const haloPositions=new Float32Array(specks.length*3);haloGeometry.setAttribute('position',new THREE.BufferAttribute(haloPositions,3).setUsage(THREE.DynamicDrawUsage));
  const haloMaterial=rememberMaterial(new THREE.PointsMaterial({color:0x7bafff,map:haloTexture,size:.72,transparent:true,opacity:.29,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));
  const halos=new THREE.Points(haloGeometry,haloMaterial);halos.frustumCulled=false;scene.add(halos);

  // Lightweight optical glow, rendered in one transparent full-screen pass.
  const glowScene=new THREE.Scene(),glowCamera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
  const glowMaterial=rememberMaterial(new THREE.ShaderMaterial({
    transparent:true,depthTest:false,depthWrite:false,blending:THREE.AdditiveBlending,
    uniforms:{uAspect:{value:1}},
    vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
    fragmentShader:`varying vec2 vUv; uniform float uAspect;
      void main(){
        vec2 p=vUv-.5;
        float centre=smoothstep(.075,.30,length(vec2(p.x*uAspect,p.y)));
        float horizontal=exp(-abs(p.y)*140.)*.20+exp(-abs(p.y)*24.)*.038;
        float vertical=exp(-abs(p.x)*180.)*.13+exp(-abs(p.x)*50.)*.02;
        float sides=pow(abs(p.x)*2.,1.8);
        vec3 light=vec3(.72,.83,1.)*horizontal*(.2+sides)*centre;
        light+=vec3(.07,.43,.95)*vertical*centre;
        gl_FragColor=vec4(light,1.);
      }`,
  }));
  glowScene.add(new THREE.Mesh(rememberGeometry(new THREE.PlaneGeometry(2,2)),glowMaterial));

  const media=window.matchMedia('(prefers-reduced-motion: reduce)');
  let paused=media.matches,destroyed=false,frame=0,last=0,time=0,visible=true,fallback=null;
  const pointer={x:0,y:0},eased={x:0,y:0};
  function updateGeometry(){
    const travel=time*SPEED;
    for(let i=0;i<frameCount;i++){
      const z=12-((i*DEPTH/frameCount-travel)%DEPTH+DEPTH)%DEPTH;
      for(let side=0;side<4;side++){
        if(side<2){dummy.position.set(0,(side?1:-1)*(HALF_H-.025),z);dummy.scale.set(HALF_W*2,.052,.10);}
        else{dummy.position.set((side===2?1:-1)*(HALF_W-.025),0,z);dummy.scale.set(.052,HALF_H*2,.10);}
        dummy.rotation.set(0,0,0);dummy.updateMatrix();ribs.setMatrixAt(i*4+side,dummy.matrix);
      }
    }
    ribs.instanceMatrix.needsUpdate=true;
    specks.forEach((speck,index)=>{
      const z=12-((speck.depth-travel)%DEPTH+DEPTH)%DEPTH;
      if(speck.side<2){dummy.position.set(speck.offset*HALF_W,(speck.side?1:-1)*(HALF_H-.07),z);dummy.scale.set(speck.wide,.024,speck.long);}
      else{dummy.position.set((speck.side===2?1:-1)*(HALF_W-.07),speck.offset*HALF_H,z);dummy.scale.set(.024,speck.wide,speck.long);}
      dummy.updateMatrix();markers.setMatrixAt(index,dummy.matrix);
      haloPositions[index*3]=dummy.position.x;haloPositions[index*3+1]=dummy.position.y;haloPositions[index*3+2]=z;
    });
    markers.instanceMatrix.needsUpdate=true;haloGeometry.attributes.position.needsUpdate=true;
    panelTexture.offset.y=(time*SPEED/DEPTH*36)%1;
  }
  function render(){
    if(destroyed)return;
    camera.position.x=eased.x*.19;camera.position.y=-eased.y*.12;
    camera.lookAt(eased.x*.45,-eased.y*.25,-90);
    camera.rotation.z=paused?0:Math.sin(time*.16)*.0018;
    renderer.autoClear=true;renderer.render(scene,camera);
    renderer.autoClear=false;renderer.render(glowScene,glowCamera);renderer.autoClear=true;
  }
  function resize(){
    if(destroyed)return;
    const box=container.getBoundingClientRect(),width=Math.max(1,box.width),height=Math.max(1,box.height);
    camera.aspect=width/height;camera.fov=width<600?76:66;camera.updateProjectionMatrix();
    glowMaterial.uniforms.uAspect.value=camera.aspect;renderer.setSize(width,height,false);render();
  }
  function tick(now){
    if(destroyed||paused)return;
    frame=requestAnimationFrame(tick);
    const dt=Math.min(.05,(now-(last||now))/1000);last=now;
    if(!visible||document.hidden)return;
    time+=dt;
    const ease=1-Math.exp(-dt*3);
    eased.x+=(pointer.x-eased.x)*ease;eased.y+=(pointer.y-eased.y)*ease;
    updateGeometry();render();
  }
  function pointerMove(event){
    if(paused||!visible)return;
    const box=container.getBoundingClientRect();
    pointer.x=clamp((event.clientX-box.left)/Math.max(1,box.width)*2-1,-1,1);
    pointer.y=clamp((event.clientY-box.top)/Math.max(1,box.height)*2-1,-1,1);
  }
  function pointerLeave(){pointer.x=0;pointer.y=0;}
  function motionChange(){if(media.matches){paused=true;cancelAnimationFrame(frame);render();}}
  const observer=new ResizeObserver(resize);observer.observe(container);
  const intersection=new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting??true;},{rootMargin:'100px'});intersection.observe(container);
  window.addEventListener('pointermove',pointerMove,{passive:true});window.addEventListener('pointerleave',pointerLeave,{passive:true});
  media.addEventListener('change',motionChange);
  function cleanup(){
    if(destroyed)return;destroyed=true;cancelAnimationFrame(frame);
    observer.disconnect();intersection.disconnect();
    window.removeEventListener('pointermove',pointerMove);window.removeEventListener('pointerleave',pointerLeave);media.removeEventListener('change',motionChange);
    canvas.removeEventListener('webglcontextlost',contextLost);
    ribs.dispose();markers.dispose();textures.forEach(texture=>texture.dispose());
    geometries.forEach(geometry=>geometry.dispose());materials.forEach(material=>material.dispose());
    scene.clear();glowScene.clear();renderer.renderLists.dispose();renderer.dispose();renderer.forceContextLoss();canvas.remove();
  }
  function contextLost(event){event.preventDefault();cleanup();fallback=mountCanvasFallback(container);if(paused!==fallback.paused)fallback.togglePause();}
  canvas.addEventListener('webglcontextlost',contextLost);
  updateGeometry();resize();if(!paused)frame=requestAnimationFrame(tick);
  return {
    get paused(){return fallback?fallback.paused:paused;},
    togglePause(){
      if(fallback)return fallback.togglePause();
      if(destroyed)return true;
      paused=!paused;cancelAnimationFrame(frame);last=0;
      if(!paused)frame=requestAnimationFrame(tick);else render();
      return paused;
    },
    destroy(){cleanup();fallback?.destroy();},
  };
}
