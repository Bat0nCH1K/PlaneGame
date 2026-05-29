import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

// ---------- НАСТРОЙКИ ----------
const isMobile = /Android|iPhone|iPad|iPod|webOS/i.test(navigator.userAgent);

// ---------- СЦЕНА ----------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a2e);

// Звезды (упрощенные)
const starsGeo = new THREE.BufferGeometry();
const starsCount = 400;
const starsPos = new Float32Array(starsCount * 3);
for (let i = 0; i < starsCount * 3; i += 3) {
  starsPos[i] = (Math.random() - 0.5) * 400;
  starsPos[i+1] = (Math.random() - 0.5) * 300;
  starsPos[i+2] = (Math.random() - 0.5) * 400;
}
starsGeo.setAttribute('position', new THREE.BufferAttribute(starsPos, 3));
const stars = new THREE.Points(starsGeo, new THREE.PointsMaterial({color: 0xffffff, size: 0.3}));
scene.add(stars);

// Освещение
scene.add(new THREE.AmbientLight(0x404066));
const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(10, 20, 15);
scene.add(dirLight);

// Земля
const gridHelper = new THREE.GridHelper(20, 16, 0x335577, 0x224466);
gridHelper.position.y = -3;
scene.add(gridHelper);

// ---------- КАМЕРА ----------
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.5, 200);
camera.position.set(6, 4, 10);
camera.lookAt(0, 0, 0);

// ---------- РЕНДЕРЫ ----------
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Ограничиваем для производительности
renderer.shadowMap.enabled = false; // Отключаем тени для мобилок
document.body.appendChild(renderer.domElement);

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0px';
labelRenderer.domElement.style.pointerEvents = 'none';
document.body.appendChild(labelRenderer.domElement);

// ---------- ORBIT CONTROLS ----------
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.target.set(0, 0.3, 0);
controls.rotateSpeed = isMobile ? 0.6 : 0.5;
controls.zoomSpeed = isMobile ? 0.8 : 1.0;
controls.panSpeed = isMobile ? 0.5 : 0.7;
controls.mouseButtons = {
  LEFT: null,
  MIDDLE: THREE.MOUSE.DOLLY,
  RIGHT: THREE.MOUSE.ROTATE
};
controls.touches = {
  ONE: THREE.TOUCH.ROTATE,
  TWO: THREE.TOUCH.DOLLY_PAN
};
controls.update();

// ---------- САМОЛЕТ ----------
const airplaneGroup = new THREE.Group();
scene.add(airplaneGroup);

// Фюзеляж (упрощенный)
const fuselageGeo = new THREE.CylinderGeometry(0.55, 0.45, 3.0, 8); // Меньше сегментов
const fuselageMat = new THREE.MeshStandardMaterial({ color: 0x4488cc, roughness: 0.4, metalness: 0.6 });
const fuselage = new THREE.Mesh(fuselageGeo, fuselageMat);
fuselage.rotation.x = Math.PI/2;
airplaneGroup.add(fuselage);

// Нос
const noseGeo = new THREE.SphereGeometry(0.5, 8, 8);
const nose = new THREE.Mesh(noseGeo, new THREE.MeshStandardMaterial({ color: 0x5599dd, roughness: 0.3, metalness: 0.7 }));
nose.position.x = 1.6;
nose.scale.set(0.45, 0.85, 0.85);
airplaneGroup.add(nose);

// Кабина
const cockpitGeo = new THREE.SphereGeometry(0.4, 8, 8);
const cockpit = new THREE.Mesh(cockpitGeo, new THREE.MeshStandardMaterial({ color: 0x88ccff, roughness: 0.1, metalness: 0.3, transparent: true, opacity: 0.7 }));
cockpit.position.set(0.9, 0.4, 0);
cockpit.scale.set(0.55, 0.35, 0.55);
airplaneGroup.add(cockpit);

// ---------- ДЕТАЛИ ----------
const partsLayer = new THREE.Group();
airplaneGroup.add(partsLayer);
const placedParts = [];

