// scene.js — сцена, камера, рендер, окружение

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';

const isMobile = /Android|iPhone|iPad|iPod|webOS/i.test(navigator.userAgent);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);
window.scene = scene;

// Звёзды
const sg = new THREE.BufferGeometry();
const sp = new Float32Array(900);
for (let i=0; i<900; i+=3) { sp[i]=(Math.random()-0.5)*400; sp[i+1]=Math.random()*150+30; sp[i+2]=(Math.random()-0.5)*400; }
sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
const stars = new THREE.Points(sg, new THREE.PointsMaterial({color:0xffffff,size:0.3}));
scene.add(stars);

// Свет
scene.add(new THREE.AmbientLight(0x606080));
const sun = new THREE.DirectionalLight(0xffffff, 1);
sun.position.set(20,30,10);
scene.add(sun);

// Земля
const gnd = new THREE.Mesh(new THREE.PlaneGeometry(80,80), new THREE.MeshStandardMaterial({color:0x4a7c3f,roughness:0.9}));
gnd.rotation.x = -Math.PI/2;
gnd.position.y = -5;
scene.add(gnd);

// Взлётка
const rw = new THREE.Mesh(new THREE.PlaneGeometry(4,25), new THREE.MeshStandardMaterial({color:0x444444,roughness:0.8}));
rw.rotation.x = -Math.PI/2;
rw.position.set(0,-4.99,10);
scene.add(rw);
for (let i=2; i<=18; i+=3) {
  const st = new THREE.Mesh(new THREE.PlaneGeometry(1,0.3), new THREE.MeshStandardMaterial({color:0xffffff}));
  st.rotation.x = -Math.PI/2;
  st.position.set(0,-4.98,i);
  scene.add(st);
}

// Камера
const camera = new THREE.PerspectiveCamera(55, innerWidth/innerHeight, 0.3, 300);
camera.position.set(8,5,10);
camera.lookAt(0,0,0);
window.camera = camera;

// Рендеры
const renderer = new THREE.WebGLRenderer({antialias:true,powerPreference:"high-performance"});
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
document.body.appendChild(renderer.domElement);
window.renderer = renderer;

const labelR = new CSS2DRenderer();
labelR.setSize(innerWidth, innerHeight);
labelR.domElement.style.position = 'absolute';
labelR.domElement.style.top = '0px';
labelR.domElement.style.pointerEvents = 'none';
document.body.appendChild(labelR.domElement);
window.labelRenderer = labelR;

// OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
window.orbitControls = controls;
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.target.set(0,0.3,0);
controls.rotateSpeed = isMobile ? 0.7 : 0.6;
controls.zoomSpeed = isMobile ? 1.0 : 1.2;
controls.panSpeed = isMobile ? 0.6 : 0.8;
controls.minDistance = 3;
controls.maxDistance = 30;
controls.maxPolarAngle = Math.PI*0.75;
controls.mouseButtons = { LEFT: null, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE };
controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };
controls.update();
window.controls = controls;

// Экспорт для цикла
window.animateLoop = function(cb) {
  const clock = new THREE.Clock();
  function loop() {
    requestAnimationFrame(loop);
    const dt = Math.min(clock.getDelta(), 0.1);
    stars.rotation.y += 0.0003;
    cb(dt);
    controls.update();
    renderer.render(scene, camera);
    labelR.render(scene, camera);
  }
  loop();
};

addEventListener('resize', () => {
  camera.aspect = innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  labelR.setSize(innerWidth, innerHeight);
});
