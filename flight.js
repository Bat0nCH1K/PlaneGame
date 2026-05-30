// flight.js v2.1 — полёт с ползунком газа
import * as THREE from 'three';

window.isFlying = false;
window.flyData = null;
window.keys = {};
window.viewMode = 0;
window.flyingDetached = [];
window.throttle = 0; // ползунок газа 0..1

let mobileCtrl = null;
let throttleSlider = null;

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

function createThrottleSlider() {
  if (throttleSlider) return;
  const container = document.createElement('div');
  container.id = 'throttle-container';
  container.style.cssText = 'position:absolute;bottom:20px;left:50%;transform:translateX(-50%);z-index:25;display:flex;flex-direction:column;align-items:center;gap:4px;pointer-events:auto';
  container.innerHTML = `
    <div style="color:white;font-size:10px;font-weight:bold;background:rgba(0,0,0,0.6);padding:2px 8px;border-radius:8px;">⚡ ГАЗ</div>
    <input type="range" id="throttle-slider" min="0" max="100" value="50" style="width:180px;height:20px;-webkit-appearance:none;background:rgba(255,255,255,0.2);border-radius:10px;outline:none;">
  `;
  document.body.appendChild(container);
  const slider = document.getElementById('throttle-slider');
  slider.addEventListener('input', () => {
    window.throttle = parseInt(slider.value) / 100;
  });
  window.throttle = 0.5;
  throttleSlider = container;
}

function removeThrottleSlider() {
  if (throttleSlider) {
    throttleSlider.remove();
    throttleSlider = null;
  }
}

window.showMobileControls = function() {
  if (mobileCtrl) return;
  createThrottleSlider();
  mobileCtrl = document.createElement('div');
  mobileCtrl.className = 'mobile-ctrl-container';
  mobileCtrl.innerHTML = `
    <div class="mobile-ctrl-row"><button class="ctrl-btn" id="cu">▲</button></div>
    <div class="mobile-ctrl-row"><button class="ctrl-btn" id="cl">◀</button><button class="ctrl-btn" id="cr">▶</button></div>
    <div class="mobile-ctrl-row"><button class="ctrl-btn" id="cd">▼</button></div>`;
  document.body.appendChild(mobileCtrl);
  const bind = (id, key) => {
    const b = document.getElementById(id);
    if (!b) return;
    b.addEventListener('pointerdown', e => { e.preventDefault(); window.keys[key] = true; });
    b.addEventListener('pointerup', e => { e.preventDefault(); window.keys[key] = false; });
    b.addEventListener('pointerleave', () => { window.keys[key] = false; });
  };
  bind('cu', 'pitchup');
  bind('cd', 'pitchdown');
  bind('cl', 'yawleft');
  bind('cr', 'yawright');
};

window.hideMobileControls = function() {
  if (mobileCtrl) { mobileCtrl.remove(); mobileCtrl = null; }
  removeThrottleSlider();
  Object.keys(window.keys).forEach(k => window.keys[k] = false);
};

window.addEventListener('keydown', e => {
  if (e.key === 'ArrowUp') { window.keys['pitchup'] = true; e.preventDefault(); }
  else if (e.key === 'ArrowDown') { window.keys['pitchdown'] = true; e.preventDefault(); }
  else if (e.key === 'ArrowLeft') { window.keys['yawleft'] = true; e.preventDefault(); }
  else if (e.key === 'ArrowRight') { window.keys['yawright'] = true; e.preventDefault(); }
  else if (e.key === 'w' || e.key === 'W') { window.throttle = Math.min(1, window.throttle + 0.1); e.preventDefault(); }
  else if (e.key === 's' || e.key === 'S') { window.throttle = Math.max(0, window.throttle - 0.1); e.preventDefault(); }
});
window.addEventListener('keyup', e => {
  if (e.key === 'ArrowUp') { window.keys['pitchup'] = false; e.preventDefault(); }
  else if (e.key === 'ArrowDown') { window.keys['pitchdown'] = false; e.preventDefault(); }
  else if (e.key === 'ArrowLeft') { window.keys['yawleft'] = false; e.preventDefault(); }
  else if (e.key === 'ArrowRight') { window.keys['yawright'] = false; e.preventDefault(); }
});

