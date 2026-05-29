// script.js — основной модуль: сцена, конструктор, UI
// Версия: 1.0.2

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

const isMobile = /Android|iPhone|iPad|iPod|webOS/i.test(navigator.userAgent);

// ---------- СЦЕНА ----------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);

// Звезды
const starsGeo = new THREE.BufferGeometry();
const starsCount = 300;
const starsPos = new Float32Array(starsCount * 3);
for (let i = 0; i < starsCount * 3; i += 3) {
  starsPos[i] = (Math.random() - 0.5) * 400;
  starsPos[i+1] = (Math.random() - 0.5) * 200 + 50;
  starsPos[i+2] = (Math.random() - 0.5) * 400;
}
starsGeo.setAttribute('position', new THREE.BufferAttribute(starsPos, 3));
const stars = new THREE.Points(starsGeo, new THREE.PointsMaterial({color: 0xffffff, size: 0.3}));
scene.add(stars);

// Освещение
scene.add(new THREE.AmbientLight(0x606080));
const sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
sunLight.position.set(20, 30, 10);
scene.add(sunLight);

// ЗЕМЛЯ
const groundGeo = new THREE.PlaneGeometry(80, 80);
const ground = new THREE.Mesh(groundGeo, new THREE.MeshStandardMaterial({ color: 0x4a7c3f, roughness: 0.9 }));
ground.rotation.x = -Math.PI / 2;
ground.position.y = -5;
scene.add(ground);

// Взлётная полоса
const runwayGeo = new THREE.PlaneGeometry(4, 25);
const runway = new THREE.Mesh(runwayGeo, new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.8 }));
runway.rotation.x = -Math.PI / 2;
runway.position.set(0, -4.99, 10);
scene.add(runway);

for (let i = 2; i <= 18; i += 3) {
  const stripeGeo = new THREE.PlaneGeometry(1, 0.3);
  const stripe = new THREE.Mesh(stripeGeo, new THREE.MeshStandardMaterial({ color: 0xffffff }));
  stripe.rotation.x = -Math.PI / 2;
  stripe.position.set(0, -4.98, i);
  scene.add(stripe);
}

// ---------- КАМЕРА ----------
const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.3, 300);
camera.position.set(8, 5, 10);
camera.lookAt(0, 0, 0);

// ---------- РЕНДЕРЫ ----------
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0px';
labelRenderer.domElement.style.pointerEvents = 'none';
document.body.appendChild(labelRenderer.domElement);

// ---------- ORBIT CONTROLS ----------
const controls = new OrbitControls(camera, renderer.domElement);
window.orbitControls = controls;
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.target.set(0, 0.3, 0);
controls.rotateSpeed = isMobile ? 0.7 : 0.6;
controls.zoomSpeed = isMobile ? 1.0 : 1.2;
controls.panSpeed = isMobile ? 0.6 : 0.8;
controls.minDistance = 3;
controls.maxDistance = 30;
controls.maxPolarAngle = Math.PI * 0.75;
controls.mouseButtons = { LEFT: null, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE };
controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };
controls.update();

// ---------- САМОЛЕТ ----------
const airplaneGroup = new THREE.Group();
airplaneGroup.position.set(0, 0, 0);
scene.add(airplaneGroup);

// Фюзеляж (вдоль Z, нос в -Z)
const fuselageGeo = new THREE.CylinderGeometry(0.5, 0.55, 3.2, 10);
const fuselageMat = new THREE.MeshStandardMaterial({ color: 0x4488cc, roughness: 0.4, metalness: 0.6 });
const fuselage = new THREE.Mesh(fuselageGeo, fuselageMat);
fuselage.rotation.x = Math.PI/2;
fuselage.name = 'fuselage';
airplaneGroup.add(fuselage);

// Нос (полусфера спереди = -Z)
const noseGeo = new THREE.SphereGeometry(0.5, 10, 10, 0, Math.PI*2, 0, Math.PI/2);
const nose = new THREE.Mesh(noseGeo, new THREE.MeshStandardMaterial({ color: 0x5599dd, roughness: 0.3, metalness: 0.7 }));
nose.position.z = -1.6;
nose.rotation.x = Math.PI;
nose.scale.set(0.9, 0.9, 0.5);
nose.name = 'nose';
airplaneGroup.add(nose);

