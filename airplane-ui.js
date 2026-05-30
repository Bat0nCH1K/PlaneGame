// airplane-ui.js
import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

// ===== САМОЛЁТ =====
const ag = new THREE.Group();
ag.position.set(0,0,0);
window.scene.add(ag);
window.airplaneGroup = ag;

let fm, nm, cm;
window.hitTargets = [];
window.currentFuselage = 'med';

const FT = {
  small:{l:2.4,r:0.4,c:0x44aacc},
  med:{l:3.2,r:0.5,c:0x4488cc},
  big:{l:4.0,r:0.65,c:0x4466aa}
};

window.setFuselage = function(t){
  window.currentFuselage=t;
  const c=FT[t];
  if(fm)ag.remove(fm);if(nm)ag.remove(nm);if(cm)ag.remove(cm);
  window.hitTargets.length=0;
  fm=new THREE.Mesh(new THREE.CylinderGeometry(c.r,c.r*1.1,c.l,10),new THREE.MeshStandardMaterial({color:c.c,roughness:0.4,metalness:0.6}));
  fm.rotation.x=Math.PI/2;ag.add(fm);window.hitTargets.push(fm);
  nm=new THREE.Mesh(new THREE.SphereGeometry(c.r,10,10,0,Math.PI*2,0,Math.PI/2),new THREE.MeshStandardMaterial({color:c.c+0x111133,roughness:0.3,metalness:0.7}));
  nm.position.z=-c.l/2-0.1;nm.rotation.x=Math.PI;nm.scale.set(0.9,0.9,0.5);ag.add(nm);window.hitTargets.push(nm);
  cm=new THREE.Mesh(new THREE.SphereGeometry(c.r*0.8,10,10),new THREE.MeshStandardMaterial({color:0x88ccff,roughness:0.1,metalness:0.3,transparent:true,opacity:0.7}));
  cm.position.set(0,c.r*0.8,-c.l*0.25);cm.scale.set(0.55,0.35,0.55);ag.add(cm);window.hitTargets.push(cm);
};
window.setFuselage('med');

// ===== ДЕТАЛИ =====
const pl = new THREE.Group();
ag.add(pl);
window.partsLayer=pl;
window.placedParts=[];
window.selectedPart=null;
const LIM={wing:2,tail:2,engine:2};

function lbl(t){
  const d=document.createElement('div');d.textContent=t;
  d.style.cssText='color:white;font-weight:bold;font-size:10px;text-shadow:1px 1px 2px black;background:rgba(0,0,0,0.6);padding:2px 6px;border-radius:8px;';
  const l=new CSS2DObject(d);l.userData.isLabel=true;return l;
}

window.createPart = function(t){
  const g=new THREE.Group();g.userData={type:t,isPart:true};
  if(t==='wing'){
    const w=new THREE.Mesh(new THREE.BoxGeometry(2.5,0.08,0.7),new THREE.MeshStandardMaterial({color:0xe67e22,roughness:0.5,metalness:0.5}));
    w.userData.isPartMesh=true;g.add(w);
    const eg=new THREE.BoxGeometry(0.06,0.1,0.72),em=new THREE.MeshStandardMaterial({color:0xc0560a});
    g.add(new THREE.Mesh(eg,em)).position.set(-1.25,0,0);
    g.add(new THREE.Mesh(eg,em)).position.set(1.25,0,0);
    g.userData.snapPos=new THREE.Vector3(0,0.05,0);
  }else if(t==='tail'){
    const h=new THREE.Mesh(new THREE.BoxGeometry(1.2,0.06,0.35),new THREE.MeshStandardMaterial({color:0x9b59b6,roughness:0.5,metalness:0.5}));
    h.userData.isPartMesh=true;g.add(h);
    const v=new THREE.Mesh(new THREE.BoxGeometry(0.06,0.5,0.35),new THREE.MeshStandardMaterial({color:0x9b59b6,roughness:0.5,metalness:0.5}));
    v.position.y=0.3;v.userData.isPartMesh=true;g.add(v);
    const c=FT[window.currentFuselage];
    g.userData.snapPos=new THREE.Vector3(0,0.3,c.l/2+0.05);
  }else{
    const e=new THREE.Mesh(new THREE.CylinderGeometry(0.25,0.28,0.7,8),new THREE.MeshStandardMaterial({color:0xccccdd,roughness:0.3,metalness:0.8}));
    e.rotation.x=Math.PI/2;e.userData.isPartMesh=true;g.add(e);
    const s=new THREE.Mesh(new THREE.TorusGeometry(0.26,0.04,6,12),new THREE.MeshStandardMaterial({color:0xe74c3c,roughness:0.2,metalness:0.3}));
    s.rotation.y=Math.PI/2;s.userData.isPartMesh=true;g.add(s);
    g.userData.snapPos=new THREE.Vector3(0.55,-0.4,0);
  }
  g.add(lbl(t==='wing'?'🪽':t==='tail'?'🪁':'🚀')).position.set(0,0.5,0);
  return g;
};

