// scene.js — сцена, камера, рендер, окружение

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';

const isMobile = /Android|iPhone|iPad|iPod|webOS/i.test(navigator.userAgent);

// Сцена
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);
window.scene = scene;

// Звёзды
const starsGeo = new THREE.BufferGeometry();
const starsArr = new Float32Array(900);
for (let i = 0; i < 900; i += 3) {
  starsArr[i] = (Math.random() - 0.5) * 500;
  starsArr[i + 1] = Math.random() * 200 + 40;
  starsArr[i + 2] = (Math.random() - 0.5) * 500;
}
starsGeo.setAttribute('position', new THREE.BufferAttribute(starsArr, 3));
scene.add(new THREE.Points(starsGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.3 })));

// Свет
scene.add(new THREE.AmbientLight(0x606080));
const sun = new THREE.DirectionalLight(0xffffff, 1);
sun.position.set(20, 30, 10);
scene.add(sun);

// ЗЕМЛЯ — БОЛЬШАЯ И В КЛЕТКУ
const gridSize = 120;
const gridDivs = 20;
const groundGeo = new THREE.PlaneGeometry(gridSize, gridSize, gridDivs, gridDivs);
const groundMat = new THREE.MeshStandardMaterial({ 
  color: 0x4a7c3f, 
  roughness: 0.9,
  wireframe: false
});
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -5;
scene.add(ground);

// Сетка-разметка (линии)
const gridHelper = new THREE.GridHelper(gridSize, gridDivs, 0x2d5a1e, 0x2d5a1e);
gridHelper.position.y = -4.99;
scene.add(gridHelper);

// Взлётная полоса (шире и длиннее)
const runwayGeo = new THREE.PlaneGeometry(6, 30);
const runway = new THREE.Mesh(runwayGeo, new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.8 }));
runway.rotation.x = -Math.PI / 2;
runway.position.set(0, -4.98, 10);
scene.add(runway);

// Разметка полосы
for (let i = 0; i <= 20; i += 3) {
  const stripe = new THREE.Mesh(
    new THREE.PlaneGeometry(1.5, 0.3),
    new THREE.MeshStandardMaterial({ color: 0xffffff })
  );
  stripe.rotation.x = -Math.PI / 2;
  stripe.position.set(0, -4.97, i);
  scene.add(stripe);
}

// Камера — ДАЛЬШЕ
const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.3, 500);
camera.position.set(12, 8, 16);
camera.lookAt(0, 0, 0);
window.camera = camera;

// WebGL рендер
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);
window.renderer = renderer;

// CSS2D рендер
const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(innerWidth, innerHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0px';
labelRenderer.domElement.style.pointerEvents = 'none';
document.body.appendChild(labelRenderer.domElement);
window.labelRenderer = labelRenderer;

// OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
window.controls = controls;
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.target.set(0, 0.3, 0);
controls.rotateSpeed = isMobile ? 0.7 : 0.6;
controls.zoomSpeed = isMobile ? 1.0 : 1.2;
controls.minDistance = 5;
controls.maxDistance = 40;
controls.maxPolarAngle = Math.PI * 0.75;
controls.mouseButtons = { LEFT: null, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE };
controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };
controls.update();

// Ресайз
window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  labelRenderer.setSize(innerWidth, innerHeight);
});