// Кабина
const cockpitGeo = new THREE.SphereGeometry(0.4, 10, 10);
const cockpit = new THREE.Mesh(cockpitGeo, new THREE.MeshStandardMaterial({ color: 0x88ccff, roughness: 0.1, metalness: 0.3, transparent: true, opacity: 0.7 }));
cockpit.position.set(0, 0.4, -0.9);
cockpit.scale.set(0.55, 0.35, 0.55);
airplaneGroup.add(cockpit);

const fuselageHitTargets = [fuselage, nose, cockpit];

// ---------- ДЕТАЛИ ----------
const partsLayer = new THREE.Group();
airplaneGroup.add(partsLayer);
window.placedParts = [];
let selectedPart = null;

const PART_LIMITS = { wing: 2, tail: 2, engine: 2 };

function createLabel(text) {
  const div = document.createElement('div');
  div.textContent = text;
  div.style.cssText = 'color:white;font-weight:bold;font-size:10px;text-shadow:1px 1px 2px black;background:rgba(0,0,0,0.6);padding:2px 6px;border-radius:8px;';
  const label = new CSS2DObject(div);
  label.userData.isLabel = true;
  return label;
}

function createPart(type) {
  const group = new THREE.Group();
  group.userData = { type: type, isPart: true };
  
  if (type === 'wing') {
    const wingGeo = new THREE.BoxGeometry(2.5, 0.08, 0.7);
    const wingMat = new THREE.MeshStandardMaterial({ color: 0xe67e22, roughness: 0.5, metalness: 0.5 });
    const wing = new THREE.Mesh(wingGeo, wingMat);
    wing.userData.isPartMesh = true;
    group.add(wing);
    
    const edgeGeo = new THREE.BoxGeometry(0.06, 0.1, 0.72);
    const edgeMat = new THREE.MeshStandardMaterial({ color: 0xc0560a });
    const edgeL = new THREE.Mesh(edgeGeo, edgeMat);
    edgeL.position.set(-1.25, 0, 0);
    group.add(edgeL);
    const edgeR = new THREE.Mesh(edgeGeo, edgeMat);
    edgeR.position.set(1.25, 0, 0);
    group.add(edgeR);
    
    group.userData.snapPos = new THREE.Vector3(0, 0.05, 0);
  } else if (type === 'tail') {
    const hStabGeo = new THREE.BoxGeometry(1.2, 0.06, 0.35);
    const tailMat = new THREE.MeshStandardMaterial({ color: 0x9b59b6, roughness: 0.5, metalness: 0.5 });
    const hStab = new THREE.Mesh(hStabGeo, tailMat);
    hStab.userData.isPartMesh = true;
    group.add(hStab);
    
    const vStabGeo = new THREE.BoxGeometry(0.06, 0.5, 0.35);
    const vStab = new THREE.Mesh(vStabGeo, tailMat);
    vStab.position.y = 0.3;
    vStab.userData.isPartMesh = true;
    group.add(vStab);
    
    group.userData.snapPos = new THREE.Vector3(0, 0.3, 1.55);
  } else if (type === 'engine') {
    const engineGeo = new THREE.CylinderGeometry(0.25, 0.28, 0.7, 8);
    const engineMat = new THREE.MeshStandardMaterial({ color: 0xccccdd, roughness: 0.3, metalness: 0.8 });
    const engine = new THREE.Mesh(engineGeo, engineMat);
    engine.rotation.x = Math.PI/2;
    engine.userData.isPartMesh = true;
    group.add(engine);
    
    const stripeGeo = new THREE.TorusGeometry(0.26, 0.04, 6, 12);
    const stripe = new THREE.Mesh(stripeGeo, new THREE.MeshStandardMaterial({ color: 0xe74c3c, roughness: 0.2, metalness: 0.3 }));
    stripe.rotation.y = Math.PI/2;
    stripe.userData.isPartMesh = true;
    group.add(stripe);
    
    group.userData.snapPos = new THREE.Vector3(0.55, 0, 0);
  }
  
  const label = createLabel(type === 'wing' ? '🪽' : type === 'tail' ? '🪁' : '🚀');
  label.position.set(0, 0.5, 0);
  group.add(label);
  
  return group;
}