function createLabel(text) {
  const div = document.createElement('div');
  div.textContent = text;
  div.style.color = 'white';
  div.style.fontWeight = 'bold';
  div.style.fontSize = '11px';
  div.style.textShadow = '1px 1px 2px black';
  div.style.background = 'rgba(0,0,0,0.6)';
  div.style.padding = '2px 6px';
  div.style.borderRadius = '8px';
  return new CSS2DObject(div);
}

function createPart(type) {
  const group = new THREE.Group();
  
  if (type === 'wing') {
    const wingGeo = new THREE.BoxGeometry(2.4, 0.1, 0.75);
    const wingMat = new THREE.MeshStandardMaterial({ color: 0xe67e22, roughness: 0.5, metalness: 0.5 });
    const wing = new THREE.Mesh(wingGeo, wingMat);
    group.add(wing);
    
    const tipGeo = new THREE.BoxGeometry(0.12, 0.12, 0.8);
    const tipMat = new THREE.MeshStandardMaterial({ color: 0xf39c12 });
    const tipL = new THREE.Mesh(tipGeo, tipMat);
    tipL.position.set(-1.2, 0, 0);
    group.add(tipL);
    const tipR = new THREE.Mesh(tipGeo, tipMat);
    tipR.position.set(1.2, 0, 0);
    group.add(tipR);
    
    group.userData = { type: 'wing', snapPos: new THREE.Vector3(0, -0.18, 0) };
  }
  else if (type === 'tail') {
    const hStabGeo = new THREE.BoxGeometry(1.1, 0.08, 0.4);
    const tailMat = new THREE.MeshStandardMaterial({ color: 0x9b59b6, roughness: 0.5, metalness: 0.5 });
    group.add(new THREE.Mesh(hStabGeo, tailMat));
    
    const vStabGeo = new THREE.BoxGeometry(0.1, 0.5, 0.4);
    const vStab = new THREE.Mesh(vStabGeo, tailMat);
    vStab.position.y = 0.3;
    group.add(vStab);
    
    group.userData = { type: 'tail', snapPos: new THREE.Vector3(-1.45, 0.08, 0) };
  }
  else if (type === 'engine') {
    const engineGeo = new THREE.CylinderGeometry(0.25, 0.28, 0.75, 8);
    const engineMat = new THREE.MeshStandardMaterial({ color: 0xccccdd, roughness: 0.3, metalness: 0.8 });
    const engine = new THREE.Mesh(engineGeo, engineMat);
    engine.rotation.x = Math.PI/2;
    group.add(engine);
    
    const stripeGeo = new THREE.TorusGeometry(0.26, 0.04, 6, 12);
    const stripe = new THREE.Mesh(stripeGeo, new THREE.MeshStandardMaterial({ color: 0xe74c3c, roughness: 0.2, metalness: 0.3 }));
    stripe.position.x = 0.08;
    stripe.rotation.y = Math.PI/2;
    group.add(stripe);
    
    group.userData = { type: 'engine', snapPos: new THREE.Vector3(0, -0.5, 0.75) };
  }
  
  const label = createLabel(type === 'wing' ? '🪽' : type === 'tail' ? '🪁' : '🚀');
  label.position.set(0, 0.5, 0);
  group.add(label);
  
  return group;
}

function spawnPart(type) {
  const part = createPart(type);
  const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion).multiplyScalar(2.5);
  part.position.copy(camera.position).add(dir);
  partsLayer.add(part);
  placedParts.push(part);
  return part;
}

// Простое перетаскивание (без DragControls для производительности)
let draggedPart = null;
let dragOffset = new THREE.Vector3();
const raycaster = new THREE.Raycaster();

function getIntersection(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  const mouse = new THREE.Vector2(
    ((event.clientX - rect.left) / rect.width) * 2 - 1,
    -((event.clientY - rect.top) / rect.height) * 2 + 1
  );
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(placedParts, true);
  return { mouse, intersects };
}

