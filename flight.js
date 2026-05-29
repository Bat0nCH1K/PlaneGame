// flight.js — модуль управления полётом
// Версия: 1.0.2

import * as THREE from 'three';

window.isFlying = false;
window.flyData = null;
window.keys = {};
window.viewMode = 0;

let mobileCtrlContainer = null;
let viewBtnClickHandler = null;

// Инициализация после загрузки DOM
function initFlightUI() {
  const viewBtn = document.getElementById('view-btn');
  if (!viewBtn) return;
  
  // Удаляем старый обработчик если был
  if (viewBtnClickHandler) {
    viewBtn.removeEventListener('click', viewBtnClickHandler);
  }
  
  viewBtnClickHandler = () => {
    window.viewMode = (window.viewMode + 1) % 3;
    const modes = ['📷 Сзади', '📷 Сбоку', '📷 Свободно'];
    viewBtn.textContent = modes[window.viewMode];
    
    if (window.viewMode === 2) {
      if (window.orbitControls) window.orbitControls.enabled = true;
    } else {
      if (window.orbitControls) window.orbitControls.enabled = false;
    }
  };
  
  viewBtn.addEventListener('click', viewBtnClickHandler);
}

// Ждём загрузки DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFlightUI);
} else {
  initFlightUI();
}

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

window.detachLooseParts = function(airplaneGroup, partsLayer, placedParts) {
  const detachedParts = [];
  const remainingParts = [];
  
  for (const part of placedParts) {
    const snapLocal = part.userData.snapPos;
    let isSnapped = false;
    
    if (snapLocal) {
      const dist = part.position.distanceTo(snapLocal);
      if (dist < 0.3) isSnapped = true;
    }
    
    if (isSnapped) {
      remainingParts.push(part);
    } else {
      const worldPos = new THREE.Vector3();
      part.getWorldPosition(worldPos);
      const worldQuat = new THREE.Quaternion();
      part.getWorldQuaternion(worldQuat);
      
      partsLayer.remove(part);
      airplaneGroup.parent.add(part);
      part.position.copy(worldPos);
      part.quaternion.copy(worldQuat);
      
      detachedParts.push({
        part: part,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2
        )
      });
    }
  }
  
  placedParts.length = 0;
  placedParts.push(...remainingParts);
  
  return detachedParts;
};

window.updateDetachedParts = function(detachedParts, dt) {
  for (const dp of detachedParts) {
    dp.velocity.y -= 9.8 * dt;
    dp.part.position.add(dp.velocity.clone().multiplyScalar(dt));
    
    if (dp.part.position.y < -4.8) {
      dp.part.position.y = -4.8;
      dp.velocity.y *= -0.3;
      dp.velocity.x *= 0.8;
      dp.velocity.z *= 0.8;
    }
    
    dp.part.rotation.x += (Math.random() - 0.5) * 5 * dt;
    dp.part.rotation.z += (Math.random() - 0.5) * 5 * dt;
  }
};

window.startFlight = function(airplaneGroup, camera, controls, placedParts, partsLayer) {
  const hasWing = placedParts.some(p => p.userData.type === 'wing');
  const hasTail = placedParts.some(p => p.userData.type === 'tail');
  const hasEngine = placedParts.some(p => p.userData.type === 'engine');
  
  if (!hasWing || !hasTail || !hasEngine) {
    alert('⚠️ Нужны Крыло, Хвост и Двигатель!');
    return { success: false, detachedParts: [] };
  }
  
  const detached = window.detachLooseParts(airplaneGroup, partsLayer, placedParts);
  
  const stillHasWing = placedParts.some(p => p.userData.type === 'wing');
  const stillHasTail = placedParts.some(p => p.userData.type === 'tail');
  const stillHasEngine = placedParts.some(p => p.userData.type === 'engine');
  
  if (!stillHasWing || !stillHasTail || !stillHasEngine) {
    alert('⚠️ Часть деталей отвалилась! Приварите их к правильным местам.');
    for (const dp of detached) {
      partsLayer.add(dp.part);
      placedParts.push(dp.part);
    }
    return { success: false, detachedParts: [] };
  }
  
  window.isFlying = true;
  window.flyData = {
    speed: 0.0,
    roll: 0,
    pitch: 0,
    yaw: 0,
  };
  window.viewMode = 0;
  
  airplaneGroup.position.set(0, -4.5, 8);
  airplaneGroup.rotation.set(0, 0, 0);
  
  controls.enabled = false;
  window.showMobileControls();
  
  const viewBtn = document.getElementById('view-btn');
  if (viewBtn) {
    viewBtn.style.display = 'block';
    viewBtn.textContent = '📷 Сзади';
  }
  
  return { success: true, detachedParts: detached };
};

