// flight.js v1.2.3
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
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bindViewBtn);
else bindViewBtn();

window.showMobileControls = function() {
  if (mobileCtrl) return;
  mobileCtrl = document.createElement('div');
  mobileCtrl.className = 'mobile-ctrl-container';
  mobileCtrl.innerHTML = '<div class="mobile-ctrl-row"><button class="ctrl-btn" id="cu">▲</button></div><div class="mobile-ctrl-row"><button class="ctrl-btn" id="cl">◀</button><button class="ctrl-btn" id="cg">⚡</button><button class="ctrl-btn" id="cr">▶</button></div><div class="mobile-ctrl-row"><button class="ctrl-btn" id="cd">▼</button></div>';
  document.body.appendChild(mobileCtrl);
  const bind = (id, key) => {
    const b = document.getElementById(id);
    if (!b) return;
    const a = e => { e.preventDefault(); window.keys[key] = true; };
    const r = e => { e.preventDefault(); window.keys[key] = false; };
    b.addEventListener('pointerdown', a);
    b.addEventListener('pointerup', r);
    b.addEventListener('pointerleave', r);
    b.addEventListener('pointercancel', r);
  };
  bind('cu', 'pitchup');
  bind('cd', 'pitchdown');
  bind('cl', 'yawleft');
  bind('cr', 'yawright');
  bind('cg', 'w');
};

window.hideMobileControls = function() {
  if (mobileCtrl) { mobileCtrl.remove(); mobileCtrl = null; }
  Object.keys(window.keys).forEach(k => window.keys[k] = false);
};

window.addEventListener('keydown', e => {
  if (e.key === 'ArrowUp') { window.keys['pitchup'] = true; e.preventDefault(); }
  else if (e.key === 'ArrowDown') { window.keys['pitchdown'] = true; e.preventDefault(); }
  else if (e.key === 'ArrowLeft') { window.keys['yawleft'] = true; e.preventDefault(); }
  else if (e.key === 'ArrowRight') { window.keys['yawright'] = true; e.preventDefault(); }
  else window.keys[e.key.toLowerCase()] = true;
});
window.addEventListener('keyup', e => {
  if (e.key === 'ArrowUp') { window.keys['pitchup'] = false; e.preventDefault(); }
  else if (e.key === 'ArrowDown') { window.keys['pitchdown'] = false; e.preventDefault(); }
  else if (e.key === 'ArrowLeft') { window.keys['yawleft'] = false; e.preventDefault(); }
  else if (e.key === 'ArrowRight') { window.keys['yawright'] = false; e.preventDefault(); }
  else window.keys[e.key.toLowerCase()] = false;
});

window.detachLooseParts = function(ag, pl, pp) {
  const d = [], r = [];
  for (const p of pp) {
    if (p.userData.snapPos && p.position.distanceTo(p.userData.snapPos) < 1.2) r.push(p);
    else {
      const w = new THREE.Vector3(); p.getWorldPosition(w);
      const q = new THREE.Quaternion(); p.getWorldQuaternion(q);
      pl.remove(p); ag.parent.add(p);
      p.position.copy(w); p.quaternion.copy(q);
      d.push({ part: p, vel: new THREE.Vector3((Math.random()-0.5)*2, (Math.random()-0.5)*2, (Math.random()-0.5)*2) });
    }
  }
  pp.length = 0; pp.push(...r);
  return d;
};

window.updateDetached = function(d, dt) {
  for (const x of d) {
    x.vel.y -= 9.8 * dt;
    x.part.position.add(x.vel.clone().multiplyScalar(dt));
    if (x.part.position.y < -4.8) { x.part.position.y = -4.8; x.vel.y *= -0.3; x.vel.x *= 0.8; x.vel.z *= 0.8; }
    x.part.rotation.x += (Math.random()-0.5) * 5 * dt;
    x.part.rotation.z += (Math.random()-0.5) * 5 * dt;
  }
};