renderer.domElement.addEventListener('pointerdown', (event) => {
  if (isFlying) return;
  if (event.pointerType === 'touch' && event.isPrimary === false) return;
  
  const { intersects } = getIntersection(event);
  
  if (intersects.length > 0) {
    // Нашли деталь — начинаем перетаскивание
    let obj = intersects[0].object;
    while (obj && !placedParts.includes(obj)) obj = obj.parent;
    if (obj && placedParts.includes(obj)) {
      draggedPart = obj;
      controls.enabled = false;
      const point = intersects[0].point;
      const worldPos = new THREE.Vector3();
      draggedPart.getWorldPosition(worldPos);
      dragOffset.copy(worldPos).sub(point);
      document.getElementById('mode-indicator').textContent = '📌 ТЯНИ';
    }
  }
});

renderer.domElement.addEventListener('pointermove', (event) => {
  if (!draggedPart || isFlying) return;
  if (event.pointerType === 'touch' && event.isPrimary === false) return;
  
  const rect = renderer.domElement.getBoundingClientRect();
  const mouse = new THREE.Vector2(
    ((event.clientX - rect.left) / rect.width) * 2 - 1,
    -((event.clientY - rect.top) / rect.height) * 2 + 1
  );
  raycaster.setFromCamera(mouse, camera);
  
  // Пересекаем с плоскостью
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const target = new THREE.Vector3();
  raycaster.ray.intersectPlane(plane, target);
  
  if (target) {
    target.add(dragOffset);
    // Конвертируем в локальные координаты
    airplaneGroup.worldToLocal(target);
    target.y = Math.max(-2, Math.min(2.5, target.y));
    target.x = Math.max(-2.5, Math.min(2.5, target.x));
    target.z = Math.max(-1.5, Math.min(1.5, target.z));
    draggedPart.position.copy(target);
  }
});

renderer.domElement.addEventListener('pointerup', () => {
  if (!draggedPart) return;
  
  // Проверка притягивания
  const type = draggedPart.userData.type;
  const snapLocal = draggedPart.userData.snapPos;
  if (snapLocal) {
    const worldSnap = snapLocal.clone();
    airplaneGroup.localToWorld(worldSnap);
    const partWorldPos = new THREE.Vector3();
    draggedPart.getWorldPosition(partWorldPos);
    
    if (partWorldPos.distanceTo(worldSnap) < 1.0) {
      draggedPart.position.copy(snapLocal);
    }
  }
  
  draggedPart = null;
  controls.enabled = true;
  document.getElementById('mode-indicator').textContent = isFlying ? '✈️ ПОЛЕТ' : '🛠️ СБОРКА';
});

// Размещение новой детали по тапу на свободное место
renderer.domElement.addEventListener('click', (event) => {
  if (isFlying) return;
  if (draggedPart) return; // Был драг, а не клик
  
  const { intersects } = getIntersection(event);
  
  // Кликнули по детали? Тогда не спавним новую
  if (intersects.length > 0) {
    let obj = intersects[0].object;
    while (obj && !placedParts.includes(obj) && obj !== airplaneGroup) obj = obj.parent;
    if (obj && placedParts.includes(obj)) return;
  }
  
  // Спавним новую деталь
  const part = createPart(selectedPartType);
  const rect = renderer.domElement.getBoundingClientRect();
  const mouse = new THREE.Vector2(
    ((event.clientX - rect.left) / rect.width) * 2 - 1,
    -((event.clientY - rect.top) / rect.height) * 2 + 1
  );
  raycaster.setFromCamera(mouse, camera);
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const target = new THREE.Vector3();
  raycaster.ray.intersectPlane(plane, target);
  
  if (target) {
    airplaneGroup.worldToLocal(target);
    target.y = Math.max(-2, Math.min(2.5, target.y));
    target.x = Math.max(-2.5, Math.min(2.5, target.x));
    target.z = Math.max(-1.5, Math.min(1.5, target.z));
    part.position.copy(target);
  }
  
  partsLayer.add(part);
  placedParts.push(part);
});

// ---------- СОСТОЯНИЯ ----------
let selectedPartType = 'wing';
let isFlying = false;
let flyData = null;
const keys = {};

