/** Original branch 3D arrival terminal. Three.js MIT; no remote models or tracking. */
import * as THREE from './three.module.js';
const clamp=THREE.MathUtils.clamp;
export function mountArrivalReader(host,{onScan,onNeedCode,onZoomChange=()=>{}}){
 const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.22;renderer.localClippingEnabled=true;
 host.append(renderer.domElement);renderer.domElement.setAttribute('aria-hidden','true');
 const scene=new THREE.Scene();scene.background=new THREE.Color('#f5f5f7');
 const camera=new THREE.PerspectiveCamera(32,1,.1,70);camera.position.set(3.2,4.3,12.7);camera.lookAt(0,2,0);
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 scene.add(new THREE.HemisphereLight(0xffffff,0xa2a294,2.25));
 const key=new THREE.DirectionalLight(0xfff8eb,4.2);key.position.set(-4,8,5);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.camera.left=-7;key.shadow.camera.right=7;key.shadow.camera.top=8;key.shadow.camera.bottom=-5;key.shadow.normalBias=.025;key.shadow.bias=-.00012;key.shadow.radius=4;scene.add(key);
 const fill=new THREE.DirectionalLight(0xe2ecff,1.5);fill.position.set(5,3,-4);scene.add(fill);
 const machine=new THREE.Group();scene.add(machine);
 const mat=(color,roughness=.5,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
 const cream=mat('#c7c5ac',.36,.24),lid=mat('#dedbc4',.4,.12),edge=mat('#a5a58d',.46,.28),dark=mat('#30362b',.65),rubber=mat('#34382e',.9),steel=mat('#9d9e88',.28,.8);
 function shape(w,h,r){const s=new THREE.Shape();s.moveTo(-w/2+r,-h/2);s.lineTo(w/2-r,-h/2);s.quadraticCurveTo(w/2,-h/2,w/2,-h/2+r);s.lineTo(w/2,h/2-r);s.quadraticCurveTo(w/2,h/2,w/2-r,h/2);s.lineTo(-w/2+r,h/2);s.quadraticCurveTo(-w/2,h/2,-w/2,h/2-r);s.lineTo(-w/2,-h/2+r);s.quadraticCurveTo(-w/2,-h/2,-w/2+r,-h/2);return s;}
 function block(w,h,d,x,y,z,m,r=.07,b=.035){const g=new THREE.ExtrudeGeometry(shape(w-2*b,h-2*b,r),{depth:d-2*b,bevelEnabled:true,bevelSize:b,bevelThickness:b,bevelSegments:3,steps:1,curveSegments:10});g.translate(0,0,-(d-2*b)/2);const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;machine.add(o);return o;}
 // Separate lid halves leave a genuine narrow channel between them.
 block(5.05,.83,1.85,0,.63,0,cream,.12,.06);
 block(5.1,.16,1.88,0,.24,0,edge,.08,.025);
 block(5.09,.25,.86,0,1.13,.515,lid,.07,.04);
 block(5.09,.25,.86,0,1.13,-.515,lid,.07,.04);
 block(.26,.25,.28,-2.42,1.13,0,lid,.04,.02);block(.26,.25,.28,2.42,1.13,0,lid,.04,.02);
 block(4.62,.05,.16,0,1.065,0,dark,.01,.008);
 // Inner metal rails and visible slot walls.
 block(4.63,.08,.018,0,1.17,.09,steel,.005,.004);block(4.63,.08,.018,0,1.17,-.09,steel,.005,.004);
 for(const x of [-1.95,1.95])for(const z of [-.62,.62])block(.55,.19,.4,x,.095,z,rubber,.07,.02);
 block(2.35,.48,.055,-.38,.66,.963,edge,.05,.018);block(2.18,.33,.025,-.38,.67,1.003,dark,.025,.008);
 function canvasTexture(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());return t;}
 function label(text,w,h,size=45,col='#656954',background=null){return canvasTexture(w,h,c=>{if(background){c.fillStyle=background;c.fillRect(0,0,w,h);}c.fillStyle=col;c.textAlign='center';c.textBaseline='middle';c.font=`${size}px monospace`;c.fillText(text,w/2,h/2);});}
 const displayMaterial=new THREE.MeshBasicMaterial({map:label('INSERT PASS',700,110,44,'#cfddac','#20291f')});
 const display=new THREE.Mesh(new THREE.PlaneGeometry(2.04,.245),displayMaterial);display.position.set(-.38,.67,1.022);machine.add(display);
 function print(text,x,y,z,w,h,rotation=0){const m=new THREE.MeshBasicMaterial({map:label(text,800,100,42),transparent:true,depthWrite:false});const p=new THREE.Mesh(new THREE.PlaneGeometry(w,h),m);p.position.set(x,y,z);p.rotation.x=rotation;machine.add(p);return p;}
 print('PARALLAX  /  BRANCH READER',-.48,1.264,.58,2.65,.13,-Math.PI/2);print('02',-2,.65,.96,.3,.15);print('RE:LIFE',1.8,.42,.96,.55,.10);
 // Machined fasteners, indicator bezel and recessed vent grooves.
 for(const x of [-2.25,2.25]){const screw=new THREE.Mesh(new THREE.CylinderGeometry(.055,.055,.018,20),steel);screw.rotation.x=Math.PI/2;screw.position.set(x,.45,.955);machine.add(screw);block(.06,.007,.01,x,.45,.968,dark,.001,.001);}
 for(let i=0;i<7;i++)block(.012,.21,.043,2.533,.6,-.6+i*.12,dark,.002,.002);
 const bezel=new THREE.Mesh(new THREE.TorusGeometry(.12,.027,12,40),steel);bezel.position.set(1.77,.73,.97);machine.add(bezel);
 const lampMaterial=new THREE.MeshStandardMaterial({color:'#b9bf84',emissive:'#a9c25f',emissiveIntensity:.3,roughness:.24});const lamp=new THREE.Mesh(new THREE.SphereGeometry(.093,24,16),lampMaterial);lamp.scale.z=.35;lamp.position.set(1.77,.73,.99);machine.add(lamp);
 const glowTexture=canvasTexture(128,128,c=>{const g=c.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(223,255,126,.8)');g.addColorStop(.3,'rgba(202,242,115,.2)');g.addColorStop(1,'rgba(200,255,100,0)');c.fillStyle=g;c.fillRect(0,0,128,128);});
 const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));glow.position.set(1.77,.73,1.05);glow.scale.set(.7,.7,.7);glow.material.opacity=.1;machine.add(glow);
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.ShadowMaterial({color:'#51564b',opacity:.18}));floor.rotation.x=-Math.PI/2;floor.position.y=-.02;floor.receiveShadow=true;scene.add(floor);
 // Soft contact shadow supplements the actual directional shadow.
 const shadowMap=canvasTexture(256,256,c=>{const g=c.createRadialGradient(128,128,18,128,128,125);g.addColorStop(0,'rgba(44,49,38,.22)');g.addColorStop(1,'rgba(44,49,38,0)');c.fillStyle=g;c.fillRect(0,0,256,256);});
 const contact=new THREE.Mesh(new THREE.PlaneGeometry(7,3.8),new THREE.MeshBasicMaterial({map:shadowMap,transparent:true,depthWrite:false}));contact.rotation.x=-Math.PI/2;contact.position.y=.001;scene.add(contact);
 let passCode='',state='idle',disposed=false,drag=null,hover=false,near=false,frame=0,last=performance.now();
 function paperTexture(code){return canvasTexture(1600,820,(c,w,h)=>{
 c.fillStyle='#f3f0e6';c.fillRect(0,0,w,h);let seed=47;const random=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};for(let i=0;i<36000;i++){const v=random();c.fillStyle=v>.5?'rgba(100,90,65,.055)':'rgba(255,255,255,.2)';c.fillRect(random()*w,random()*h,1+random(),1);}
 const t=(s,x,y,size,color='#373d34',font='monospace')=>{c.fillStyle=color;c.font=`${size}px ${font}`;c.fillText(s,x,y);};
 t('branch',65,115,72,'#30372f','Arial');t('by parallax',68,151,18);t('PERSONAL BOARDING PASS',780,96,24);t('RE:LIFE / 人生登机牌',780,134,21,'#777c6c','Microsoft YaHei');
 c.strokeStyle='#a9ad9d';c.lineWidth=1;c.beginPath();c.moveTo(60,180);c.lineTo(1515,180);c.stroke();
 t('FROM / 起点',65,230,20);t('TO / 目的地',630,230,20);t('此刻',65,335,78,'#373d34','Microsoft YaHei');t('↗',460,330,82);t('另一种可能',630,335,70,'#373d34','Microsoft YaHei');t('YOUR PRESENT',65,385,23);t('YOUR POSSIBILITIES',630,385,23);
 t('PERSONAL CODE',65,473,21,'#858977');t(code||'AWAITING YOUR PASS',65,525,33);t('GATE',800,473,20);t('02',800,535,52);t('SEAT',1000,473,20);t('YOU',1000,535,52);
 c.setLineDash([8,10]);c.beginPath();c.moveTo(60,592);c.lineTo(1515,592);c.moveTo(1238,25);c.lineTo(1238,790);c.stroke();c.setLineDash([]);
 let x=65;for(let i=0;i<110;i++){const width=2+Math.floor(random()*5);c.fillStyle='#4b5146';c.fillRect(x,643,width,66);x+=width+3;}
 t('ONE PERSON. MANY POSSIBILITIES.',65,765,18);t('保存编码 · 在活动现场揭晓人生',710,740,18,'#777c6c','Microsoft YaHei');
 c.save();c.translate(1390,465);c.rotate(-Math.PI/2);t('RE:LIFE    /    ADMIT ONE',-250,0,36);t((code||'PARALLAX / BRANCH').slice(-16),-250,50,22);c.restore();
 // Die-cut notches at the stub perforation and rounded paper corners.
 c.globalCompositeOperation='destination-out';for(const y of [0,h]){c.beginPath();c.arc(1238,y,18,0,Math.PI*2);c.fill();}c.globalCompositeOperation='source-over';
 });}
 const clip=new THREE.Plane(new THREE.Vector3(0,1,0),-1.25);
 const paperMaterial=new THREE.MeshStandardMaterial({map:paperTexture(''),roughness:.94,metalness:0,side:THREE.FrontSide,transparent:true,alphaTest:.5});
 const backMaterial=new THREE.MeshStandardMaterial({color:'#e8e3d4',roughness:.97,side:THREE.BackSide});
 const geo=new THREE.PlaneGeometry(4.7,2.409,80,40);const base=Float32Array.from(geo.attributes.position.array);const backGeo=geo.clone();
 const paper=new THREE.Group();const face=new THREE.Mesh(geo,paperMaterial);face.castShadow=true;face.receiveShadow=true;paper.add(face);const back=new THREE.Mesh(backGeo,backMaterial);back.position.z=-.014;back.castShadow=true;paper.add(back);scene.add(paper);
 // A visible paper edge follows the curved perimeter, giving it a physical thickness.
 const edgeGeo=new THREE.BufferGeometry();const edgePositions=new Float32Array((80*2+40*2+1)*3);edgeGeo.setAttribute('position',new THREE.BufferAttribute(edgePositions,3));const paperEdge=new THREE.Line(edgeGeo,new THREE.LineBasicMaterial({color:'#beb9aa'}));paper.add(paperEdge);
 const target=new THREE.Vector3(0,3.55,.04);paper.position.copy(target);paper.rotation.set(-.13,-.15,-.07);let bend=.06,insert=0;
 function deform(amount){const a=geo.attributes.position,b=backGeo.attributes.position;for(let i=0;i<a.count;i++){const x=base[i*3],y=base[i*3+1];const z=amount*(Math.sin(x*1.3)+.35*x*x)+.025*Math.cos(y*2+x);a.setZ(i,z);b.setZ(i,z);}a.needsUpdate=true;b.needsUpdate=true;geo.computeVertexNormals();backGeo.computeVertexNormals();const ids=[];for(let i=0;i<=80;i++)ids.push(i);for(let j=1;j<=40;j++)ids.push(j*81+80);for(let i=79;i>=0;i--)ids.push(40*81+i);for(let j=39;j>=0;j--)ids.push(j*81);ids.forEach((id,i)=>{edgePositions[i*3]=a.getX(id);edgePositions[i*3+1]=a.getY(id);edgePositions[i*3+2]=a.getZ(id)-.007;});edgeGeo.attributes.position.needsUpdate=true;}
 let zoom=1,pinchDistance=0,pinchZoom=1,pinching=false;const pointers=new Map();
 function setZoom(value){if(!Number.isFinite(value))return;zoom=clamp(value,.65,2.5);onZoomChange(zoom);}
 function distance(){const a=[...pointers.values()];return a.length<2?0:Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);}
 const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(),plane=new THREE.Plane(new THREE.Vector3(0,0,1),-.04),point=new THREE.Vector3();
 function ray(e){const r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);}
 function down(e){if(e.button!==0)return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});renderer.domElement.setPointerCapture(e.pointerId);if(pointers.size>=2){cancel();pinching=true;pinchDistance=distance();pinchZoom=zoom;return;}if(pinching||state==='reading'||state==='success')return;ray(e);if(!raycaster.intersectObject(face).length)return;raycaster.ray.intersectPlane(plane,point);drag={x:e.clientX,y:e.clientY,offset:paper.position.clone().sub(point),moved:false};renderer.domElement.style.cursor='grabbing';}
 function move(e){if(pointers.has(e.pointerId))pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pinching){if(pointers.size>=2&&pinchDistance>0)setZoom(pinchZoom*distance()/pinchDistance);return;}ray(e);if(drag){raycaster.ray.intersectPlane(plane,point);target.copy(point).add(drag.offset);target.x=clamp(target.x,-2.5,2.5);target.y=clamp(target.y,1.65,4.6);drag.moved ||= Math.abs(e.clientX-drag.x)+Math.abs(e.clientY-drag.y)>7;near=target.y<2.8&&Math.abs(target.x)<1;host.classList.toggle('near-slot',near);}else{hover=raycaster.intersectObject(face).length>0;renderer.domElement.style.cursor=hover?'grab':'default';}}
 function up(e){pointers.delete(e.pointerId);if(pinching){if(!pointers.size)pinching=false;cancel();return;}if(!drag)return;const activate=near||!drag.moved;drag=null;near=false;host.classList.remove('near-slot');target.set(0,3.55,.04);renderer.domElement.style.cursor='grab';if(activate){if(passCode)onScan();else onNeedCode();}}
 function cancel(){drag=null;near=false;target.set(0,3.55,.04);host.classList.remove('near-slot');renderer.domElement.style.cursor='grab';}
 function pointerCancel(e){pointers.delete(e.pointerId);if(!pointers.size)pinching=false;cancel();}
 function wheel(e){e.preventDefault();cancel();const delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?host.clientHeight:1);setZoom(zoom*Math.exp(-clamp(delta,-200,200)*.0018));}
 function keys(e){if(['+','=','-','0'].includes(e.key)){e.preventDefault();cancel();setZoom(e.key==='0'?1:zoom*(e.key==='-'?1/1.15:1.15));}}
 renderer.domElement.tabIndex=0;renderer.domElement.removeAttribute('aria-hidden');renderer.domElement.setAttribute('role','group');renderer.domElement.setAttribute('aria-label','三维票证与读卡器。滚轮或双指缩放，也可用加减键缩放、0键恢复。');
 renderer.domElement.addEventListener('pointerdown',down);renderer.domElement.addEventListener('pointermove',move);renderer.domElement.addEventListener('pointerup',up);renderer.domElement.addEventListener('pointercancel',pointerCancel);renderer.domElement.addEventListener('wheel',wheel,{passive:false});renderer.domElement.addEventListener('keydown',keys);
 function resize(){const w=Math.max(host.clientWidth,1),h=Math.max(host.clientHeight,1);renderer.setSize(w,h,false);camera.aspect=w/h;const halfFov=Math.tan(THREE.MathUtils.degToRad(camera.fov/2));const d=Math.max(5.65/(2*halfFov),6.3/(2*halfFov*camera.aspect));camera.position.copy(new THREE.Vector3(.22,.16,.963).normalize().multiplyScalar(d).add(new THREE.Vector3(0,2.35,0)));camera.lookAt(0,2.35,0);camera.updateProjectionMatrix();}
 const observer=new ResizeObserver(resize);observer.observe(host);resize();
 function tick(now){if(disposed)return;frame=requestAnimationFrame(tick);if(document.hidden){last=now;return;}const dt=Math.min((now-last)/1000,.06);last=now;const rate=reduced.matches?1:1-Math.exp(-dt*9);camera.zoom=THREE.MathUtils.lerp(camera.zoom,zoom,rate);camera.updateProjectionMatrix();const reading=state==='reading'||state==='success';insert=THREE.MathUtils.lerp(insert,reading?1:0,rate);const destination=reading?new THREE.Vector3(0,.9,0):target;paper.position.lerp(destination,rate);paper.rotation.x=THREE.MathUtils.lerp(paper.rotation.x,reading?0:-.13,rate);paper.rotation.y=THREE.MathUtils.lerp(paper.rotation.y,reading?0:(drag?target.x*.12:-.15),rate);paper.rotation.z=THREE.MathUtils.lerp(paper.rotation.z,reading?0:(drag?target.x*-.08:-.07),rate);if(!drag&&!reading&&!reduced.matches)paper.position.y+=Math.sin(now*.0015)*.0018;bend=THREE.MathUtils.lerp(bend,reading?.006:drag?.13:.055,rate);deform(bend);paperMaterial.clippingPlanes=reading?[clip]:[];backMaterial.clippingPlanes=reading?[clip]:[];paperEdge.visible=!reading;const lit=near||reading;lampMaterial.emissiveIntensity=lit?2.8:.25;lampMaterial.color.set(state==='error'?'#bc694d':'#b9cf7a');lampMaterial.emissive.set(state==='error'?'#bd4a2e':'#b7da6f');glow.material.opacity=lit?.8:.06;renderer.render(scene,camera);}
 frame=requestAnimationFrame(tick);
 return {setZoom,zoomBy(factor){cancel();setZoom(zoom*factor);},resetView(){cancel();setZoom(1);},setCode(value){passCode=value||'';paperMaterial.map.dispose();paperMaterial.map=paperTexture(passCode);paperMaterial.needsUpdate=true;if(state==='idle'){displayMaterial.map.dispose();displayMaterial.map=label(passCode?'READY TO READ':'INSERT PASS',700,110,42,'#cfddac','#20291f');displayMaterial.needsUpdate=true;}},setState(value){if(state===value)return;state=value;const text={idle:passCode?'READY TO READ':'INSERT PASS',reading:'READING...',success:'WELCOME ABOARD',error:'TRY AGAIN'}[state]||'INSERT PASS';displayMaterial.map.dispose();displayMaterial.map=label(text,700,110,42,state==='error'?'#e6a58a':'#cfddac','#20291f');displayMaterial.needsUpdate=true;},dispose(){disposed=true;cancelAnimationFrame(frame);observer.disconnect();renderer.domElement.removeEventListener('pointerdown',down);renderer.domElement.removeEventListener('pointermove',move);renderer.domElement.removeEventListener('pointerup',up);renderer.domElement.removeEventListener('pointercancel',pointerCancel);renderer.domElement.removeEventListener('wheel',wheel);renderer.domElement.removeEventListener('keydown',keys);scene.traverse(o=>{o.geometry?.dispose();for(const m of(Array.isArray(o.material)?o.material:[o.material]))if(m){m.map?.dispose();m.dispose();}});renderer.dispose();renderer.domElement.remove();}};
}