window.clearAllParts=function(){
  while(window.placedParts.length){const p=window.placedParts.pop();p.traverse(c=>{if(c.geometry)c.geometry.dispose();if(c.material)Array.isArray(c.material)?c.material.forEach(m=>m.dispose()):c.material.dispose();});pl.remove(p);}
  const rm=[];window.scene.children.forEach(c=>{if(c.userData?.isPart&&c!==ag&&c!==pl&&!ag.children.includes(c))rm.push(c);});
  rm.forEach(c=>{c.traverse(x=>{if(x.geometry)x.geometry.dispose();if(x.material)Array.isArray(x.material)?x.material.forEach(m=>m.dispose()):x.material.dispose();});window.scene.remove(c);});
  window.selectedPart=null;
  document.getElementById('nudge-controls').style.display='none';
  document.getElementById('snap-btn').style.display='none';
};

window.selectPart=function(p){
  if(window.selectedPart&&window.selectedPart!==p){window.selectedPart.traverse(c=>{if(c.userData?.isPartMesh&&c.material?.emissive)c.material.emissive.set(0x000000);});}
  window.selectedPart=p;
  if(p){p.traverse(c=>{if(c.userData?.isPartMesh&&c.material?.emissive)c.material.emissive.set(0x444444);});document.getElementById('nudge-controls').style.display='flex';document.getElementById('snap-btn').style.display='block';}
  else{document.getElementById('nudge-controls').style.display='none';document.getElementById('snap-btn').style.display='none';}
};

// ===== ПЕРЕТАСКИВАНИЕ =====
const rc=new THREE.Raycaster();
let dr=null,wop=false;

function gh(e){
  const r=window.renderer.domElement.getBoundingClientRect();
  rc.setFromCamera(new THREE.Vector2(((e.clientX-r.left)/r.width)*2-1,-((e.clientY-r.top)/r.height)*2+1),window.camera);
  return{fh:rc.intersectObjects(window.hitTargets||[],false),ph:rc.intersectObjects(window.placedParts||[],true)};
}

window.renderer.domElement.addEventListener('pointerdown',e=>{
  if(window.isFlying||(e.pointerType==='touch'&&!e.isPrimary))return;
  const{ph}=gh(e);
  if(ph.length){let o=ph[0].object;while(o&&!window.placedParts.includes(o))o=o.parent;if(o&&window.placedParts.includes(o)){dr=o;window.selectPart(o);wop=true;document.getElementById('mode-indicator').textContent='📌 ТЯНИ';return;}}
  wop=false;
});