// ---------- UI ----------
const btnWing = document.getElementById('btn-wing');
const btnTail = document.getElementById('btn-tail');
const btnEngine = document.getElementById('btn-engine');
const flyBtn = document.getElementById('fly-btn');
const resetBtn = document.getElementById('reset-btn');
const modeIndicator = document.getElementById('mode-indicator');
const instrDiv = document.getElementById('instr');

function setActiveButton(type) {
  [btnWing, btnTail, btnEngine].forEach(b => b.classList.remove('active'));
  if (type === 'wing') btnWing.classList.add('active');
  if (type === 'tail') btnTail.classList.add('active');
  if (type === 'engine') btnEngine.classList.add('active');
  selectedPartType = type;
}

btnWing.addEventListener('click', () => setActiveButton('wing'));
btnTail.addEventListener('click', () => setActiveButton('tail'));
btnEngine.addEventListener('click', () => setActiveButton('engine'));

// Кнопка полета
flyBtn.addEventListener('click', () => {
  if (isFlying) {
    exitFlightMode();
    return;
  }
  
  const hasWing = placedParts.some(p => p.userData.type === 'wing');
  const hasTail = placedParts.some(p => p.userData.type === 'tail');
  const hasEngine = placedParts.some(p => p.userData.type === 'engine');
  
  if (!hasWing || !hasTail || !hasEngine) {
    alert('⚠️ Нужны Крыло, Хвост и Двигатель!');
    return;
  }
  
  isFlying = true;
  flyBtn.textContent = '🛬 ЗЕМЛЯ';
  flyBtn.style.background = '#e74c3c';
  modeIndicator.textContent = '✈️ ПОЛЕТ';
  modeIndicator.style.background = '#e74c3c';
  document.body.classList.add('flying');
  instrDiv.textContent = '🎮 Кнопки управления на экране';
  
  controls.enabled = false;
  
  flyData = {
    speed: 0.15,
    roll: 0,
    pitch: 0,
    yaw: 0,
  };
  
  airplaneGroup.position.set(0, 2, 0);
  airplaneGroup.rotation.set(0, 0, 0);
  
  // Показываем мобильные кнопки управления
  showMobileControls();
});

function exitFlightMode() {
  isFlying = false;
  flyBtn.textContent = '✈️ ВЗЛЕТ';
  flyBtn.style.background = '#2ecc71';
  modeIndicator.textContent = '🛠️ СБОРКА';
  modeIndicator.style.background = 'rgba(0,0,0,0.7)';
  document.body.classList.remove('flying');
  instrDiv.textContent = '👆 Тап: деталь | ✌️ Два пальца: вращать';
  
  controls.enabled = true;
  airplaneGroup.position.set(0, 0, 0);
  airplaneGroup.rotation.set(0, 0, 0);
  controls.target.set(0, 0.3, 0);
  controls.update();
  flyData = null;
  
  hideMobileControls();
}

// Сброс
resetBtn.addEventListener('click', () => {
  if (isFlying) exitFlightMode();
  while (placedParts.length > 0) {
    partsLayer.remove(placedParts.pop());
  }
  setActiveButton('wing');
});