window.detachLooseParts = function(ag, pl, pp) {
  const d = [], r = [];
  for (const p of pp) {
    if (p.userData.snapPos && p.position.distanceTo(p.userData.snapPos) < 1.5) r.push(p);
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
  const sp = { small: 0.6, med: 0.8, big: 1.0 };
  const agil = { small: 1.2, med: 0.8, big: 0.5 };
  window.flyData = { speed: 0.2, roll: 0, pitch: 0, yaw: 0, maxSpeed: sp[window.currentFuselage], agility: agil[window.currentFuselage] };
  window.viewMode = 0;
  window.flyingDetached = det;
  ag.position.set(0, -4.5, 30);
  ag.rotation.set(0, 0, 0);
  ctrl.enabled = false;
  window.showMobileControls();
  document.body.classList.add('flying');
  const vb = document.getElementById('view-btn');
  if (vb) { vb.style.display = 'block'; vb.textContent = '📷 Сзади'; }
  const fb = document.getElementById('fly-btn');
  if (fb) { fb.textContent = '🛬 ЗЕМЛЯ'; fb.style.display = 'block'; }
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
  const fb = document.getElementById('fly-btn');
  if (fb) { fb.textContent = '✈️ ВЗЛЕТ'; fb.style.display = 'block'; }
};

window.updateFlight = function(ag, cam, ctrl, dt) {
  if (!window.isFlying || !window.flyData) return;
  const k = window.keys;
  const f = window.flyData;
  const a = f.agility;

  // Скорость от ползунка
  const targetSpeed = window.throttle * f.maxSpeed;
  f.speed += (targetSpeed - f.speed) * 0.03;

  // Тангаж
  const pitchQ = new THREE.Quaternion();
  const pitchAxis = new THREE.Vector3(1, 0, 0);
  const pitchInput = ((k['pitchup'] ? 1 : 0) - (k['pitchdown'] ? 1 : 0)) * 0.02 * a;
  pitchQ.setFromAxisAngle(pitchAxis, pitchInput);
  ag.quaternion.multiply(pitchQ);

  // Рыскание
  const yawQ = new THREE.Quaternion();
  const yawAxis = new THREE.Vector3(0, 1, 0);
  const yawInput = ((k['yawleft'] ? 1 : 0) - (k['yawright'] ? 1 : 0)) * 0.008 * a;
  yawQ.setFromAxisAngle(yawAxis, yawInput);
  ag.quaternion.multiply(yawQ);

  // Крен визуальный
  const yawRate = ((k['yawleft'] ? 1 : 0) - (k['yawright'] ? 1 : 0)) * 0.3;
  f.roll += (yawRate - f.roll) * 0.1;
  ag.rotation.z = f.roll;

  // Вперёд
  const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(ag.quaternion);
  ag.position.add(fwd.multiplyScalar(f.speed * dt * 60));

  // Гравитация
  ag.position.y -= 9.8 * dt;

  // Подъёмная сила
  if (f.speed > 0.2) {
    ag.position.y += (f.speed - 0.2) * 0.6 * dt * 60;
  }

  // Земля
  if (ag.position.y < -4.5) {
    ag.position.y = -4.5;
    ag.rotation.x *= 0.5;
    ag.rotation.z *= 0.5;
    f.speed *= 0.9;
  }

  if (ag.position.y > 40) ag.position.y = 40;

  // Камера
  if (window.viewMode === 0) {
    const off = new THREE.Vector3(0, 3, 10).applyQuaternion(ag.quaternion);
    cam.position.lerp(ag.position.clone().add(off), 0.06);
    ctrl.target.lerp(ag.position.clone(), 0.1);
  } else if (window.viewMode === 1) {
    const off = new THREE.Vector3(10, 2, 0).applyQuaternion(ag.quaternion);
    cam.position.lerp(ag.position.clone().add(off), 0.05);
    ctrl.target.lerp(ag.position.clone(), 0.08);
  } else {
    if (!ctrl.enabled) { ctrl.enabled = true; ctrl.target.copy(ag.position); }
  }
};
