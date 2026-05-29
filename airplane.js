// airplane.js — самолёт, детали, рейкастинг, перетаскивание

import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

// ===== САМОЛЁТ =====
const airplaneGroup = new THREE.Group();
airplaneGroup.position.set(0,0,0);
window.scene.add(airplaneGroup);
window.airplaneGroup = airplaneGroup;

const fg = new THREE.CylinderGeometry(0.5,0.55,3.2,10);
const fuselage = new THREE.Mesh(fg, new THREE.MeshStandardMaterial({color:0x4488cc,roughness:0.4,metalness:0.6}));
fuselage.rotation.x = Math.PI/2;
airplaneGroup.add(fuselage);

const nose = new THREE.Mesh(
  new THREE.SphereGeometry(0.5,10,10,0,Math.PI*2,0,Math.PI/2),
  new THREE.MeshStandardMaterial({color:0x5599dd,roughness:0.3,metalness:0.7})
);
nose.position.z = -1.6; nose.rotation.x = Math.PI; nose.scale.set(0.9,0.9,0.5);
airplaneGroup.add(nose);

const cockpit = new THREE.Mesh(
  new THREE.SphereGeometry(0.4,10,10),
  new THREE.MeshStandardMaterial({color:0x88ccff,roughness:0.1,metalness:0.3,transparent:true,opacity:0.7})
);
cockpit.position.set(0,0.4,-0.9); cockpit.scale.set(0.55,0.35,0.55);
airplaneGroup.add(cockpit);

const hitTargets = [fuselage, nose, cockpit];

// ===== ДЕТАЛИ =====
const partsLayer = new THREE.Group();
airplaneGroup.add(partsLayer);
window.partsLayer = partsLayer;
window.placedParts = [];
window.selectedPart = null;
const LIMITS = { wing: 2, tail: 2, engine: 2 };

function mkLabel(text) {
  const d = document.createElement('div');
  d.textContent = text;
  d.style.cssText = 'color:white;font-weight:bold;font-size:10px;text-shadow:1px 1px 2px black;background:rgba(0,0,0,0.6);padding:2px 6px;border-radius:8px;';
  const l = new CSS2DObject(d);
  l.userData.isLabel = true;
  return l;
}

window.createPart = function (type) {
  const g = new THREE.Group();
  g.userData = { type, isPart: true };
  if (type === 'wing') {
    const w = new THREE.Mesh(new THREE.BoxGeometry(2.5,0.08,0.7), new THREE.MeshStandardMaterial({color:0xe67e22,roughness:0.5,metalness:0.5}));
    w.userData.isPartMesh = true; g.add(w);
    const eg = new THREE.BoxGeometry(0.06,0.1,0.72), em = new THREE.MeshStandardMaterial({color:0xc0560a});
    const el = new THREE.Mesh(eg,em); el.position.set(-1.25,0,0); g.add(el);
    const er = new THREE.Mesh(eg,em); er.position.set(1.25,0,0); g.add(er);
    // Крылья крепятся по бокам фюзеляжа (X)
    g.userData.snapPos = new THREE.Vector3(0, 0.05, 0);
  } else if (type === 'tail') {
    const h = new THREE.Mesh(new THREE.BoxGeometry(1.2,0.06,0.35), new THREE.MeshStandardMaterial({color:0x9b59b6,roughness:0.5,metalness:0.5}));
    h.userData.isPartMesh = true; g.add(h);
    const v = new THREE.Mesh(new THREE.BoxGeometry(0.06,0.5,0.35), new THREE.MeshStandardMaterial({color:0x9b59b6,roughness:0.5,metalness:0.5}));
    v.position.y = 0.3; v.userData.isPartMesh = true; g.add(v);
    // Хвост сзади (Z+)
    g.userData.snapPos = new THREE.Vector3(0, 0.3, 1.55);
  } else {
    const e = new THREE.Mesh(new THREE.CylinderGeometry(0.25,0.28,0.7,8), new THREE.MeshStandardMaterial({color:0xccccdd,roughness:0.3,metalness:0.8}));
    e.rotation.x = Math.PI/2; e.userData.isPartMesh = true; g.add(e);
    const s = new THREE.Mesh(new THREE.TorusGeometry(0.26,0.04,6,12), new THREE.MeshStandardMaterial({color:0xe74c3c,roughness:0.2,metalness:0.3}));
    s.rotation.y = Math.PI/2; s.userData.isPartMesh = true; g.add(s);
    // Двигатели под крыльями (Y-)
    g.userData.snapPos = new THREE.Vector3(0.55, -0.4, 0);
  }
  const lb = mkLabel(type==='wing'?'🪽':type==='tail'?'🪁':'🚀');
  lb.position.set(0,0.5,0);
  g.add(lb);
  return g;
};