function clearAllParts() {
  while (window.placedParts.length > 0) {
    const part = window.placedParts.pop();
    part.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
    partsLayer.remove(part);
  }
  // Удаляем отвалившиеся детали из сцены
  const toRemove = [];
  scene.children.forEach(child => {
    if (child.userData && child.userData.isPart && child !== airplaneGroup && child !== partsLayer && !airplaneGroup.children.includes(child)) {
      toRemove.push(child);
    }
  });
  toRemove.forEach(child => {
    child.traverse(c => {
      if (c.geometry) c.geometry.dispose();
      if (c.material) {
        if (Array.isArray(c.material)) c.material.forEach(m => m.dispose());
        else c.material.dispose();
      }
    });
    scene.remove(child);
  });
  selectedPart = null;
  document.getElementById('nudge-controls').style.display = 'none';
}

window.selectPart = function(part) {
  if (selectedPart && selectedPart !== part) {
    selectedPart.traverse((child) => {
      if (child.userData && child.userData.isPartMesh && child.material && child.material.emissive) {
        child.material.emissive.set(0x000000);
      }
    });
  }
  
  selectedPart = part;
  
  if (part) {
    part.traverse((child) => {
      if (child.userData && child.userData.isPartMesh && child.material && child.material.emissive) {
        child.material.emissive.set(0x444444);
      }
    });
    document.getElementById('nudge-controls').style.display = 'flex';
  } else {
    document.getElementById('nudge-controls').style.display = 'none';
  }
};

// ---------- РЕЙКАСТИНГ И ПЕРЕТАСКИВАНИЕ ----------
const raycaster = new THREE.Raycaster();
let draggedPart = null;
let dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
let dragOffset = new THREE.Vector3();
let initialClickWasOnPart = false;

function getIntersections(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  const mouse = new THREE.Vector2(
    ((event.clientX - rect.left) / rect.width) * 2 - 1,
    -((event.clientY - rect.top) / rect.height) * 2 + 1
  );
  raycaster.setFromCamera(mouse, camera);
  const fuselageHits = raycaster.intersectObjects(fuselageHitTargets, false);
  const partHits = raycaster.intersectObjects(window.placedParts, true);
  return { mouse, fuselageHits, partHits };
}

renderer.domElement.addEventListener('pointerdown', (event) => {
  if (window.isFlying) return;
  if (event.pointerType === 'touch' && event.isPrimary === false) return;
  
  const { partHits } = getIntersections(event);
  
  if (partHits.length > 0) {
    let obj = partHits[0].object;
    while (obj && !window.placedParts.includes(obj)) obj = obj.parent;
    if (obj && window.placedParts.includes(obj)) {
      draggedPart = obj;
      window.selectPart(obj);
      controls.enabled = false;
      
      const point = partHits[0].point;
      const worldPos = new THREE.Vector3();
      draggedPart.getWorldPosition(worldPos);
      dragOffset.copy(worldPos).sub(point);
      
      const normal = new THREE.Vector3(0, 0, 1);
      normal.applyQuaternion(camera.quaternion);
      dragPlane.set(normal, 0);
      
      initialClickWasOnPart = true;
      document.getElementById('mode-indicator').textContent = '📌 ТЯНИ';
      return;
    }
  }
  
  initialClickWasOnPart = false;
});

renderer.domElement.addEventListener('pointermove', (event) => {
  if (!draggedPart || window.isFlying) return;
  if (event.pointerType === 'touch' && event.isPrimary === false) return;
  
  const rect = renderer.domElement.getBoundingClientRect();
  const mouse = new THREE.Vector2(
    ((event.clientX - rect.left) / rect.width) * 2 - 1,
    -((event.clientY - rect.top) / rect.height) * 2 + 1
  );
  raycaster.setFromCamera(mouse, camera);
  
  const target = new THREE.Vector3();
  if (raycaster.ray.intersectPlane(dragPlane, target)) {
    target.add(dragOffset);
    airplaneGroup.worldToLocal(target);
    target.y = Math.max(-2.5, Math.min(3, target.y));
    target.x = Math.max(-2.5, Math.min(2.5, target.x));
    target.z = Math.max(-2, Math.min(2, target.z));
    draggedPart.position.copy(target);
  }
});

