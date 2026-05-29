// flight.js — модуль управления полётом
// Экспортирует функции и переменные в глобальную область через window

import * as THREE from 'three';

// ---------- ПЕРЕМЕННЫЕ ПОЛЁТА ----------
window.isFlying = false;
window.flyData = null;
window.keys = {};

// ---------- МОБИЛЬНЫЕ КНОПКИ ----------
let mobileCtrlContainer = null;

window.showMobileControls = function() {
  if (mobileCtrlContainer) return;
  
  mobileCtrlContainer = document.createElement('div');
  mobileCtrlContainer.className = 'mobile-ctrl-container';
  mobileCtrlContainer.innerHTML = `
    <div class="mobile-ctrl-row">
      <button class="ctrl-btn" id="ctrl-up">▲</button>
    </div>
    <div class="mobile-ctrl-row">
      <button class="ctrl-btn" id="ctrl-left">◀</button>
      <button class="ctrl-btn" id="ctrl-gas">⚡</button>
      <button class="ctrl-btn" id="ctrl-right">▶</button>
    </div>
    <div class="mobile-ctrl-row">
      <button class="ctrl-btn" id="ctrl-down">▼</button>
    </div>
  `;
  document.body.appendChild(mobileCtrlContainer);
  
  const bind = (id, key) => {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.addEventListener('pointerdown', (e) => { e.preventDefault(); window.keys[key] = true; });
    btn.addEventListener('pointerup', (e) => { e.preventDefault(); window.keys[key] = false; });
    btn.addEventListener('pointerleave', () => { window.keys[key] = false; });
    btn.addEventListener('pointercancel', () => { window.keys[key] = false; });
  };
  
  bind('ctrl-up', 'arrowup');
  bind('ctrl-down', 'arrowdown');
  bind('ctrl-left', 'arrowleft');
  bind('ctrl-right', 'arrowright');
  bind('ctrl-gas', 'w');
};

window.hideMobileControls = function() {
  if (mobileCtrlContainer) {
    mobileCtrlContainer.remove();
    mobileCtrlContainer = null;
  }
  Object.keys(window.keys).forEach(k => window.keys[k] = false);
};

// Клавиатура
window.addEventListener('keydown', (e) => { window.keys[e.key.toLowerCase()] = true; });
window.addEventListener('keyup', (e) => { window.keys[e.key.toLowerCase()] = false; });

// ---------- ФУНКЦИИ ПОЛЁТА ----------
window.startFlight = function(airplaneGroup, camera, controls) {
  const hasWing = window.placedParts.some(p => p.userData.type === 'wing');
  const hasTail = window.placedParts.some(p => p.userData.type === 'tail');
  const hasEngine = window.placedParts.some(p => p.userData.type === 'engine');
  
  if (!hasWing || !hasTail || !hasEngine) {
    alert('⚠️ Нужны Крыло, Хвост и Двигатель!');
    return false;
  }
  
  // Сбрасываем выделение
  if (window.selectPart) window.selectPart(null);
  
  window.isFlying = true;
  window.flyData = {
    speed: 0.0,
    roll: 0,
    pitch: 0,
    yaw: 0,
  };
  
  // Самолёт на земле, развёрнут носом вперёд (-Z)
  airplaneGroup.position.set(0, -4.5, 0);
  airplaneGroup.rotation.set(0, Math.PI, 0);
  
  controls.enabled = false;
  window.showMobileControls();
  
  return true;
};

window.exitFlight = function(airplaneGroup, camera, controls) {
  window.isFlying = false;
  window.flyData = null;
  
  airplaneGroup.position.set(0, 0, 0);
  airplaneGroup.rotation.set(0, 0, 0);
  controls.target.set(0, 0.3, 0);
  controls.enabled = true;
  controls.update();
  
  window.hideMobileControls();
};

window.updateFlight = function(airplaneGroup, camera, controls, dt) {
  if (!window.isFlying || !window.flyData) return;
  
  const k = window.keys;
  const fd = window.flyData;
  
  const throttle = k['w'] ? 1 : (k['s'] ? -1 : 0);
  const aileron = (k['a'] ? 1 : 0) - (k['d'] ? 1 : 0);
  const elevator = (k['arrowup'] ? 1 : 0) - (k['arrowdown'] ? 1 : 0);
  const rudder = (k['arrowleft'] ? 1 : 0) - (k['arrowright'] ? 1 : 0);
  const qKey = k['q'] ? 1 : 0;
  const eKey = k['e'] ? 1 : 0;
  
  fd.speed += throttle * 0.02;
  fd.speed = Math.max(0.0, Math.min(fd.speed, 0.8));
  
  if (fd.speed < 0.1 && throttle === 0 && airplaneGroup.position.y < -3) {
    fd.speed += 0.005;
  }
  
  fd.roll += aileron * 0.03;
  fd.pitch += elevator * 0.02;
  fd.yaw += (rudder + eKey - qKey) * 0.02;
  
  fd.roll *= 0.97;
  fd.pitch *= 0.97;
  fd.yaw *= 0.97;
  
  airplaneGroup.rotation.z = fd.roll;
  airplaneGroup.rotation.x = fd.pitch;
  airplaneGroup.rotation.y += fd.yaw;
  
  const forward = new THREE.Vector3(1, 0, 0);
  forward.applyQuaternion(airplaneGroup.quaternion);
  airplaneGroup.position.add(forward.multiplyScalar(fd.speed));
  
  const lift = fd.speed * 0.15;
  airplaneGroup.position.y += (fd.pitch * fd.speed * 0.3) - 0.02 + lift * 0.3;
  
  if (airplaneGroup.position.y < -4.6) {
    airplaneGroup.position.y = -4.6;
    if (fd.pitch < 0) fd.pitch *= -0.3;
    if (fd.speed > 0.3) fd.speed *= 0.95;
  }
  
  if (airplaneGroup.position.y > 20) airplaneGroup.position.y = 20;
  
  const camOffset = new THREE.Vector3(-6, 2.5, 0);
  camOffset.applyQuaternion(airplaneGroup.quaternion);
  camera.position.lerp(airplaneGroup.position.clone().add(camOffset), 0.06);
  
  const lookTarget = airplaneGroup.position.clone().add(forward.clone().multiplyScalar(3));
  controls.target.lerp(lookTarget, 0.08);
};