window.clearAllParts = function () {
  while (window.placedParts.length) {
    const p = window.placedParts.pop();
    p.traverse(c => { if (c.geometry) c.geometry.dispose(); if (c.material) Array.isArray(c.material) ? c.material.forEach(m=>m.dispose()) : c.material.dispose(); });
    partsLayer.remove(p);
  }
  const rm = [];
  window.scene.children.forEach(c => { if (c.userData?.isPart && c !== airplaneGroup && c !== partsLayer && !airplaneGroup.children.includes(c)) rm.push(c); });
  rm.forEach(c => {
    c.traverse(x => { if (x.geometry) x.geometry.dispose(); if (x.material) Array.isArray(x.material) ? x.material.forEach(m=>m.dispose()) : x.material.dispose(); });
    window.scene.remove(c);
  });
  window.selectedPart = null;
  document.getElementById('nudge-controls').style.display = 'none';
};

window.selectPart = function (part) {
  if (window.selectedPart && window.selectedPart !== part) {
    window.selectedPart.traverse(c => { if (c.userData?.isPartMesh && c.material?.emissive) c.material.emissive.set(0x000000); });
  }
  window.selectedPart = part;
  if (part) {
    part.traverse(c => { if (c.userData?.isPartMesh && c.material?.emissive) c.material.emissive.set(0x444444); });
    document.getElementById('nudge-controls').style.display = 'flex';
  } else {
    document.getElementById('nudge-controls').style.display = 'none';
  }
};

// ===== ПЕРЕТАСКИВАНИЕ =====
const raycaster = new THREE.Raycaster();
let dragged = null, dragPlane = new THREE.Plane(new THREE.Vector3(0,1,0),0), dragOff = new THREE.Vector3(), wasOnPart = false;

function getHits(e) {
  const r = window.renderer.domElement.getBoundingClientRect();
  const m = new THREE.Vector2(((e.clientX-r.left)/r.width)*2-1, -((e.clientY-r.top)/r.height)*2+1);
  raycaster.setFromCamera(m, window.camera);
  return { fh: raycaster.intersectObjects(hitTargets, false), ph: raycaster.intersectObjects(window.placedParts, true) };
}

window.renderer.domElement.addEventListener('pointerdown', e => {
  if (window.isFlying || (e.pointerType==='touch'&&!e.isPrimary)) return;
  const {ph} = getHits(e);
  if (ph.length) {
    let o = ph[0].object;
    while (o && !window.placedParts.includes(o)) o = o.parent;
    if (o && window.placedParts.includes(o)) {
      dragged = o; window.selectPart(o); window.controls.enabled = false;
      const pt = ph[0].point, wp = new THREE.Vector3(); dragged.getWorldPosition(wp);
      dragOff.copy(wp).sub(pt);
      dragPlane.set(new THREE.Vector3(0,0,1).applyQuaternion(window.camera.quaternion), 0);
      wasOnPart = true;
      document.getElementById('mode-indicator').textContent = '📌 ТЯНИ';
      return;
    }
  }
  wasOnPart = false;
});

window.renderer.domElement.addEventListener('pointermove', e => {
  if (!dragged || window.isFlying || (e.pointerType==='touch'&&!e.isPrimary)) return;
  const r = window.renderer.domElement.getBoundingClientRect();
  raycaster.setFromCamera(new THREE.Vector2(((e.clientX-r.left)/r.width)*2-1, -((e.clientY-r.top)/r.height)*2+1), window.camera);
  const t = new THREE.Vector3();
  if (raycaster.ray.intersectPlane(dragPlane, t)) {
    t.add(dragOff); window.airplaneGroup.worldToLocal(t);
    t.y = Math.max(-2.5,Math.min(3,t.y));
    t.x = Math.max(-2.5,Math.min(2.5,t.x));
    t.z = Math.max(-2,Math.min(2,t.z));
    dragged.position.copy(t);
  }
});

window.renderer.domElement.addEventListener('pointerup', e => {
  if (!dragged) { if (!wasOnPart && !window.isFlying) placeClick(e); return; }
  const snap = dragged.userData.snapPos;
  if (snap) {
    // Увеличил радиус притягивания до 1.5
    if (dragged.position.distanceTo(snap) < 1.5) {
      dragged.position.copy(snap);
    }
  }
  dragged = null; window.controls.enabled = true;
  document.getElementById('mode-indicator').textContent = window.isFlying ? '✈️ ПОЛЕТ' : '🛠️ СБОРКА';
});

function placeClick(e) {
  const {fh, ph} = getHits(e);
  if (ph.length) {
    let o = ph[0].object;
    while (o && !window.placedParts.includes(o)) o = o.parent;
    if (o && window.placedParts.includes(o)) { window.selectPart(o); return; }
  }
  if (fh.length) {
    const type = window.selectedPartType || 'wing';
    const cnt = window.placedParts.filter(p=>p.userData.type===type).length;
    if (cnt >= LIMITS[type]) { alert(`⚠️ Можно только ${LIMITS[type]} детали типа «${type}»`); return; }
    const pt = fh[0].point.clone(); window.airplaneGroup.worldToLocal(pt);
    const part = window.createPart(type);
    part.position.copy(pt);
    // Автоматически притягиваем, если близко
    const snap = part.userData.snapPos;
    if (snap && pt.distanceTo(snap) < 1.5) {
      part.position.copy(snap);
    }
    partsLayer.add(part); window.placedParts.push(part);
    window.selectPart(part);
  }
                                           }