renderer.domElement.addEventListener('pointerup', (event) => {
  if (!draggedPart) {
    if (!initialClickWasOnPart && !window.isFlying) {
      handlePlacementClick(event);
    }
    return;
  }
  
  const snapLocal = draggedPart.userData.snapPos;
  if (snapLocal) {
    const worldSnap = snapLocal.clone();
    airplaneGroup.localToWorld(worldSnap);
    const partWorldPos = new THREE.Vector3();
    draggedPart.getWorldPosition(partWorldPos);
    
    if (partWorldPos.distanceTo(worldSnap) < 1.2) {
      draggedPart.position.copy(snapLocal);
    }
  }
  
  draggedPart = null;
  controls.enabled = true;
  document.getElementById('mode-indicator').textContent = '🛠️ СБОРКА';
});

function handlePlacementClick(event) {
  const { fuselageHits, partHits } = getIntersections(event);
  
  if (partHits.length > 0) {
    let obj = partHits[0].object;
    while (obj && !window.placedParts.includes(obj)) obj = obj.parent;
    if (obj && window.placedParts.includes(obj)) {
      window.selectPart(obj);
      return;
    }
  }
  
  if (fuselageHits.length > 0) {
    const type = window.selectedPartType;
    
    const count = window.placedParts.filter(p => p.userData.type === type).length;
    if (count >= PART_LIMITS[type]) {
      alert(`⚠️ Можно поставить только ${PART_LIMITS[type]} детали типа «${type}»`);
      return;
    }
    
    const point = fuselageHits[0].point.clone();
    airplaneGroup.worldToLocal(point);
    
    const part = createPart(type);
    part.position.copy(point);
    partsLayer.add(part);
    window.placedParts.push(part);
    window.selectPart(part);
  }
}

// ---------- КНОПКИ СМЕЩЕНИЯ ----------
document.querySelectorAll('.nudge-btn').forEach(btn => {
  btn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedPart || window.isFlying) return;
    
    const axis = btn.dataset.axis;
    const dir = parseFloat(btn.dataset.dir);
    const step = 0.08;
    
    selectedPart.position[axis] += dir * step;
    selectedPart.position.y = Math.max(-2.5, Math.min(3, selectedPart.position.y));
    selectedPart.position.x = Math.max(-2.5, Math.min(2.5, selectedPart.position.x));
    selectedPart.position.z = Math.max(-2, Math.min(2, selectedPart.position.z));
  });
});

// ---------- UI ----------
window.selectedPartType = 'wing';
const btnWing = document.getElementById('btn-wing');
const btnTail = document.getElementById('btn-tail');
const btnEngine = document.getElementById('btn-engine');
const flyBtn = document.getElementById('fly-btn');
const resetBtn = document.getElementById('reset-btn');
const modeIndicator = document.getElementById('mode-indicator');
const instrDiv = document.getElementById('instr');
const nudgeControls = document.getElementById('nudge-controls');
const viewBtn = document.getElementById('view-btn');

function setActiveButton(type) {
  [btnWing, btnTail, btnEngine].forEach(b => b.classList.remove('active'));
  if (type === 'wing') btnWing.classList.add('active');
  if (type === 'tail') btnTail.classList.add('active');
  if (type === 'engine') btnEngine.classList.add('active');
  window.selectedPartType = type;
}

btnWing.addEventListener('click', () => setActiveButton('wing'));
btnTail.addEventListener('click', () => setActiveButton('tail'));
btnEngine.addEventListener('click', () => setActiveButton('engine'));

let flyingDetachedParts = [];

flyBtn.addEventListener('click', () => {
  if (window.isFlying) {
    window.exitFlight(airplaneGroup, camera, controls);
    flyBtn.textContent = '✈️ ВЗЛЕТ';
    flyBtn.style.background = '#2ecc71';
    modeIndicator.textContent = '🛠️ СБОРКА';
    modeIndicator.style.background = 'rgba(0,0,0,0.7)';
    document.body.classList.remove('flying');
    instrDiv.textContent = '👆 Тап по фюзеляжу: деталь | Кнопки: двигать | ✌️: вращать';
    if (selectedPart) nudgeControls.style.display = 'flex';
    if (viewBtn) viewBtn.style.display = 'none';
    for (const dp of flyingDetachedParts) {
      partsLayer.add(dp.part);
      window.placedParts.push(dp.part);
    }
    flyingDetachedParts = [];
    return;
  }
  
  const result = window.startFlight(airplaneGroup, camera, controls, window.placedParts, partsLayer);
  
  if (result.success) {
    flyBtn.textContent = '🛬 ЗЕМЛЯ';
    flyBtn.style.background = '#e74c3c';
    modeIndicator.textContent = '✈️ ПОЛЕТ';
    modeIndicator.style.background = '#e74c3c';
    document.body.classList.add('flying');
    instrDiv.textContent = '🎮 Кнопки внизу | W/S: газ | Стрелки: управление | 📷: смена вида';
    nudgeControls.style.display = 'none';
    flyingDetachedParts = result.detachedParts;
    if (viewBtn) {
      viewBtn.style.display = 'block';
      viewBtn.textContent = '📷 Сзади';
    }
  }
});