window.renderer.domElement.addEventListener('pointermove',e=>{
  if(!dr||window.isFlying)return;
  const r=window.renderer.domElement.getBoundingClientRect();
  rc.setFromCamera(new THREE.Vector2(((e.clientX-r.left)/r.width)*2-1,-((e.clientY-r.top)/r.height)*2+1),window.camera);
  const h=rc.intersectObjects(window.hitTargets||[],false);
  if(h.length){const pt=h[0].point.clone();ag.worldToLocal(pt);pt.y=Math.max(-2.5,Math.min(3,pt.y));pt.x=Math.max(-2.5,Math.min(2.5,pt.x));pt.z=Math.max(-2,Math.min(2,pt.z));dr.position.copy(pt);}
});

window.renderer.domElement.addEventListener('pointerup',e=>{
  if(!dr){if(!wop&&!window.isFlying)pc(e);return;}
  dr=null;document.getElementById('mode-indicator').textContent=window.isFlying?'✈️ ПОЛЕТ':'🛠️ СБОРКА';
});

function pc(e){
  const{fh,ph}=gh(e);
  if(ph.length){let o=ph[0].object;while(o&&!window.placedParts.includes(o))o=o.parent;if(o&&window.placedParts.includes(o)){window.selectPart(o);return;}}
  if(fh.length){
    const t=window.selectedPartType||'wing';
    if(window.placedParts.filter(p=>p.userData.type===t).length>=LIM[t]){alert('⚠️ Можно только '+LIM[t]+' детали');return;}
    const pt=fh[0].point.clone();ag.worldToLocal(pt);
    const p=window.createPart(t);p.position.copy(pt);pl.add(p);window.placedParts.push(p);window.selectPart(p);
  }
}

// ===== UI =====
window.selectedPartType='wing';

const mi=document.getElementById('mode-indicator');
const vb=document.getElementById('view-btn');
const fb=document.getElementById('fly-btn');
const rb=document.getElementById('reset-btn');
const bw=document.getElementById('btn-wing');
const bt=document.getElementById('btn-tail');
const be=document.getElementById('btn-engine');
const bs=document.getElementById('btn-fus-small');
const bm=document.getElementById('btn-fus-med');
const bb=document.getElementById('btn-fus-big');
const nc=document.getElementById('nudge-controls');
const sb=document.getElementById('snap-btn');
const id=document.getElementById('instr');
const vg=document.getElementById('version-badge');
const vp=document.getElementById('changelog-popup');
const vl=document.getElementById('changelog-list');

function sa(t){[bw,bt,be].forEach(b=>b.classList.remove('active'));if(t==='wing')bw.classList.add('active');if(t==='tail')bt.classList.add('active');if(t==='engine')be.classList.add('active');window.selectedPartType=t;}
function sf(t){[bs,bm,bb].forEach(b=>b.classList.remove('active'));if(t==='small')bs.classList.add('active');if(t==='med')bm.classList.add('active');if(t==='big')bb.classList.add('active');}

bw.addEventListener('click',()=>sa('wing'));
bt.addEventListener('click',()=>sa('tail'));
be.addEventListener('click',()=>sa('engine'));
bs.addEventListener('click',()=>{sf('small');window.setFuselage('small');});
bm.addEventListener('click',()=>{sf('med');window.setFuselage('med');});
bb.addEventListener('click',()=>{sf('big');window.setFuselage('big');});
sf('med');

fb.addEventListener('click',()=>{
  if(window.isFlying){
    window.exitFlight(ag,window.camera,window.controls);
    fb.textContent='✈️ ВЗЛЕТ';fb.style.background='#2ecc71';mi.textContent='🛠️ СБОРКА';mi.style.background='rgba(0,0,0,0.7)';
    document.body.classList.remove('flying');id.textContent='👆 Тап: деталь | Тап по детали: выделить | Кнопки: двигать/приварить | ✌️: вращать';
    if(window.selectedPart){nc.style.display='flex';sb.style.display='block';}
    if(vb)vb.style.display='none';
    for(const d of window.flyingDetached){pl.add(d.part);window.placedParts.push(d.part);}
    window.flyingDetached.length=0;return;
  }
  if(window.startFlight(ag,window.camera,window.controls,window.placedParts,pl)){
    fb.textContent='🛬 ЗЕМЛЯ';fb.style.background='#e74c3c';mi.textContent='✈️ ПОЛЕТ';mi.style.background='#e74c3c';
    document.body.classList.add('flying');id.textContent='🎮 ▲▼: тангаж | ◀▶: поворот | ⚡: газ | 📷: вид';
    nc.style.display='none';sb.style.display='none';
    if(vb){vb.style.display='block';vb.textContent='📷 Сзади';}
  }
});

