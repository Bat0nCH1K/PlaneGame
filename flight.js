// flight.js — полёт

import * as THREE from 'three';

window.isFlying = false;
window.flyData = null;
window.keys = {};
window.viewMode = 0;
window.flyingDetached = [];

let mobileCtrl = null;

function bindViewBtn() {
  const btn = document.getElementById('view-btn');
  if (!btn || btn.dataset.bound === '1') return;
  btn.dataset.bound = '1';
  btn.addEventListener('click', () => {
    window.viewMode = (window.viewMode + 1) % 3;
    btn.textContent = ['📷 Сзади', '📷 Сбоку', '📷 Свободно'][window.viewMode];
    if (window.controls) window.controls.enabled = (window.viewMode === 2);
  });
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bindViewBtn);
} else {
  bindViewBtn();
}

window.showMobileControls = function () {
  if (mobileCtrl) return;
  mobileCtrl = document.createElement('div');
  mobileCtrl.className = 'mobile-ctrl-container';
  mobileCtrl.innerHTML = `
    <div class="mobile-ctrl-row"><button class="ctrl-btn" id="cu">▲</button></div>
    <div class="mobile-ctrl-row"><button class="ctrl-btn" id="cl">◀</button><button class="ctrl-btn" id="cg">⚡</button><button class="ctrl-btn" id="cr">▶</button></div>
    <div class="mobile-ctrl-row"><button class="ctrl-btn" id="cd">▼</button></div>`;
  document.body.appendChild(mobileCtrl);
  const bind = (id, k) => {
    const b = document.getElementById(id);
    if (!b) return;
    const a = e => { e.preventDefault(); window.keys[k] = true; };
    const r = e => { e.preventDefault(); window.keys[k] = false; };
    b.addEventListener('pointerdown', a);
    b.addEventListener('pointerup', r);
    b.addEventListener('pointerleave', r);
    b.addEventListener('pointercancel', r);
  };
  bind('cu', 'arrowup'); bind('cd', 'arrowdown');
  bind('cl', 'arrowleft'); bind('cr', 'arrowright');
  bind('cg', 'w');
};

window.hideMobileControls = function () {
  if (mobileCtrl) { mobileCtrl.remove(); mobileCtrl = null; }
  Object.keys(window.keys).forEach(k => window.keys[k] = false);
};

window.addEventListener('keydown', e => { window.keys[e.key.toLowerCase()] = true; });
window.addEventListener('keyup', e => { window.keys[e.key.toLowerCase()] = false; });

window.detachLooseParts = function (airplaneGroup, partsLayer, placedParts) {
  const detached = [], remaining = [];
  for (const p of placedParts) {
    const snap = p.userData.snapPos;
    if (snap && p.position.distanceTo(snap) < 0.3) {
      remaining.push(p);
    } else {
      const wp = new THREE.Vector3(); p.getWorldPosition(wp);
      const wq = new THREE.Quaternion(); p.getWorldQuaternion(wq);
      partsLayer.remove(p);
      airplaneGroup.parent.add(p);
      p.position.copy(wp); p.quaternion.copy(wq);
      detached.push({ part: p, velocity: new THREE.Vector3((Math.random()-0.5)*2, (Math.random()-0.5)*2, (Math.random()-0.5)*2) });
    }
  }
  placedParts.length = 0;
  placedParts.push(...remaining);
  return detached;
};

window.updateDetached = function (detached, dt) {
  for (const d of detached) {
    d.velocity.y -= 9.8 * dt;
    d.part.position.add(d.velocity.clone().multiplyScalar(dt));
    if (d.part.position.y < -4.8) { d.part.position.y = -4.8; d.velocity.y *= -0.3; d.velocity.x *= 0.8; d.velocity.z *= 0.8; }
    d.part.rotation.x += (Math.random()-0.5) * 5 * dt;
    d.part.rotation.z += (Math.random()-0.5) * 5 * dt;
  }
};