window.exitFlight = function(airplaneGroup, camera, controls) {
  window.isFlying = false;
  window.flyData = null;
  window.viewMode = 0;
  
  airplaneGroup.position.set(0, 0, 0);
  airplaneGroup.rotation.set(0, 0, 0);
  controls.target.set(0, 0.3, 0);
  controls.enabled = true;
  controls.update();
  
  window.hideMobileControls();
  
  const viewBtn = document.getElementById('view-btn');
  if (viewBtn) viewBtn.style.display = 'none';
};

window.updateFlight = function(airplaneGroup, camera, controls, dt) {
  if (!window.isFlying || !window.flyData) return;
  
  const k = window.keys;
  const fd = window.flyData;
  
  const throttle = k['w'] ? 1 : (k['s'] ? -1 : 0);
  const aileron = (k['a'] ? 1 : 0) - (k['d'] ? 1 : 0);
  const elevator = (k['arrowup'] ? 1 : 0) - (k['arrowdown'] ? 1 : 0);
  const rudder = (k['arrowleft'] ? 1 : 0) - (k['arrowright'] ? 1 : 0);
  
  fd.speed += throttle * 0.015;
  fd.speed = Math.max(0.0, Math.min(fd.speed, 0.7));
  
  if (fd.speed < 0.08 && throttle === 0 && airplaneGroup.position.y < -3) {
    fd.speed += 0.004;
  }
  
  fd.roll += aileron * 0.02;
  fd.pitch += elevator * 0.015;
  fd.yaw += rudder * 0.01;
  
  fd.roll *= 0.97;
  fd.pitch *= 0.97;
  fd.yaw *= 0.97;
  
  airplaneGroup.rotation.z = fd.roll;
  airplaneGroup.rotation.x = fd.pitch;
  airplaneGroup.rotation.y += fd.yaw;
  
  const forward = new THREE.Vector3(0, 0, -1);
  forward.applyQuaternion(airplaneGroup.quaternion);
  airplaneGroup.position.add(forward.multiplyScalar(fd.speed));
  
  const lift = fd.speed * 0.12;
  airplaneGroup.position.y += (fd.pitch * fd.speed * 0.25) - 0.015 + lift * 0.3;
  
  if (airplaneGroup.position.y < -4.6) {
    airplaneGroup.position.y = -4.6;
    if (fd.pitch < 0) fd.pitch *= -0.3;
    if (fd.speed > 0.3) fd.speed *= 0.95;
  }
  
  if (airplaneGroup.position.y > 20) airplaneGroup.position.y = 20;
  
  if (window.viewMode === 0) {
    const camOffset = new THREE.Vector3(0, 2.5, 7);
    camOffset.applyQuaternion(airplaneGroup.quaternion);
    camera.position.lerp(airplaneGroup.position.clone().add(camOffset), 0.1);
    controls.target.lerp(airplaneGroup.position.clone(), 0.15);
  } else if (window.viewMode === 1) {
    const camOffset = new THREE.Vector3(8, 1.5, 0);
    camOffset.applyQuaternion(airplaneGroup.quaternion);
    camera.position.lerp(airplaneGroup.position.clone().add(camOffset), 0.08);
    controls.target.lerp(airplaneGroup.position.clone(), 0.1);
  } else {
    if (!controls.enabled) {
      controls.enabled = true;
      controls.target.copy(airplaneGroup.position);
    }
  }
};