window.startFlight = function(ag, cam, ctrl, pp, pl) {
  const needs = { small: { wing: 1, tail: 1, engine: 1 }, med: { wing: 2, tail: 1, engine: 1 }, big: { wing: 2, tail: 1, engine: 2 } };
  const n = needs[window.currentFuselage || 'med'];
  for (const t of ['wing', 'tail', 'engine']) {
    if (pp.filter(p => p.userData.type === t).length < (n[t] || 0)) {
      alert('⚠️ Нужно: крыльев ' + n.wing + ', хвостов ' + n.tail + ', двигателей ' + n.engine);
      return false;
    }
  }
  const det = window.detachLooseParts(ag, pl, pp);
  for (const t of ['wing', 'tail', 'engine']) {
    if (pp.filter(p => p.userData.type === t).length < (n[t] || 0)) {
      alert('⚠️ Детали отвалились!');
      for (const x of det) { pl.add(x.part); pp.push(x.part); }
      return false;
    }
  }
  window.isFlying = true;
  const sp = { small: 0.4, med: 0.55, big: 0.7 };
  const agil = { small: 1.0, med: 0.65, big: 0.4 };
  window.flyData = { speed: 0.05, roll: 0, pitch: 0, yaw: 0, maxSpeed: sp[window.currentFuselage], agility: agil[window.currentFuselage] };
  window.viewMode = 0;
  window.flyingDetached = det;
  ag.position.set(0, -4.5, 30);
  ag.rotation.set(0, 0, 0);
  ctrl.enabled = false;
  window.showMobileControls();
  document.body.classList.add('flying');
  const vb = document.getElementById('view-btn');
  if (vb) { vb.style.display = 'block'; vb.textContent = '📷 Сзади'; }
  return true;
};

window.exitFlight = function(ag, cam, ctrl) {
  window.isFlying = false;
  window.flyData = null;
  window.viewMode = 0;
  ag.position.set(0, 0, 0);
  ag.rotation.set(0, 0, 0);
  ctrl.target.set(0, 0.3, 0);
  ctrl.enabled = true;
  ctrl.update();
  window.hideMobileControls();
  document.body.classList.remove('flying');
  const vb = document.getElementById('view-btn');
  if (vb) vb.style.display = 'none';
};

window.updateFlight = function(ag, cam, ctrl, dt) {
  if (!window.isFlying || !window.flyData) return;
  const k = window.keys;
  const f = window.flyData;
  const a = f.agility;

  // Газ
  const throttle = (k['w'] ? 1 : 0) - (k['s'] ? 1 : 0);
  f.speed += throttle * 0.01;
  f.speed = Math.max(0.02, Math.min(f.speed, f.maxSpeed));

  // Торможение — СИЛЬНЕЕ
  f.speed *= 0.996;

  // Тангаж — относительно самолёта
  const pitchInput = ((k['pitchup'] ? 1 : 0) - (k['pitchdown'] ? 1 : 0)) * 0.015 * a;
  f.pitch += pitchInput;
  f.pitch = Math.max(-0.5, Math.min(0.5, f.pitch));
  // Затухание тангажа
  f.pitch *= 0.995;

  // Рыскание — ОЧЕНЬ МЯГКО
  const yawInput = ((k['yawleft'] ? 1 : 0) - (k['yawright'] ? 1 : 0)) * 0.003 * a;
  f.yaw += yawInput;
  f.yaw *= 0.95;
  // Ограничение угловой скорости
  f.yaw = Math.max(-0.03, Math.min(0.03, f.yaw));

  // Крен пропорционален рысканию
  const targetRoll = f.yaw * 8;
  f.roll += (targetRoll - f.roll) * 0.04;

  ag.rotation.z = f.roll;
  ag.rotation.x = f.pitch;
  ag.rotation.y += f.yaw;

  // Движение вперёд
  const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(ag.quaternion);
  ag.position.add(fwd.multiplyScalar(f.speed));

  // Подъёмная сила
  const lift = f.speed * 0.08 + f.pitch * f.speed * 0.25;
  ag.position.y += lift - 0.01;

  // Падает при скорости ниже 0.1
  if (f.speed < 0.1 && ag.position.y > -4.5) {
    ag.position.y -= 0.04;
  }

  if (ag.position.y < -4.6) {
    ag.position.y = -4.6;
    if (f.pitch < 0) f.pitch *= -0.3;
    if (f.speed > 0.3) f.speed *= 0.95;
  }
  if (ag.position.y > 30) ag.position.y = 30;

  // Камера
  if (window.viewMode === 0) {
    const off = new THREE.Vector3(0, 4, 12).applyQuaternion(ag.quaternion);
    cam.position.lerp(ag.position.clone().add(off), 0.05);
    ctrl.target.lerp(ag.position.clone(), 0.08);
  } else if (window.viewMode === 1) {
    const off = new THREE.Vector3(15, 2.5, 0).applyQuaternion(ag.quaternion);
    cam.position.lerp(ag.position.clone().add(off), 0.04);
    ctrl.target.lerp(ag.position.clone(), 0.06);
  } else {
    if (!ctrl.enabled) { ctrl.enabled = true; ctrl.target.copy(ag.position); }
  }
};