window.startFlight = function (airplaneGroup, camera, controls, placedParts, partsLayer) {
  if (!placedParts.some(p=>p.userData.type==='wing') || !placedParts.some(p=>p.userData.type==='tail') || !placedParts.some(p=>p.userData.type==='engine')) {
    alert('⚠️ Нужны Крыло, Хвост и Двигатель!'); return false;
  }
  const detached = window.detachLooseParts(airplaneGroup, partsLayer, placedParts);
  if (!placedParts.some(p=>p.userData.type==='wing') || !placedParts.some(p=>p.userData.type==='tail') || !placedParts.some(p=>p.userData.type==='engine')) {
    alert('⚠️ Часть деталей отвалилась! Приварите их.');
    for (const d of detached) { partsLayer.add(d.part); placedParts.push(d.part); }
    return false;
  }
  window.isFlying = true;
  window.flyData = { speed: 0, roll: 0, pitch: 0, yaw: 0 };
  window.viewMode = 0;
  window.flyingDetached = detached;
  airplaneGroup.position.set(0, -4.5, 8);
  airplaneGroup.rotation.set(0, 0, 0);
  controls.enabled = false;
  window.showMobileControls();
  const vb = document.getElementById('view-btn');
  if (vb) { vb.style.display = 'block'; vb.textContent = '📷 Сзади'; }
  return true;
};

window.exitFlight = function (airplaneGroup, camera, controls) {
  window.isFlying = false;
  window.flyData = null;
  window.viewMode = 0;
  airplaneGroup.position.set(0, 0, 0);
  airplaneGroup.rotation.set(0, 0, 0);
  controls.target.set(0, 0.3, 0);
  controls.enabled = true;
  controls.update();
  window.hideMobileControls();
  const vb = document.getElementById('view-btn');
  if (vb) vb.style.display = 'none';
};

window.updateFlight = function (airplaneGroup, camera, controls, dt) {
  if (!window.isFlying || !window.flyData) return;
  const k = window.keys, f = window.flyData;
  f.speed += ((k['w']?1:0)-(k['s']?1:0)) * 0.015;
  f.speed = Math.max(0, Math.min(f.speed, 0.7));
  if (f.speed < 0.08 && !k['w'] && !k['s'] && airplaneGroup.position.y < -3) f.speed += 0.004;
  f.roll += ((k['a']?1:0)-(k['d']?1:0)) * 0.02;
  f.pitch += ((k['arrowup']?1:0)-(k['arrowdown']?1:0)) * 0.015;
  f.yaw += ((k['arrowleft']?1:0)-(k['arrowright']?1:0)) * 0.01;
  f.roll *= 0.97; f.pitch *= 0.97; f.yaw *= 0.97;
  airplaneGroup.rotation.z = f.roll;
  airplaneGroup.rotation.x = f.pitch;
  airplaneGroup.rotation.y += f.yaw;
  const fwd = new THREE.Vector3(0,0,-1).applyQuaternion(airplaneGroup.quaternion);
  airplaneGroup.position.add(fwd.multiplyScalar(f.speed));
  airplaneGroup.position.y += f.pitch * f.speed * 0.25 - 0.015 + f.speed * 0.036;
  if (airplaneGroup.position.y < -4.6) { airplaneGroup.position.y = -4.6; if (f.pitch<0) f.pitch *= -0.3; if (f.speed>0.3) f.speed *= 0.95; }
  if (airplaneGroup.position.y > 20) airplaneGroup.position.y = 20;

  if (window.viewMode === 0) {
    const off = new THREE.Vector3(0,2.5,7).applyQuaternion(airplaneGroup.quaternion);
    camera.position.lerp(airplaneGroup.position.clone().add(off), 0.1);
    controls.target.lerp(airplaneGroup.position.clone(), 0.15);
  } else if (window.viewMode === 1) {
    const off = new THREE.Vector3(8,1.5,0).applyQuaternion(airplaneGroup.quaternion);
    camera.position.lerp(airplaneGroup.position.clone().add(off), 0.08);
    controls.target.lerp(airplaneGroup.position.clone(), 0.1);
  } else {
    if (!controls.enabled) { controls.enabled = true; controls.target.copy(airplaneGroup.position); }
  }
};
