// airplane.js v1.3.0
import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

const ag = new THREE.Group();
ag.position.set(0,0,0);
window.scene.add(ag);
window.airplaneGroup = ag;

let fm, nm, cm, bigHitbox;
window.hitTargets = [];
window.currentFuselage = 'med';

const FT = {
  small: { l: 2.4, r: 0.4, c: 0x55ccdd },
  med:   { l: 3.6, r: 0.5, c: 0x55cc55 },
  big:   { l: 5.0, r: 0.7, c: 0xdd4444 }
};

window.setFuselage = function(t) {
  window.currentFuselage = t;
  const c = FT[t];
  if (fm) ag.remove(fm);
  if (nm) ag.remove(nm);
  if (cm) ag.remove(cm);
  if (bigHitbox) ag.remove(bigHitbox);
  window.hitTargets.length = 0;

  fm = new THREE.Mesh(
    new THREE.CylinderGeometry(c.r, c.r*1.15, c.l, 10),
    new THREE.MeshStandardMaterial({ color: c.c, roughness: 0.4, metalness: 0.6 })
  );
  fm.rotation.x = Math.PI/2;
  ag.add(fm);
  window.hitTargets.push(fm);

  nm = new THREE.Mesh(
    new THREE.SphereGeometry(c.r, 10, 10, 0, Math.PI*2, 0, Math.PI/2),
    new THREE.MeshStandardMaterial({ color: c.c - 0x111122, roughness: 0.3, metalness: 0.7 })
  );
  nm.position.z = -c.l/2 - 0.1;
  nm.rotation.x = Math.PI;
  nm.scale.set(0.9, 0.9, 0.5);
  ag.add(nm);
  window.hitTargets.push(nm);

  cm = new THREE.Mesh(
    new THREE.SphereGeometry(c.r*0.8, 10, 10),
    new THREE.MeshStandardMaterial({ color: 0xaaddff, roughness: 0.1, metalness: 0.3, transparent: true, opacity: 0.7 })
  );
  cm.position.set(0, c.r*0.8, -c.l*0.2);
  cm.scale.set(0.55, 0.35, 0.55);
  ag.add(cm);
  window.hitTargets.push(cm);

  // НЕВИДИМАЯ СФЕРА для больших хитбоксов
  bigHitbox = new THREE.Mesh(
    new THREE.SphereGeometry(c.l * 0.7, 8, 8),
    new THREE.MeshBasicMaterial({ visible: false, transparent: true, opacity: 0 })
  );
  ag.add(bigHitbox);
  window.hitTargets.push(bigHitbox);
};
window.setFuselage('med');

const pl = new THREE.Group();
ag.add(pl);
window.partsLayer = pl;
window.placedParts = [];
window.selectedPart = null;

function lbl(t) {
  const d = document.createElement('div');
  d.textContent = t;
  d.style.cssText = 'color:white;font-weight:bold;font-size:10px;text-shadow:1px 1px 2px black;background:rgba(0,0,0,0.6);padding:2px 6px;border-radius:8px;';
  const l = new CSS2DObject(d);
  l.userData.isLabel = true;
  return l;
}

window.createPart = function(t) {
  const g = new THREE.Group();
  g.userData = { type: t, isPart: true };
  if (t === 'wing') {
    const w = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.08, 0.7), new THREE.MeshStandardMaterial({ color: 0xe67e22, roughness: 0.5, metalness: 0.5 }));
    w.userData.isPartMesh = true; g.add(w);
    const eg = new THREE.BoxGeometry(0.06, 0.1, 0.72), em = new THREE.MeshStandardMaterial({ color: 0xc0560a });
    g.add(new THREE.Mesh(eg, em)).position.set(-1.4, 0, 0);
    g.add(new THREE.Mesh(eg, em)).position.set(1.4, 0, 0);
    g.userData.snapPos = new THREE.Vector3(0, 0.05, 0);
  } else if (t === 'tail') {
    const h = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.06, 0.4), new THREE.MeshStandardMaterial({ color: 0x9b59b6, roughness: 0.5, metalness: 0.5 }));
    h.userData.isPartMesh = true; g.add(h);
    const v = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.6, 0.4), new THREE.MeshStandardMaterial({ color: 0x9b59b6, roughness: 0.5, metalness: 0.5 }));
    v.position.y = 0.35; v.userData.isPartMesh = true; g.add(v);
    const c = FT[window.currentFuselage];
    g.userData.snapPos = new THREE.Vector3(0, 0.35, c.l/2 + 0.1);
  } else {
    const e = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.28, 0.7, 8), new THREE.MeshStandardMaterial({ color: 0xccccdd, roughness: 0.3, metalness: 0.8 }));
    e.rotation.x = Math.PI/2; e.userData.isPartMesh = true; g.add(e);
    const s = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.04, 6, 12), new THREE.MeshStandardMaterial({ color: 0xe74c3c, roughness: 0.2, metalness: 0.3 }));
    s.rotation.y = Math.PI/2; s.userData.isPartMesh = true; g.add(s);
    g.userData.snapPos = new THREE.Vector3(0.55, -0.45, 0);
  }
  g.add(lbl(t === 'wing' ? '🪽' : t === 'tail' ? '🪁' : '🚀')).position.set(0, 0.5, 0);
  return g;
};

