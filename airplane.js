// airplane.js — самолёт, детали, фюзеляжи
import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

const airplaneGroup=new THREE.Group();
airplaneGroup.position.set(0,0,0);
window.scene.add(airplaneGroup);
window.airplaneGroup=airplaneGroup;

let fuselageMesh,noseMesh,cockpitMesh;
const hitTargets=[];

window.currentFuselage='med';

const FUSELAGE_TYPES={
  small:{length:2.4,radius:0.4,color:0x44aacc,speed:0.5},
  med:{length:3.2,radius:0.5,color:0x4488cc,speed:0.7},
  big:{length:4.0,radius:0.65,color:0x4466aa,speed:1.0}
};

window.setFuselage=function(type){
  window.currentFuselage=type;
  const cfg=FUSELAGE_TYPES[type];
  
  if(fuselageMesh)airplaneGroup.remove(fuselageMesh);
  if(noseMesh)airplaneGroup.remove(noseMesh);
  if(cockpitMesh)airplaneGroup.remove(cockpitMesh);
  hitTargets.length=0;
  
  const fg=new THREE.CylinderGeometry(cfg.radius,cfg.radius*1.1,cfg.length,10);
  fuselageMesh=new THREE.Mesh(fg,new THREE.MeshStandardMaterial({color:cfg.color,roughness:0.4,metalness:0.6}));
  fuselageMesh.rotation.x=Math.PI/2;
  airplaneGroup.add(fuselageMesh);
  hitTargets.push(fuselageMesh);
  
  const ng=new THREE.SphereGeometry(cfg.radius,10,10,0,Math.PI*2,0,Math.PI/2);
  noseMesh=new THREE.Mesh(ng,new THREE.MeshStandardMaterial({color:cfg.color+0x111133,roughness:0.3,metalness:0.7}));
  noseMesh.position.z=-cfg.length/2-0.1;
  noseMesh.rotation.x=Math.PI;
  noseMesh.scale.set(0.9,0.9,0.5);
  airplaneGroup.add(noseMesh);
  hitTargets.push(noseMesh);
  
  const cg=new THREE.SphereGeometry(cfg.radius*0.8,10,10);
  cockpitMesh=new THREE.Mesh(cg,new THREE.MeshStandardMaterial({color:0x88ccff,roughness:0.1,metalness:0.3,transparent:true,opacity:0.7}));
  cockpitMesh.position.set(0,cfg.radius*0.8,-cfg.length*0.25);
  cockpitMesh.scale.set(0.55,0.35,0.55);
  airplaneGroup.add(cockpitMesh);
  hitTargets.push(cockpitMesh);
};

window.setFuselage('med');

// Детали
const partsLayer=new THREE.Group();
airplaneGroup.add(partsLayer);
window.partsLayer=partsLayer;
window.placedParts=[];
window.selectedPart=null;
const LIMITS={wing:2,tail:2,engine:2};

function mkLabel(text){
  const d=document.createElement('div');d.textContent=text;
  d.style.cssText='color:white;font-weight:bold;font-size:10px;text-shadow:1px 1px 2px black;background:rgba(0,0,0,0.6);padding:2px 6px;border-radius:8px;';
  const l=new CSS2DObject(d);l.userData.isLabel=true;return l;
}

window.createPart=function(type){
  const g=new THREE.Group();g.userData={type,isPart:true};
  if(type==='wing'){
    const w=new THREE.Mesh(new THREE.BoxGeometry(2.5,0.08,0.7),new THREE.MeshStandardMaterial({color:0xe67e22,roughness:0.5,metalness:0.5}));
    w.userData.isPartMesh=true;g.add(w);
    const eg=new THREE.BoxGeometry(0.06,0.1,0.72),em=new THREE.MeshStandardMaterial({color:0xc0560a});
    g.add(new THREE.Mesh(eg,em)).position.set(-1.25,0,0);
    g.add(new THREE.Mesh(eg,em)).position.set(1.25,0,0);
    g.userData.snapPos=new THREE.Vector3(0,0.05,0);
  }else if(type==='tail'){
    const h=new THREE.Mesh(new THREE.BoxGeometry(1.2,0.06,0.35),new THREE.MeshStandardMaterial({color:0x9b59b6,roughness:0.5,metalness:0.5}));
    h.userData.isPartMesh=true;g.add(h);
    const v=new THREE.Mesh(new THREE.BoxGeometry(0.06,0.5,0.35),new THREE.MeshStandardMaterial({color:0x9b59b6,roughness:0.5,metalness:0.5}));
    v.position.y=0.3;v.userData.isPartMesh=true;g.add(v);
    const cfg=FUSELAGE_TYPES[window.currentFuselage];
    g.userData.snapPos=new THREE.Vector3(0,0.3,cfg.length/2+0.05);
  }else{
    const e=new THREE.Mesh(new THREE.CylinderGeometry(0.25,0.28,0.7,8),new THREE.MeshStandardMaterial({color:0xccccdd,roughness:0.3,metalness:0.8}));
    e.rotation.x=Math.PI/2;e.userData.isPartMesh=true;g.add(e);
    const s=new THREE.Mesh(new THREE.TorusGeometry(0.26,0.04,6,12),new THREE.MeshStandardMaterial({color:0xe74c3c,roughness:0.2,metalness:0.3}));
    s.rotation.y=Math.PI/2;s.userData.isPartMesh=true;g.add(s);
    g.userData.snapPos=new THREE.Vector3(0.55,-0.4,0);
  }
  const lb=mkLabel(type==='wing'?'🪽':type==='tail'?'🪁':'🚀');
  lb.position.set(0,0.5,0);g.add(lb);
  return g;
};