rb.addEventListener('click',()=>{
  if(window.isFlying){
    window.exitFlight(ag,window.camera,window.controls);
    fb.textContent='✈️ ВЗЛЕТ';fb.style.background='#2ecc71';mi.textContent='🛠️ СБОРКА';mi.style.background='rgba(0,0,0,0.7)';
    document.body.classList.remove('flying');id.textContent='👆 Тап: деталь | Тап по детали: выделить | Кнопки: двигать/приварить | ✌️: вращать';
    if(vb)vb.style.display='none';
    for(const d of window.flyingDetached){pl.add(d.part);window.placedParts.push(d.part);}
    window.flyingDetached.length=0;
  }
  window.clearAllParts();sa('wing');nc.style.display='none';sb.style.display='none';
});

document.querySelectorAll('.nudge-btn').forEach(b=>{b.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();if(!window.selectedPart||window.isFlying)return;const ax=b.dataset.axis,dr=parseFloat(b.dataset.dir);window.selectedPart.position[ax]+=dr*0.08;window.selectedPart.position.y=Math.max(-2.5,Math.min(3,window.selectedPart.position.y));window.selectedPart.position.x=Math.max(-2.5,Math.min(2.5,window.selectedPart.position.x));window.selectedPart.position.z=Math.max(-2,Math.min(2,window.selectedPart.position.z));});});

sb.addEventListener('click',()=>{if(!window.selectedPart||window.isFlying)return;const sn=window.selectedPart.userData.snapPos;if(sn)window.selectedPart.position.copy(sn);});

sa('wing');
const demo=window.createPart('wing');
demo.position.set(0,0.05,0);
pl.add(demo);window.placedParts.push(demo);window.selectPart(demo);

const VER='1.1.0';
const cl=[
  {v:'1.1.0',t:'major',d:'Три фюзеляжа. Физика: тангаж навсегда, крен автоматический. Ландшафт 200×200 с холмами.'},
  {v:'1.0.5',t:'minor',d:'Кнопка «Приварить», улучшено управление.'},
  {v:'1.0.4',t:'patch',d:'Индикатор и кнопка вида в отдельном блоке.'}
];
function rcl(){
  vl.innerHTML='';
  cl.forEach(e=>{const d=document.createElement('div');d.className='changelog-entry '+e.t;const tag=e.t==='major'?'БО':e.t==='minor'?'МО':'П';d.innerHTML='<div class="changelog-version">v'+e.v+' <span class="tag '+e.t+'">'+tag+'+1</span></div><div class="changelog-desc">'+e.d+'</div>';vl.appendChild(d);});
}
vg.textContent='v'+VER;
vg.addEventListener('click',e=>{e.stopPropagation();const vis=vp.style.display==='block';vp.style.display=vis?'none':'block';if(!vis)rcl();});
document.addEventListener('click',e=>{if(!vg.contains(e.target)&&!vp.contains(e.target))vp.style.display='none';});

const clk=new THREE.Clock();
(function l(){requestAnimationFrame(l);const dt=Math.min(clk.getDelta(),0.1);window.updateFlight(ag,window.camera,window.controls,dt);window.updateDetached(window.flyingDetached,dt);window.controls.update();window.renderer.render(window.scene,window.camera);window.labelRenderer.render(window.scene,window.camera);})();