// Мобильные кнопки управления
function showMobileControls() {
  let container = document.getElementById('mobile-controls');
  if (container) return;
  
  container = document.createElement('div');
  container.id = 'mobile-controls';
  container.innerHTML = `
    <div style="position:absolute; bottom:80px; left:50%; transform:translateX(-50%); display:flex; gap:8px; z-index:20;">
      <button class="ctrl-btn" id="ctrl-up">▲</button>
    </div>
    <div style="position:absolute; bottom:40px; left:50%; transform:translateX(-50%); display:flex; gap:8px; z-index:20;">
      <button class="ctrl-btn" id="ctrl-left">◀</button>
      <button class="ctrl-btn" id="ctrl-fire">⚡</button>
      <button class="ctrl-btn" id="ctrl-right">▶</button>
    </div>
    <div style="position:absolute; bottom:5px; left:50%; transform:translateX(-50%); display:flex; gap:8px; z-index:20;">
      <button class="ctrl-btn" id="ctrl-down">▼</button>
    </div>
  `;
  document.body.appendChild(container);
  
  // Стили для кнопок
  const style = document.createElement('style');
  style.textContent = `
    .ctrl-btn {
      width: 50px; height: 50px; border-radius: 25px;
      background: rgba(255,255,255,0.2); border: 2px solid rgba(255,255,255,0.5);
      color: white; font-size: 20px; cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      touch-action: manipulation;
    }
    .ctrl-btn:active { background: rgba(255,255,255,0.5); }
  `;
  document.head.appendChild(style);
  
  // Обработчики
  const bind = (id, key) => {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.addEventListener('pointerdown', (e) => { e.preventDefault(); keys[key] = true; });
    btn.addEventListener('pointerup', (e) => { e.preventDefault(); keys[key] = false; });
    btn.addEventListener('pointerleave', () => { keys[key] = false; });
  };
  
  bind('ctrl-up', 'arrowup');
  bind('ctrl-down', 'arrowdown');
  bind('ctrl-left', 'arrowleft');
  bind('ctrl-right', 'arrowright');
  bind('ctrl-fire', 'w'); // кнопка "огонь" = ускорение
}

function hideMobileControls() {
  const container = document.getElementById('mobile-controls');
  if (container) container.remove();
  // Очищаем клавиши
  Object.keys(keys).forEach(k => keys[k] = false);
}

// Клавиатура
window.addEventListener('keydown', (e) => { keys[e.key.toLowerCase()] = true; });
window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });

// ---------- ИГРОВОЙ ЦИКЛ ----------
function animate() {
  requestAnimationFrame(animate);
  
  stars.rotation.y += 0.0003;
  
  if (isFlying && flyData) {
    const throttle = keys['w'] ? 1 : (keys['s'] ? -1 : 0);
    const aileron = (keys['a'] ? 1 : 0) - (keys['d'] ? 1 : 0);
    const elevator = (keys['arrowup'] ? 1 : 0) - (keys['arrowdown'] ? 1 : 0);
    const rudder = (keys['arrowleft'] ? 1 : 0) - (keys['arrowright'] ? 1 : 0);
    const qKey = keys['q'] ? 1 : 0;
    const eKey = keys['e'] ? 1 : 0;
    
    flyData.speed += throttle * 0.015;
    flyData.speed = Math.max(0.05, Math.min(flyData.speed, 0.6));
    
    flyData.roll += aileron * 0.025;
    flyData.pitch += elevator * 0.018;
    flyData.yaw += (rudder + eKey - qKey) * 0.018;
    
    flyData.roll *= 0.97;
    flyData.pitch *= 0.97;
    flyData.yaw *= 0.97;
    
    airplaneGroup.rotation.z = flyData.roll;
    airplaneGroup.rotation.x = flyData.pitch;
    airplaneGroup.rotation.y += flyData.yaw;
    
    const forward = new THREE.Vector3(1, 0, 0);
    forward.applyQuaternion(airplaneGroup.quaternion);
    airplaneGroup.position.add(forward.multiplyScalar(flyData.speed));
    
    airplaneGroup.position.y += (flyData.pitch * flyData.speed * 0.4) - 0.015;
    if (airplaneGroup.position.y < 0.5) {
      airplaneGroup.position.y = 0.5;
      flyData.pitch *= -0.5;
    }
    if (airplaneGroup.position.y > 15) airplaneGroup.position.y = 15;
    
    const camOffset = new THREE.Vector3(-4, 2, 0);
    camOffset.applyQuaternion(airplaneGroup.quaternion);
    camera.position.lerp(airplaneGroup.position.clone().add(camOffset), 0.08);
    controls.target.lerp(airplaneGroup.position.clone().add(new THREE.Vector3(1.5, 0, 0)), 0.08);
  }
  
  controls.update();
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
}

// Старт
setActiveButton('wing');
spawnPart('wing');
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
});