window.clearAllParts=function(){
  while(window.placedParts.length){const p=window.placedParts.pop();p.traverse(c=>{if(c.geometry)c.geometry.dispose();if(c.material)Array.isArray(c.material)?c.material.forEach(m=>m.dispose()):c.material.dispose();});partsLayer.remove(p);}
  const rm=[];window.scene.children.forEach(c=>{if(c.userData?.isPart&&c!==airplaneGroup&&c!==partsLayer&&!airplaneGroup.children.includes(c))rm.push(c);});
  rm.forEach(c=>{c.traverse(x=>{if(x.geometry)x.geometry.dispose();if(x.material)Array.isArray(x.material)?x.material.forEach(m=>m.dispose()):x.material.dispose();});window.scene.remove(c);});
  window.selectedPart=null;
  document.getElementById('nudge-controls').style.display='none';
  document.getElementById('snap-btn').style.display='none';
};

window.selectPart=function(part){
  if(window.selectedPart&&window.selectedPart!==part){window.selectedPart.traverse(c=>{if(c.userData?.isPartMesh&&c.material?.emissive)c.material.emissive.set(0x000000);});}
  window.selectedPart=part;
  if(part){part.traverse(c=>{if(c.userData?.isPartMesh&&c.material?.emissive)c.material.emissive.set(0x444444);});document.getElementById('nudge-controls').style.display='flex';document.getElementById('snap-btn').style.display='block';}
  else{document.getElementById('nudge-controls').style.display='none';document.getElementById('snap-btn').style.display='none';}
};

// Перетаскивание
const raycaster=new THREE.Raycaster();
let dragged=null,wasOnPart=false;

function getHits(e){
  const r=window.renderer.domElement.getBoundingClientRect();
  const m=new THREE.Vector2(((e.clientX-r.left)/r.width)*2-1,-((e.clientY-r.top)/r.height)*2+1);
  raycaster.setFromCamera(m,window.camera);
  return{fh:raycaster.intersectObjects(hitTargets,false),ph:raycaster.intersectObjects(window.placedParts,true)};
}

window.renderer.domElement.addEventListener('pointerdown',e=>{
  if(window.isFlying||(e.pointerType==='touch'&&!e.isPrimary))return;
  const{ph}=getHits(e);
  if(ph.length){let o=ph[0].object;while(o&&!window.placedParts.includes(o))o=o.parent;if(o&&window.placedParts.includes(o)){dragged=o;window.selectPart(o);wasOnPart=true;document.getElementById('mode-indicator').textContent='📌 ТЯНИ';return;}}
  wasOnPart=false;
});

window.renderer.domElement.addEventListener('pointermove',e=>{
  if(!dragged||window.isFlying)return;
  const r=window.renderer.domElement.getBoundingClientRect();
  raycaster.setFromCamera(new THREE.Vector2(((e.clientX-r.left)/r.width)*2-1,-((e.clientY-r.top)/r.height)*2+1),window.camera);
  const hits=raycaster.intersectObjects(hitTargets,false);
  if(hits.length){const pt=hits[0].point.clone();window.airplaneGroup.worldToLocal(pt);pt.y=Math.max(-2.5,Math.min(3,pt.y));pt.x=Math.max(-2.5,Math.min(2.5,pt.x));pt.z=Math.max(-2,Math.min(2,pt.z));dragged.position.copy(pt);}
});

window.renderer.domElement.addEventListener('pointerup',e=>{
  if(!dragged){if(!wasOnPart&&!window.isFlying)placeClick(e);return;}
  dragged=null;document.getElementById('mode-indicator').textContent=window.isFlying?'✈️ ПОЛЕТ':'🛠️ СБОРКА';
});

function placeClick(e){
  const{fh,ph}=getHits(e);
  if(ph.length){let o=ph[0].object;while(o&&!window.placedParts.includes(o))o=o.parent;if(o&&window.placedParts.includes(o)){window.selectPart(o);return;}}
  if(fh.length){const type=window.selectedPartType||'wing';const cnt=window.placedParts.filter(p=>p.userData.type===type).length;if(cnt>=LIMITS[type]){alert(`⚠️ Можно только ${LIMITS[type]} детали типа «${type}»`);return;}const pt=fh[0].point.clone();window.airplaneGroup.worldToLocal(pt);const part=window.createPart(type);part.position.copy(pt);partsLayer.add(part);window.placedParts.push(part);window.selectPart(part);}
}