resetBtn.addEventListener('click', () => {
  if (window.isFlying) {
    window.exitFlight(airplaneGroup, camera, controls);
    flyBtn.textContent = '✈️ ВЗЛЕТ';
    flyBtn.style.background = '#2ecc71';
    modeIndicator.textContent = '🛠️ СБОРКА';
    modeIndicator.style.background = 'rgba(0,0,0,0.7)';
    document.body.classList.remove('flying');
    instrDiv.textContent = '👆 Тап по фюзеляжу: деталь | Кнопки: двигать | ✌️: вращать';
    if (viewBtn) viewBtn.style.display = 'none';
    for (const dp of flyingDetachedParts) {
      partsLayer.add(dp.part);
      window.placedParts.push(dp.part);
    }
    flyingDetachedParts = [];
  }
  clearAllParts();
  setActiveButton('wing');
  nudgeControls.style.display = 'none';
});

// ---------- СТАРТ ----------
setActiveButton('wing');
const demoPart = createPart('wing');
demoPart.position.set(0, 0.05, 0);
partsLayer.add(demoPart);
window.placedParts.push(demoPart);
window.selectPart(demoPart);

// ---------- ИГРОВОЙ ЦИКЛ ----------
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  
  const dt = Math.min(clock.getDelta(), 0.1);
  stars.rotation.y += 0.0003;
  
  window.updateFlight(airplaneGroup, camera, controls, dt);
  window.updateDetachedParts(flyingDetachedParts, dt);
  
  controls.update();
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
});

// ---------- СИСТЕМА ВЕРСИОНИРОВАНИЯ ----------
const VERSION = '1.0.2';

const changelog = [
  {
    version: '1.0.0',
    type: 'major',
    desc: 'Большое обновление! 3D-конструктор: сборка самолёта из крыльев, хвоста и двигателей. Режим полёта с управлением.'
  },
  {
    version: '1.0.1',
    type: 'minor',
    desc: 'Лимит деталей (по 2 каждого типа). Убраны шарики на крыльях. Самолёт летит носом вперёд. Камера привязана к самолёту. Три вида камеры.'
  },
  {
    version: '1.0.2',
    type: 'patch',
    desc: 'Исправлен баг с загрузкой flight.js. Индикатор режима больше не перекрывается кнопками. Добавлена плашка версии.'
  }
];

function renderChangelog() {
  const list = document.getElementById('changelog-list');
  if (!list) return;
  list.innerHTML = '';
  
  changelog.forEach(entry => {
    const div = document.createElement('div');
    div.className = `changelog-entry ${entry.type}`;
    
    const tagLabel = entry.type === 'major' ? 'БО' : entry.type === 'minor' ? 'МО' : 'П';
    
    div.innerHTML = `
      <div class="changelog-version">
        v${entry.version} <span class="tag ${entry.type}">${tagLabel}+1</span>
      </div>
      <div class="changelog-desc">${entry.desc}</div>
    `;
    
    list.appendChild(div);
  });
}

const versionBadge = document.getElementById('version-badge');
if (versionBadge) {
  versionBadge.textContent = `v${VERSION}`;
  
  versionBadge.addEventListener('click', (e) => {
    e.stopPropagation();
    const popup = document.getElementById('changelog-popup');
    if (!popup) return;
    const isVisible = popup.style.display === 'block';
    popup.style.display = isVisible ? 'none' : 'block';
    if (!isVisible) renderChangelog();
  });
}

document.addEventListener('click', (e) => {
 