window.clearAllParts = function() {
  while (window.placedParts.length) {
    const p = window.placedParts.pop();
    p.traverse(c => { if (c.geometry) c.geometry.dispose(); if (c.material) Array.isArray(c.material) ? c.material.forEach(m => m.dispose()) : c.material.dispose(); });
    pl.remove(p);
  }
  const rm = [];
  window.scene.children.forEach(c => { if (c.userData?.isPart && c !== ag && c !== pl && !ag.children.includes(c)) rm.push(c); });
  rm.forEach(c => { c.traverse(x => { if (x.geometry) x.geometry.dispose(); if (x.material) Array.isArray(x.material) ? x.material.forEach(m => m.dispose()) : x.material.dispose(); }); window.scene.remove(c); });
  window.selectedPart = null;
  document.getElementById('nudge-controls').style.display = 'none';
  document.getElementById('snap-btn').style.display = 'none';
};

window.selectPart = function(p) {
  if (window.selectedPart && window.selectedPart !== p) {
    window.selectedPart.traverse(c => { if (c.userData?.isPartMesh && c.material?.emissive) c.material.emissive.set(0x000000); });
  }
  window.selectedPart = p;
  if (p) {
    p.traverse(c => { if (c.userData?.isPartMesh && c.material?.emissive) c.material.emissive.set(0x444444); });
    document.getElementById('nudge-controls').style.display = 'flex';
    document.getElementById('snap-btn').style.display = 'block';
  } else {
    document.getElementById('nudge-controls').style.display = 'none';
    document.getElementById('snap-btn').style.display = 'none';
  }
};

const rc = new THREE.Raycaster();
let dr = null, wop = false;
function gh(e) {
  const r = window.renderer.domElement.getBoundingClientRect();
  rc.setFromCamera(new THREE.Vector2(((e.clientX-r.left)/r.width)*2-1, -((e.clientY-r.top)/r.height)*2+1), window.camera);
  return {
    fh: rc.intersectObjects(window.hitTargets||[], false),
    ph: rc.intersectObjects(window.placedParts||[], true)
  };
}

window.renderer.domElement.addEventListener('pointerdown', e => {
  if (window.isFlying || (e.pointerType==='touch' && !e.isPrimary)) return;
  const { ph } = gh(e);
  if (ph.length) {
    let o = ph[0].object;
    while (o && !window.placedParts.includes(o)) o = o.parent;
    if (o && window.placedParts.includes(o)) {
      dr = o; window.selectPart(o); wop = true;
      document.getElementById('mode-indicator').textContent = '📌 ТЯНИ';
      return;
    }
  }
  wop = false;
});

window.renderer.domElement.addEventListener('pointermove', e => {
  if (!dr || window.isFlying) return;
  const r = window.renderer.domElement.getBoundingClientRect();
  rc.setFromCamera(new THREE.Vector2(((e.clientX-r.left)/r.width)*2-1, -((e.clientY-r.top)/r.height)*2+1), window.camera);
  const h = rc.intersectObjects(window.hitTargets||[], false);
  if (h.length) {
    const pt = h[0].point.clone();
    ag.worldToLocal(pt);
    pt.y = Math.max(-4, Math.min(4, pt.y));
    pt.x = Math.max(-4, Math.min(4, pt.x));
    pt.z = Math.max(-4, Math.min(4, pt.z));
    dr.position.copy(pt);
  }
});

window.renderer.domElement.addEventListener('pointerup', e => {
  if (!dr) { if (!wop && !window.isFlying) pc(e); return; }
  const snap = dr.userData.snapPos;
  if (snap && dr.position.distanceTo(snap) < 2.5) {
    dr.position.copy(snap);
  }
  dr = null;
  document.getElementById('mode-indicator').textContent = window.isFlying ? '✈️ ПОЛЕТ' : '🛠️ СБОРКА';
});

function pc(e) {
  const { fh, ph } = gh(e);
  if (ph.length) {
    let o = ph[0].object;
    while (o && !window.placedParts.includes(o)) o = o.parent;
    if (o && window.placedParts.includes(o)) { window.selectPart(o); return; }
  }
  if (fh.length) {
    const t = window.selectedPartType || 'wing';
    const needs = { small:{wing:1,tail:1,engine:1}, med:{wing:2,tail:1,engine:1}, big:{wing:2,tail:1,engine:2} };
    const lim = needs[window.currentFuselage] || {};
    if (window.placedParts.filter(p => p.userData.type === t).length >= (lim[t]||2)) {
      alert('⚠️ Хватит ' + lim[t] + ' шт.');
      return;
    }
    const pt = fh[0].point.clone();
    ag.worldToLocal(pt);
    const p = window.createPart(t);
    p.position.copy(pt);
    pl.add(p);
    window.placedParts.push(p);
    window.selectPart(p);
  }
  }
