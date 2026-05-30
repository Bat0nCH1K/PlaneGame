// flight.js v4.2 — тангаж через локальную ось, взлёт с поднятым носом
import * as THREE from 'three';

window.isFlying = false;
window.flyData = null;
window.keys = {};
window.viewMode = 0;
window.flyingDetached = [];
window.throttle = 0.3;

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
  container.className = 'throttle-container';
  container.innerHTML = '<div style="color:white;font-size:10px;font-weight:bold;background:rgba(0,0,0,0.6);padding:2px 8px;border-radius:8px;">⚡ ГАЗ <span id="throttle-val">30%</span></div><input type="range" id="throttle-slider" min="0" max="100" value="30" style="width:200px;height:24px;-webkit-appearance:none;appearance:none;background:linear-gradient(to right,#2ecc71,#f1c40f,#e74c3c);border-radius:12px;outline:none;">';
  document.body.appendChild(container);
  const slider = document.getElementById('throttle-slider');
  const label = document.getElementById('throttle-val');
  slider.addEventListener('input', () => {
    window.throttle = parseInt(slider.value) / 100;
    label.textContent = Math.round(window.throttle * 100) + '%';
  });
  window.throttle = 0.3;
  throttleSlider = container;
}

function removeThrottleSlider() {
  if (throttleSlider) { throttleSlider.remove(); throttleSlider = null; }
}

window.showMobileControls = function() {
  if (mobileCtrl) return;
  createThrottleSlider();
  mobileCtrl = document.createElement('div');
  mobileCtrl.className = 'mobile-ctrl-container';
  mobileCtrl.innerHTML = '<div class="mobile-ctrl-row"><button class="ctrl-btn" id="cu">▲</button></div><div class="mobile-ctrl-row"><button class="ctrl-btn" id="cl">◀</button><button class="ctrl-btn" id="cr">▶</button></div><div class="mobile-ctrl-row"><button class="ctrl-btn" id="cd">▼</button></div>';
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
  else if (e.key === 'w' || e.key === 'W') { window.throttle = Math.min(1, window.throttle + 0.05); e.preventDefault(); }
  else if (e.key === 's' || e.key === 'S') { window.throttle = Math.max(0, window.throttle - 0.05); e.preventDefault(); }
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
  window.flyData = {
    speed: 0,
    maxSpeed: { small: 0.6, med: 0.5, big: 0.4 }[window.currentFuselage],
    agility: { small: 1.2, med: 1.0, big: 0.8 }[window.currentFuselage],
    onGround: true,
    verticalSpeed: 0
  };
  window.viewMode = 0;
  window.flyingDetached = det;
  ag.position.set(0, -4.5, 0);
  ag.rotation.set(0, 0, 0);
  ctrl.enabled = false;
  window.showMobileControls();
  document.body.classList.add('flying');
  const vb = document.getElementById('view-btn');
  if (vb) { vb.style.display = 'block'; vb.textContent = '📷 Сзади'; }
  const fb = document.getElementById('fly-btn');
  if (fb) { fb.textContent = '🛬 ЗЕМЛЯ'; fb.style.background = '#e74c3c'; }
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
  if (fb) { fb.textContent = '✈️ ВЗЛЕТ'; fb.style.background = '#2ecc71'; }
};

window.updateFlight = function(ag, cam, ctrl, dt) {
  if (!window.isFlying || !window.flyData) return;
  const k = window.keys;
  const f = window.flyData;
  const a = f.agility;

  f.speed += (window.throttle * f.maxSpeed - f.speed) * 2.0 * dt;

  const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(ag.quaternion);
  ag.position.x += fwd.x * f.speed * 60 * dt;
  ag.position.z += fwd.z * f.speed * 60 * dt;

  // Рыскание — мировая ось Y
  const yawRate = ((k['yawleft'] ? 1 : 0) - (k['yawright'] ? 1 : 0)) * 1.2 * a * dt;
  ag.rotateY(yawRate);

  // Тангаж — ЛОКАЛЬНАЯ ось X
  const pitchRate = ((k['pitchup'] ? 1 : 0) - (k['pitchdown'] ? 1 : 0)) * 0.8 * a * dt;
  ag.rotateX(pitchRate);

  // Крен: макс 90°, сервопривод
  const rollTarget = ((k['yawleft'] ? 1 : 0) - (k['yawright'] ? 1 : 0)) * Math.PI / 2;
  ag.rotation.z += (rollTarget - ag.rotation.z) * 4 * dt;

  const speed = f.speed;
  const pitch = ag.rotation.x;

  if (ag.position.y <= -4.5) {
    ag.position.y = -4.5;
    f.verticalSpeed = 0;
    f.onGround = true;
    // Взлёт: скорость > 0.15 и нос поднят (pitch отрицательный — нос вверх)
    if (speed > 0.15 && pitch < -0.05) {
      f.verticalSpeed = (speed - 0.15) * 8;
      f.onGround = false;
    }
    ag.rotation.z += (0 - ag.rotation.z) * 3 * dt;
  } else {
    f.onGround = false;
    f.verticalSpeed -= 9.8 * dt;
    f.verticalSpeed += speed * 1.2 * dt;
    if (speed < 0.1) f.verticalSpeed -= 15 * dt;
  }

  ag.position.y += f.verticalSpeed * dt;

  if (ag.position.y < -4.5) {
    ag.position.y = -4.5;
    f.verticalSpeed = 0;
    f.onGround = true;
  }
  if (ag.position.y > 50) {
    ag.position.y = 50;
    f.verticalSpeed = Math.min(f.verticalSpeed, 0);
  }

  const camBack = new THREE.Vector3(0, 3, 10);
  camBack.applyQuaternion(ag.quaternion);
  cam.position.lerp(ag.position.clone().add(camBack), 0.08);
  ctrl.target.lerp(ag.position.clone(), 0.1);
};
